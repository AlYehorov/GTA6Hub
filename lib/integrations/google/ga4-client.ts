import { google } from "googleapis";
import { getIntegrationsEnv } from "@/lib/integrations/config";
import { getGoogleAuth } from "@/lib/integrations/google/auth";
import type { Ga4Snapshot } from "@/lib/integrations/types";

const GA4_SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function fetchGa4Snapshot(): Promise<Ga4Snapshot> {
  const env = getIntegrationsEnv();
  const propertyId = env.ga4PropertyId;
  if (!propertyId) {
    throw new Error("GA4_PROPERTY_ID is not configured");
  }

  const auth = getGoogleAuth(GA4_SCOPES);
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });
  const property = `properties/${propertyId}`;

  const startDate = daysAgo(28);
  const endDate = daysAgo(0);

  const [
    summaryReport,
    landingReport,
    exitReport,
    sourceReport,
    countryReport,
    deviceReport,
    referrerReport,
    realtimeReport,
  ] = await Promise.all([
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "averageSessionDuration" },
          { name: "screenPageViewsPerSession" },
          { name: "userEngagementDuration" },
        ],
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "landingPage" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "engagementRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "20",
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "sessions" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "20",
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "10",
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "15",
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "15",
      },
    }),
    analyticsdata.properties.runRealtimeReport({
      property,
      requestBody: {
        metrics: [{ name: "activeUsers" }],
      },
    }).catch(() => ({ data: { rows: [] } })),
  ]);

  const summaryMetrics = summaryReport.data.rows?.[0]?.metricValues ?? [];
  const num = (i: number) => Number(summaryMetrics[i]?.value ?? 0);

  const totalUsers = num(2);
  const newUsers = num(3);
  const returningUsers = Math.max(0, totalUsers - newUsers);
  const engagementDuration = num(6);
  const sessions = num(1);

  const realtimeVisitors = Number(
    realtimeReport.data.rows?.[0]?.metricValues?.[0]?.value ?? 0
  );

  return {
    summary: {
      visitors: num(0),
      sessions,
      users: totalUsers,
      returningUsers,
      averageEngagementTime: sessions > 0 ? engagementDuration / sessions : 0,
      pagesPerSession: num(5),
      realtimeVisitors,
    },
    topLandingPages: (landingReport.data.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      users: Number(row.metricValues?.[1]?.value ?? 0),
      engagementRate: Number(row.metricValues?.[2]?.value ?? 0),
    })),
    topExitPages: (exitReport.data.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      exitRate: Number(row.metricValues?.[1]?.value ?? 0),
    })),
    trafficSources: (sourceReport.data.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      users: Number(row.metricValues?.[1]?.value ?? 0),
    })),
    countries: (countryReport.data.rows ?? []).map((row) => ({
      country: row.dimensionValues?.[0]?.value ?? "",
      users: Number(row.metricValues?.[0]?.value ?? 0),
      sessions: Number(row.metricValues?.[1]?.value ?? 0),
    })),
    devices: (deviceReport.data.rows ?? []).map((row) => ({
      device: row.dimensionValues?.[0]?.value ?? "",
      users: Number(row.metricValues?.[0]?.value ?? 0),
      sessions: Number(row.metricValues?.[1]?.value ?? 0),
    })),
    referrers: (referrerReport.data.rows ?? []).map((row) => ({
      referrer: row.dimensionValues?.[0]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    })),
    syncedAt: new Date().toISOString(),
  };
}
