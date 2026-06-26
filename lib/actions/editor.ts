"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { generateArticleFromOpportunity } from "@/lib/opportunity-engine/article-generator";
import { deleteDraftAdmin } from "@/lib/drafts/delete-draft";
import { getDraftByIdAdmin } from "@/lib/drafts/queries";
import { findOpportunityById, findOpportunityByClusterKey } from "@/lib/opportunity-engine/loader";
import { upsertOpportunityStatus, getClusterKeyForDraft } from "@/lib/opportunity-engine/queries";
import { sendOpportunityToWorkflow } from "@/lib/opportunity-engine/workflow-bridge";

const PATHS = ["/admin/editor", "/admin/content-engine", "/admin/drafts", "/admin/workflow"];

function revalidateEditor() {
  for (const path of PATHS) {
    revalidatePath(path);
  }
}

export async function generateArticleAction(opportunityId: string): Promise<{
  success: boolean;
  draftId?: string;
  redirectTo?: string;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { draftId } = await generateArticleFromOpportunity(opportunityId);
    revalidateEditor();
    return {
      success: true,
      draftId,
      redirectTo: `/admin/drafts/${draftId}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Article generation failed",
    };
  }
}

export async function recreateArticleAction(opportunityId: string): Promise<{
  success: boolean;
  draftId?: string;
  redirectTo?: string;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const opportunity = await findOpportunityById(opportunityId);
    if (!opportunity) return { success: false, error: "Opportunity not found" };

    if (opportunity.aiDraftId) {
      const existing = await getDraftByIdAdmin(opportunity.aiDraftId);
      if (existing?.status === "published") {
        return { success: false, error: "This draft is already published — edit the live article instead" };
      }
      if (existing?.status === "approved") {
        return {
          success: false,
          error: "Reject or publish the approved draft before recreating",
        };
      }
      if (existing) {
        await deleteDraftAdmin(opportunity.aiDraftId);
      }
    }

    const { draftId } = await generateArticleFromOpportunity(opportunityId);
    revalidateEditor();
    return {
      success: true,
      draftId,
      redirectTo: `/admin/drafts/${draftId}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Recreate failed",
    };
  }
}

export async function regenerateFromDraftAction(draftId: string): Promise<{
  success: boolean;
  draftId?: string;
  redirectTo?: string;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const draft = await getDraftByIdAdmin(draftId);
    if (!draft) return { success: false, error: "Draft not found" };

    if (draft.status === "published") {
      return { success: false, error: "This draft is already published" };
    }
    if (draft.status === "approved") {
      return {
        success: false,
        error: "Reject the approved draft before regenerating",
      };
    }

    const clusterKey = await getClusterKeyForDraft(draftId);
    if (!clusterKey) {
      await deleteDraftAdmin(draftId);
      revalidateEditor();
      return {
        success: true,
        redirectTo: "/admin/editor",
      };
    }

    await deleteDraftAdmin(draftId);

    const opportunity = await findOpportunityByClusterKey(clusterKey);
    if (!opportunity) {
      revalidateEditor();
      return {
        success: true,
        redirectTo: "/admin/editor",
      };
    }

    const { draftId: newDraftId } = await generateArticleFromOpportunity(opportunity.id);
    revalidateEditor();
    return {
      success: true,
      draftId: newDraftId,
      redirectTo: `/admin/drafts/${newDraftId}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Regenerate failed",
    };
  }
}

export async function markOpportunityIgnoredAction(opportunityId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const opportunity = await findOpportunityById(opportunityId);
    if (!opportunity) return { success: false, error: "Opportunity not found" };

    await upsertOpportunityStatus({
      clusterKey: opportunity.clusterKey,
      title: opportunity.title,
      score: opportunity.score,
      status: "ignored",
    });

    revalidateEditor();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to ignore opportunity",
    };
  }
}

export async function sendOpportunityWorkflowAction(
  opportunityId: string,
  draftId: string
): Promise<{
  success: boolean;
  redirectTo?: string;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const opportunity = await findOpportunityById(opportunityId);
    if (!opportunity) return { success: false, error: "Opportunity not found" };

    const result = await sendOpportunityToWorkflow({
      opportunity,
      draftId,
      sourceIds: opportunity.sourceIds,
    });

    revalidateEditor();
    return { success: true, redirectTo: result.redirectTo };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Workflow handoff failed",
    };
  }
}
