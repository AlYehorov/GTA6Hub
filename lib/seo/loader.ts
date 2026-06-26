/**
 * SEO Intelligence Engine — single loader for /admin/seo.
 *
 * All sections are computed deterministically from one DB fetch cycle.
 * OpenAI is NEVER called here — only via explicit button actions
 * (AI Editor, Weekly Report).
 */

import { isOpenAiConfigured } from "@/lib/ai/openai-client";
import { fetchEntityRowsForGaps } from "@/lib/editorial/content-gaps";
import { detectOutdatedArticles } from "@/lib/editorial/outdated";
import { detectCannibalization } from "@/lib/seo/cannibalization";
import { collectValidPaths, detectBrokenInternalLinks } from "@/lib/seo/broken-links";
import { computeEntityCoverage } from "@/lib/seo/coverage";
import { generateKeywordOpportunities } from "@/lib/seo/keywords";
import {
  fetchArticlesForSeoIntelligence,
  fetchPublishedVideoSlugs,
  fetchSourceTitlesForKeywords,
  fetchVideoTitlesForKeywords,
  buildValidPathsFromData,
} from "@/lib/seo/queries";
import {
  getImproveReasons,
  scoreSeoArticle,
  seoStatusFromScore,
} from "@/lib/seo/scoring";
import type {
  ContentInventoryRow,
  FreshnessFlag,
  ImproveQueueItem,
  SeoIntelligenceData,
  WeeklyReportInput,
} from "@/lib/seo/types";
import { SEO_ENTITY_KINDS } from "@/lib/editorial/constants";
import type { SeoEntityKind } from "@/lib/editorial/constants";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export async function loadSeoIntelligenceData(): Promise<SeoIntelligenceData> {
  const configured = isSupabaseAdminConfigured();

  if (!configured) {
    return {
      inventory: [],
      improveQueue: [],
      freshnessFlags: [],
      cannibalization: [],
      keywordOpportunities: [],
      coverage: [],
      brokenLinks: [],
      configured: false,
      openAiConfigured: isOpenAiConfigured(),
    };
  }

  const [
    articles,
    entityRows,
    outdatedArticles,
    sourceTitles,
    videoTitles,
    videoSlugs,
  ] = await Promise.all([
    fetchArticlesForSeoIntelligence(),
    fetchEntityRowsForGaps(),
    detectOutdatedArticles(20),
    fetchSourceTitlesForKeywords(),
    fetchVideoTitlesForKeywords(),
    fetchPublishedVideoSlugs(),
  ]);

  const publishedArticles = articles.filter((a) => a.status === "published");
  const scored = articles.map(scoreSeoArticle);

  const staleIds = new Set(outdatedArticles.map((a) => a.id));

  const inventory: ContentInventoryRow[] = scored.map((item) => ({
    ...item,
    seoStatus: seoStatusFromScore(item.score),
  }));

  const improveQueue: ImproveQueueItem[] = scored
    .filter((item) => item.status === "published")
    .map((item) => ({
      articleId: item.articleId,
      title: item.title,
      slug: item.slug,
      type: item.type,
      score: item.score,
      reasons: getImproveReasons(item, { isStale: staleIds.has(item.articleId) }),
    }))
    .filter((item) => item.reasons.length > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 15);

  const freshnessFlags: FreshnessFlag[] = outdatedArticles.map((a) => ({
    articleId: a.id,
    title: a.title,
    slug: a.slug,
    type: a.type,
    daysSinceUpdate: a.daysSinceUpdate,
    newestRockstarSourceTitle: a.newestRockstarSourceTitle,
  }));

  const cannibalization = detectCannibalization(scored);
  const coverage = computeEntityCoverage(entityRows, publishedArticles);

  const entityTitles: Array<{ title: string; kind: SeoEntityKind }> = [];
  for (const kind of SEO_ENTITY_KINDS) {
    const row = entityRows.find((r) => r.kind === kind);
    for (const entity of row?.entities ?? []) {
      if (entity.status === "published") {
        entityTitles.push({ title: entity.title, kind });
      }
    }
  }

  const keywordOpportunities = generateKeywordOpportunities({
    articleTitles: publishedArticles.map((a) => a.title),
    sourceTitles,
    entityTitles,
    videoTitles,
    limit: 20,
  });

  const pathData = buildValidPathsFromData(articles, entityRows, videoSlugs);
  const validPaths = collectValidPaths(pathData);
  const brokenLinks = detectBrokenInternalLinks(articles, validPaths);

  return {
    inventory,
    improveQueue,
    freshnessFlags,
    cannibalization,
    keywordOpportunities,
    coverage,
    brokenLinks,
    configured: true,
    openAiConfigured: isOpenAiConfigured(),
  };
}

export function buildWeeklyReportInput(
  data: SeoIntelligenceData
): WeeklyReportInput {
  return {
    inventory: data.inventory,
    improveQueue: data.improveQueue,
    freshnessFlags: data.freshnessFlags,
    cannibalization: data.cannibalization,
    keywordOpportunities: data.keywordOpportunities,
    coverage: data.coverage,
    brokenLinks: data.brokenLinks,
  };
}
