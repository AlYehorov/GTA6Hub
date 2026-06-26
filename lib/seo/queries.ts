import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { ENTITY_KINDS } from "@/lib/entities/config";
import type { EntityRowsByKind } from "@/lib/editorial/content-gaps";
import type { SeoArticleRecord } from "@/lib/seo/types";

export async function fetchArticlesForSeoIntelligence(): Promise<SeoArticleRecord[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select(
      `
      id, title, slug, type, status, excerpt, content,
      hero_image_url, seo_title, seo_description, video_id,
      source_url, published_at, updated_at,
      category:categories(name)
    `
    )
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => {
    const rawCategory = row.category as { name: string } | { name: string }[] | null;
    const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
    return {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      type: row.type as "news" | "guide",
      status: row.status as SeoArticleRecord["status"],
      excerpt: (row.excerpt as string | null) ?? null,
      content: row.content as string,
      hero_image_url: (row.hero_image_url as string | null) ?? null,
      seo_title: (row.seo_title as string | null) ?? null,
      seo_description: (row.seo_description as string | null) ?? null,
      video_id: (row.video_id as string | null) ?? null,
      source_url: (row.source_url as string | null) ?? null,
      published_at: (row.published_at as string | null) ?? null,
      updated_at: row.updated_at as string,
      category: category?.name ?? null,
    };
  });
}

export async function fetchSourceTitlesForKeywords(limit = 40): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("source_items")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => row.title as string);
}

export async function fetchVideoTitlesForKeywords(limit = 30): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("videos")
    .select("title")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => row.title as string);
}

export function buildValidPathsFromData(
  articles: SeoArticleRecord[],
  entityRows: EntityRowsByKind[],
  videoSlugs: string[]
): { articlePaths: string[]; entityPaths: string[]; videoPaths: string[] } {
  const articlePaths = articles
    .filter((a) => a.status === "published")
    .map((a) => {
      const prefix = a.type === "guide" ? "/guides" : "/news";
      return `${prefix}/${a.slug}`;
    });

  const entityPaths: string[] = [];
  for (const { kind, entities } of entityRows) {
    const config = ENTITY_KINDS[kind];
    for (const entity of entities) {
      if (entity.status === "published") {
        entityPaths.push(`${config.routePrefix}/${entity.slug}`);
      }
    }
  }

  const videoPaths = videoSlugs.map((slug) => `/videos/${slug}`);

  return { articlePaths, entityPaths, videoPaths };
}

export async function fetchPublishedVideoSlugs(limit = 30): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("videos")
    .select("slug")
    .eq("status", "published")
    .limit(limit);

  return (data ?? []).map((row) => row.slug as string);
}

export async function fetchArticleForAiEditor(
  articleId: string
): Promise<SeoArticleRecord | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select(
      `
      id, title, slug, type, status, excerpt, content,
      hero_image_url, seo_title, seo_description, video_id,
      source_url, published_at, updated_at,
      category:categories(name)
    `
    )
    .eq("id", articleId)
    .maybeSingle();

  if (!data) return null;

  const rawCategory = data.category as { name: string } | { name: string }[] | null;
  const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  return {
    id: data.id as string,
    title: data.title as string,
    slug: data.slug as string,
    type: data.type as "news" | "guide",
    status: data.status as SeoArticleRecord["status"],
    excerpt: (data.excerpt as string | null) ?? null,
    content: data.content as string,
    hero_image_url: (data.hero_image_url as string | null) ?? null,
    seo_title: (data.seo_title as string | null) ?? null,
    seo_description: (data.seo_description as string | null) ?? null,
    video_id: (data.video_id as string | null) ?? null,
    source_url: (data.source_url as string | null) ?? null,
    published_at: (data.published_at as string | null) ?? null,
    updated_at: data.updated_at as string,
    category: category?.name ?? null,
  };
}
