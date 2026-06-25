import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { trackActivity } from "@/lib/profile/activity";
import { awardXP } from "@/lib/profile/xp";

export interface AchievementContext {
  overallPercentage: number;
  completedCount: number;
  totalCount: number;
  categoryCompletions: Map<string, { slug: string; completed: number; total: number }>;
  categoriesWithProgress: number;
  categoriesCompleted: number;
  savedArticlesCount: number;
  savedLocationsCount: number;
  articlesReadCount: number;
  guidesReadCount: number;
  newsReadCount: number;
}

async function buildAchievementContext(userId: string): Promise<AchievementContext | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const [itemsRes, progressRes, categoriesRes, savedArticlesRes, savedLocationsRes, readsRes] =
    await Promise.all([
      supabase.from("completion_items").select("id, category_id").eq("status", "published"),
      supabase.from("user_progress").select("item_id").eq("user_id", userId).eq("completed", true),
      supabase.from("completion_categories").select("id, slug"),
      supabase.from("saved_articles").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("saved_locations").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("article_reads").select("article_id, article:articles(type)").eq("user_id", userId),
    ]);

  const items = itemsRes.data ?? [];
  const completedIds = new Set((progressRes.data ?? []).map((r) => r.item_id as string));
  const categories = new Map((categoriesRes.data ?? []).map((c) => [c.id as string, c.slug as string]));

  const categoryCompletions = new Map<string, { slug: string; completed: number; total: number }>();
  let categoriesWithProgress = 0;
  let categoriesCompleted = 0;

  for (const [catId, slug] of categories) {
    const catItems = items.filter((i) => i.category_id === catId);
    const catCompleted = catItems.filter((i) => completedIds.has(i.id as string)).length;
    categoryCompletions.set(catId, { slug, completed: catCompleted, total: catItems.length });
    if (catCompleted > 0) categoriesWithProgress++;
    if (catItems.length > 0 && catCompleted >= catItems.length) categoriesCompleted++;
  }

  const totalCount = items.length;
  const completedCount = items.filter((i) => completedIds.has(i.id as string)).length;

  let guidesReadCount = 0;
  let newsReadCount = 0;
  for (const row of readsRes.data ?? []) {
    const article = row.article as { type?: string } | null;
    if (article?.type === "guide") guidesReadCount++;
    if (article?.type === "news") newsReadCount++;
  }

  return {
    overallPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    completedCount,
    totalCount,
    categoryCompletions,
    categoriesWithProgress,
    categoriesCompleted,
    savedArticlesCount: savedArticlesRes.count ?? 0,
    savedLocationsCount: savedLocationsRes.count ?? 0,
    articlesReadCount: readsRes.data?.length ?? 0,
    guidesReadCount,
    newsReadCount,
  };
}

export interface AchievementRule {
  slug: string;
  check: (ctx: AchievementContext) => boolean;
}

