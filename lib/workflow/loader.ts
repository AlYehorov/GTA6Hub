import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { isOpenAiConfigured } from "@/lib/ai/openai-client";
import { suggestInternalLinksFromArticles, buildLinkTargetsFromEditorialData } from "@/lib/editorial/internal-links";
import { scoreSeoArticle } from "@/lib/seo/scoring";
import { fetchArticlesForSeoIntelligence } from "@/lib/seo/queries";
import { fetchEntityRowsForGaps } from "@/lib/editorial/content-gaps";
import { getAllEditorialTasks } from "@/lib/workflow/queries";
import { generateEditorialTaskCandidates } from "@/lib/workflow/task-generator";
import {
  computeDailyCapacity,
  computeOpenAiUsageStats,
  computeWeeklyWorkflowStats,
  computeWorkflowMetrics,
} from "@/lib/workflow/metrics";
import type {
  EditorialTaskWithContext,
  EditorialTaskStatus,
  WorkflowPageData,
} from "@/lib/workflow/types";
import {
  ACTIVE_TASK_STATUSES,
  HISTORY_STATUSES,
  KANBAN_STATUSES,
} from "@/lib/workflow/types";
import { SEO_ENTITY_KINDS } from "@/lib/editorial/constants";
import type { SeoEntityKind } from "@/lib/editorial/constants";

async function enrichTasks(
  tasks: Awaited<ReturnType<typeof getAllEditorialTasks>>
): Promise<EditorialTaskWithContext[]> {
  if (!isSupabaseAdminConfigured() || tasks.length === 0) return tasks;

  const supabase = createAdminClient();
  const sourceIds = tasks
    .map((t) => t.related_source)
    .filter((id): id is string => Boolean(id));
  const articleIds = tasks
    .map((t) => t.related_article)
    .filter((id): id is string => Boolean(id));

  const [sourcesRes, articlesRes, allArticles, entityRows] = await Promise.all([
    sourceIds.length
      ? supabase.from("source_items").select("id, title").in("id", sourceIds)
      : Promise.resolve({ data: [] }),
    articleIds.length
      ? supabase.from("articles").select("id, title, slug").in("id", articleIds)
      : Promise.resolve({ data: [] }),
    fetchArticlesForSeoIntelligence(),
    fetchEntityRowsForGaps(),
  ]);

  const sourceMap = new Map(
    (sourcesRes.data ?? []).map((s) => [s.id as string, s.title as string])
  );
  const articleMap = new Map(
    (articlesRes.data ?? []).map((a) => [
      a.id as string,
      { title: a.title as string, slug: a.slug as string },
    ])
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

  return tasks.map((task) => {
    const articleMeta = task.related_article
      ? articleMap.get(task.related_article)
      : null;
    const articleRecord = task.related_article
      ? allArticles.find((a) => a.id === task.related_article)
      : null;

    let seoScore: number | null = null;
    let suggestedFaq: string[] = [];
    let suggestedInternalLinks: string[] = [];

    if (articleRecord) {
      const scored = scoreSeoArticle(articleRecord);
      seoScore = scored.score;
      if (!scored.hasFaq) {
        suggestedFaq = [
          `What is ${articleRecord.title} in GTA 6?`,
          `Is ${articleRecord.title} confirmed for GTA VI?`,
        ];
      }
      const suggestions = suggestInternalLinksFromArticles(
        [articleRecord],
        linkTargets,
        1
      );
      suggestedInternalLinks =
        suggestions[0]?.suggestedLinks.map((l: { href: string }) => l.href) ?? [];
    }

    return {
      ...task,
      relatedSourceTitle: task.related_source
        ? sourceMap.get(task.related_source) ?? null
        : null,
      relatedArticleTitle: articleMeta?.title ?? null,
      relatedArticleSlug: articleMeta?.slug ?? null,
      seoScore,
      suggestedFaq,
      suggestedInternalLinks,
    };
  });
}

function groupByStatus(
  tasks: EditorialTaskWithContext[]
): Record<EditorialTaskStatus, EditorialTaskWithContext[]> {
  const groups = {} as Record<EditorialTaskStatus, EditorialTaskWithContext[]>;
  for (const status of [
    ...KANBAN_STATUSES,
    "fact_check",
    "scheduled",
    "needs_update",
    "archived",
    "cancelled",
  ] as EditorialTaskStatus[]) {
    groups[status] = [];
  }
  for (const task of tasks) {
    if (!groups[task.status]) groups[task.status] = [];
    groups[task.status].push(task);
  }
  return groups;
}

export async function loadWorkflowPageData(): Promise<WorkflowPageData> {
  const configured = isSupabaseAdminConfigured();

  if (!configured) {
    return {
      tasks: [],
      todayByStatus: {},
      kanban: {} as WorkflowPageData["kanban"],
      history: [],
      dailyCapacity: { taskCount: 0, estimatedMinutes: 0 },
      weeklyStats: {
        tasksCreated: 0,
        tasksCompleted: 0,
        averageCompletionMinutes: null,
        completionRate: 0,
      },
      metrics: {
        tasksCompletedToday: 0,
        averagePublishMinutes: null,
        averageReviewMinutes: null,
        openOpportunities: 0,
      },
      openAiUsage: {
        requestsToday: 0,
        requestsThisMonth: 0,
        estimatedMonthlyCostUsd: 0,
        budgetCapUsd: 5,
        budgetUsedPercent: 0,
      },
      generatorPreview: [],
      configured: false,
      openAiConfigured: isOpenAiConfigured(),
    };
  }

  const [rawTasks, weeklyStats, openAiUsage, generatorPreview] =
    await Promise.all([
      getAllEditorialTasks(),
      computeWeeklyWorkflowStats(),
      computeOpenAiUsageStats(),
      generateEditorialTaskCandidates(),
    ]);

  const tasks = await enrichTasks(rawTasks);
  const byStatus = groupByStatus(tasks);

  const todayActive = tasks.filter((t) =>
    ACTIVE_TASK_STATUSES.includes(t.status)
  );
  const todayByStatus: Record<string, EditorialTaskWithContext[]> = {};
  for (const task of todayActive) {
    if (!todayByStatus[task.status]) todayByStatus[task.status] = [];
    todayByStatus[task.status].push(task);
  }

  const kanban = {} as WorkflowPageData["kanban"];
  for (const status of KANBAN_STATUSES) {
    kanban[status] = byStatus[status] ?? [];
  }

  const history = tasks.filter((t) => HISTORY_STATUSES.includes(t.status));

  return {
    tasks,
    todayByStatus,
    kanban,
    history,
    dailyCapacity: computeDailyCapacity(tasks),
    weeklyStats,
    metrics: computeWorkflowMetrics(tasks),
    openAiUsage,
    generatorPreview: generatorPreview.slice(0, 15),
    configured: true,
    openAiConfigured: isOpenAiConfigured(),
  };
}
