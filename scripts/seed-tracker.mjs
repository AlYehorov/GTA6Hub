/**
 * Seed completion tracker categories and demo items.
 * Run: npm run seed:tracker
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

const CATEGORIES = [
  { slug: "100-percent-completion", title: "100 Percent Completion", icon: "trophy", sort_order: 1 },
  { slug: "main-missions", title: "Main Missions", icon: "flag", sort_order: 2 },
  { slug: "side-missions", title: "Side Missions", icon: "map-pin", sort_order: 3 },
  { slug: "random-events", title: "Random Events", icon: "zap", sort_order: 4 },
  { slug: "strangers", title: "Strangers", icon: "users", sort_order: 5 },
  { slug: "collectibles", title: "Collectibles", icon: "gem", sort_order: 6 },
  { slug: "weapons", title: "Weapons", icon: "crosshair", sort_order: 7 },
  { slug: "vehicles", title: "Vehicles", icon: "car", sort_order: 8 },
  { slug: "businesses", title: "Businesses", icon: "building", sort_order: 9 },
  { slug: "properties", title: "Properties", icon: "home", sort_order: 10 },
  { slug: "animals", title: "Animals", icon: "paw-print", sort_order: 11 },
  { slug: "wildlife", title: "Wildlife", icon: "tree", sort_order: 12 },
  { slug: "achievements", title: "Achievements", icon: "award", sort_order: 13 },
  { slug: "trophies", title: "Trophies", icon: "medal", sort_order: 14 },
  { slug: "easter-eggs", title: "Easter Eggs", icon: "egg", sort_order: 15 },
  { slug: "secrets", title: "Secrets", icon: "key", sort_order: 16 },
  { slug: "activities", title: "Activities", icon: "sparkles", sort_order: 17 },
];

const DEMO_ITEMS_BY_SLUG = {
  "100-percent-completion": [
    {
      title: "Complete all story missions",
      description: "Finish every main story chapter across Leonida and Vice City.",
      difficulty: "hard",
      spoiler: false,
    },
    {
      title: "Reach 100% game completion",
      description: "Hit the full completion stat — missions, collectibles, activities, and more.",
      difficulty: "hard",
      spoiler: true,
    },
  ],
  "main-missions": [
    {
      title: "Prologue: Vice City Arrival",
      description: "Complete the opening sequence and establish your foothold in Vice City.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "Chapter 3: Keys Run",
      description: "Cross the bridge network into the Leonida Keys during the mid-game arc.",
      difficulty: "medium",
      spoiler: true,
    },
    {
      title: "Finale: Leonida Showdown",
      description: "Complete the final story mission and resolve the main narrative.",
      difficulty: "hard",
      spoiler: true,
    },
  ],
  "side-missions": [
    {
      title: "Beach Patrol Gig",
      description: "Help local security along the Vice City beachfront.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "Swamp Courier",
      description: "Deliver packages through the Everglades-adjacent wetlands.",
      difficulty: "medium",
      spoiler: false,
    },
  ],
  "random-events": [
    {
      title: "Highway Pursuit Assist",
      description: "Optional encounter triggered while driving major Leonida highways.",
      difficulty: "medium",
      spoiler: false,
    },
    {
      title: "Nightclub Street Scene",
      description: "Random nightlife encounter in downtown Vice City.",
      difficulty: "easy",
      spoiler: true,
    },
  ],
  strangers: [
    {
      title: "Dockside Stranger",
      description: "Meet a recurring NPC at the Vice City marina.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "Highway Hitchhiker",
      description: "Pick up a stranger on the route toward the Keys.",
      difficulty: "medium",
      spoiler: false,
    },
  ],
  collectibles: [
    {
      title: "Hidden Stash #1 — Ocean Drive",
      description: "Collectible cache hidden near the neon-lit Ocean Drive strip.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "Leonida Postcard Set",
      description: "Find all tourism postcards scattered across the map.",
      difficulty: "medium",
      spoiler: false,
    },
    {
      title: "Rare Vinyl Record",
      description: "Locate the exclusive Vice City vinyl collectible.",
      difficulty: "hard",
      spoiler: true,
    },
  ],
  weapons: [
    {
      title: "Starting Sidearm",
      description: "Acquire your first pistol during early story progression.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "SMG Unlock",
      description: "Unlock a submachine gun through a side activity or shop.",
      difficulty: "medium",
      spoiler: false,
    },
  ],
  vehicles: [
    {
      title: "Starter Muscle Car",
      description: "Obtain your first high-performance vehicle in Vice City.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "Airboat Discovery",
      description: "Find and use an airboat in the Leonida wetlands.",
      difficulty: "medium",
      spoiler: false,
    },
  ],
  businesses: [
    {
      title: "Acquire First Business",
      description: "Purchase or unlock your first income-generating business.",
      difficulty: "medium",
      spoiler: false,
    },
    {
      title: "Max Business Upgrades",
      description: "Fully upgrade a business property to top tier.",
      difficulty: "hard",
      spoiler: true,
    },
  ],
  properties: [
    {
      title: "Safehouse — Vice City",
      description: "Unlock your primary Vice City safehouse.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "Keys Island Retreat",
      description: "Purchase a property in the Leonida Keys.",
      difficulty: "medium",
      spoiler: false,
    },
  ],
  animals: [
    {
      title: "Pet the Street Cat",
      description: "Interact with ambient cats found in urban districts.",
      difficulty: "easy",
      spoiler: false,
    },
  ],
  wildlife: [
    {
      title: "Spot an Alligator",
      description: "Observe wildlife in the Leonida swamp regions.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "Bird Watching Challenge",
      description: "Photograph native bird species across Leonida.",
      difficulty: "medium",
      spoiler: false,
    },
  ],
  achievements: [
    {
      title: "Welcome to Leonida",
      description: "Complete the tutorial and first open-world objective.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "Completionist",
      description: "Earn the platform achievement for 100% completion.",
      difficulty: "hard",
      spoiler: true,
    },
  ],
  trophies: [
    {
      title: "Bronze: First Heist",
      description: "Complete your first major score.",
      difficulty: "easy",
      spoiler: false,
    },
    {
      title: "Platinum: Leonida Legend",
      description: "Unlock the platinum trophy by completing all requirements.",
      difficulty: "hard",
      spoiler: true,
    },
  ],
  "easter-eggs": [
    {
      title: "Classic Rockstar Reference",
      description: "Find a hidden nod to a previous Rockstar title.",
      difficulty: "medium",
      spoiler: true,
    },
    {
      title: "Neon Alley Secret",
      description: "Discover a hidden alley easter egg in downtown Vice City.",
      difficulty: "medium",
      spoiler: true,
    },
  ],
  secrets: [
    {
      title: "Hidden Bunker Entrance",
      description: "Locate a concealed bunker access point in the mainland.",
      difficulty: "hard",
      spoiler: true,
    },
    {
      title: "Developer Room",
      description: "Find the in-world developer homage room.",
      difficulty: "hard",
      spoiler: true,
    },
  ],
  activities: [
    {
      title: "Street Racing Circuit",
      description: "Complete the Vice City street racing activity line.",
      difficulty: "medium",
      spoiler: false,
    },
    {
      title: "Fishing Minigame Master",
      description: "Catch every fish type in the Leonida fishing activity.",
      difficulty: "hard",
      spoiler: false,
    },
    {
      title: "Nightclub VIP Access",
      description: "Unlock VIP status at a Vice City nightclub.",
      difficulty: "medium",
      spoiler: true,
    },
  ],
};

async function seed() {
  console.log("Seeding completion tracker...");

  for (const cat of CATEGORIES) {
    const { data: existing } = await supabase
      .from("completion_categories")
      .select("id")
      .eq("slug", cat.slug)
      .maybeSingle();

    let categoryId = existing?.id;

    if (!categoryId) {
      const { data, error } = await supabase
        .from("completion_categories")
        .insert(cat)
        .select("id")
        .single();

      if (error) {
        console.error(`Failed to insert category ${cat.slug}:`, error.message);
        continue;
      }
      categoryId = data.id;
      console.log(`  + category: ${cat.title}`);
    } else {
      await supabase.from("completion_categories").update(cat).eq("id", categoryId);
      console.log(`  ~ category: ${cat.title}`);
    }

    const items = DEMO_ITEMS_BY_SLUG[cat.slug] ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const { data: existingItem } = await supabase
        .from("completion_items")
        .select("id")
        .eq("category_id", categoryId)
        .eq("title", item.title)
        .maybeSingle();

      const payload = {
        category_id: categoryId,
        title: item.title,
        description: item.description,
        spoiler: item.spoiler,
        difficulty: item.difficulty,
        sort_order: i + 1,
        status: "published",
      };

      if (existingItem) {
        await supabase.from("completion_items").update(payload).eq("id", existingItem.id);
        console.log(`    ~ item: ${item.title}`);
      } else {
        const { error } = await supabase.from("completion_items").insert(payload);
        if (error) {
          console.error(`    Failed item ${item.title}:`, error.message);
        } else {
          console.log(`    + item: ${item.title}`);
        }
      }
    }
  }

  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
