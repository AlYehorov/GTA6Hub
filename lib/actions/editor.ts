"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { generateArticleFromOpportunity } from "@/lib/opportunity-engine/article-generator";
import { findOpportunityById } from "@/lib/opportunity-engine/loader";
import { upsertOpportunityStatus } from "@/lib/opportunity-engine/queries";
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
