import type { GameEntityKind } from "@/lib/types/game-entity";
import type { SeoEntityKind } from "@/lib/editorial/constants";

export interface TodaySummary {
  newRockstarNews: number;
  newVideos: number;
  redditDiscussions: number;
  newAiDrafts: number;
  draftsWaitingReview: number;
  publishedToday: number;
  articlesUpdatedToday: number;
}

export type OpportunityDifficulty = "Easy" | "Medium" | "Hard";

export type OpportunityCategory =
  | "News"
  | "Guide"
  | "Entity"
  | "SEO Gap"
  | "Reddit Trend"
  | "Listicle";

export interface ContentOpportunity {
  id: string;
  title: string;
  stars: 1 | 2 | 3 | 4 | 5;
  estimatedMonthlyTraffic: number;
  difficulty: OpportunityDifficulty;
  category: OpportunityCategory;
  rationale: string;
  sourceItemId?: string;
  entityKind?: GameEntityKind;
  entitySlug?: string;
}

export interface MissingSeoPage {
  kind: SeoEntityKind;
  slug: string;
  title: string;
  reason: "no_entity_page" | "no_article";
  entityHref: string;
}

export interface OutdatedArticle {
  id: string;
  title: string;
  slug: string;
  type: "news" | "guide";
  daysSinceUpdate: number;
  newestRockstarSourceTitle: string;
  newestRockstarSourceDate: string;
}

export interface InternalLinkSuggestion {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  articleType: "news" | "guide";
  suggestedLinks: Array<{
    label: string;
    href: string;
    reason: string;
  }>;
}

export interface SeoHealthItem {
  articleId: string;
  title: string;
  slug: string;
  type: "news" | "guide";
  score: number;
  breakdown: {
    title: number;
    description: number;
    faq: number;
    images: number;
    video: number;
    internalLinks: number;
    schema: number;
    wordCount: number;
    freshness: number;
  };
}

export interface EditorialDashboardData {
  summary: TodaySummary;
  opportunities: ContentOpportunity[];
  missingPages: MissingSeoPage[];
  outdatedArticles: OutdatedArticle[];
  internalLinkSuggestions: InternalLinkSuggestion[];
  weakestSeo: SeoHealthItem[];
  configured: boolean;
  openAiConfigured: boolean;
}

export interface EditorialReportSnapshot {
  adminName: string;
  summary: TodaySummary;
  topOpportunities: Array<{ title: string; stars: number; traffic: number }>;
  missingPageCount: number;
  topMissing: string[];
  outdatedCount: number;
  topOutdated: string[];
  weakestSeo: Array<{ title: string; score: number }>;
  draftsWaiting: number;
}

export interface DailyReportResult {
  markdown: string;
  generatedAt: string;
  cached: boolean;
  error?: string;
}

export interface ArticleSeoInput {
  id: string;
  title: string;
  slug: string;
  type: "news" | "guide";
  excerpt: string | null;
  content: string;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  video_id: string | null;
  published_at: string | null;
  updated_at: string;
}
