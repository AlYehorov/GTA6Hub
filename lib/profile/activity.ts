import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export type ActivityType =
  | "tracker_item_completed"
  | "article_saved"
  | "location_saved"
  | "achievement_unlocked"
  | "article_read"
  | "profile_created";

export async function trackActivity(
  userId: string,
  type: ActivityType,
  title: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const admin = createAdminClient();
  await admin.from("activity_events").insert({
    user_id: userId,
    type,
    title,
    metadata,
  });
}
