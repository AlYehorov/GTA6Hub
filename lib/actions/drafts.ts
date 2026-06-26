"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getDraftByIdAdmin } from "@/lib/drafts/queries";
import { aiDraftService } from "@/lib/ai/ai-draft-service";
import { articlePublishingService } from "@/lib/workflows/article-publishing-service";
import {
  trackDraftApproved,
  trackDraftRejected,
  trackDraftPublished,
} from "@/lib/analytics/track";
import { meetsConfidenceThreshold } from "@/lib/editorial/confidence";
import type { ArticleType } from "@/lib/types/article";

export interface ActionResult {
  success: boolean;
  error?: string;
  articleSlug?: string;
}

function revalidateDraftPaths(id: string) {
  revalidatePath("/admin/drafts");
  revalidatePath(`/admin/drafts/${id}`);
  revalidatePath("/admin/editorial");
  revalidatePath("/admin");
  revalidatePath("/news");
  revalidatePath("/newsroom");
  revalidatePath("/guides");
  revalidatePath("/videos");
}

export async function approveDraft(id: string): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  const draft = await getDraftByIdAdmin(id);
  if (!draft) return { success: false, error: "Draft not found" };
  if (draft.status !== "pending") {
    return { success: false, error: "Only pending drafts can be approved" };
  }
  if (!meetsConfidenceThreshold(draft.confidence)) {
    return { success: false, error: "Draft confidence is below the 90% minimum" };
  }

  try {
    await aiDraftService.updateStatus(id, "approved");
    await trackDraftApproved(id, draft.source_item.source);
    revalidateDraftPaths(id);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Approve failed",
    };
  }
}

export async function rejectDraft(id: string): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  const draft = await getDraftByIdAdmin(id);
  if (!draft) return { success: false, error: "Draft not found" };
  if (draft.status === "published" || draft.status === "rejected") {
    return { success: false, error: "Draft cannot be rejected" };
  }

  try {
    await aiDraftService.updateStatus(id, "rejected");
    await trackDraftRejected(id, draft.source_item.source);
    revalidateDraftPaths(id);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Reject failed",
    };
  }
}

export async function publishDraft(
  id: string,
  type: ArticleType = "news"
): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  const draft = await getDraftByIdAdmin(id);
  if (!draft) return { success: false, error: "Draft not found" };
  if (draft.status !== "approved") {
    return { success: false, error: "Draft must be approved before publishing" };
  }
  if (!meetsConfidenceThreshold(draft.confidence)) {
    return { success: false, error: "Draft confidence is below the 90% minimum" };
  }

  try {
    const result = await articlePublishingService.publishDraft(draft, type);
    await trackDraftPublished(
      id,
      draft.source_item.source,
      result.articleId,
      result.slug
    );
    revalidateDraftPaths(id);
    revalidatePath(`/${result.type}/${result.slug}`);
    return { success: true, articleSlug: result.slug };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Publish failed",
    };
  }
}
