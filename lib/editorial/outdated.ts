import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { OUTDATED_ARTICLE_DAYS } from "@/lib/editorial/constants";
import type { OutdatedArticle } from "@/lib/editorial/types";

export async function detectOutdatedArticles(
  limit = 20
): Promise<OutdatedArticle[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - OUTDATED_ARTICLE_DAYS);

  const [{ data: articles }, { data: rockstarSources }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, slug, type, updated_at, published_at")
      .eq("status", "published")
      .lt("updated_at", cutoff.toISOString())
      .order("updated_at", { ascending: true }),
    supabase
      .from("source_items")
      .select("title, published_at, created_at")
      .in("source", ["rockstar_newswire", "rockstar_youtube"])
      .order("published_at", { ascending: false })
      .limit(50),
  ]);

  if (!articles?.length || !rockstarSources?.length) return [];

  const newestRockstar = rockstarSources[0];
  const newestDate =
    (newestRockstar.published_at as string | null) ??
    (newestRockstar.created_at as string);
  const newestTime = new Date(newestDate).getTime();

  const outdated: OutdatedArticle[] = [];

  for (const row of articles) {
    const updatedAt = row.updated_at as string;
    const updatedTime = new Date(updatedAt).getTime();
    if (newestTime <= updatedTime) continue;

    const daysSinceUpdate = Math.floor(
      (Date.now() - updatedTime) / (1000 * 60 * 60 * 24)
    );

    outdated.push({
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      type: row.type as "news" | "guide",
      daysSinceUpdate,
      newestRockstarSourceTitle: newestRockstar.title as string,
      newestRockstarSourceDate: newestDate,
    });
  }

  return outdated.slice(0, limit);
}
