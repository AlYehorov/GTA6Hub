import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { CommunityNotificationType } from "@/lib/types/community";

export async function createCommunityNotification(input: {
  userId: string;
  type: CommunityNotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const admin = createAdminClient();
  await admin.from("community_notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    metadata: input.metadata ?? {},
  });
}
