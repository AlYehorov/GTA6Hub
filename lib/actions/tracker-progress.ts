"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateAndUnlockAchievements } from "@/lib/profile/achievements";
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
  await evaluateAndUnlockAchievements(userId);
  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return { success: true };
}
