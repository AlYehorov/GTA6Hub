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
import {
  getContentPlanIdeaById,
  updateContentPlanIdea,
} from "@/lib/content-engine/queries";
import type { ContentPlanIdea } from "@/lib/content-engine/types";
import type { SourceItem } from "@/lib/types/source";

export interface WorkflowBridgeResult {
  mode: "improve" | "create";
  workspaceId?: string;
  draftId?: string;
  articleId?: string;
  message: string;
}

async function findArticleForIdea(
  idea: ContentPlanIdea,
  draftSlug?: string
): Promise<{ id: string; title: string } | null> {
  const articles = await fetchArticlesForSeoIntelligence();
  const slugNeedle = draftSlug?.toLowerCase();
  if (slugNeedle) {
    const bySlug = articles.find((a) => a.slug.toLowerCase() === slugNeedle);
    if (bySlug) return { id: bySlug.id, title: bySlug.title };
  }

  const titleLower = idea.title.toLowerCase();
  const fuzzy = articles.find(
    (a) =>
      a.title.toLowerCase().includes(titleLower.slice(0, 24)) ||
      titleLower.includes(a.title.toLowerCase().slice(0, 24))
  );
  if (fuzzy) return { id: fuzzy.id, title: fuzzy.title };

  const keyword = idea.target_keyword.toLowerCase();
  const byKeyword = articles.find((a) =>
    a.title.toLowerCase().includes(keyword.slice(0, 20))
  );
  if (byKeyword) return { id: byKeyword.id, title: byKeyword.title };

  return null;
}

export async function sendIdeaToWorkflow(input: {
  ideaId: string;
  source: SourceItem;
  draftSlug?: string;
  draftId?: string;
}): Promise<WorkflowBridgeResult> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin not configured");
  }

  const idea = await getContentPlanIdeaById(input.ideaId);
  if (!idea) throw new Error("Content plan idea not found");

  const article = await findArticleForIdea(idea, input.draftSlug);

  if (article) {
    const articles = await fetchArticlesForSeoIntelligence();
    const full = articles.find((a) => a.id === article.id);
    if (!full) throw new Error("Article not found");

    const scored = scoreSeoArticle(full);
    const checklist = buildChecklistForArticle(scored);
    const reason = `Improve Article — ${idea.title} (from content engine)`;
    const contentHash = hashArticleContent(full);
    const existing = await getActiveWorkspaceByArticleId(article.id);

    let workspaceId: string;

    if (existing) {
      const mergedChecklist = mergeChecklists(existing.checklist, checklist);
      const mergedSources = Array.from(
        new Set([...existing.related_source_ids, input.source.id])
      );
      const mergedReason =
        existing.reason && !existing.reason.includes(idea.title)
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
        "content_engine",
        `Content engine: improve workspace for "${idea.title}"`
      );
      workspaceId = existing.id;
    } else {
      const workspace = await insertArticleWorkspace({
        article_id: article.id,
        status: "needs_improvement",
        seo_score: scored.score,
        potential_score: estimatePotentialScore(scored.score, checklist),
        estimated_minutes: estimateMinutes(checklist),
        checklist,
        reason,
        related_source_ids: [input.source.id],
        assigned_to: null,
        article_content_hash: contentHash,
      });
      if (!workspace) throw new Error("Failed to create workspace");
      workspaceId = workspace.id;

      await logWorkspaceActivity(
        workspaceId,
        "content_engine",
        `Content engine: new improve workspace for "${idea.title}"`
      );
    }

    await updateContentPlanIdea(input.ideaId, {
      status: "workflow_sent",
      workspace_id: workspaceId,
      ai_draft_id: input.draftId ?? idea.ai_draft_id,
    });

    return {
      mode: "improve",
      workspaceId,
      articleId: article.id,
      draftId: input.draftId ?? idea.ai_draft_id ?? undefined,
      message: `Improve workspace ready for "${article.title}"`,
    };
  }

  if (!input.draftId && !idea.ai_draft_id) {
    throw new Error("Generate a draft first before sending a new article to workflow");
  }

  const draftId = input.draftId ?? idea.ai_draft_id!;

  await updateContentPlanIdea(input.ideaId, {
    status: "workflow_sent",
    ai_draft_id: draftId,
  });

  return {
    mode: "create",
    draftId,
    message: "New article draft ready for review in AI Drafts",
  };
}

export async function markIdeaIgnored(ideaId: string): Promise<void> {
  await updateContentPlanIdea(ideaId, { status: "ignored" });
}
