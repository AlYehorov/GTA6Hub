import type { ArticleStatus } from "@/lib/types/article";
import type { SeoEntityKind } from "@/lib/editorial/constants";

export interface SeoArticleRecord {
  id: string;
  title: string;
  slug: string;
  type: "news" | "guide";
  status: ArticleStatus;
  excerpt: string | null;
  content: string;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  video_id: string | null;
  source_url: string | null;
  published_at: string | null;
  updated_at: string;
  category: string | null;
}

export interface SeoScoreBreakdown {
  title: number;
  description: number;
  faq: number;
  internalLinks: number;
  externalSources: number;
  heroImage: number;
  video: number;
  wordCount: number;
  schema: number;
  freshness: number;
}

export interface SeoScoredArticle {
  articleId: string;
  title: string;
  slug: string;
  type: "news" | "guide";
  status: ArticleStatus;
  category: string | null;
  publishedAt: string | null;
  updatedAt: string;
  wordCount: number;
  imageCount: number;
  hasFaq: boolean;
  internalLinkCount: number;
  hasVideo: boolean;
  score: number;
  breakdown: SeoScoreBreakdown;
}

export interface ContentInventoryRow extends SeoScoredArticle {
  seoStatus: "excellent" | "good" | "needs-work" | "critical";
}

export interface ImproveQueueItem {
  articleId: string;
  title: string;
  slug: string;
  type: "news" | "guide";
  score: number;
  reasons: string[];
}

export interface CannibalizationPair {
  articleAId: string;
  articleATitle: string;
  articleBId: string;
  articleBTitle: string;
  similarity: number;
  suggestion: string;
}

export interface KeywordOpportunity {
  id: string;
  phrase: string;
  source: "entity" | "source" | "video" | "pattern";
  category: string;
  rationale: string;
}

export interface EntityCoverageStat {
  kind: SeoEntityKind;
  label: string;
  percent: number;
  publishedEntities: number;
  coveredEntities: number;
  totalEntities: number;
}

export interface BrokenInternalLink {
  articleId: string;
  articleTitle: string;
  href: string;
  lineContext?: string;
}

export interface FreshnessFlag {
  articleId: string;
  title: string;
  slug: string;
  type: "news" | "guide";
  daysSinceUpdate: number;
  newestRockstarSourceTitle: string;
}

export interface AiEditorResult {
  seo_title: string;
  seo_description: string;
  faq_markdown: string;
  internal_link_suggestions: string[];
  notes: string;
}

export interface WeeklySeoReportResult {
  markdown: string;
  generatedAt: string;
  error?: string;
}

export interface SeoIntelligenceData {
  inventory: ContentInventoryRow[];
  improveQueue: ImproveQueueItem[];
  freshnessFlags: FreshnessFlag[];
  cannibalization: CannibalizationPair[];
  keywordOpportunities: KeywordOpportunity[];
  coverage: EntityCoverageStat[];
  brokenLinks: BrokenInternalLink[];
  configured: boolean;
  openAiConfigured: boolean;
}

export interface WeeklyReportInput {
  inventory: ContentInventoryRow[];
  improveQueue: ImproveQueueItem[];
  freshnessFlags: FreshnessFlag[];
  cannibalization: CannibalizationPair[];
  keywordOpportunities: KeywordOpportunity[];
  coverage: EntityCoverageStat[];
  brokenLinks: BrokenInternalLink[];
}
