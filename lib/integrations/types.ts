export type IntegrationId = "search_console" | "analytics" | "clarity";

export type VerificationStatus =
  | "pending"
  | "verified"
  | "failed"
  | "not_configured";

export interface IntegrationSettingsRow {
  id: IntegrationId;
  property_url: string | null;
  verification_status: VerificationStatus;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  updated_at: string;
}

export interface GscPageMetric {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueryMetric {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSummary {
  indexedPagesEstimate: number;
  excludedPages: number;
  impressions: number;
  clicks: number;
  ctr: number;
  averagePosition: number;
  sitemapStatus: "ok" | "warning" | "error" | "unknown";
  sitemapErrors: number;
  crawlErrors: GscCrawlIssue[];
}

export interface GscCrawlIssue {
  type: "404" | "redirect" | "robots" | "canonical" | "noindex" | "broken_link";
  url: string;
  detail: string;
}

export interface GscSnapshot {
  summary: GscSummary;
  topQueries: GscQueryMetric[];
  topPages: GscPageMetric[];
  pageTrends?: Array<{
    page: string;
    currentClicks: number;
    previousClicks: number;
    changePercent: number;
  }>;
  syncedAt: string;
}

export interface Ga4Summary {
  visitors: number;
  sessions: number;
  users: number;
  returningUsers: number;
  averageEngagementTime: number;
  pagesPerSession: number;
  realtimeVisitors: number;
}

export interface Ga4LandingPage {
  path: string;
  sessions: number;
  users: number;
  engagementRate: number;
}

export interface Ga4ExitPage {
  path: string;
  sessions: number;
  exitRate: number;
}

export interface Ga4TrafficSource {
  source: string;
  sessions: number;
  users: number;
}

export interface Ga4Country {
  country: string;
  users: number;
  sessions: number;
}

export interface Ga4Device {
  device: string;
  users: number;
  sessions: number;
}

export interface Ga4Referrer {
  referrer: string;
  sessions: number;
}

export interface Ga4Snapshot {
  summary: Ga4Summary;
  topLandingPages: Ga4LandingPage[];
  topExitPages: Ga4ExitPage[];
  trafficSources: Ga4TrafficSource[];
  countries: Ga4Country[];
  devices: Ga4Device[];
  referrers: Ga4Referrer[];
  syncedAt: string;
}

export interface ClaritySnapshot {
  projectId: string | null;
  heatmapUrl: string | null;
  recordingsUrl: string | null;
  deadClicks: number;
  quickBacks: number;
  rageClicks: number;
  averageScrollDepth: number;
  scrollDepthByPage: Array<{ page: string; depth: number }>;
  mostInteractedPages: Array<{ page: string; interactions: number }>;
  syncedAt: string;
}

export interface PageTrafficTrend {
  path: string;
  articleId: string | null;
  articleTitle: string | null;
  currentClicks: number;
  previousClicks: number;
  changePercent: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface LowCtrOpportunity {
  path: string;
  articleId: string | null;
  articleTitle: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  suggestions: string[];
}

export interface LowPositionOpportunity {
  path: string;
  articleId: string | null;
  articleTitle: string | null;
  impressions: number;
  position: number;
  suggestions: string[];
}

export interface ArticleSeoMetrics {
  articleId: string;
  title: string;
  slug: string;
  type: string;
  organicClicks: number;
  impressions: number;
  averagePosition: number | null;
  ctr: number;
  trafficTrend: "rising" | "falling" | "stable";
  trafficChangePercent: number;
  seoScore: number;
  entityCount: number;
  internalLinkCount: number;
}

export interface InsightsDashboardData {
  configured: boolean;
  integrationsConfigured: {
    searchConsole: boolean;
    analytics: boolean;
    clarity: boolean;
  };
  lastSync: {
    searchConsole: string | null;
    analytics: string | null;
    clarity: string | null;
  };
  googleHealth: {
    indexed: number;
    excluded: number;
    errors: number;
    sitemapStatus: GscSummary["sitemapStatus"];
  };
  traffic: {
    users: number;
    sessions: number;
    organic: number;
    referral: number;
    direct: number;
  };
  searchPerformance: {
    impressions: number;
    clicks: number;
    ctr: number;
    averagePosition: number;
  };
  topPerformingPages: GscPageMetric[];
  pagesLosingTraffic: PageTrafficTrend[];
  pagesRising: PageTrafficTrend[];
  lowCtrOpportunities: LowCtrOpportunity[];
  lowPositionOpportunities: LowPositionOpportunity[];
  crawlIssues: GscCrawlIssue[];
  weeklySummary: string | null;
  articleMetrics: ArticleSeoMetrics[];
}
