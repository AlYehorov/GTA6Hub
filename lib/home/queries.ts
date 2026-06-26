import { unstable_cache } from "next/cache";
import { REVALIDATE_ARTICLES, REVALIDATE_COMMUNITY, REVALIDATE_TRACKER } from "@/lib/cache/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { editorialLabelFromCategory } from "@/lib/newsroom/labels";
import { isGta6Content } from "@/lib/gta6/content-filter";
import { meetsArticleConfidenceThreshold } from "@/lib/editorial/confidence";
import { getPublicSupabase } from "@/lib/supabase/public";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { ArticleListItem } from "@/lib/types/article";
import type { CompletionItem } from "@/lib/types/completion";
import type { CommunityStats } from "@/lib/types/profile";

const ARTICLE_LIST_SELECT = `
  id, title, slug, excerpt, hero_image_url, status, type, reading_time_minutes,
  published_at, source_label, source_url, ai_confidence,
  category:categories(name, slug)
`;

export type HomepageArticleSections = {
  latest: ArticleListItem[];
  official: ArticleListItem[];
  trailers: ArticleListItem[];
  rumors: ArticleListItem[];
  guides: ArticleListItem[];
};

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

function filterArticles(items: ArticleListItem[]): ArticleListItem[] {
  return items.filter(
    (item) =>
      isGta6Content(item.title, item.excerpt) &&
      meetsArticleConfidenceThreshold(item.ai_confidence)
  );
}

const getCachedHomeArticles = unstable_cache(
  async (): Promise<HomepageArticleSections | null> => {
    if (!isSupabaseConfigured()) return null;

    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_LIST_SELECT)
      .eq("status", "published")
      .in("type", ["news", "guide"])
      .order("published_at", { ascending: false })
      .limit(48);

    if (error || !data?.length) return null;

    const articles = filterArticles(
      data.map((row) => mapListItem(row as Record<string, unknown>))
    );
    if (articles.length === 0) return null;

    const news = articles.filter((a) => a.type === "news");
    const guides = articles.filter((a) => a.type === "guide");

    return {
      latest: news.slice(0, 5),
      official: news.filter((a) => a.category?.slug === "official").slice(0, 4),
      trailers: news.filter((a) => a.category?.slug === "trailer").slice(0, 4),
      rumors: news.filter((a) => a.source_label === "unconfirmed").slice(0, 4),
      guides: guides.slice(0, 4),
    };
  },
  ["homepage-article-sections"],
  { revalidate: REVALIDATE_ARTICLES, tags: ["articles", "homepage"] }
);

export async function getHomepageArticleSections(): Promise<HomepageArticleSections | null> {
  if (!isSupabaseConfigured()) return null;
  return getCachedHomeArticles();
}

export type HomepageTrackerSnapshot = {
  items: CompletionItem[];
  totalCategories: number;
};

const getCachedTrackerSnapshot = unstable_cache(
  async (): Promise<HomepageTrackerSnapshot | null> => {
    if (!isSupabaseConfigured()) return null;

    const supabase = getPublicSupabase();
    const [{ data: items, error: itemsError }, { data: categories, error: catError }] =
      await Promise.all([
        supabase
          .from("completion_items")
          .select(
            "id, category_id, title, description, spoiler, difficulty, image_url, sort_order, status, created_at, updated_at"
          )
          .eq("status", "published")
          .order("sort_order", { ascending: true })
          .limit(24),
        supabase.from("completion_categories").select("id"),
      ]);

    if (itemsError || catError || !items?.length) return null;

    return {
      items: items as CompletionItem[],
      totalCategories: categories?.length ?? 0,
    };
  },
  ["homepage-tracker-snapshot"],
  { revalidate: REVALIDATE_TRACKER, tags: ["tracker", "homepage"] }
);

export async function getHomepageTrackerSnapshot(): Promise<HomepageTrackerSnapshot | null> {
  if (!isSupabaseConfigured()) return null;
  return getCachedTrackerSnapshot();
}

const getCachedCommunityStats = unstable_cache(
  async (): Promise<CommunityStats | null> => {
    if (!isSupabaseAdminConfigured()) return null;

    const supabase = createAdminClient();

    const { count: totalPlayers } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const { data: latest } = await supabase
      .from("user_achievements")
      .select("user_id, unlocked_at, achievement_id")
      .order("unlocked_at", { ascending: false })
      .limit(5);

    const achievementIds = [...new Set((latest ?? []).map((r) => r.achievement_id as string))];
    const userIds = [...new Set((latest ?? []).map((r) => r.user_id as string))];

    const [{ data: achievements }, { data: userProfiles }] = await Promise.all([
      achievementIds.length
        ? supabase.from("achievements").select("id, title").in("id", achievementIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? supabase.from("profiles").select("id, username").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const achMap = new Map((achievements ?? []).map((a) => [a.id as string, a.title as string]));
    const profileMap = new Map((userProfiles ?? []).map((p) => [p.id as string, p.username as string]));

    const stats: CommunityStats = {
      total_players: totalPlayers ?? 0,
      average_completion: 0,
      latest_achievements: (latest ?? []).map((row) => ({
        username: profileMap.get(row.user_id as string) ?? "Player",
        achievement_title: achMap.get(row.achievement_id as string) ?? "Achievement",
        unlocked_at: row.unlocked_at as string,
      })),
    };

    if (stats.total_players === 0 && stats.latest_achievements.length === 0) return null;
    return stats;
  },
  ["homepage-community-stats"],
  { revalidate: REVALIDATE_COMMUNITY, tags: ["community", "homepage"] }
);

export async function getHomepageCommunityStats(): Promise<CommunityStats | null> {
  if (!isSupabaseConfigured()) return null;
  return getCachedCommunityStats();
}
