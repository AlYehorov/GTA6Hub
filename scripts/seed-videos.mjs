/**
 * Backfill videos table from existing rockstar_youtube source_items.
 * Run: npm run seed:videos
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

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function seed() {
  const { data: sources } = await supabase
    .from("source_items")
    .select("*")
    .eq("source", "rockstar_youtube")
    .order("created_at", { ascending: false });

  console.log(`Found ${sources?.length ?? 0} YouTube source items`);

  for (const source of sources ?? []) {
    const youtubeId = source.external_id as string;
    const { data: existing } = await supabase
      .from("videos")
      .select("id")
      .eq("youtube_id", youtubeId)
      .maybeSingle();

    if (existing) {
      console.log(`  ~ skip ${source.title}`);
      continue;
    }

    const isTrailer = /trailer/i.test(source.title as string);
    const { error } = await supabase.from("videos").insert({
      title: source.title,
      slug: slugify(source.title as string),
      youtube_id: youtubeId,
      description: source.content ?? "",
      source_channel: "Rockstar Games",
      source_url: source.source_url,
      published_at: source.published_at,
      category: isTrailer ? "official_trailer" : "official_video",
      status: "published",
      source_item_id: source.id,
    });

    if (error) console.error(`  ! ${source.title}:`, error.message);
    else console.log(`  + ${source.title}`);
  }

  console.log("Done.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
