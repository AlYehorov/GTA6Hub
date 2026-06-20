import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MOCK_CHARACTERS, MOCK_VEHICLES } from "@/lib/data/mock-content";

export type SearchResultType = "news" | "guide" | "character" | "vehicle";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  href: string;
  type: SearchResultType;
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const [articles, characters, vehicles] = await Promise.all([
    searchArticles(trimmed),
    searchCharacters(trimmed),
    searchVehicles(trimmed),
  ]);

  return [...articles, ...characters, ...vehicles];
}

async function searchArticles(query: string): Promise<SearchResult[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const sanitized = query.replace(/[%_,]/g, " ").trim();
  const pattern = `%${sanitized}%`;

  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, type")
    .eq("status", "published")
    .or(`title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern}`)
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) return [];

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.excerpt as string) ?? "",
    href: row.type === "guide" ? `/guides/${row.slug}` : `/news/${row.slug}`,
    type: row.type as "news" | "guide",
  }));
}

function searchCharacters(query: string): SearchResult[] {
  const q = query.toLowerCase();
  return MOCK_CHARACTERS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      (c.subtitle?.toLowerCase().includes(q) ?? false) ||
      (c.tag?.toLowerCase().includes(q) ?? false)
  ).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.subtitle ?? "",
    href: c.href,
    type: "character" as const,
  }));
}

function searchVehicles(query: string): SearchResult[] {
  const q = query.toLowerCase();
  return MOCK_VEHICLES.filter(
    (v) =>
      v.title.toLowerCase().includes(q) ||
      (v.subtitle?.toLowerCase().includes(q) ?? false) ||
      (v.tag?.toLowerCase().includes(q) ?? false)
  ).map((v) => ({
    id: v.id,
    title: v.title,
    description: v.subtitle ?? "",
    href: v.href,
    type: "vehicle" as const,
  }));
}

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  news: "News",
  guide: "Guide",
  character: "Character",
  vehicle: "Vehicle",
};
