/**
 * Seed demo articles for production / local development.
 * Run: npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
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

function calculateReadingTime(content) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 200));
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function uploadHeroImage(localPath, storagePath) {
  const buffer = readFileSync(localPath);
  const ext = localPath.split(".").pop();
  const contentType =
    ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";

  const { error } = await supabase.storage
    .from("article-images")
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Upload failed (${storagePath}): ${error.message}`);

  const { data } = supabase.storage.from("article-images").getPublicUrl(storagePath);
  return data.publicUrl;
}

async function upsertArticle(article, tagSlugs) {
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", article.slug)
    .maybeSingle();

  let articleId;

  if (existing) {
    const { data, error } = await supabase
      .from("articles")
      .update(article)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) throw new Error(`Update ${article.slug}: ${error.message}`);
    articleId = data.id;
    console.log(`Updated: ${article.title}`);
  } else {
    const { data, error } = await supabase
      .from("articles")
      .insert(article)
      .select("id")
      .single();
    if (error) throw new Error(`Insert ${article.slug}: ${error.message}`);
    articleId = data.id;
    console.log(`Created: ${article.title}`);
  }

  const { data: tags } = await supabase.from("tags").select("id, slug").in("slug", tagSlugs);
  if (tags?.length) {
    await supabase.from("article_tags").delete().eq("article_id", articleId);
    await supabase.from("article_tags").insert(
      tags.map((t) => ({ article_id: articleId, tag_id: t.id }))
    );
  }

  return articleId;
}

const DEMO_ARTICLES = [
  {
    slug: "gta-vi-trailer-2-breakdown",
    title: "GTA VI Trailer 2: Every Detail We Caught Frame by Frame",
    excerpt:
      "From neon-soaked Vice City streets to new gameplay mechanics — our full breakdown of Rockstar's latest reveal.",
    category: "trailer",
    image: "public/images/gta6/trailer-2-header.webp",
    storage: "seed/trailer-2-breakdown.webp",
    tags: ["lucia", "jason", "vice-city", "trailer-2"],
    content: `# Trailer 2: Everything We Know

Rockstar dropped the second GTA VI trailer and Vice City has never looked sharper.

## Lucia & Jason

The trailer doubles down on the dual-protagonist setup. Lucia and Jason feel like partners in crime with real chemistry.

## Vice City & Leonida

Neon-soaked streets, highways into the Everglades, and Miami heat haze everywhere.

## What to Watch Next

- Official gameplay reveal
- Pre-order details
- Map size confirmations

> GTA6Hub is unofficial and not affiliated with Rockstar Games.`,
    seo_title: "GTA VI Trailer 2 Breakdown | GTA6Hub",
    seo_description: "Frame-by-frame breakdown of GTA VI Trailer 2 — Lucia, Jason, and Vice City.",
    publishedOffsetDays: 0,
  },
  {
    slug: "lucia-and-jason-what-we-know",
    title: "Lucia and Jason: What We Know About the Protagonists",
    excerpt:
      "The dual-protagonist story setup, their backgrounds, and how co-op narrative might work in Leonida.",
    category: "official",
    image: "public/images/gta6/jason-lucia-motel.jpg",
    storage: "seed/lucia-jason-protagonists.jpg",
    tags: ["lucia", "jason", "leonida"],
    content: `# Lucia and Jason: What We Know

Grand Theft Auto VI centers on two protagonists — Lucia and Jason — partners navigating crime and survival in Leonida.

## Lucia

Rockstar's first female lead in the modern GTA era. Trailers show her as sharp, driven, and deeply connected to Vice City's criminal underworld.

## Jason

Jason complements Lucia as a co-lead with his own motivations and skill set. Together they represent a narrative built around partnership.

## Dual-Protagonist Gameplay

Switching between characters may unlock unique mission paths, abilities, and story perspectives — similar to GTA V but with deeper integration.

> Information compiled from official trailers. GTA6Hub is unofficial.`,
    seo_title: "Lucia and Jason — GTA VI Protagonists | GTA6Hub",
    seo_description: "Everything we know about GTA VI protagonists Lucia and Jason in Leonida.",
    publishedOffsetDays: 3,
  },
  {
    slug: "vice-city-map-size",
    title: "Vice City Map Size Compared to Previous GTA Worlds",
    excerpt:
      "Early estimates suggest Leonida will be the largest open world Rockstar has ever built. Here's the math.",
    category: "analysis",
    image: "public/images/gta6/vice-city-banner.jpg",
    storage: "seed/vice-city-map-size.jpg",
    tags: ["vice-city", "leonida", "map"],
    content: `# Vice City Map Size

Leonida is shaping up to be Rockstar's most ambitious open world yet.

## Scale Estimates

Community analysis from Trailer 2 suggests a map spanning dense urban Vice City, coastal highways, and vast Everglades swampland.

## Compared to GTA V

Los Santos set a high bar. Leonida appears to exceed it in vertical density, biome variety, and explorable wilderness.

## What We Still Don't Know

Rockstar hasn't confirmed exact map dimensions. Expect official details closer to launch.

> Analysis based on trailer footage. Estimates are unofficial.`,
    seo_title: "GTA VI Map Size — Vice City & Leonida | GTA6Hub",
    seo_description: "How big is the GTA VI map? Vice City and Leonida size compared to previous GTA worlds.",
    publishedOffsetDays: 6,
  },
  {
    slug: "neon-nights-vice-city-districts",
    title: "Neon Nights: Vice City Districts Revealed",
    excerpt:
      "Ocean Drive, downtown, and the Keys — a tour of every confirmed location in Leonida.",
    category: "official",
    image: "public/images/gta6/lucia-caminos-02.jpg",
    storage: "seed/neon-nights-districts.jpg",
    tags: ["vice-city", "leonida"],
    content: `# Neon Nights: Vice City Districts

Trailer 2 gave us our best look yet at Vice City's neighborhoods and surrounding Leonida.

## Downtown & Ocean Drive

Neon-lit boulevards, nightlife districts, and high-rise corridors define the urban core — a clear Miami-inspired aesthetic.

## The Keys & Coastline

Beyond the city, coastal islands and bridges connect Leonida's archipelago, opening up boat chases and scenic getaways.

## Everglades

Swampland and rural highways provide contrast to the neon city — perfect for off-road sequences and hidden content.

> District names are based on trailer analysis. GTA6Hub is unofficial.`,
    seo_title: "Vice City Districts — Neon Nights | GTA6Hub",
    seo_description: "Tour of confirmed Vice City districts and Leonida locations from GTA VI trailers.",
    publishedOffsetDays: 8,
  },
];

async function main() {
  const { data: categories, error } = await supabase.from("categories").select("*");
  if (error) {
    console.error("Run migrations first: supabase/migrations/001_initial_schema.sql");
    process.exit(1);
  }

  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  console.log("Uploading hero images...\n");

  for (const demo of DEMO_ARTICLES) {
    const heroUrl = await uploadHeroImage(join(root, demo.image), demo.storage);
    const publishedAt = new Date(
      Date.now() - demo.publishedOffsetDays * 86400000
    ).toISOString();

    await upsertArticle(
      {
        title: demo.title,
        slug: demo.slug,
        excerpt: demo.excerpt,
        content: demo.content,
        hero_image_url: heroUrl,
        status: "published",
        type: "news",
        reading_time_minutes: calculateReadingTime(demo.content),
        category_id: categoryBySlug[demo.category] ?? null,
        seo_title: demo.seo_title,
        seo_description: demo.seo_description,
        published_at: publishedAt,
      },
      demo.tags
    );
  }

  console.log("\nDone! 4 demo articles seeded.");
  console.log("View: http://localhost:3000/news");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
