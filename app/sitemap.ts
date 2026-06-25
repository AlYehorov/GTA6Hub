import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/constants/site";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const STATIC_ROUTES = [
  "",
  "/news",
  "/guides",
  "/search",
  "/characters",
  "/vehicles",
  "/trailers",
  "/map",
  "/tracker",
  "/leaderboard",
  "/login",
  "/register",
  "/weapons",
  "/locations",
  "/animals",
  "/businesses",
  "/missions",
  "/collectibles",
  "/checklist",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/news" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  if (!isSupabaseConfigured()) return staticEntries;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, type, updated_at, published_at")
    .eq("status", "published");

  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${base}/${a.type === "guide" ? "guides" : "news"}/${a.slug}`,
    lastModified: new Date(a.updated_at ?? a.published_at ?? now),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const { data: categories } = await supabase
    .from("completion_categories")
    .select("slug, created_at");

  const trackerEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/tracker`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    ...(categories ?? []).map((c) => ({
      url: `${base}/tracker/${c.slug}`,
      lastModified: new Date(c.created_at ?? now),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const entityTables = [
    { table: "game_locations", prefix: "/locations" },
    { table: "game_characters", prefix: "/characters" },
    { table: "game_vehicles", prefix: "/vehicles" },
    { table: "game_weapons", prefix: "/weapons" },
    { table: "game_animals", prefix: "/animals" },
    { table: "game_businesses", prefix: "/businesses" },
    { table: "game_missions", prefix: "/missions" },
    { table: "game_collectibles", prefix: "/collectibles" },
  ] as const;

  const entityEntries: MetadataRoute.Sitemap = [];
  for (const { table, prefix } of entityTables) {
    const { data } = await supabase
      .from(table)
      .select("slug, updated_at")
      .eq("status", "published");
    for (const row of data ?? []) {
      entityEntries.push({
        url: `${base}${prefix}/${row.slug}`,
        lastModified: new Date(row.updated_at ?? now),
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  }

  return [...staticEntries, ...trackerEntries, ...articleEntries, ...entityEntries];
}
