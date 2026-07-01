import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { editorialLabelFromCategory } from "@/lib/newsroom/labels";
import { isGta6Content } from "@/lib/gta6/content-filter";
import { meetsArticleConfidenceThreshold } from "@/lib/editorial/confidence";
import type {
  ArticleListItem,
  ArticleType,
  ArticleWithRelations,
  Category,
  Tag,
  Article,
} from "@/lib/types/article";

function isPublicArticle(item: ArticleListItem): boolean {
  return (
    isGta6Content(item.title, item.excerpt) &&
    meetsArticleConfidenceThreshold(item.ai_confidence, item.source_label)
  );
}

const ARTICLE_LIST_SELECT = `
  id, title, slug, excerpt, hero_image_url, status, type, reading_time_minutes,
  published_at, source_label, source_url, ai_confidence,
  category:categories(name, slug)
`;

function mapListItem(row: Record<string, unknown>): ArticleListItem {
  const category = row.category as { name: string; slug: string } | null;
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    excerpt: (row.excerpt as string | null) ?? null,
    hero_image_url: (row.hero_image_url as string | null) ?? null,
    status: row.status as ArticleListItem["status"],
    type: row.type as ArticleListItem["type"],
    reading_time_minutes: Number(row.reading_time_minutes ?? 0),
    published_at: (row.published_at as string | null) ?? null,
    source_label: (row.source_label as ArticleListItem["source_label"]) ?? null,
    source_url: (row.source_url as string | null) ?? null,
    ai_confidence: row.ai_confidence != null ? Number(row.ai_confidence) : null,
    editorial_label: editorialLabelFromCategory(category?.slug, row.source_label as ArticleListItem["source_label"]),
    category: category ? { name: category.name, slug: category.slug } : null,
  };
}

function filterGta6Articles(items: ArticleListItem[]): ArticleListItem[] {
  return items.filter(isPublicArticle);
}

export async function getPublishedArticles(
  type: ArticleType,
  limit = 50
): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_LIST_SELECT)
    .eq("type", type)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPublishedArticles:", error.message);
    return [];
  }

  return filterGta6Articles(
    (data ?? []).map((row) => mapListItem(row as Record<string, unknown>))
  );
}

export async function getPublishedArticlesByCategory(
  type: ArticleType,
  categorySlug: string,
  limit = 10
): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) return [];

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_LIST_SELECT)
    .eq("type", type)
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return filterGta6Articles(
    (data ?? []).map((row) => mapListItem(row as Record<string, unknown>))
  );
}

export async function getPublishedArticlesBySourceLabel(
  type: ArticleType,
  sourceLabel: string | string[],
  limit = 10
): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const labels = Array.isArray(sourceLabel) ? sourceLabel : [sourceLabel];
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_LIST_SELECT)
    .eq("type", type)
    .eq("status", "published")
    .in("source_label", labels)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return filterGta6Articles(
    (data ?? []).map((row) => mapListItem(row as Record<string, unknown>))
  );
}

export async function getEditorialPicks(limit = 6): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_LIST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit * 2);

  if (error) return [];

  const items = filterGta6Articles(
    (data ?? []).map((row) => mapListItem(row as Record<string, unknown>))
  );
  return items
    .sort((a, b) => (b.ai_confidence ?? 0) - (a.ai_confidence ?? 0))
    .slice(0, limit);
}

const ARTICLE_SELECT = `
  *,
  category:categories(id, name, slug, description, created_at),
  article_tags(tag_id, tags(id, name, slug, created_at))
`;

function mapArticle(row: Record<string, unknown>): ArticleWithRelations {
  const articleTags = (row.article_tags as Array<{ tags: Tag | null }>) ?? [];
  const { article_tags: _tags, category, ...articleFields } = row;
  void _tags;

  return {
    ...(articleFields as unknown as Article),
    category: (category as ArticleWithRelations["category"]) ?? null,
    tags: articleTags.map((at) => at.tags).filter(Boolean) as Tag[],
  };
}

export async function getArticleBySlug(
  slug: string,
  type: ArticleType
): Promise<ArticleWithRelations | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("slug", slug)
    .eq("type", type)
    .eq("status", "published")
    .single();

  if (error || !data) return null;

  const article = mapArticle(data as Record<string, unknown>);
  if (!isGta6Content(article.title, article.excerpt, article.content)) return null;
  if (!meetsArticleConfidenceThreshold(article.ai_confidence, article.source_label)) return null;
  return article;
}

export async function getRelatedArticles(
  articleId: string,
  type: ArticleType,
  categoryId: string | null,
  limit = 3
): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select(ARTICLE_LIST_SELECT)
    .eq("type", type)
    .eq("status", "published")
    .neq("id", articleId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) return [];
  return filterGta6Articles(
    (data ?? []).map((row) => mapListItem(row as Record<string, unknown>))
  );
}

export async function getAllArticlesAdmin(): Promise<ArticleListItem[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_LIST_SELECT)
    .order("updated_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => mapListItem(row as Record<string, unknown>));
}

export async function getArticleByIdAdmin(
  id: string
): Promise<ArticleWithRelations | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapArticle(data as Record<string, unknown>);
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) return [];
  return data ?? [];
}

export async function getTags(): Promise<Tag[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");

  if (error) return [];
  return data ?? [];
}

export async function getCategoriesAdmin(): Promise<Category[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = createAdminClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data ?? [];
}

export async function getTagsAdmin(): Promise<Tag[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = createAdminClient();
  const { data } = await supabase.from("tags").select("*").order("name");
  return data ?? [];
}
