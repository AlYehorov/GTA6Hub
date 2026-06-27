import { fetchArticlesForSeoIntelligence } from "@/lib/seo/queries";
import { scoreSeoArticle } from "@/lib/seo/scoring";
import { getRelatedEntitiesForArticle } from "@/lib/knowledge-graph/queries";
import type { BrokenInternalLink } from "@/lib/seo/types";
import type {
  ArticleSeoMetrics,
  GscCrawlIssue,
  GscPageMetric,
  InsightsDashboardData,
  LowCtrOpportunity,
  LowPositionOpportunity,
  PageTrafficTrend,
} from "@/lib/integrations/types";
import type { Ga4Snapshot, GscSnapshot } from "@/lib/integrations/types";

function pathFromUrl(url: string, siteUrl: string): string {
  try {
    const parsed = new URL(url);
    const site = new URL(siteUrl);
    if (parsed.hostname.replace(/^www\./, "") === site.hostname.replace(/^www\./, "")) {
      return parsed.pathname;
    }
  } catch {
    /* ignore */
  }
  return url;
}

function matchArticleByPath(
  path: string,
  articles: Awaited<ReturnType<typeof fetchArticlesForSeoIntelligence>>
) {
  const normalized = path.replace(/\/$/, "");
  return articles.find((a) => {
    const prefix = a.type === "guide" ? "/guides/" : "/news/";
    return normalized === `${prefix}${a.slug}` || normalized.endsWith(`/${a.slug}`);
  });
}

export function buildPageTrends(
  gsc: GscSnapshot | null,
  siteUrl: string,
  articles: Awaited<ReturnType<typeof fetchArticlesForSeoIntelligence>>
): { losing: PageTrafficTrend[]; rising: PageTrafficTrend[] } {
  if (!gsc?.pageTrends?.length) return { losing: [], rising: [] };

  const trends: PageTrafficTrend[] = gsc.pageTrends.map((trend) => {
    const path = pathFromUrl(trend.page, siteUrl);
    const article = matchArticleByPath(path, articles);
    const pageMetric = gsc.topPages.find((p) => p.page === trend.page);
    return {
      path,
      articleId: article?.id ?? null,
      articleTitle: article?.title ?? null,
      currentClicks: trend.currentClicks,
      previousClicks: trend.previousClicks,
      changePercent: trend.changePercent,
      impressions: pageMetric?.impressions ?? 0,
      ctr: pageMetric?.ctr ?? 0,
      position: pageMetric?.position ?? 0,
    };
  });

  const losing = trends
    .filter((t) => t.changePercent <= -20 && t.previousClicks >= 5)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 10);

  const rising = trends
    .filter((t) => t.changePercent >= 20 && t.currentClicks >= 5)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10);

  return { losing, rising };
}

export function buildLowCtrOpportunities(
  pages: GscPageMetric[],
  siteUrl: string,
  articles: Awaited<ReturnType<typeof fetchArticlesForSeoIntelligence>>
): LowCtrOpportunity[] {
  return pages
    .filter((p) => p.impressions >= 100 && p.ctr < 0.03)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15)
    .map((p) => {
      const path = pathFromUrl(p.page, siteUrl);
      const article = matchArticleByPath(path, articles);
      return {
        path,
        articleId: article?.id ?? null,
        articleTitle: article?.title ?? null,
        impressions: p.impressions,
        clicks: p.clicks,
        ctr: p.ctr,
        position: p.position,
        suggestions: [
          "Improve title",
          "Improve meta description",
          "Add FAQ",
          "Improve internal links",
        ],
      };
    });
}

export function buildLowPositionOpportunities(
  pages: GscPageMetric[],
  siteUrl: string,
  articles: Awaited<ReturnType<typeof fetchArticlesForSeoIntelligence>>
): LowPositionOpportunity[] {
  return pages
    .filter((p) => p.position >= 8 && p.position <= 20 && p.impressions >= 50)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15)
    .map((p) => {
      const path = pathFromUrl(p.page, siteUrl);
      const article = matchArticleByPath(path, articles);
      return {
        path,
        articleId: article?.id ?? null,
        articleTitle: article?.title ?? null,
        impressions: p.impressions,
        position: p.position,
        suggestions: [
          "Expand article",
          "Improve entities",
          "Add related content",
        ],
      };
    });
}

