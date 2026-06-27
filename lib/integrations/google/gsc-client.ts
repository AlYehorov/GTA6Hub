import { google } from "googleapis";
import { getIntegrationsEnv } from "@/lib/integrations/config";
import { getGoogleAuth } from "@/lib/integrations/google/auth";
import type { GscCrawlIssue, GscSnapshot } from "@/lib/integrations/types";

const GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

function formatSiteUrl(property: string): string {
  if (property.startsWith("sc-domain:") || property.startsWith("http")) {
    return property;
  }
  return property.endsWith("/") ? property : `${property}/`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function fetchGscSnapshot(): Promise<GscSnapshot> {
  const env = getIntegrationsEnv();
  const siteUrl = formatSiteUrl(env.searchConsoleProperty ?? env.siteUrl);
  const auth = getGoogleAuth(GSC_SCOPES);
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const startDate = daysAgo(28);
  const endDate = daysAgo(1);

  const [siteSummary, topQueries, topPages, sitemaps] = await Promise.all([
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
      },
    }),
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 50,
      },
    }),
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 100,
      },
    }),
    searchconsole.sitemaps.list({ siteUrl }).catch(() => ({ data: { sitemap: [] } })),
  ]);

  const summaryRow = siteSummary.data.rows?.[0];
  const impressions = summaryRow?.impressions ?? 0;
  const clicks = summaryRow?.clicks ?? 0;
  const ctr = summaryRow?.ctr ?? 0;
  const averagePosition = summaryRow?.position ?? 0;

  const pages = (topPages.data.rows ?? []).map((row) => ({
    page: row.keys?.[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));

  const queries = (topQueries.data.rows ?? []).map((row) => ({
    query: row.keys?.[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));

  const sitemapList = sitemaps.data.sitemap ?? [];
  let sitemapErrors = 0;
  let sitemapStatus: GscSnapshot["summary"]["sitemapStatus"] = "unknown";

  for (const sm of sitemapList) {
    const errors = Number(sm.errors ?? 0);
    const warnings = Number(sm.warnings ?? 0);
    sitemapErrors += errors;
    if (errors > 0) sitemapStatus = "error";
    else if (warnings > 0 && sitemapStatus !== "error") sitemapStatus = "warning";
    else if (sitemapStatus === "unknown") sitemapStatus = "ok";
  }

  const crawlErrors: GscCrawlIssue[] = [];
  for (const sm of sitemapList) {
    if (Number(sm.errors ?? 0) > 0) {
      crawlErrors.push({
        type: "broken_link",
        url: sm.path ?? siteUrl,
        detail: `Sitemap has ${sm.errors} error(s)`,
      });
    }
  }

  let pageTrends: GscSnapshot["pageTrends"];
  try {
    const trendMap = await fetchGscPageTrends();
    pageTrends = Array.from(trendMap.entries()).map(([page, t]) => {
      const changePercent =
        t.previous > 0
          ? ((t.current - t.previous) / t.previous) * 100
          : t.current > 0
            ? 100
            : 0;
      return {
        page,
        currentClicks: t.current,
        previousClicks: t.previous,
        changePercent,
      };
    });
  } catch {
    pageTrends = [];
  }

  return {
    summary: {
      indexedPagesEstimate: pages.filter((p) => p.impressions > 0).length,
      excludedPages: sitemapErrors,
      impressions,
      clicks,
      ctr,
      averagePosition,
      sitemapStatus,
      sitemapErrors,
      crawlErrors,
    },
    topQueries: queries,
    topPages: pages,
    pageTrends,
    syncedAt: new Date().toISOString(),
  };
}

export async function verifySearchConsoleAccess(): Promise<{
  verified: boolean;
  siteUrl: string;
  permissionLevel?: string;
}> {
  const env = getIntegrationsEnv();
  const siteUrl = formatSiteUrl(env.searchConsoleProperty ?? env.siteUrl);
  const auth = getGoogleAuth(GSC_SCOPES);
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const { data } = await searchconsole.sites.get({ siteUrl });
  const level = data.permissionLevel ?? undefined;
  const verified = Boolean(level && level !== "siteUnverifiedUser");

  return { verified, siteUrl, permissionLevel: level ?? undefined };
}

export async function fetchGscPageTrends(): Promise<
  Map<string, { current: number; previous: number }>
> {
  const env = getIntegrationsEnv();
  const siteUrl = formatSiteUrl(env.searchConsoleProperty ?? env.siteUrl);
  const auth = getGoogleAuth(GSC_SCOPES);
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const [current, previous] = await Promise.all([
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: daysAgo(28),
        endDate: daysAgo(1),
        dimensions: ["page"],
        rowLimit: 500,
      },
    }),
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: daysAgo(56),
        endDate: daysAgo(29),
        dimensions: ["page"],
        rowLimit: 500,
      },
    }),
  ]);

  const map = new Map<string, { current: number; previous: number }>();

  for (const row of current.data.rows ?? []) {
    const page = row.keys?.[0] ?? "";
    map.set(page, { current: row.clicks ?? 0, previous: 0 });
  }

  for (const row of previous.data.rows ?? []) {
    const page = row.keys?.[0] ?? "";
    const existing = map.get(page) ?? { current: 0, previous: 0 };
    existing.previous = row.clicks ?? 0;
    map.set(page, existing);
  }

  return map;
}
