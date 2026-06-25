import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { getLevelLabel } from "@/lib/profile/xp";
import type {
  Achievement,
  ActivityEvent,
  CommunityStats,
  LeaderboardData,
  LeaderboardEntry,
  Profile,
  ProfileWithStats,
  SavedArticle,
  SavedLocation,
  UserAchievement,
} from "@/lib/types/profile";

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    username: row.username as string,
    display_name: (row.display_name as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 1),
    favorite_category_id: (row.favorite_category_id as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToAchievement(row: Record<string, unknown>): Achievement {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    icon: row.icon as string,
    xp_reward: Number(row.xp_reward ?? 0),
    sort_order: Number(row.sort_order),
    created_at: row.created_at as string,
  };
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();

  if (error || !data) return null;
  return rowToProfile(data);
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!data) return null;
  return rowToProfile(data);
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  return !data;
}

async function getUserProgressStats(userId: string): Promise<{
  completed: number;
  total: number;
  percentage: number;
  collectibles_found: number;
  categories_completed: number;
  categoryCompletions: Map<string, { slug: string; completed: number; total: number }>;
}> {
  if (!isSupabaseConfigured()) {
    return {
      completed: 0,
      total: 0,
      percentage: 0,
      collectibles_found: 0,
      categoryCompletions: new Map(),
      categories_completed: 0,
    };
  }

  const supabase = await createClient();

  const [itemsRes, progressRes, categoriesRes] = await Promise.all([
    supabase.from("completion_items").select("id, category_id").eq("status", "published"),
    supabase.from("user_progress").select("item_id").eq("user_id", userId).eq("completed", true),
    supabase.from("completion_categories").select("id, slug"),
  ]);

  const items = itemsRes.data ?? [];
  const completedIds = new Set((progressRes.data ?? []).map((r) => r.item_id as string));
  const categories = new Map((categoriesRes.data ?? []).map((c) => [c.id as string, c.slug as string]));

  const collectiblesCategoryId = [...categories.entries()].find(([, slug]) => slug === "collectibles")?.[0];
  const collectiblesFound = items.filter(
    (i) => i.category_id === collectiblesCategoryId && completedIds.has(i.id as string)
  ).length;

  const categoryCompletions = new Map<string, { slug: string; completed: number; total: number }>();
  let categoriesCompleted = 0;
  for (const [catId, slug] of categories) {
    const catItems = items.filter((i) => i.category_id === catId);
    const catCompleted = catItems.filter((i) => completedIds.has(i.id as string)).length;
    categoryCompletions.set(catId, { slug, completed: catCompleted, total: catItems.length });
    if (catItems.length > 0 && catCompleted >= catItems.length) categoriesCompleted++;
  }

  const total = items.length;
  const completed = items.filter((i) => completedIds.has(i.id as string)).length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    collectibles_found: collectiblesFound,
    categoryCompletions,
    categories_completed: categoriesCompleted,
  };
}

export async function getProfileWithStats(username: string): Promise<ProfileWithStats | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  const stats = await getUserProgressStats(profile.id);

  const supabase = await createClient();
  const [achievementsRes, favoriteRes] = await Promise.all([
    supabase
      .from("user_achievements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id),
    profile.favorite_category_id
      ? supabase
          .from("completion_categories")
          .select("id, slug, title")
          .eq("id", profile.favorite_category_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let favoriteCategory = favoriteRes.data
    ? {
        id: favoriteRes.data.id as string,
        slug: favoriteRes.data.slug as string,
        title: favoriteRes.data.title as string,
      }
    : null;

  if (!favoriteCategory && stats.categoryCompletions.size > 0) {
    let best: { id: string; slug: string; pct: number } | null = null;
    for (const [catId, c] of stats.categoryCompletions) {
      if (c.total === 0) continue;
      const pct = Math.round((c.completed / c.total) * 100);
      if (!best || pct > best.pct) best = { id: catId, slug: c.slug, pct };
    }
    if (best) {
      const { data } = await supabase
        .from("completion_categories")
        .select("id, slug, title")
        .eq("id", best.id)
        .maybeSingle();
      if (data) {
        favoriteCategory = {
          id: data.id as string,
          slug: data.slug as string,
          title: data.title as string,
        };
      }
    }
  }

  return {
    ...profile,
    completion_percentage: stats.percentage,
    achievements_unlocked: achievementsRes.count ?? 0,
    collectibles_found: stats.collectibles_found,
    total_items: stats.total,
    completed_items: stats.completed,
    categories_completed: stats.categories_completed,
    favorite_category: favoriteCategory,
    level_label: getLevelLabel(profile.level),
  };
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_achievements")
    .select(`*, achievement:achievements(*)`)
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    achievement_id: row.achievement_id as string,
    unlocked_at: row.unlocked_at as string,
    achievement: row.achievement ? rowToAchievement(row.achievement as Record<string, unknown>) : undefined,
  }));
}

