/**
 * Remove GTA V / GTA Online content from source_items, drafts, and published articles.
 * Run: npm run cleanup:content
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const GTA_VI_PATTERNS = [
  /\bGTA\s*VI\b/i,
  /\bGTA\s*6\b/i,
  /\bGrand Theft Auto\s*VI\b/i,
  /\bGrand Theft Auto\s*6\b/i,
  /\bGTAVI\b/i,
];

const GTA6_CONTEXT_PATTERNS = [
  /\bLeonida\b/i,
  /\bVice City\b/i,
  /\bLucia Caminos\b/i,
  /\bLucia\b/i,
  /\bJason Duval\b/i,
];

const LEGACY_PATTERNS = [
  /\bGTA\s*Online\b/i,
  /\bGTAO\b/i,
  /\bGTA\s*V\b/i,
  /\bGTA\s*5\b/i,
  /\bGTAV\b/i,
  /\bGrand Theft Auto\s+V\b/i,
  /\bGrand Theft Auto\s+5\b/i,
];

function isLegacyGtaContent(...parts) {
  const text = parts.filter(Boolean).join(" ");
  return LEGACY_PATTERNS.some((pattern) => pattern.test(text));
}

function hasGta6Signal(...parts) {
  const text = parts.filter(Boolean).join(" ");
  if (GTA_VI_PATTERNS.some((pattern) => pattern.test(text))) return true;
  return GTA6_CONTEXT_PATTERNS.some((pattern) => pattern.test(text));
}

function isGta6Content(...parts) {
  const text = parts.filter(Boolean).join(" ");
  if (!text.trim()) return false;

  const hasGta6 = hasGta6Signal(text);
  const hasLegacy = isLegacyGtaContent(text);

  if (hasLegacy && !hasGta6) return false;
  return hasGta6;
}

function isGta6SourceItem(item) {
  if (hasGta6Signal(item.title)) return true;
  if (isLegacyGtaContent(item.title, item.content)) return false;
  if (item.source === "reddit") return true;
  return isGta6Content(item.title, item.content);
}

const MIN_CONTENT_CONFIDENCE = 0.9;

function meetsConfidenceThreshold(confidence) {
  return Number(confidence) >= MIN_CONTENT_CONFIDENCE;
}

function loadEnv() {
  const envPath = join(root, ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function cleanup() {
  const { data: sources } = await supabase.from("source_items").select("*");
  console.log(`Checking ${sources?.length ?? 0} source_items`);

  for (const source of sources ?? []) {
    if (isGta6SourceItem(source)) continue;

    const { data: drafts } = await supabase
      .from("ai_drafts")
      .select("id")
      .eq("source_item_id", source.id);

    if (drafts?.length) {
      await supabase.from("ai_drafts").delete().eq("source_item_id", source.id);
      console.log(`  - deleted ${drafts.length} draft(s) for: ${source.title}`);
    }

    const { error } = await supabase.from("source_items").delete().eq("id", source.id);
    if (error) console.error(`  ! source ${source.title}:`, error.message);
    else console.log(`  - removed source: ${source.title}`);
  }

  const { data: pendingDrafts } = await supabase
    .from("ai_drafts")
    .select("id, title, status, source_item:source_items(source, title, content)");

  for (const draft of pendingDrafts ?? []) {
    const source = draft.source_item;
    const keep = source
      ? isGta6SourceItem(source)
      : isGta6Content(draft.title);
    if (keep) continue;
    const { error } = await supabase.from("ai_drafts").delete().eq("id", draft.id);
    if (error) console.error(`  ! draft ${draft.title}:`, error.message);
    else console.log(`  - removed pending draft: ${draft.title}`);
  }

  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, excerpt, content, status")
    .eq("status", "published");

  for (const article of articles ?? []) {
    if (isGta6Content(article.title, article.excerpt, article.content)) continue;

    const { error } = await supabase
      .from("articles")
      .update({ status: "draft" })
      .eq("id", article.id);

    if (error) console.error(`  ! unpublish ${article.title}:`, error.message);
    else console.log(`  - unpublished: ${article.title}`);
  }

  const { data: lowConfidenceDrafts } = await supabase
    .from("ai_drafts")
    .select("id, title, confidence, status")
    .lt("confidence", MIN_CONTENT_CONFIDENCE);

  for (const draft of lowConfidenceDrafts ?? []) {
    const { error } = await supabase.from("ai_drafts").delete().eq("id", draft.id);
    if (error) console.error(`  ! low-conf draft ${draft.title}:`, error.message);
    else console.log(`  - removed low-confidence draft (${Math.round(draft.confidence * 100)}%): ${draft.title}`);
  }

  const { data: lowConfidenceArticles } = await supabase
    .from("articles")
    .select("id, title, ai_confidence, status")
    .eq("status", "published")
    .not("ai_confidence", "is", null)
    .lt("ai_confidence", MIN_CONTENT_CONFIDENCE);

  for (const article of lowConfidenceArticles ?? []) {
    const { error } = await supabase
      .from("articles")
      .update({ status: "draft" })
      .eq("id", article.id);

    if (error) console.error(`  ! low-conf article ${article.title}:`, error.message);
    else console.log(`  - unpublished low-confidence article (${Math.round(article.ai_confidence * 100)}%): ${article.title}`);
  }

  console.log("Done.");
}

cleanup().catch((e) => {
  console.error(e);
  process.exit(1);
});
