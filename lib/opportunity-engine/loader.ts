import { isOpenAiConfigured } from "@/lib/ai/openai-client";
import { getAdminUser } from "@/lib/auth/admin";
import {
  buildArticleTextCorpus,
  computeContentGaps,
  fetchEntityRowsForGaps,
} from "@/lib/editorial/content-gaps";
import { detectOutdatedArticles } from "@/lib/editorial/outdated";
import type { ArticleSeoInput } from "@/lib/editorial/types";
import { getContentEngineUsageStats } from "@/lib/content-engine/usage";
import { getOpportunityStatusMap } from "@/lib/opportunity-engine/queries";
import { rankEditorialOpportunities } from "@/lib/opportunity-engine/ranker";
import { buildEditorialRecommendation } from "@/lib/opportunity-engine/recommendation";
import { computeTrendingKeywords } from "@/lib/opportunity-engine/trending";
import type {
  ContentGapItem,
  EditorBriefingData,
  OpportunityEntity,
} from "@/lib/opportunity-engine/types";
import { kgEntityHref } from "@/lib/knowledge-graph/types";
import { getAllSourceItemsAdmin } from "@/lib/sources/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getAllVideosAdmin } from "@/lib/videos/queries";

const ANALYSIS_WINDOW_DAYS = 7;

function startOfWindowUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ANALYSIS_WINDOW_DAYS);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function adminDisplayName(email: string | undefined | null): string {
  if (!email) return "Editor";
  const local = email.split("@")[0] ?? "Editor";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

async function fetchArticlesForBriefing(): Promise<ArticleSeoInput[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, slug, type, excerpt, content, hero_image_url, seo_title, seo_description, video_id, published_at, updated_at"
    )
    .in("status", ["published", "draft"]);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    type: row.type as "news" | "guide",
    excerpt: (row.excerpt as string | null) ?? null,
    content: (row.content as string) ?? "",
    hero_image_url: (row.hero_image_url as string | null) ?? null,
    seo_title: (row.seo_title as string | null) ?? null,
    seo_description: (row.seo_description as string | null) ?? null,
    video_id: (row.video_id as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    updated_at: row.updated_at as string,
  }));
}

async function fetchLinkedEntities(
  sourceIds: string[]
): Promise<OpportunityEntity[]> {
  if (!isSupabaseAdminConfigured() || sourceIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("source_entities")
    .select("entity:kg_entities(id, kind, slug, title, status)")
    .in("source_item_id", sourceIds);

  const entities: OpportunityEntity[] = [];
  const seen = new Set<string>();

  for (const row of data ?? []) {
    const entity = Array.isArray(row.entity) ? row.entity[0] : row.entity;
    if (!entity || entity.status !== "published") continue;
    const id = entity.id as string;
    if (seen.has(id)) continue;
    seen.add(id);
    entities.push({
      id,
      kind: entity.kind as string,
      slug: entity.slug as string,
      title: entity.title as string,
      href: kgEntityHref(entity.kind as Parameters<typeof kgEntityHref>[0], entity.slug as string),
    });
  }

  return entities;
}

export async function loadEditorBriefing(): Promise<EditorBriefingData> {
  const configured = isSupabaseAdminConfigured();
  const openAiConfigured = isOpenAiConfigured();
  const user = await getAdminUser();
  const adminName = adminDisplayName(user?.email);

  if (!configured) {
    return {
      adminName,
      intake: {
        rockstarPosts: 0,
        youtubeVideos: 0,
        redditDiscussions: 0,
        newswireUpdates: 0,
        affectedEntities: 0,
        outdatedArticles: 0,
      },
      opportunities: [],
      weeklyGaps: [],
      trendingKeywords: [],
      recommendation: {
        summary: "Configure Supabase to load the editorial briefing.",
        publishRockstar: false,
        publishCommunity: false,
        updateGuidesCount: 0,
        trafficGainEstimate: "Low",
      },
      usage: await getContentEngineUsageStats(),
      configured: false,
      openAiConfigured,
    };
  }

  const windowStart = startOfWindowUtc();

  const [
    allSources,
    videos,
    articles,
    entityRows,
    outdated,
    statusMap,
    usage,
  ] = await Promise.all([
    getAllSourceItemsAdmin({ limit: 500 }),
    getAllVideosAdmin(),
    fetchArticlesForBriefing(),
    fetchEntityRowsForGaps(),
    detectOutdatedArticles(20),
    getOpportunityStatusMap(),
    getContentEngineUsageStats(),
  ]);

  const windowSources = allSources.filter(
    (s) => s.created_at >= windowStart || (s.published_at && s.published_at >= windowStart)
  );

  const rockstarPosts = windowSources.filter(
    (s) => s.source === "rockstar_newswire" || s.source === "rockstar_youtube"
  ).length;
  const redditDiscussions = windowSources.filter((s) => s.source === "reddit").length;
  const newswireUpdates = windowSources.filter(
    (s) => s.source === "rockstar_newswire"
  ).length;
  const youtubeVideos = videos.filter(
    (v) => v.created_at >= windowStart || (v.published_at && v.published_at >= windowStart)
  ).length;

  const sourceIds = windowSources.map((s) => s.id);
  const linkedEntities = await fetchLinkedEntities(sourceIds);

  const articleText = buildArticleTextCorpus(
    articles.filter((a) => a.type).map((a) => ({
      title: a.title,
      content: a.content,
      slug: a.slug,
    }))
  );
  const gaps = computeContentGaps(articleText, entityRows, 30);

  const opportunities = rankEditorialOpportunities({
    sources: windowSources.length > 0 ? windowSources : allSources.slice(0, 200),
    videos: videos.slice(0, 80),
    articles,
    gaps,
    entities: linkedEntities,
    statusMap,
    limit: 12,
  });

  const weeklyGaps: ContentGapItem[] = gaps.slice(0, 8).map((g) => ({
    title: g.title,
    kind: g.kind,
    slug: g.slug,
    href: g.entityHref,
  }));

  const trendingKeywords = computeTrendingKeywords(
    windowSources.length > 0 ? windowSources : allSources.slice(0, 150)
  );

  const recommendation = buildEditorialRecommendation({
    opportunities,
    outdatedCount: outdated.length,
  });

  return {
    adminName,
    intake: {
      rockstarPosts,
      youtubeVideos,
      redditDiscussions,
      newswireUpdates,
      affectedEntities: linkedEntities.length,
      outdatedArticles: outdated.length,
    },
    opportunities,
    weeklyGaps,
    trendingKeywords,
    recommendation,
    usage,
    configured: true,
    openAiConfigured,
  };
}

export async function findOpportunityById(
  opportunityId: string
): Promise<import("@/lib/opportunity-engine/types").EditorialOpportunity | null> {
  const data = await loadEditorBriefing();
  return data.opportunities.find((o) => o.id === opportunityId) ?? null;
}
