import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { isOpenAiConfigured } from "@/lib/ai/openai-client";
import {
  buildLinkTargetsFromEditorialData,
  suggestInternalLinksFromArticles,
} from "@/lib/editorial/internal-links";
import { fetchEntityRowsForGaps } from "@/lib/editorial/content-gaps";
import { SEO_ENTITY_KINDS } from "@/lib/editorial/constants";
import type { SeoEntityKind } from "@/lib/editorial/constants";
import { fetchArticlesForSeoIntelligence } from "@/lib/seo/queries";
import {
  getAllArticleWorkspaces,
  getArticleWorkspaceById,
  getWorkspaceActivity,
} from "@/lib/workspace/queries";
import {
  computeDailyWorkspaceCapacity,
  computeOpenAiUsageStats,
  computeWeeklyWorkspaceStats,
  computeWorkspaceMetrics,
} from "@/lib/workspace/metrics";
import type {
  ArticleWorkspace,
  ArticleWorkspaceWithContext,
  WorkflowHomeData,
  WorkspaceDetailData,
} from "@/lib/workspace/types";
import {
  ACTIVE_WORKSPACE_STATUSES,
  HISTORY_WORKSPACE_STATUSES,
} from "@/lib/workspace/types";

async function enrichWorkspaces(
  workspaces: ArticleWorkspace[]
): Promise<ArticleWorkspaceWithContext[]> {
  if (!isSupabaseAdminConfigured() || workspaces.length === 0) {
    return workspaces.map((w) => ({
      ...w,
      articleTitle: "",
      articleSlug: "",
      articleType: "",
      articleExcerpt: null,
      articlePreview: "",
      relatedSources: [],
      suggestedFaq: [],
      suggestedInternalLinks: [],
      suggestedVideos: [],
    }));
  }

  const supabase = createAdminClient();
  const articleIds = workspaces.map((w) => w.article_id);
  const sourceIds = workspaces.flatMap((w) => w.related_source_ids);

  const [articlesRes, sourcesRes, allArticles, entityRows] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, slug, type, excerpt, content, video_id")
      .in("id", articleIds),
    sourceIds.length
      ? supabase.from("source_items").select("id, title").in("id", sourceIds)
      : Promise.resolve({ data: [] }),
    fetchArticlesForSeoIntelligence(),
    fetchEntityRowsForGaps(),
  ]);

  const articleMap = new Map(
    (articlesRes.data ?? []).map((a) => [
      a.id as string,
      a as {
        id: string;
        title: string;
        slug: string;
        type: string;
        excerpt: string | null;
        content: string;
        video_id: string | null;
      },
    ])
  );
  const sourceMap = new Map(
    (sourcesRes.data ?? []).map((s) => [s.id as string, s.title as string])
  );

  const linkEntities: Array<{ kind: SeoEntityKind; slug: string; title: string }> = [];
  for (const kind of SEO_ENTITY_KINDS) {
    const row = entityRows.find((r) => r.kind === kind);
    for (const entity of row?.entities ?? []) {
      if (entity.status === "published") {
        linkEntities.push({ kind, slug: entity.slug, title: entity.title });
      }
    }
  }

  const linkTargets = buildLinkTargetsFromEditorialData(
    linkEntities,
    allArticles
      .filter((a) => a.status === "published")
      .map((a) => ({ title: a.title, slug: a.slug, type: a.type })),
    []
  );

  return workspaces.map((workspace) => {
    const article = articleMap.get(workspace.article_id);
    const articleRecord = allArticles.find((a) => a.id === workspace.article_id);
    const relatedSources = workspace.related_source_ids
      .map((id) => ({ id, title: sourceMap.get(id) ?? "Source" }))
      .filter((s) => s.title);

    let suggestedFaq: string[] = [];
    let suggestedInternalLinks: string[] = [];
    const suggestedVideos: string[] = [];

    if (article) {
      if (!article.content.toLowerCase().includes("faq")) {
        suggestedFaq = [
          `What is ${article.title} in GTA 6?`,
          `Is ${article.title} confirmed for GTA VI?`,
        ];
      }
      if (articleRecord) {
        const suggestions = suggestInternalLinksFromArticles(
          [articleRecord],
          linkTargets,
          1
        );
        suggestedInternalLinks =
          suggestions[0]?.suggestedLinks.map((l) => l.href) ?? [];
      }
      if (!article.video_id && !/youtube\.com|youtu\.be/i.test(article.content)) {
        suggestedVideos.push("Embed official Rockstar YouTube trailer or clip");
      }
    }

    return {
      ...workspace,
      articleTitle: article?.title ?? "Unknown article",
      articleSlug: article?.slug ?? "",
      articleType: article?.type ?? "news",
      articleExcerpt: article?.excerpt ?? null,
      articlePreview: article?.content.slice(0, 600) ?? "",
      relatedSources,
      suggestedFaq,
      suggestedInternalLinks,
      suggestedVideos,
    };
  });
}

export async function loadWorkflowHomeData(): Promise<WorkflowHomeData> {
  const configured = isSupabaseAdminConfigured();

  if (!configured) {
    return {
      workspaces: [],
      activeWorkspaces: [],
      history: [],
      dailyCapacity: { articleCount: 0, estimatedMinutes: 0 },
      weeklyStats: {
        workspacesCreated: 0,
        workspacesCompleted: 0,
        averageCompletionMinutes: null,
        completionRate: 0,
        averageSeoGain: null,
      },
      metrics: {
        articlesNeedingAttention: 0,
        averageSeoGain: null,
        averageImprovementMinutes: null,
        completedImprovementsToday: 0,
        openWorkspaces: 0,
      },
      openAiUsage: {
        requestsToday: 0,
        requestsThisMonth: 0,
        estimatedMonthlyCostUsd: 0,
        budgetCapUsd: 5,
        budgetUsedPercent: 0,
      },
      configured: false,
      openAiConfigured: isOpenAiConfigured(),
    };
  }

  const [rawWorkspaces, weeklyStats, openAiUsage] = await Promise.all([
    getAllArticleWorkspaces(),
    computeWeeklyWorkspaceStats(),
    computeOpenAiUsageStats(),
  ]);

  const workspaces = await enrichWorkspaces(rawWorkspaces);
  const activeWorkspaces = workspaces
    .filter((w) => ACTIVE_WORKSPACE_STATUSES.includes(w.status))
    .sort((a, b) => a.seo_score - b.seo_score);
  const history = workspaces.filter((w) =>
    HISTORY_WORKSPACE_STATUSES.includes(w.status)
  );

  return {
    workspaces,
    activeWorkspaces,
    history,
    dailyCapacity: computeDailyWorkspaceCapacity(rawWorkspaces),
    weeklyStats,
    metrics: computeWorkspaceMetrics(rawWorkspaces),
    openAiUsage,
    configured: true,
    openAiConfigured: isOpenAiConfigured(),
  };
}

export async function loadWorkspaceDetailData(
  id: string
): Promise<WorkspaceDetailData | null> {
  const configured = isSupabaseAdminConfigured();
  if (!configured) return null;

  const workspace = await getArticleWorkspaceById(id);
  if (!workspace) return null;

  const [enriched, activity] = await Promise.all([
    enrichWorkspaces([workspace]),
    getWorkspaceActivity(id),
  ]);

  return {
    workspace: enriched[0]!,
    activity,
    configured: true,
    openAiConfigured: isOpenAiConfigured(),
  };
}
