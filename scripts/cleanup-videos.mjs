/**
 * Remove GTA Online / mock videos and fix Trailer 2 YouTube ID.
 * Run: npm run cleanup:videos
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

const EXCLUDE_PATTERNS = [
  /\bGTA\s*Online\b/i,
  /\bGTA\s*V\b/i,
  /\bGTA\s*5\b/i,
  /\bGrand Theft Auto\s*V\b/i,
  /\bGrand Theft Auto\s*5\b/i,
];

function isGta6VideoTitle(title) {
  if (!GTA_VI_PATTERNS.some((pattern) => pattern.test(title))) return false;
  if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(title))) return false;
  return true;
}

function isValidYoutubeId(id) {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
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

const KNOWN_GTA6_VIDEOS = [
  {
    title: "Grand Theft Auto VI Trailer 1",
    slug: "grand-theft-auto-vi-trailer-1",
    youtube_id: "QdBZY2fkU-0",
    source_url: "https://www.youtube.com/watch?v=QdBZY2fkU-0",
    published_at: "2023-12-04T23:07:10.000Z",
    category: "official_trailer",
  },
  {
    title: "Grand Theft Auto VI Trailer 2",
    slug: "grand-theft-auto-vi-trailer-2",
    youtube_id: "VQRLujxTm3c",
    source_url: "https://www.youtube.com/watch?v=VQRLujxTm3c",
    published_at: "2025-05-06T17:07:10.000Z",
    category: "official_trailer",
  },
  {
    title: "Grand Theft Auto VI: Official Cover Art Reveal",
    slug: "grand-theft-auto-vi-official-cover-art-reveal",
    youtube_id: "EiQEBYDox_k",
    source_url: "https://www.youtube.com/watch?v=EiQEBYDox_k",
    published_at: "2026-06-18T17:00:00.000Z",
    category: "official_video",
  },
];

async function cleanup() {
  const { data: videos } = await supabase.from("videos").select("*");
  console.log(`Found ${videos?.length ?? 0} videos`);

  for (const video of videos ?? []) {
    const shouldRemove =
      !isGta6VideoTitle(video.title) || !isValidYoutubeId(video.youtube_id);

    if (shouldRemove) {
      const { error } = await supabase.from("videos").delete().eq("id", video.id);
      if (error) console.error(`  ! delete ${video.title}:`, error.message);
      else console.log(`  - removed: ${video.title}`);
    }
  }

  for (const known of KNOWN_GTA6_VIDEOS) {
    const { data: bySlug } = await supabase
      .from("videos")
      .select("*")
      .eq("slug", known.slug)
      .maybeSingle();

    if (bySlug) {
      if (bySlug.youtube_id !== known.youtube_id) {
        const { error } = await supabase
          .from("videos")
          .update({
            youtube_id: known.youtube_id,
            source_url: known.source_url,
            title: known.title,
            status: "published",
            published_at: known.published_at,
            category: known.category,
          })
          .eq("id", bySlug.id);

        if (error) console.error(`  ! fix ${known.title}:`, error.message);
        else console.log(`  ~ fixed: ${known.title} → ${known.youtube_id}`);
      } else {
        console.log(`  = ok: ${known.title}`);
      }
      continue;
    }

    const { data: byYt } = await supabase
      .from("videos")
      .select("id")
      .eq("youtube_id", known.youtube_id)
      .maybeSingle();

    if (byYt) {
      console.log(`  = exists by youtube_id: ${known.title}`);
      continue;
    }

    const { error } = await supabase.from("videos").insert({
      ...known,
      description: "",
      source_channel: "Rockstar Games",
      status: "published",
    });

    if (error) console.error(`  ! insert ${known.title}:`, error.message);
    else console.log(`  + added: ${known.title}`);
  }

  console.log("Done.");
}

cleanup().catch((e) => {
  console.error(e);
  process.exit(1);
});
