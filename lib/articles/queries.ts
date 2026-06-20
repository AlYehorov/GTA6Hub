import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type {
  ArticleListItem,
  ArticleType,
  ArticleWithRelations,
  Category,
  Tag,
  Article,
} from "@/lib/types/article";

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

function mapListItem(row: Record<string, unknown>): ArticleListItem {
  const { category, article_tags: _tags, ...rest } = row;
  void _tags;
  return {
    ...(rest as unknown as Omit<ArticleListItem, "category">),
    category: category
      ? {
          name: (category as { name: string }).name,
          slug: (category as { slug: string }).slug,
        }
      : null,
  };
}

export async function getPublishedArticles(
  type: ArticleType,
  limit = 50
): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, hero_image_url, status, type, reading_time_minutes, published_at, category:categories(name, slug)")
    .eq("type", type)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPublishedArticles:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapListItem(row as Record<string, unknown>));
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
  return mapArticle(data as Record<string, unknown>);
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
    .select("id, title, slug, excerpt, hero_image_url, status, type, reading_time_minutes, published_at, category:categories(name, slug)")
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
  return (data ?? []).map((row) => mapListItem(row as Record<string, unknown>));
}

export async function getAllArticlesAdmin(): Promise<ArticleListItem[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, hero_image_url, status, type, reading_time_minutes, published_at, category:categories(name, slug)")
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
