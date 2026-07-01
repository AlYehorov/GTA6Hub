import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isGta6Content } from "@/lib/gta6/content-filter";
import { meetsArticleConfidenceThreshold } from "@/lib/editorial/confidence";
import type { ArticleListItem } from "@/lib/types/article";
import { entityHref } from "@/lib/entities/config";
import { searchEntities } from "@/lib/entities/queries";
import type { GameEntityKind } from "@/lib/types/game-entity";

export type SearchResultType =
  | "news"
  | "guide"
  | "character"
  | "vehicle"
  | "location"
  | "weapon"
  | "animal"
  | "business"
  | "mission"
  | "collectible";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  href: string;
  type: SearchResultType;
}

const ENTITY_KIND_TO_SEARCH_TYPE: Record<GameEntityKind, SearchResultType> = {
  locations: "location",
  characters: "character",
  vehicles: "vehicle",
  weapons: "weapon",
  animals: "animal",
  businesses: "business",
  missions: "mission",
  collectibles: "collectible",
};

export async function searchAll(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const [articles, entities] = await Promise.all([
    searchArticles(trimmed),
    searchEntities(trimmed, 5),
  ]);

  const entityResults: SearchResult[] = entities.map(({ kind, entity }) => ({
    id: entity.id,
    title: entity.title,
    description: entity.description,
    href: entityHref(kind, entity.slug),
    type: ENTITY_KIND_TO_SEARCH_TYPE[kind],
  }));

  return [...articles, ...entityResults];
}

async function searchArticles(query: string): Promise<SearchResult[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const sanitized = query.replace(/[%_,]/g, " ").trim();
  const pattern = `%${sanitized}%`;

  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, type, ai_confidence, source_label")
    .eq("status", "published")
    .or(`title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern}`)
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) return [];

  return (data ?? [])
    .filter((row) =>
      isGta6Content(row.title as string, row.excerpt as string) &&
      meetsArticleConfidenceThreshold(
        row.ai_confidence as number | null,
        row.source_label as ArticleListItem["source_label"]
      )
    )
    .map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.excerpt as string) ?? "",
    href: row.type === "guide" ? `/guides/${row.slug}` : `/news/${row.slug}`,
    type: row.type as "news" | "guide",
  }));
}

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  news: "News",
  guide: "Guides",
  character: "Characters",
  vehicle: "Vehicles",
  location: "Locations",
  weapon: "Weapons",
  animal: "Animals",
  business: "Businesses",
  mission: "Missions",
  collectible: "Collectibles",
};
