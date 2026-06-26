import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  getClusterKeyForDraft,
  resetOpportunityByClusterKey,
  resetOpportunityByDraftId,
} from "@/lib/opportunity-engine/queries";
import type { AiDraftStatus } from "@/lib/types/ai-draft";

const DELETABLE_STATUSES: AiDraftStatus[] = ["pending", "rejected"];

export async function deleteDraftAdmin(id: string): Promise<{
  opportunityClusterKey: string | null;
}> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin is not configured");
  }

  const supabase = createAdminClient();
  const { data: draft, error: fetchError } = await supabase
    .from("ai_drafts")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!draft) throw new Error("Draft not found");

  const status = draft.status as AiDraftStatus;
  if (!DELETABLE_STATUSES.includes(status)) {
    throw new Error("Only pending or rejected drafts can be deleted");
  }

  const clusterKey = await getClusterKeyForDraft(id);

  const { error: deleteError } = await supabase.from("ai_drafts").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);

  try {
    if (clusterKey) {
      await resetOpportunityByClusterKey(clusterKey);
    } else {
      await resetOpportunityByDraftId(id);
    }
  } catch {
    // editorial_opportunities table may be missing
  }

  return { opportunityClusterKey: clusterKey };
}
