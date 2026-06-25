/**
 * Seed demo map points for Sprint 5.
 * Run: npm run seed:map
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

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const DEMO_POINTS = [
  {
    title: "Vice City Beach",
    type: "location",
    district: "Vice City",
    lat: 72,
    lng: 78,
    description:
      "Sun-soaked coastline along the Atlantic side of Vice City. Community footage suggests a vibrant beachfront with pier attractions and open sand areas.",
    verified: true,
    spoiler: false,
  },
  {
    title: "Downtown Vice City",
    type: "location",
    district: "Vice City",
    lat: 52,
    lng: 72,
    description:
      "The urban core of Vice City — dense skyline, neon nightlife, and high-rise districts inspired by Miami's downtown corridor.",
    verified: true,
    spoiler: false,
  },
  {
    title: "Leonida Keys",
    type: "location",
    district: "Leonida Keys",
    lat: 82,
    lng: 88,
    description:
      "A chain of islands south of the mainland. Trailer footage hints at bridge connections and tropical island gameplay.",
    verified: true,
    spoiler: false,
  },
  {
    title: "Grassrivers Wetlands",
    type: "wildlife",
    district: "Grassrivers",
    lat: 58,
    lng: 28,
    description:
      "Expansive wetlands and swampland on the western side of Leonida. Expect wildlife, airboats, and rural backcountry vibes.",
    verified: false,
    spoiler: false,
  },
  {
    title: "Port Gellhorn",
    type: "location",
    district: "Port Gellhorn",
    lat: 32,
    lng: 82,
    description:
      "Industrial port town on the eastern coast. Speculated to feature dockyards, shipping lanes, and working-class neighborhoods.",
    verified: false,
    spoiler: false,
  },
  {
    title: "Ambrosia",
    type: "location",
    district: "Ambrosia",
    lat: 28,
    lng: 48,
    description:
      "Northern Leonida region with rural farmland and small-town Americana. A contrast to Vice City's neon density.",
    verified: false,
    spoiler: false,
  },
  {
    title: "Mount Kalaga",
    type: "location",
    district: "Mount Kalaga",
    lat: 18,
    lng: 22,
    description:
      "Mountainous terrain in northwest Leonida. Trailers have teased elevated vistas and wilderness exploration.",
    verified: false,
    spoiler: false,
  },
  {
    title: "Vice City International Airport",
    type: "activity",
    district: "Vice City",
    lat: 48,
    lng: 58,
    description:
      "Major airport hub serving Vice City. A staple GTA location type — expect missions, chases, and traversal options.",
    verified: true,
    spoiler: false,
  },
  {
    title: "Ocean Drive",
    type: "location",
    district: "Vice City",
    lat: 66,
    lng: 74,
    description:
      "Iconic oceanfront strip with art deco architecture and palm-lined roads — a Vice City signature inspired by South Beach.",
    verified: true,
    spoiler: false,
  },
  {
    title: "Nightclub District",
    type: "business",
    district: "Vice City",
    lat: 56,
    lng: 68,
    description: "Neon-lit nightlife zone with clubs, bars, and late-night activity. Community expects a social hub for Lucia and Jason.",
    verified: false,
    spoiler: true,
  },
];

async function main() {
  console.log("Seeding map points...");

  for (const point of DEMO_POINTS) {
    const slug = slugify(point.title);
    const payload = {
      title: point.title,
      slug,
      description: point.description,
      type: point.type,
      district: point.district,
      lat: point.lat,
      lng: point.lng,
      spoiler: point.spoiler,
      verified: point.verified,
      status: "published",
      source_url: "https://www.rockstargames.com/VI/",
      created_by: "seed:map",
    };

    const { error } = await supabase.from("map_points").upsert(payload, { onConflict: "slug" });

    if (error) {
      console.error(`Failed: ${point.title}`, error.message);
    } else {
      console.log(`✓ ${point.title}`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
