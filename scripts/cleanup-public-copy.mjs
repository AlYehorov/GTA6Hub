/**
 * Clean published article copy: remove draft footers, polish excerpts, fix hero images.
 * Run: npm run cleanup:public-copy
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

const DRAFT_PATTERNS = [
  /\*?\s*draft\s+(generated|for)\s+[^*\n]+human\s+review[^*\n]*\*?/gi,
  /\*?\s*requires\s+human\s+review\s+before\s+publishing\.?\s*\*?/gi,
  /\*?\s*draft\s+for\s+human\s+review\.?\s*\*?/gi,
  /^---\s*\n\*[^*]+\*\s*$/gm,
];

const BASED_ON_PREFIX =
  /^based on\s+(rockstar\s+(newswire|youtube)|reddit|x(?:\s*\(twitter\))?|community)\s*:\s*/i;

const EDITORIAL_2K_IMAGES = [
  "/images/gta6/trailer-2-header.jpg",
  "/images/gta6/hero-vice-city.jpg",
  "/images/gta6/jason-lucia-03-landscape.jpg",
  "/images/gta6/lucia-portrait.jpg",
  "/images/gta6/jason-duval-04.jpg",
  "/images/gta6/vice-city-banner.jpg",
  "/images/gta6/jason-lucia-motel.jpg",
  "/images/gta6/lucia-caminos-02.jpg",
  "/images/gta6/jason-duval-01.jpg",
  "/images/gta6/raul-bautista.jpg",
  "/images/gta6/vice-city-blank.jpg",
  "/images/gta6/jason-lucia-03-portrait.jpg",
];

function isHighResolutionHero(url) {
  if (!url?.trim()) return false;
  const normalized = url.trim().toLowerCase();
  if (normalized.includes("img.youtube.com/vi/")) return false;
  if (normalized.includes("hqdefault") || normalized.includes("mqdefault")) return false;
  if (normalized.startsWith("/images/gta6/")) return true;
  if (normalized.includes("supabase.co/storage/")) return true;
  return /\.(webp|jpg|jpeg|png)(\?|$)/i.test(normalized);
}

function editorialFallbackByIndex(index) {
  return EDITORIAL_2K_IMAGES[index % EDITORIAL_2K_IMAGES.length];
}

function sanitizeContent(content) {
  let text = (content ?? "").trim();
  for (const pattern of DRAFT_PATTERNS) text = text.replace(pattern, "");
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function sanitizeExcerpt(excerpt) {
  if (!excerpt?.trim()) return null;
  let text = excerpt.trim();
  for (const pattern of DRAFT_PATTERNS) text = text.replace(pattern, "");
  text = text.replace(BASED_ON_PREFIX, "").trim();
  return text || null;
}

function normalizeHero(url, index) {
  if (isHighResolutionHero(url) && url.includes("supabase.co/storage/")) {
    return url.trim();
  }
  return editorialFallbackByIndex(index);
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const { data: articles, error } = await supabase
  .from("articles")
  .select("id, slug, title, excerpt, content, hero_image_url, status")
  .eq("status", "published")
  .order("published_at", { ascending: false });

if (error) {
  console.error(error.message);
  process.exit(1);
}

let updated = 0;

for (const [index, article] of (articles ?? []).entries()) {
  const nextContent = sanitizeContent(article.content);
  const nextExcerpt = sanitizeExcerpt(article.excerpt);
  const nextHero = normalizeHero(article.hero_image_url, index);

  const changed =
    nextContent !== (article.content ?? "") ||
    nextExcerpt !== (article.excerpt ?? null) ||
    nextHero !== (article.hero_image_url ?? null);

  if (!changed) continue;

  const { error: updateError } = await supabase
    .from("articles")
    .update({
      content: nextContent,
      excerpt: nextExcerpt,
      hero_image_url: nextHero,
    })
    .eq("id", article.id);

  if (updateError) {
    console.error(`! ${article.title}:`, updateError.message);
    continue;
  }

  updated++;
  console.log(`✓ cleaned: ${article.title}`);
}

console.log(`Done. Updated ${updated} published article(s).`);
