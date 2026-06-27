import { getSiteUrl } from "@/lib/constants/site";
import {
  isClarityConfigured,
  isGa4Configured,
  isSearchConsoleConfigured,
} from "@/lib/integrations/config";
import {
  buildArticleMetrics,
  buildCrawlIssues,
  buildLowCtrOpportunities,
  buildLowPositionOpportunities,
  buildPageTrends,
  buildTrafficBreakdown,
  buildWeeklySummary,
} from "@/lib/integrations/insights/analysis";
import {
  getGa4Snapshot,
  getGscSnapshot,
  getIntegrationSettings,
} from "@/lib/integrations/queries";
import type { InsightsDashboardData } from "@/lib/integrations/types";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { collectValidPaths, detectBrokenInternalLinks } from "@/lib/seo/broken-links";
import { fetchArticlesForSeoIntelligence } from "@/lib/seo/queries";

export async function loadInsightsDashboard(): Promise<InsightsDashboardData> {
  const configured = isSupabaseAdminConfigured();
  const siteUrl = getSiteUrl();

  if (!configured) {
    return emptyInsights();
  }

  const [gsc, ga4, gscSettings, ga4Settings, claritySettings, articles] =
    await Promise.all([
      getGscSnapshot(),
      getGa4Snapshot(),
      getIntegrationSettings("search_console"),
      getIntegrationSettings("analytics"),
      getIntegrationSettings("clarity"),
      fetchArticlesForSeoIntelligence(),
    ]);

  const published = articles.filter((a) => a.status === "published");
  const articlePaths = published.map((a) =>
    a.type === "guide" ? `/guides/${a.slug}` : `/news/${a.slug}`
  );
  const validPaths = collectValidPaths({ articlePaths, entityPaths: [], videoPaths: [] });
  const brokenLinks = detectBrokenInternalLinks(published, validPaths);

  const { losing, rising } = buildPageTrends(gsc, siteUrl, articles);
  const traffic = buildTrafficBreakdown(ga4);
  const articleMetrics = await buildArticleMetrics(gsc, siteUrl);

  const data: InsightsDashboardData = {
    configured: true,
    integrationsConfigured: {
      searchConsole: isSearchConsoleConfigured(),
      analytics: isGa4Configured(),
      clarity: isClarityConfigured(),
    },
    lastSync: {
      searchConsole: gscSettings?.last_sync_at ?? gsc?.syncedAt ?? null,
      analytics: ga4Settings?.last_sync_at ?? ga4?.syncedAt ?? null,
      clarity: claritySettings?.last_sync_at ?? null,
    },
    googleHealth: {
      indexed: gsc?.summary.indexedPagesEstimate ?? 0,
      excluded: gsc?.summary.excludedPages ?? 0,
      errors: gsc?.summary.sitemapErrors ?? 0,
      sitemapStatus: gsc?.summary.sitemapStatus ?? "unknown",
    },
    traffic,
    searchPerformance: {
      impressions: gsc?.summary.impressions ?? 0,
      clicks: gsc?.summary.clicks ?? 0,
      ctr: gsc?.summary.ctr ?? 0,
      averagePosition: gsc?.summary.averagePosition ?? 0,
    },
    topPerformingPages: (gsc?.topPages ?? []).slice(0, 20),
    pagesLosingTraffic: losing,
    pagesRising: rising,
    lowCtrOpportunities: buildLowCtrOpportunities(
      gsc?.topPages ?? [],
      siteUrl,
      articles
    ),
    lowPositionOpportunities: buildLowPositionOpportunities(
      gsc?.topPages ?? [],
      siteUrl,
      articles
    ),
    crawlIssues: buildCrawlIssues(gsc, brokenLinks),
    weeklySummary: null,
    articleMetrics: articleMetrics.slice(0, 30),
  };

  data.weeklySummary = buildWeeklySummary(data);
  return data;
}

function emptyInsights(): InsightsDashboardData {
  return {
    configured: false,
    integrationsConfigured: {
      searchConsole: false,
      analytics: false,
      clarity: false,
    },
    lastSync: { searchConsole: null, analytics: null, clarity: null },
    googleHealth: { indexed: 0, excluded: 0, errors: 0, sitemapStatus: "unknown" },
    traffic: { users: 0, sessions: 0, organic: 0, referral: 0, direct: 0 },
    searchPerformance: { impressions: 0, clicks: 0, ctr: 0, averagePosition: 0 },
    topPerformingPages: [],
    pagesLosingTraffic: [],
    pagesRising: [],
    lowCtrOpportunities: [],
    lowPositionOpportunities: [],
    crawlIssues: [],
    weeklySummary: null,
    articleMetrics: [],
  };
}

export async function loadArticleSeoMetrics(articleId: string) {
  const metrics = await buildArticleMetrics(await getGscSnapshot(), getSiteUrl());
  return metrics.find((m) => m.articleId === articleId) ?? null;
}