export async function getRecentProgress(userId: string, limit = 5) {
  if (!isSupabaseConfigured()) return [];

  const supabase = isSupabaseAdminConfigured() ? createAdminClient() : await createClient();
  const { data: progress } = await supabase
    .from("user_progress")
    .select("item_id, completed_at")
    .eq("user_id", userId)
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (!progress?.length) return [];

  const itemIds = progress.map((p) => p.item_id as string);
  const { data: items } = await supabase
    .from("completion_items")
    .select("id, title, category_id")
    .in("id", itemIds);

  const categoryIds = [...new Set((items ?? []).map((i) => i.category_id as string))];
  const { data: categories } = await supabase
    .from("completion_categories")
    .select("id, title")
    .in("id", categoryIds);

  const itemMap = new Map((items ?? []).map((i) => [i.id as string, i]));
  const catMap = new Map((categories ?? []).map((c) => [c.id as string, c.title as string]));

  return progress.map((row) => {
    const item = itemMap.get(row.item_id as string);
    return {
      title: (item?.title as string) ?? "Unknown",
      category: catMap.get(item?.category_id as string) ?? "Unknown",
      completed_at: row.completed_at as string,
    };
  });
}

export async function getCategoryBreakdown(userId: string) {
  if (!isSupabaseConfigured()) return [];

  const stats = await getUserProgressStats(userId);
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("completion_categories")
    .select("id, slug, title, icon")
    .order("sort_order", { ascending: true });

  return (categories ?? [])
    .map((cat) => {
      const c = stats.categoryCompletions.get(cat.id as string);
      const total = c?.total ?? 0;
      const completed = c?.completed ?? 0;
      return {
        id: cat.id as string,
        slug: cat.slug as string,
        title: cat.title as string,
        icon: cat.icon as string,
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    })
    .filter((c) => c.total > 0);
}

export async function getCommunityStats(): Promise<CommunityStats> {
  if (!isSupabaseAdminConfigured()) {
    return { total_players: 0, average_completion: 0, latest_achievements: [] };
  }

  const supabase = createAdminClient();

  const { count: totalPlayers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { data: profiles } = await supabase.from("profiles").select("id");
  const profileIds = (profiles ?? []).map((p) => p.id as string);

  let totalPct = 0;
  let counted = 0;
  for (const id of profileIds.slice(0, 100)) {
    const stats = await getUserProgressStats(id);
    if (stats.total > 0) {
      totalPct += stats.percentage;
      counted++;
    }
  }

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

  return {
    total_players: totalPlayers ?? 0,
    average_completion: counted > 0 ? Math.round(totalPct / counted) : 0,
    latest_achievements: (latest ?? []).map((row) => ({
      username: profileMap.get(row.user_id as string) ?? "Player",
      achievement_title: achMap.get(row.achievement_id as string) ?? "Achievement",
      unlocked_at: row.unlocked_at as string,
    })),
  };
}

export async function getLeaderboardData(): Promise<LeaderboardData> {
  if (!isSupabaseAdminConfigured()) {
    return { top_completion: [], most_achievements: [], newest_completions: [] };
  }

  const supabase = createAdminClient();
  const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url");

  const completionEntries: LeaderboardEntry[] = [];
  for (const p of profiles ?? []) {
    const stats = await getUserProgressStats(p.id as string);
    if (stats.total === 0) continue;
    completionEntries.push({
      user_id: p.id as string,
      username: p.username as string,
      avatar_url: (p.avatar_url as string | null) ?? null,
      value: stats.percentage,
      label: `${stats.percentage}%`,
    });
  }
  completionEntries.sort((a, b) => b.value - a.value);

  const { data: achievementCounts } = await supabase
    .from("user_achievements")
    .select("user_id");

  const countByUser = new Map<string, number>();
  for (const row of achievementCounts ?? []) {
    const uid = row.user_id as string;
    countByUser.set(uid, (countByUser.get(uid) ?? 0) + 1);
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const achievementEntries: LeaderboardEntry[] = [...countByUser.entries()]
    .map(([userId, count]) => {
      const p = profileMap.get(userId);
      return {
        user_id: userId,
        username: (p?.username as string) ?? "Player",
        avatar_url: (p?.avatar_url as string | null) ?? null,
        value: count,
        label: `${count} unlocked`,
      };
    })
    .sort((a, b) => b.value - a.value);

  const { data: recentProgress } = await supabase
    .from("user_progress")
    .select("user_id, item_id, completed_at")
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(10);

  const recentUserIds = [...new Set((recentProgress ?? []).map((r) => r.user_id as string))];
  const recentItemIds = [...new Set((recentProgress ?? []).map((r) => r.item_id as string))];

  const [{ data: recentProfiles }, { data: recentItems }] = await Promise.all([
    recentUserIds.length
      ? supabase.from("profiles").select("id, username, avatar_url").in("id", recentUserIds)
      : Promise.resolve({ data: [] }),
    recentItemIds.length
      ? supabase.from("completion_items").select("id, title, category_id").in("id", recentItemIds)
      : Promise.resolve({ data: [] }),
  ]);

  const recentProfileMap = new Map(
    (recentProfiles ?? []).map((p) => [p.id as string, p])
  );
  const recentItemMap = new Map((recentItems ?? []).map((i) => [i.id as string, i]));
  const recentCatIds = [...new Set((recentItems ?? []).map((i) => i.category_id as string))];
  const { data: recentCats } = recentCatIds.length
    ? await supabase.from("completion_categories").select("id, title").in("id", recentCatIds)
    : { data: [] };
  const recentCatMap = new Map((recentCats ?? []).map((c) => [c.id as string, c.title as string]));

  return {
    top_completion: completionEntries.slice(0, 10),
    most_achievements: achievementEntries.slice(0, 10),
    newest_completions: (recentProgress ?? []).map((row) => {
      const profile = recentProfileMap.get(row.user_id as string);
      const item = recentItemMap.get(row.item_id as string);
      return {
        username: (profile?.username as string) ?? "Player",
        avatar_url: (profile?.avatar_url as string | null) ?? null,
        item_title: (item?.title as string) ?? "Item",
        category_title: recentCatMap.get(item?.category_id as string) ?? "Category",
        completed_at: row.completed_at as string,
      };
    }),
  };
}

export async function getAllAchievements(): Promise<Achievement[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order", { ascending: true });

  return (data ?? []).map(rowToAchievement);
}

export async function getSavedArticles(userId: string, limit = 12): Promise<SavedArticle[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_articles")
    .select("id, article_id, created_at, article:articles(title, slug, type, excerpt, hero_image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? [])
    .map((row) => {
      const article = row.article as unknown as Record<string, unknown> | null;
      if (!article) return null;
      return {
        id: row.id as string,
        article_id: row.article_id as string,
        created_at: row.created_at as string,
        title: article.title as string,
        slug: article.slug as string,
        type: article.type as string,
        excerpt: (article.excerpt as string | null) ?? null,
        hero_image_url: (article.hero_image_url as string | null) ?? null,
      };
    })
    .filter(Boolean) as SavedArticle[];
}

export async function getSavedLocations(userId: string, limit = 12): Promise<SavedLocation[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_locations")
    .select("id, map_point_id, created_at, point:map_points(title, slug, type, district)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? [])
    .map((row) => {
      const point = row.point as unknown as Record<string, unknown> | null;
      if (!point) return null;
      return {
        id: row.id as string,
        map_point_id: row.map_point_id as string,
        created_at: row.created_at as string,
        title: point.title as string,
        slug: point.slug as string,
        type: point.type as string,
        district: (point.district as string | null) ?? null,
      };
    })
    .filter(Boolean) as SavedLocation[];
}

export async function getActivityEvents(userId: string, limit = 10): Promise<ActivityEvent[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  }));
}

export async function isArticleSaved(userId: string, articleId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_articles")
    .select("id")
    .eq("user_id", userId)
    .eq("article_id", articleId)
    .maybeSingle();

  return !!data;
}

export async function isLocationSaved(userId: string, mapPointId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_locations")
    .select("id")
    .eq("user_id", userId)
    .eq("map_point_id", mapPointId)
    .maybeSingle();

  return !!data;
}
