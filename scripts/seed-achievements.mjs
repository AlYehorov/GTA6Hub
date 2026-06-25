/**
 * Seed achievements for profiles sprint.
 * Run: npm run seed:achievements
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

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const ACHIEVEMENTS = [
  { slug: "first_login", title: "Welcome to Leonida", description: "Sign in to GTAVIHub for the first time.", icon: "user", xp_reward: 25, sort_order: 1 },
  { slug: "first_tracker_item", title: "First Step", description: "Complete your first tracker item.", icon: "flag", xp_reward: 30, sort_order: 2 },
  { slug: "complete_10_tracker_items", title: "Getting Started", description: "Complete 10 tracker items.", icon: "list-checks", xp_reward: 50, sort_order: 3 },
  { slug: "complete_50_tracker_items", title: "Dedicated Player", description: "Complete 50 tracker items.", icon: "trophy", xp_reward: 100, sort_order: 4 },
  { slug: "reach_10_percent", title: "10% Complete", description: "Reach 10% overall tracker completion.", icon: "percent", xp_reward: 40, sort_order: 5 },
  { slug: "reach_25_percent", title: "25% Complete", description: "Reach 25% overall tracker completion.", icon: "percent", xp_reward: 75, sort_order: 6 },
  { slug: "reach_50_percent", title: "50% Complete", description: "Reach 50% overall tracker completion.", icon: "percent", xp_reward: 150, sort_order: 7 },
  { slug: "save_first_article", title: "Bookmarked", description: "Save your first article.", icon: "bookmark", xp_reward: 20, sort_order: 8 },
  { slug: "save_10_articles", title: "Archivist", description: "Save 10 articles.", icon: "book-open", xp_reward: 60, sort_order: 9 },
  { slug: "read_10_articles", title: "Well Read", description: "Read 10 articles.", icon: "newspaper", xp_reward: 50, sort_order: 10 },
  { slug: "read_50_articles", title: "News Junkie", description: "Read 50 articles.", icon: "newspaper", xp_reward: 150, sort_order: 11 },
  { slug: "trailer_detective", title: "Trailer Detective", description: "Read 5 news articles.", icon: "film", xp_reward: 40, sort_order: 12 },
  { slug: "guide_reader", title: "Guide Reader", description: "Read 5 guides.", icon: "book", xp_reward: 40, sort_order: 13 },
  { slug: "map_explorer", title: "Map Explorer", description: "Save 5 map locations.", icon: "map-pin", xp_reward: 50, sort_order: 14 },
  // Legacy Sprint 6
  { slug: "first-mission", title: "First Mission", description: "Complete your first main story mission.", icon: "flag", xp_reward: 30, sort_order: 20 },
  { slug: "ten-percent", title: "10% Complete (Legacy)", description: "Reach 10% overall completion.", icon: "trophy", xp_reward: 0, sort_order: 21 },
  { slug: "twenty-five-percent", title: "25% Complete (Legacy)", description: "Reach 25% overall completion.", icon: "trophy", xp_reward: 0, sort_order: 22 },
  { slug: "fifty-percent", title: "50% Complete (Legacy)", description: "Reach 50% overall completion.", icon: "trophy", xp_reward: 0, sort_order: 23 },
  { slug: "hundred-percent", title: "100% Completion", description: "Reach 100% overall completion.", icon: "crown", xp_reward: 500, sort_order: 24 },
  { slug: "collector", title: "Collector", description: "Find every collectible in Leonida.", icon: "gem", xp_reward: 200, sort_order: 25 },
  { slug: "explorer", title: "Explorer", description: "Make progress in 5 or more categories.", icon: "compass", xp_reward: 75, sort_order: 26 },
  { slug: "hunter", title: "Hunter", description: "Acquire every weapon in the tracker.", icon: "crosshair", xp_reward: 100, sort_order: 27 },
  { slug: "secret-finder", title: "Secret Finder", description: "Discover all secrets or easter eggs.", icon: "key", xp_reward: 150, sort_order: 28 },
];

async function seed() {
  console.log("Seeding achievements...");
  for (const ach of ACHIEVEMENTS) {
    const { data: existing } = await supabase
      .from("achievements")
      .select("id")
      .eq("slug", ach.slug)
      .maybeSingle();

    if (existing) {
      await supabase.from("achievements").update(ach).eq("id", existing.id);
      console.log(`  ~ ${ach.title}`);
    } else {
      const { error } = await supabase.from("achievements").insert(ach);
      if (error) console.error(`  Failed ${ach.slug}:`, error.message);
      else console.log(`  + ${ach.title}`);
    }
  }
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
