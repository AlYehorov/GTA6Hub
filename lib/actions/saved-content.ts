"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUserId } from "@/lib/actions/tracker-progress";
import { evaluateAndUnlockAchievements } from "@/lib/profile/achievements";
import { trackActivity } from "@/lib/profile/activity";
import { awardXP, XP_REWARDS } from "@/lib/profile/xp";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface ActionResult {
  success: boolean;
  error?: string;
  saved?: boolean;
}

function revalidateProfilePaths() {
  revalidatePath("/profile");
  revalidatePath("/u");
  revalidatePath("/leaderboard");
}

export async function toggleSaveArticle(articleId: string): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "login_required" };

  if (!isSupabaseConfigured()) return { success: false, error: "Not configured" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("saved_articles")
    .select("id")
    .eq("user_id", userId)
    .eq("article_id", articleId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_articles")
      .delete()
      .eq("user_id", userId)
      .eq("article_id", articleId);
    if (error) return { success: false, error: error.message };
    revalidateProfilePaths();
    return { success: true, saved: false };
  }

  const { data: article } = await supabase
    .from("articles")
    .select("title, slug, type")
    .eq("id", articleId)
    .maybeSingle();

  const { error } = await supabase.from("saved_articles").insert({
    user_id: userId,
    article_id: articleId,
  });

  if (error) return { success: false, error: error.message };

  await awardXP(userId, XP_REWARDS.article_saved, "article_saved");
  await trackActivity(userId, "article_saved", `Saved: ${(article?.title as string) ?? "Article"}`, {
    article_id: articleId,
    slug: article?.slug,
    type: article?.type,
  });
  await evaluateAndUnlockAchievements(userId);
  revalidateProfilePaths();

  return { success: true, saved: true };
}

export async function toggleSaveLocation(mapPointId: string): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "login_required" };

  if (!isSupabaseConfigured()) return { success: false, error: "Not configured" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("saved_locations")
    .select("id")
    .eq("user_id", userId)
    .eq("map_point_id", mapPointId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_locations")
      .delete()
      .eq("user_id", userId)
      .eq("map_point_id", mapPointId);
    if (error) return { success: false, error: error.message };
    revalidateProfilePaths();
    return { success: true, saved: false };
  }

  const { data: point } = await supabase
    .from("map_points")
    .select("title, slug")
    .eq("id", mapPointId)
    .maybeSingle();

  const { error } = await supabase.from("saved_locations").insert({
    user_id: userId,
    map_point_id: mapPointId,
  });

  if (error) return { success: false, error: error.message };

  await awardXP(userId, XP_REWARDS.location_saved, "location_saved");
  await trackActivity(
    userId,
    "location_saved",
    `Saved location: ${(point?.title as string) ?? "Location"}`,
    { map_point_id: mapPointId, slug: point?.slug }
  );
  await evaluateAndUnlockAchievements(userId);
  revalidateProfilePaths();

  return { success: true, saved: true };
}

export async function recordArticleRead(articleId: string): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "login_required" };

  if (!isSupabaseConfigured()) return { success: false, error: "Not configured" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("article_reads")
    .select("id")
    .eq("user_id", userId)
    .eq("article_id", articleId)
    .maybeSingle();

  if (existing) return { success: true };

  const { data: article } = await supabase
    .from("articles")
    .select("title, slug, type")
    .eq("id", articleId)
    .maybeSingle();

  const { error } = await supabase.from("article_reads").insert({
    user_id: userId,
    article_id: articleId,
  });

  if (error) return { success: false, error: error.message };

  await awardXP(userId, XP_REWARDS.article_read, "article_read");
  await trackActivity(userId, "article_read", `Read: ${(article?.title as string) ?? "Article"}`, {
    article_id: articleId,
    slug: article?.slug,
    type: article?.type,
  });
  await evaluateAndUnlockAchievements(userId);
  revalidateProfilePaths();

  return { success: true };
}

export async function getSavedArticleIds(): Promise<string[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data } = await supabase.from("saved_articles").select("article_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.article_id as string);
}

export async function getSavedLocationIds(): Promise<string[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data } = await supabase.from("saved_locations").select("map_point_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.map_point_id as string);
}
