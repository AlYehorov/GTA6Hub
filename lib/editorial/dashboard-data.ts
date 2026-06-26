/**
 * Editorial dashboard data loader.
 *
 * Loading strategy (one request cycle per /admin/dashboard visit):
 * 1. Fetch published articles ONCE — shared by SEO scoring, content gaps, internal links.
 * 2. Fetch entity rows in parallel — shared by gaps + link targets.
 * 3. Run pure compute (gaps, opportunities, SEO scores, link suggestions) in memory.
 * 4. Parallel independent queries: today summary counts, sources, outdated, videos.
 *
 * Daily report OpenAI call is separate and cached (see lib/editorial/daily-report.ts).
 * Pass a pre-built snapshot from this loader to avoid re-running the dashboard queries
 * on cache miss when the page already loaded data.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { isOpenAiConfigured } from "@/lib/ai/openai-client";
import type { GameEntityKind } from "@/lib/types/game-entity";
import { getAllDraftsAdmin } from "@/lib/drafts/queries";
import { getAllSourceItemsAdmin } from "@/lib/sources/queries";
import {
  buildArticleTextCorpus,
  computeContentGaps,
  fetchEntityRowsForGaps,
} from "@/lib/editorial/content-gaps";
import { gapsToMissingSeoPages } from "@/lib/editorial/missing-seo-pages";
import { detectOutdatedArticles } from "@/lib/editorial/outdated";
import {
  buildLinkTargetsFromEditorialData,
  suggestInternalLinksFromArticles,
  type PublishedEntityLinkRow,
  type PublishedVideoLinkRow,
} from "@/lib/editorial/internal-links";
import { rankContentOpportunities } from "@/lib/editorial/opportunities";
import { getWeakestArticles } from "@/lib/editorial/seo-score";
import type {
  ArticleSeoInput,
  EditorialDashboardData,
  EditorialReportSnapshot,
  TodaySummary,
} from "@/lib/editorial/types";

const LINK_ENTITY_KINDS: GameEntityKind[] = [
  "characters",
  "locations",
  "vehicles",
  "businesses",
  "missions",
  "collectibles",
];

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function buildTodaySummary(): Promise<TodaySummary> {
  if (!isSupabaseAdminConfigured()) {
    return {
      newRockstarNews: 0,
      newVideos: 0,
      redditDiscussions: 0,
      newAiDrafts: 0,
      draftsWaitingReview: 0,
      publishedToday: 0,
      articlesUpdatedToday: 0,
    };
  }

  const supabase = createAdminClient();
  const today = startOfTodayUtc();

  const [
    { count: newRockstarNews },
    { count: newVideos },
    { count: redditDiscussions },
    { count: newAiDrafts },
    drafts,
    { count: publishedToday },
    { count: articlesUpdatedToday },
  ] = await Promise.all([
    supabase
      .from("source_items")
      .select("*", { count: "exact", head: true })
      .eq("source", "rockstar_newswire")
      .gte("created_at", today),
    supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today),
    supabase
      .from("source_items")
      .select("*", { count: "exact", head: true })
      .eq("source", "reddit")
      .gte("created_at", today),
    supabase
      .from("ai_drafts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today),
    getAllDraftsAdmin(),
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", today),
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("updated_at", today),
  ]);

  return {
    newRockstarNews: newRockstarNews ?? 0,
    newVideos: newVideos ?? 0,
    redditDiscussions: redditDiscussions ?? 0,
    newAiDrafts: newAiDrafts ?? 0,
    draftsWaitingReview: drafts.filter((d) => d.status === "pending").length,
    publishedToday: publishedToday ?? 0,
    articlesUpdatedToday: articlesUpdatedToday ?? 0,
  };
}

function mapPublishedArticleRow(row: Record<string, unknown>): ArticleSeoInput {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    type: row.type as "news" | "guide",
    excerpt: (row.excerpt as string | null) ?? null,
    content: row.content as string,
    hero_image_url: (row.hero_image_url as string | null) ?? null,
    seo_title: (row.seo_title as string | null) ?? null,
    seo_description: (row.seo_description as string | null) ?? null,
    video_id: (row.video_id as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    updated_at: row.updated_at as string,
  };
}

async function fetchPublishedArticlesBundle(): Promise<ArticleSeoInput[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, slug, type, excerpt, content, hero_image_url, seo_title, seo_description, video_id, published_at, updated_at"
    )
    .eq("status", "published");

  return (data ?? []).map((row) =>
    mapPublishedArticleRow(row as Record<string, unknown>)
  );
}

async function fetchPublishedVideosForLinks(): Promise<PublishedVideoLinkRow[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("videos")
    .select("title, slug")
    .eq("status", "published")
    .limit(30);

  return (data ?? []).map((row) => ({
    title: row.title as string,
    slug: row.slug as string,
  }));
}

function entityRowsToLinkEntities(
  entityRows: Awaited<ReturnType<typeof fetchEntityRowsForGaps>>
): PublishedEntityLinkRow[] {
  const linkKindSet = new Set<string>(LINK_ENTITY_KINDS);
  const result: PublishedEntityLinkRow[] = [];

  for (const { kind, entities } of entityRows) {
    if (!linkKindSet.has(kind)) continue;
    for (const entity of entities) {
      if (entity.status !== "published") continue;
      result.push({ kind, slug: entity.slug, title: entity.title });
    }
  }

  return result;
}

export function buildEditorialReportSnapshot(
  data: EditorialDashboardData
): EditorialReportSnapshot {
  const adminName =
    process.env.EDITORIAL_ADMIN_NAME?.trim() ||
    process.env.ADMIN_DISPLAY_NAME?.trim() ||
    "Editor";

  return {
    adminName,
    summary: data.summary,
    topOpportunities: data.opportunities.slice(0, 5).map((o) => ({
      title: o.title,
      stars: o.stars,
      traffic: o.estimatedMonthlyTraffic,
    })),
    missingPageCount: data.missingPages.length,
    topMissing: data.missingPages.slice(0, 5).map((p) => p.title),
    outdatedCount: data.outdatedArticles.length,
    topOutdated: data.outdatedArticles.slice(0, 5).map((a) => a.title),
    weakestSeo: data.weakestSeo.slice(0, 5).map((a) => ({
      title: a.title,
      score: a.score,
    })),
    draftsWaiting: data.summary.draftsWaitingReview,
  };
}

export async function loadEditorialDashboardData(): Promise<EditorialDashboardData> {
  const configured = isSupabaseAdminConfigured();

  if (!configured) {
    return {
      summary: await buildTodaySummary(),
      opportunities: [],
      missingPages: [],
      outdatedArticles: [],
      internalLinkSuggestions: [],
      weakestSeo: [],
      configured: false,
      openAiConfigured: isOpenAiConfigured(),
    };
  }

  const [
    summary,
    sources,
    publishedArticles,
    entityRows,
    videos,
    outdatedArticles,
  ] = await Promise.all([
    buildTodaySummary(),
    getAllSourceItemsAdmin({ limit: 80 }),
    fetchPublishedArticlesBundle(),
    fetchEntityRowsForGaps(),
    fetchPublishedVideosForLinks(),
    detectOutdatedArticles(15),
  ]);

  const articleText = buildArticleTextCorpus(publishedArticles);
  const gaps = computeContentGaps(articleText, entityRows, 30);
  const missingPages = gapsToMissingSeoPages(gaps, 30);

  const linkEntities = entityRowsToLinkEntities(entityRows);
  const linkTargets = buildLinkTargetsFromEditorialData(
    linkEntities,
    publishedArticles.map((a) => ({
      title: a.title,
      slug: a.slug,
      type: a.type,
    })),
    videos
  );
  const internalLinkSuggestions = suggestInternalLinksFromArticles(
    publishedArticles,
    linkTargets,
    10
  );

  const opportunities = rankContentOpportunities({
    sources,
    gaps,
    existingArticleTitles: publishedArticles.map((a) => a.title),
    limit: 10,
  });
  const weakestSeo = getWeakestArticles(publishedArticles, 10);

  return {
    summary,
    opportunities,
    missingPages,
    outdatedArticles,
    internalLinkSuggestions,
    weakestSeo,
    configured: true,
    openAiConfigured: isOpenAiConfigured(),
  };
}

/** @deprecated Prefer buildEditorialReportSnapshot(loadEditorialDashboardData()) on dashboard */
export async function loadEditorialReportSnapshot(): Promise<EditorialReportSnapshot> {
  const data = await loadEditorialDashboardData();
  return buildEditorialReportSnapshot(data);
}