export function buildCrawlIssues(
  gsc: GscSnapshot | null,
  brokenLinks: BrokenInternalLink[]
): GscCrawlIssue[] {
  const issues: GscCrawlIssue[] = [...(gsc?.summary.crawlErrors ?? [])];

  for (const link of brokenLinks.slice(0, 20)) {
    issues.push({
      type: "broken_link",
      url: link.href,
      detail: `Broken link in "${link.articleTitle}"`,
    });
  }

  return issues;
}

export function buildTrafficBreakdown(ga4: Ga4Snapshot | null) {
  if (!ga4) {
    return { users: 0, sessions: 0, organic: 0, referral: 0, direct: 0 };
  }

  const organic =
    ga4.trafficSources.find((s) => s.source === "Organic Search")?.sessions ?? 0;
  const referral =
    ga4.trafficSources.find((s) => s.source === "Referral")?.sessions ?? 0;
  const direct =
    ga4.trafficSources.find((s) => s.source === "Direct")?.sessions ?? 0;

  return {
    users: ga4.summary.users,
    sessions: ga4.summary.sessions,
    organic,
    referral,
    direct,
  };
}

export async function buildArticleMetrics(
  gsc: GscSnapshot | null,
  siteUrl: string
): Promise<ArticleSeoMetrics[]> {
  const articles = await fetchArticlesForSeoIntelligence();
  const published = articles.filter((a) => a.status === "published");
  const pageMap = new Map<string, GscPageMetric>();

  for (const page of gsc?.topPages ?? []) {
    pageMap.set(pathFromUrl(page.page, siteUrl), page);
  }

  const metrics: ArticleSeoMetrics[] = [];

  for (const article of published) {
    const prefix = article.type === "guide" ? "/guides/" : "/news/";
    const path = `${prefix}${article.slug}`;
    const gscPage = pageMap.get(path);
    const scored = scoreSeoArticle(article);
    const entities = await getRelatedEntitiesForArticle(article.id);

    metrics.push({
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      type: article.type,
      organicClicks: gscPage?.clicks ?? 0,
      impressions: gscPage?.impressions ?? 0,
      averagePosition: gscPage?.position ?? null,
      ctr: gscPage?.ctr ?? 0,
      trafficTrend: "stable",
      trafficChangePercent: 0,
      seoScore: scored.score,
      entityCount: entities.length,
      internalLinkCount: scored.breakdown.internalLinks,
    });
  }

  return metrics.sort((a, b) => b.organicClicks - a.organicClicks);
}

export function buildWeeklySummary(data: InsightsDashboardData): string {
  const lines = [
    `Weekly SEO Summary — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`,
    "",
    `Search: ${data.searchPerformance.clicks.toLocaleString()} clicks, ${data.searchPerformance.impressions.toLocaleString()} impressions, CTR ${(data.searchPerformance.ctr * 100).toFixed(1)}%, avg position ${data.searchPerformance.averagePosition.toFixed(1)}`,
    `Traffic: ${data.traffic.users.toLocaleString()} users, ${data.traffic.sessions.toLocaleString()} sessions (organic ${data.traffic.organic}, direct ${data.traffic.direct})`,
    `Google Health: ~${data.googleHealth.indexed} indexed pages, ${data.googleHealth.errors} issues`,
    "",
    `Top pages: ${data.topPerformingPages.slice(0, 5).map((p) => p.page.split("/").pop()).join(", ") || "—"}`,
    `Low CTR opportunities: ${data.lowCtrOpportunities.length}`,
    `Striking distance (pos 8–20): ${data.lowPositionOpportunities.length}`,
    `Pages to review (traffic drop): ${data.pagesLosingTraffic.length}`,
  ];
  return lines.join("\n");
}