const ACHIEVEMENT_RULES: AchievementRule[] = [
  { slug: "first_login", check: () => true },
  { slug: "first_tracker_item", check: (ctx) => ctx.completedCount >= 1 },
  { slug: "complete_10_tracker_items", check: (ctx) => ctx.completedCount >= 10 },
  { slug: "complete_50_tracker_items", check: (ctx) => ctx.completedCount >= 50 },
  { slug: "reach_10_percent", check: (ctx) => ctx.overallPercentage >= 10 },
  { slug: "reach_25_percent", check: (ctx) => ctx.overallPercentage >= 25 },
  { slug: "reach_50_percent", check: (ctx) => ctx.overallPercentage >= 50 },
  { slug: "save_first_article", check: (ctx) => ctx.savedArticlesCount >= 1 },
  { slug: "save_10_articles", check: (ctx) => ctx.savedArticlesCount >= 10 },
  { slug: "read_10_articles", check: (ctx) => ctx.articlesReadCount >= 10 },
  { slug: "read_50_articles", check: (ctx) => ctx.articlesReadCount >= 50 },
  { slug: "trailer_detective", check: (ctx) => ctx.newsReadCount >= 5 },
  { slug: "guide_reader", check: (ctx) => ctx.guidesReadCount >= 5 },
  { slug: "map_explorer", check: (ctx) => ctx.savedLocationsCount >= 5 },
  // Legacy slugs (Sprint 6)
  { slug: "first-mission", check: (ctx) => getCategoryCompletion(ctx, "main-missions").completed >= 1 },
  { slug: "ten-percent", check: (ctx) => ctx.overallPercentage >= 10 },
  { slug: "twenty-five-percent", check: (ctx) => ctx.overallPercentage >= 25 },
  { slug: "fifty-percent", check: (ctx) => ctx.overallPercentage >= 50 },
  { slug: "hundred-percent", check: (ctx) => ctx.overallPercentage >= 100 },
  { slug: "collector", check: (ctx) => isCategoryComplete(ctx, "collectibles") },
  { slug: "explorer", check: (ctx) => ctx.categoriesWithProgress >= 5 },
  { slug: "hunter", check: (ctx) => isCategoryComplete(ctx, "weapons") },
  {
    slug: "secret-finder",
    check: (ctx) => isCategoryComplete(ctx, "secrets") || isCategoryComplete(ctx, "easter-eggs"),
  },
];

function getCategoryCompletion(
  ctx: AchievementContext,
  slug: string
): { completed: number; total: number } {
  for (const c of ctx.categoryCompletions.values()) {
    if (c.slug === slug) return { completed: c.completed, total: c.total };
  }
  return { completed: 0, total: 0 };
}

function isCategoryComplete(ctx: AchievementContext, slug: string): boolean {
  const c = getCategoryCompletion(ctx, slug);
  return c.total > 0 && c.completed >= c.total;
}

export async function unlockAchievementBySlug(
  userId: string,
  slug: string
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;

  const admin = createAdminClient();
  const { data: achievement } = await admin
    .from("achievements")
    .select("id, title, xp_reward")
    .eq("slug", slug)
    .maybeSingle();

  if (!achievement) return false;

  const { data: existing } = await admin
    .from("user_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_id", achievement.id as string)
    .maybeSingle();

  if (existing) return false;

  const { error } = await admin.from("user_achievements").insert({
    user_id: userId,
    achievement_id: achievement.id,
    unlocked_at: new Date().toISOString(),
  });

  if (error) return false;

  const xpReward = Number(achievement.xp_reward) || 0;
  if (xpReward > 0) {
    await awardXP(userId, xpReward, "achievement_unlock");
  }

  await trackActivity(userId, "achievement_unlocked", `Unlocked: ${achievement.title as string}`, {
    achievement_slug: slug,
  });

  return true;
}

export async function evaluateAndUnlockAchievements(userId: string): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const ctx = await buildAchievementContext(userId);
  if (!ctx) return [];

  const admin = createAdminClient();
  const { data: achievements } = await admin.from("achievements").select("id, slug, title, xp_reward");
  const { data: existing } = await admin
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const existingIds = new Set((existing ?? []).map((r) => r.achievement_id as string));
  const slugToAchievement = new Map(
    (achievements ?? []).map((a) => [a.slug as string, a as Record<string, unknown>])
  );

  const newlyUnlocked: string[] = [];

  for (const rule of ACHIEVEMENT_RULES) {
    if (!rule.check(ctx)) continue;
    const achievement = slugToAchievement.get(rule.slug);
    if (!achievement) continue;
    const achievementId = achievement.id as string;
    if (existingIds.has(achievementId)) continue;

    const { error } = await admin.from("user_achievements").insert({
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    });

    if (error) continue;

    newlyUnlocked.push(rule.slug);
    existingIds.add(achievementId);

    const xpReward = Number(achievement.xp_reward) || 0;
    if (xpReward > 0) {
      await awardXP(userId, xpReward, "achievement_unlock");
    }

    await trackActivity(
      userId,
      "achievement_unlocked",
      `Unlocked: ${achievement.title as string}`,
      { achievement_slug: rule.slug }
    );
  }

  return newlyUnlocked;
}
