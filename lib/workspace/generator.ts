import { detectOutdatedArticles } from "@/lib/editorial/outdated";
import { fetchArticlesForSeoIntelligence } from "@/lib/seo/queries";
import { scoreSeoArticle } from "@/lib/seo/scoring";
import { getAllSourceItemsAdmin } from "@/lib/sources/queries";
import {
  articleNeedsWorkspace,
  buildChecklistForArticle,
  estimateMinutes,
  estimatePotentialScore,
  hashArticleContent,
  mergeChecklists,
} from "@/lib/workspace/checklist";
import {
  getActiveWorkspaceArticleIds,
  getActiveWorkspaceByArticleId,
  insertArticleWorkspace,
  logWorkspaceActivity,
  updateArticleWorkspace,
} from "@/lib/workspace/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export interface WorkspaceScanResult {
  created: number;
  refreshed: number;
  skipped: number;
  merged: number;
}

function articleByTitleFuzzy(
  articles: Awaited<ReturnType<typeof fetchArticlesForSeoIntelligence>>,
  needle: string
) {
  const lower = needle.toLowerCase();
  return articles.find(
    (a) =>
      a.title.toLowerCase().includes(lower) ||
      lower.includes(a.title.toLowerCase().slice(0, 20))
  );
}

export async function scanArticleWorkspaces(): Promise<WorkspaceScanResult> {
  const [articles, sources, outdated, activeArticleIds] = await Promise.all([
    fetchArticlesForSeoIntelligence(),
    getAllSourceItemsAdmin({ limit: 40 }),
    detectOutdatedArticles(30),
    getActiveWorkspaceArticleIds(),
  ]);

  const published = articles.filter((a) => a.status === "published");
  const outdatedMap = new Map(outdated.map((o) => [o.id, o]));

  const signalsByArticle = new Map<
    string,
    { reasons: string[]; sourceIds: Set<string> }
  >();

  for (const source of sources.filter(
    (s) =>
      s.source === "rockstar_newswire" ||
      s.source === "rockstar_youtube" ||
      s.source === "reddit"
  )) {
    const match = articleByTitleFuzzy(published, source.title);
    if (!match) continue;
    const bucket = signalsByArticle.get(match.id) ?? {
      reasons: [],
      sourceIds: new Set<string>(),
    };
    bucket.sourceIds.add(source.id);
    if (source.source === "rockstar_newswire" || source.source === "rockstar_youtube") {
      bucket.reasons.push("Rockstar posted newer information");
    }
    signalsByArticle.set(match.id, bucket);
  }

  for (const stale of outdated) {
    const bucket = signalsByArticle.get(stale.id) ?? {
      reasons: [],
      sourceIds: new Set<string>(),
    };
    bucket.reasons.push(
      `Article is ${stale.daysSinceUpdate} days old — ${stale.newestRockstarSourceTitle}`
    );
    signalsByArticle.set(stale.id, bucket);
  }

  if (isSupabaseAdminConfigured()) {
    const supabase = createAdminClient();
    const { data: legacyTasks } = await supabase
      .from("editorial_tasks")
      .select("related_article, description, related_source, status")
      .not("related_article", "is", null);

    for (const task of legacyTasks ?? []) {
      const status = task.status as string;
      if (["published", "archived", "cancelled"].includes(status)) continue;
      const articleId = task.related_article as string;
      const bucket = signalsByArticle.get(articleId) ?? {
        reasons: [],
        sourceIds: new Set<string>(),
      };
      if (task.description) bucket.reasons.push(task.description as string);
      if (task.related_source) bucket.sourceIds.add(task.related_source as string);
      signalsByArticle.set(articleId, bucket);
    }
  }

  let created = 0;
  let refreshed = 0;
  let skipped = 0;
  let merged = 0;

  for (const article of published) {
    const scored = scoreSeoArticle(article);
    const stale = outdatedMap.get(article.id);
    const isStale = Boolean(stale);
    const freshChecklist = buildChecklistForArticle(scored, { isStale });
    const signals = signalsByArticle.get(article.id);

    if (
      !articleNeedsWorkspace(scored, freshChecklist, { isStale }) &&
      !signals
    ) {
      skipped++;
      continue;
    }

    const reason = signals?.reasons[0] ?? "";
    const sourceIds = Array.from(signals?.sourceIds ?? []);
    const contentHash = hashArticleContent(article);
    const potential = estimatePotentialScore(scored.score, freshChecklist);
    const minutes = estimateMinutes(freshChecklist);

    const existing = await getActiveWorkspaceByArticleId(article.id);

    if (existing) {
      const checklist = mergeChecklists(existing.checklist, freshChecklist);
      const hashChanged = existing.article_content_hash !== contentHash;
      const mergedReason =
        reason && !existing.reason.includes(reason)
          ? [existing.reason, reason].filter(Boolean).join(" · ")
          : existing.reason || reason;
      const mergedSources = Array.from(
        new Set([...existing.related_source_ids, ...sourceIds])
      );

      await updateArticleWorkspace(existing.id, {
        seo_score: scored.score,
        potential_score: estimatePotentialScore(scored.score, checklist),
        estimated_minutes: estimateMinutes(checklist),
        checklist,
        reason: mergedReason,
        related_source_ids: mergedSources,
        article_content_hash: contentHash,
      });

      if (hashChanged) {
        await logWorkspaceActivity(
          existing.id,
          "checklist_regenerated",
          "Article changed — checklist refreshed"
        );
      }

      await logWorkspaceActivity(
        existing.id,
        "seo_recalculated",
        `SEO score updated to ${scored.score}`
      );

      refreshed++;
      if (signals) merged++;
      continue;
    }

    if (activeArticleIds.has(article.id)) {
      skipped++;
      continue;
    }

    const workspace = await insertArticleWorkspace({
      article_id: article.id,
      status: "needs_improvement",
      seo_score: scored.score,
      potential_score: potential,
      estimated_minutes: minutes,
      checklist: freshChecklist,
      reason,
      related_source_ids: sourceIds,
      assigned_to: null,
      article_content_hash: contentHash,
    });

    if (!workspace) {
      skipped++;
      continue;
    }

    await logWorkspaceActivity(
      workspace.id,
      "created",
      `Workspace created — SEO ${scored.score}, potential ${potential}`
    );

    activeArticleIds.add(article.id);
    created++;
  }

  return { created, refreshed, skipped, merged };
}
