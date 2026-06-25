import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export const XP_REWARDS = {
  profile_created: 50,
  tracker_item_completed: 20,
  article_saved: 5,
  location_saved: 5,
  article_read: 2,
} as const;

export type XPReason = keyof typeof XP_REWARDS | "achievement_unlock" | "manual";

export function levelFromXp(xp: number): number {
  return Math.floor(xp / 250) + 1;
}

export function getLevelLabel(level: number): string {
  if (level <= 2) return "New Arrival";
  if (level <= 5) return "Vice Tourist";
  if (level <= 10) return "Leonida Explorer";
  if (level <= 20) return "Trailer Detective";
  if (level <= 35) return "Secret Hunter";
  return "Legend";
}

export function xpProgressInLevel(xp: number): { current: number; max: number; percent: number } {
  const level = levelFromXp(xp);
  const levelStart = (level - 1) * 250;
  const current = xp - levelStart;
  const max = 250;
  return {
    current,
    max,
    percent: Math.round((current / max) * 100),
  };
}

export async function awardXP(
  userId: string,
  amount: number,
  _reason: XPReason
): Promise<{ xp: number; level: number; leveledUp: boolean } | null> {
  if (!isSupabaseAdminConfigured() || amount <= 0) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const prevLevel = Number(profile.level) || 1;
  const newXp = (Number(profile.xp) || 0) + amount;
  const newLevel = levelFromXp(newXp);

  await admin
    .from("profiles")
    .update({ xp: newXp, level: newLevel, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return {
    xp: newXp,
    level: newLevel,
    leveledUp: newLevel > prevLevel,
  };
}
