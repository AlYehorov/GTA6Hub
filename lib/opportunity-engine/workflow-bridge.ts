import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { fetchArticlesForSeoIntelligence } from "@/lib/seo/queries";
import { scoreSeoArticle } from "@/lib/seo/scoring";
import {
  buildChecklistForArticle,
  estimateMinutes,
  estimatePotentialScore,
  hashArticleContent,
  mergeChecklists,
} from "@/lib/workspace/checklist";
import {
  getActiveWorkspaceByArticleId,
  insertArticleWorkspace,
  logWorkspaceActivity,
  updateArticleWorkspace,
} from "@/lib/workspace/queries";
import { upsertOpportunityStatus } from "@/lib/opportunity-engine/queries";
import type { EditorialOpportunity } from "@/lib/opportunity-engine/types";

export async function sendOpportunityToWorkflow(input: {
  opportunity: EditorialOpportunity;
  draftId: string;
  sourceIds: string[];
}): Promise<{ mode: "improve" | "create"; workspaceId?: string; redirectTo: string }> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin not configured");
  }

  if (input.opportunity.action === "improve" && input.opportunity.existingArticleId) {
    const articles = await fetchArticlesForSeoIntelligence();
    const full = articles.find((a) => a.id === input.opportunity.existingArticleId);
    if (!full) throw new Error("Article not found");

    const scored = scoreSeoArticle(full);
    const checklist = buildChecklistForArticle(scored);
    const reason = `Improve Article — ${input.opportunity.title} (editor opportunity)`;
    const contentHash = hashArticleContent(full);
    const existing = await getActiveWorkspaceByArticleId(full.id);

    let workspaceId: string;

    if (existing) {
      const mergedChecklist = mergeChecklists(existing.checklist, checklist);
      const mergedSources = Array.from(
        new Set([...existing.related_source_ids, ...input.sourceIds])
      );
      const mergedReason =
        existing.reason && !existing.reason.includes(input.opportunity.title)
          ? `${existing.reason} · ${reason}`
          : existing.reason || reason;

      await updateArticleWorkspace(existing.id, {
        seo_score: scored.score,
        potential_score: estimatePotentialScore(scored.score, mergedChecklist),
        estimated_minutes: estimateMinutes(mergedChecklist),
        checklist: mergedChecklist,
        reason: mergedReason,
        related_source_ids: mergedSources,
        article_content_hash: contentHash,
      });

      await logWorkspaceActivity(
        existing.id,
        "opportunity_engine",
        `Editor opportunity: improve "${input.opportunity.title}"`
      );
      workspaceId = existing.id;
    } else {
      const workspace = await insertArticleWorkspace({
        article_id: full.id,
        status: "needs_improvement",
        seo_score: scored.score,
        potential_score: estimatePotentialScore(scored.score, checklist),
        estimated_minutes: estimateMinutes(checklist),
        checklist,
        reason,
        related_source_ids: input.sourceIds,
        assigned_to: null,
        article_content_hash: contentHash,
      });
      if (!workspace) throw new Error("Failed to create workspace");
      workspaceId = workspace.id;

      await logWorkspaceActivity(
        workspaceId,
        "opportunity_engine",
        `Editor opportunity: new workspace for "${input.opportunity.title}"`
      );
    }

    await upsertOpportunityStatus({
      clusterKey: input.opportunity.clusterKey,
      title: input.opportunity.title,
      score: input.opportunity.score,
      status: "workflow_sent",
      aiDraftId: input.draftId,
      workspaceId,
    });

    return {
      mode: "improve",
      workspaceId,
      redirectTo: `/admin/workflow/${workspaceId}`,
    };
  }

  await upsertOpportunityStatus({
    clusterKey: input.opportunity.clusterKey,
    title: input.opportunity.title,
    score: input.opportunity.score,
    status: "draft_generated",
    aiDraftId: input.draftId,
  });

  return {
    mode: "create",
    redirectTo: `/admin/drafts/${input.draftId}`,
  };
}
