import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export interface AchievementRule {
  slug: string;
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  overallPercentage: number;
  completedCount: number;
  totalCount: number;
  categoryCompletions: Map<string, { slug: string; completed: number; total: number }>;
  categoriesWithProgress: number;
}

async function buildAchievementContext(userId: string): Promise<AchievementContext | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const [itemsRes, progressRes, categoriesRes] = await Promise.all([
    supabase.from("completion_items").select("id, category_id").eq("status", "published"),
    supabase.from("user_progress").select("item_id").eq("user_id", userId).eq("completed", true),
    supabase.from("completion_categories").select("id, slug"),
  ]);

  const items = itemsRes.data ?? [];
  const completedIds = new Set((progressRes.data ?? []).map((r) => r.item_id as string));
  const categories = new Map((categoriesRes.data ?? []).map((c) => [c.id as string, c.slug as string]));

  const categoryCompletions = new Map<string, { slug: string; completed: number; total: number }>();
  let categoriesWithProgress = 0;

  for (const [catId, slug] of categories) {
    const catItems = items.filter((i) => i.category_id === catId);
    const catCompleted = catItems.filter((i) => completedIds.has(i.id as string)).length;
    categoryCompletions.set(catId, { slug, completed: catCompleted, total: catItems.length });
    if (catCompleted > 0) categoriesWithProgress++;
  }

  const totalCount = items.length;
  const completedCount = items.filter((i) => completedIds.has(i.id as string)).length;

  return {
    overallPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    completedCount,
    totalCount,
    categoryCompletions,
    categoriesWithProgress,
  };
}

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

const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    slug: "first-mission",
    check: (ctx) => getCategoryCompletion(ctx, "main-missions").completed >= 1,
  },
  {
    slug: "ten-percent",
    check: (ctx) => ctx.overallPercentage >= 10,
  },
  {
    slug: "twenty-five-percent",
    check: (ctx) => ctx.overallPercentage >= 25,
  },
  {
    slug: "fifty-percent",
    check: (ctx) => ctx.overallPercentage >= 50,
  },
  {
    slug: "hundred-percent",
    check: (ctx) => ctx.overallPercentage >= 100,
  },
  {
    slug: "collector",
    check: (ctx) => isCategoryComplete(ctx, "collectibles"),
  },
  {
    slug: "explorer",
    check: (ctx) => ctx.categoriesWithProgress >= 5,
  },
  {
    slug: "hunter",
    check: (ctx) => isCategoryComplete(ctx, "weapons"),
  },
  {
    slug: "secret-finder",
    check: (ctx) =>
      isCategoryComplete(ctx, "secrets") || isCategoryComplete(ctx, "easter-eggs"),
  },
];

export async function evaluateAndUnlockAchievements(userId: string): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const ctx = await buildAchievementContext(userId);
  if (!ctx) return [];

  const admin = createAdminClient();
  const { data: achievements } = await admin.from("achievements").select("id, slug");
  const { data: existing } = await admin
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const existingIds = new Set((existing ?? []).map((r) => r.achievement_id as string));
  const slugToId = new Map((achievements ?? []).map((a) => [a.slug as string, a.id as string]));

  const newlyUnlocked: string[] = [];

  for (const rule of ACHIEVEMENT_RULES) {
    if (!rule.check(ctx)) continue;
    const achievementId = slugToId.get(rule.slug);
    if (!achievementId || existingIds.has(achievementId)) continue;

    const { error } = await admin.from("user_achievements").insert({
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    });

    if (!error) {
      newlyUnlocked.push(rule.slug);
      existingIds.add(achievementId);
    }
  }

  return newlyUnlocked;
}
