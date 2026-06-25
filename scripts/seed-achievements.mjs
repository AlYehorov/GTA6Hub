/**
 * Seed achievements for Sprint 6.
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
  { slug: "first-mission", title: "First Mission", description: "Complete your first main story mission.", icon: "flag", sort_order: 1 },
  { slug: "ten-percent", title: "10% Complete", description: "Reach 10% overall completion.", icon: "trophy", sort_order: 2 },
  { slug: "twenty-five-percent", title: "25% Complete", description: "Reach 25% overall completion.", icon: "trophy", sort_order: 3 },
  { slug: "fifty-percent", title: "50% Complete", description: "Reach 50% overall completion.", icon: "trophy", sort_order: 4 },
  { slug: "hundred-percent", title: "100% Completion", description: "Reach 100% overall completion.", icon: "crown", sort_order: 5 },
  { slug: "collector", title: "Collector", description: "Find every collectible in Leonida.", icon: "gem", sort_order: 6 },
  { slug: "explorer", title: "Explorer", description: "Make progress in 5 or more categories.", icon: "compass", sort_order: 7 },
  { slug: "hunter", title: "Hunter", description: "Acquire every weapon in the tracker.", icon: "crosshair", sort_order: 8 },
  { slug: "secret-finder", title: "Secret Finder", description: "Discover all secrets or easter eggs.", icon: "key", sort_order: 9 },
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
