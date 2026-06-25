/**
 * Seed programmatic SEO game entities.
 * Run: npm run seed:entities
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

const SEED = {
  game_locations: [
    {
      slug: "vice-city",
      title: "Vice City",
      category: "city",
      description:
        "Vice City is the neon-lit heart of Leonida — a sprawling metropolis inspired by Miami with beaches, downtown skyscrapers, nightlife, and Atlantic coastline.",
      seo_title: "Vice City — GTA 6 Location Guide",
      seo_description:
        "Everything about Vice City in GTA 6 — districts, beaches, skyline, and Leonida's urban core.",
      image_url: "/images/gta6/vice-city-banner.jpg",
    },
    {
      slug: "leonida-keys",
      title: "Leonida Keys",
      category: "islands",
      description:
        "The Leonida Keys are a tropical island chain south of the mainland, connected by bridges and known for beaches, boating, and island crime.",
      seo_title: "Leonida Keys — GTA 6 Location",
      seo_description: "Explore the Leonida Keys in GTA 6 — islands, bridges, and tropical gameplay.",
      image_url: "/images/gta6/trailer-2-header.webp",
    },
    {
      slug: "port-gellhorn",
      title: "Port Gellhorn",
      category: "town",
      description:
        "Port Gellhorn is a smaller Leonida town with rural and industrial areas, offering a contrast to Vice City's density.",
      seo_title: "Port Gellhorn — GTA 6 Town Guide",
      seo_description: "What we know about Port Gellhorn in GTA VI and Leonida.",
    },
    {
      slug: "ambrosia",
      title: "Ambrosia",
      category: "region",
      description:
        "Ambrosia is a Leonida region featured in trailers with distinct landscapes and open-world activities beyond Vice City.",
      seo_title: "Ambrosia — GTA 6 Region",
      seo_description: "Ambrosia region in GTA 6 — location, lore, and gameplay details.",
    },
    {
      slug: "mount-kalaga",
      title: "Mount Kalaga",
      category: "landmark",
      description:
        "Mount Kalaga is a prominent Leonida landmark visible across the map, suggesting elevated terrain and exploration opportunities.",
      seo_title: "Mount Kalaga — GTA 6 Landmark",
      seo_description: "Mount Kalaga in GTA VI — Leonida's iconic mountain landmark.",
    },
  ],
  game_characters: [
    {
      slug: "lucia",
      title: "Lucia",
      category: "protagonist",
      description:
        "Lucia is one of GTA VI's protagonists — a determined partner to Jason navigating crime, survival, and life across Leonida.",
      seo_title: "Lucia — GTA 6 Character Guide",
      seo_description: "Who is Lucia in GTA 6? Backstory, role, and everything we know.",
      image_url: "/images/gta6/lucia-portrait.jpg",
    },
    {
      slug: "jason",
      title: "Jason",
      category: "protagonist",
      description:
        "Jason is Lucia's partner and co-protagonist in GTA VI, involved in heists, chases, and the criminal underworld of Leonida.",
      seo_title: "Jason — GTA 6 Character Guide",
      seo_description: "Who is Jason in GTA 6? Protagonist profile and known details.",
      image_url: "/images/gta6/jason-duval-01.jpg",
    },
    {
      slug: "raul-bautista",
      title: "Raul Bautista",
      category: "supporting",
      description:
        "Raul Bautista appears in GTA VI promotional material as a supporting character in the Leonida criminal ecosystem.",
      seo_title: "Raul Bautista — GTA 6 Character",
      seo_description: "Raul Bautista in GTA VI — role and trailer appearances.",
      image_url: "/images/gta6/raul-bautista.jpg",
    },
    {
      slug: "boobie-ike",
      title: "Boobie Ike",
      category: "supporting",
      description:
        "Boobie Ike is a supporting character featured in GTA VI trailers and promotional content set in Leonida.",
      seo_title: "Boobie Ike — GTA 6 Character",
      seo_description: "Boobie Ike in GTA 6 — character overview and appearances.",
      image_url: "/images/gta6/boobie-ike.jpg",
    },
  ],
  game_vehicles: [
    {
      slug: "airboat",
      title: "Airboat",
      category: "boat",
      description:
        "The airboat is a signature Leonida vehicle for navigating swamps and wetlands at high speed with a rear-mounted fan.",
      seo_title: "GTA 6 Airboat — Vehicle Guide",
      seo_description: "GTA 6 airboat — wetlands transport across Leonida swamps.",
    },
    {
      slug: "police-cruiser",
      title: "Police Cruiser",
      category: "emergency",
      description:
        "Leonida law enforcement uses police cruisers for pursuits across Vice City streets and highways.",
      seo_title: "GTA 6 Police Cruiser",
      seo_description: "Police cruiser in GTA 6 — LEO vehicles and pursuit gameplay.",
    },
    {
      slug: "sports-car",
      title: "Sports Car",
      category: "car",
      description:
        "High-performance sports cars return in GTA VI with Vice City nightlife, highway chases, and customization.",
      seo_title: "GTA 6 Sports Cars",
      seo_description: "Sports cars in GTA 6 — performance vehicles in Leonida.",
    },
  ],
  game_animals: [
    {
      slug: "alligator",
      title: "Alligator",
      category: "wildlife",
      description:
        "Alligators inhabit Leonida's swamps and wetlands, adding danger and realism to the open-world ecosystem.",
      seo_title: "GTA 6 Alligators — Wildlife Guide",
      seo_description: "Alligators in GTA 6 — swamp wildlife in Leonida.",
    },
    {
      slug: "flamingo",
      title: "Flamingo",
      category: "wildlife",
      description:
        "Flamingos appear along Leonida's coastlines and keys, part of the ambient wildlife system.",
      seo_title: "GTA 6 Flamingos",
      seo_description: "Flamingos in GTA VI — coastal wildlife across Leonida.",
    },
    {
      slug: "shark",
      title: "Shark",
      category: "marine",
      description:
        "Sharks patrol the Atlantic waters around Vice City and the Keys, threatening swimmers and boaters.",
      seo_title: "GTA 6 Sharks — Marine Wildlife",
      seo_description: "Sharks in GTA 6 — ocean predators around Leonida.",
    },
  ],
};

async function seedTable(table, items) {
  console.log(`\n${table}:`);
  for (const item of items) {
    const payload = { ...item, status: "published" };
    const { data: existing } = await supabase
      .from(table)
      .select("id")
      .eq("slug", item.slug)
      .maybeSingle();

    if (existing) {
      await supabase.from(table).update(payload).eq("id", existing.id);
      console.log(`  ~ ${item.title}`);
    } else {
      const { error } = await supabase.from(table).insert(payload);
      if (error) console.error(`  ! ${item.title}:`, error.message);
      else console.log(`  + ${item.title}`);
    }
  }
}

async function seed() {
  console.log("Seeding game entities...");
  for (const [table, items] of Object.entries(SEED)) {
    await seedTable(table, items);
  }
  console.log("\nDone.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
