import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const content = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

const MOCK_ITEMS = [
  {
    source: "rockstar_newswire",
    source_type: "newswire_post",
    source_url: "https://www.rockstargames.com/newswire/article/mock-trailer3-tease",
    external_id: "mock-rsnw-trailer3-tease",
    title: "Grand Theft Auto VI — Trailer 3 Coming This Fall",
    content: "Rockstar Games confirms a third GTA VI trailer will debut this fall, showcasing more of Vice City and the Leonida Keys.",
  },
  {
    source: "reddit",
    source_type: "reddit_post",
    source_url: "https://www.reddit.com/r/GTA6/comments/mock-vice-city-map",
    external_id: "mock-reddit-vice-city-map",
    title: "Fans compile Vice City map from trailer 2 screenshots",
    content: "Community analysis thread mapping Vice City districts from trailer 2 frames.",
  },
];

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  const { error: check } = await supabase.from("source_items").select("id").limit(1);
  if (check) {
    console.error("Run supabase/migrations/002_sprint3_source_engine.sql first.");
    process.exit(1);
  }

  let draftsCreated = 0;

  for (const item of MOCK_ITEMS) {
    const { data: existing } = await supabase
      .from("source_items")
      .select("id, processed")
      .eq("source", item.source)
      .eq("external_id", item.external_id)
      .maybeSingle();

    let sourceId = existing?.id;

    if (!sourceId) {
      const { data, error } = await supabase
        .from("source_items")
        .insert({ ...item, published_at: new Date().toISOString(), processed: false })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      sourceId = data.id;
      console.log("Ingested:", item.title);
    }

    const { data: existingDraft } = await supabase
      .from("ai_drafts")
      .select("id")
      .eq("source_item_id", sourceId)
      .maybeSingle();

    if (existingDraft) continue;

    const content = `# ${item.title}\n\n${item.content}\n\n*Draft for human review.*`;
    const { error: draftError } = await supabase.from("ai_drafts").insert({
      source_item_id: sourceId,
      title: item.title,
      excerpt: item.content.slice(0, 160),
      content,
      category: item.source === "reddit" ? "Analysis" : "Official",
      suggested_tags: ["Leonida", "Vice City"],
      seo_title: `${item.title.slice(0, 50)} | GTA6Hub`,
      seo_description: item.content.slice(0, 155),
      confidence: item.source === "rockstar_newswire" ? 0.92 : 0.55,
      status: "pending",
    });

    if (draftError) throw new Error(draftError.message);

    await supabase.from("source_items").update({ processed: true }).eq("id", sourceId);
    draftsCreated++;
    console.log("Draft created:", item.title);
  }

  console.log(`\nDone. ${draftsCreated} new draft(s). Review at /admin/drafts`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
