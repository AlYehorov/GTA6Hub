"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateAndUnlockAchievements } from "@/lib/profile/achievements";
import { trackActivity } from "@/lib/profile/activity";
import { awardXP, XP_REWARDS } from "@/lib/profile/xp";
import { revalidatePath } from "next/cache";

export interface ProgressActionResult {
  success: boolean;
  error?: string;
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function isUserAuthenticated(): Promise<boolean> {
  return (await getAuthenticatedUserId()) !== null;
}

export async function fetchUserProgressIds(): Promise<string[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_progress")
    .select("item_id")
    .eq("user_id", userId)
    .eq("completed", true);

  if (error) return [];
  return (data ?? []).map((r) => r.item_id as string);
}

export async function setItemProgress(
  itemId: string,
  completed: boolean
): Promise<ProgressActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  if (completed) {
    const { error } = await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        item_id: itemId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,item_id" }
    );
    if (error) return { success: false, error: error.message };

    const { data: item } = await supabase
      .from("completion_items")
      .select("title")
      .eq("id", itemId)
      .maybeSingle();

    await awardXP(userId, XP_REWARDS.tracker_item_completed, "tracker_item_completed");
    await trackActivity(
      userId,
      "tracker_item_completed",
      `Completed: ${(item?.title as string) ?? "Tracker item"}`,
      { item_id: itemId }
    );
  } else {
    const { error } = await supabase
      .from("user_progress")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId);
    if (error) return { success: false, error: error.message };
  }

  if (completed) {
    await evaluateAndUnlockAchievements(userId);
    revalidatePath("/profile");
    revalidatePath("/u");
    revalidatePath("/leaderboard");
  }

  return { success: true };
}

export async function syncLocalProgressToServer(
  itemIds: string[]
): Promise<ProgressActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const supabase = await createClient();
  const rows = itemIds.map((itemId) => ({
    user_id: userId,
    item_id: itemId,
    completed: true,
    completed_at: new Date().toISOString(),
  }));

  if (rows.length === 0) return { success: true };

  const { error } = await supabase.from("user_progress").upsert(rows, {
    onConflict: "user_id,item_id",
  });

  if (error) return { success: false, error: error.message };

  for (const itemId of itemIds) {
    const { data: item } = await supabase
      .from("completion_items")
      .select("title")
      .eq("id", itemId)
      .maybeSingle();
    await awardXP(userId, XP_REWARDS.tracker_item_completed, "tracker_item_completed");
    await trackActivity(
      userId,
      "tracker_item_completed",
      `Completed: ${(item?.title as string) ?? "Tracker item"}`,
      { item_id: itemId }
    );
  }

  await evaluateAndUnlockAchievements(userId);
  revalidatePath("/profile");
  revalidatePath("/u");
  revalidatePath("/leaderboard");
  return { success: true };
}
