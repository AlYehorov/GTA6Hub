import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { COMMUNITY_REPUTATION_REWARDS } from "@/lib/community/constants";

export type ReputationReason = keyof typeof COMMUNITY_REPUTATION_REWARDS;

export async function awardCommunityReputation(
  userId: string,
  reason: ReputationReason,
  amount?: number
): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const delta = amount ?? COMMUNITY_REPUTATION_REWARDS[reason];
  if (delta <= 0) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("community_reputation")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return;

  const next = (Number(profile.community_reputation) || 0) + delta;
  await admin
    .from("profiles")
    .update({ community_reputation: next, updated_at: new Date().toISOString() })
    .eq("id", userId);
}
