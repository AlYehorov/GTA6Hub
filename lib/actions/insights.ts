"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { fetchArticlesForSeoIntelligence } from "@/lib/seo/queries";
import { scoreSeoArticle } from "@/lib/seo/scoring";
import {
  buildChecklistForArticle,
  hashArticleContent,
  mergeChecklists,
} from "@/lib/workspace/checklist";
import {
  getActiveWorkspaceByArticleId,
  insertArticleWorkspace,
  logWorkspaceActivity,
} from "@/lib/workspace/queries";
import type { ChecklistItemKey, WorkspaceChecklistItem } from "@/lib/workspace/types";

export interface InsightWorkspaceResult {
  success: boolean;
  error?: string;
  workspaceId?: string;
  existing?: boolean;
}

const INSIGHT_CHECKLIST_MAP: Record<string, ChecklistItemKey[]> = {
  low_ctr: ["improve_meta_description", "add_faq", "add_internal_links"],
  low_position: ["expand_article", "add_related_articles", "add_internal_links"],
  traffic_drop: ["refresh_content", "improve_meta_description", "add_internal_links"],
  expand_guide: ["expand_article", "add_faq", "add_related_articles"],
};

function pickChecklistItems(
  keys: ChecklistItemKey[],
  full: WorkspaceChecklistItem[]
): WorkspaceChecklistItem[] {
  const byKey = new Map(full.map((item) => [item.key, item]));
  return keys
    .map((key) => byKey.get(key))
    .filter((item): item is WorkspaceChecklistItem => Boolean(item));
}

export async function createWorkspaceFromInsight(input: {
  articleId: string;
  reason: string;
  insightType: keyof typeof INSIGHT_CHECKLIST_MAP;
}): Promise<InsightWorkspaceResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const existing = await getActiveWorkspaceByArticleId(input.articleId);
  if (existing) {
    return {
      success: true,
      workspaceId: existing.id,
      existing: true,
    };
  }

  const articles = await fetchArticlesForSeoIntelligence();
  const article = articles.find((a) => a.id === input.articleId);
  if (!article) {
    return { success: false, error: "Article not found" };
  }

  const scored = scoreSeoArticle(article);
  const keys = INSIGHT_CHECKLIST_MAP[input.insightType] ?? ["improve_meta_description"];
  const baseChecklist = buildChecklistForArticle(scored);
  const insightChecklist = pickChecklistItems(keys, baseChecklist);
  const checklist = mergeChecklists(baseChecklist, insightChecklist);

  const workspace = await insertArticleWorkspace({
    article_id: article.id,
    status: "needs_improvement",
    seo_score: scored.score,
    potential_score: Math.min(100, scored.score + 25),
    estimated_minutes: checklist.reduce((sum, c) => sum + c.estimated_minutes, 0),
    checklist,
    reason: input.reason,
    related_source_ids: [],
    assigned_to: null,
    article_content_hash: hashArticleContent({
      updated_at: article.updated_at,
      content: article.content,
      title: article.title,
    }),
  });

  if (!workspace) {
    return { success: false, error: "Failed to create workspace" };
  }

  await logWorkspaceActivity(workspace.id, "created_from_insight", input.reason);

  revalidatePath("/admin/insights");
  revalidatePath("/admin/workflow");
  revalidatePath(`/admin/workflow/${workspace.id}`);

  return { success: true, workspaceId: workspace.id };
}
