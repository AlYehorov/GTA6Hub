import type { SourcePlatform } from "@/lib/types/source";
import type { EditorialFocus } from "@/lib/opportunity-engine/editorial-focus";

export type ConfidenceLevel = "Low" | "Medium" | "High";
export type TrafficLevel = "Low" | "Medium" | "High" | "Very High";
export type OpportunityStatus = "open" | "draft_generated" | "ignored" | "workflow_sent";
export type ArticleAction = "create" | "improve";

export interface OpportunityEntity {
  id: string;
  kind: string;
  slug: string;
  title: string;
  href: string;
}

export interface EditorialOpportunity {
  id: string;
  clusterKey: string;
  title: string;
  summary: string;
  score: number;
  stars: 1 | 2 | 3 | 4 | 5;
  confidence: ConfidenceLevel;
  trafficEstimate: TrafficLevel;
  seoEstimate: TrafficLevel;
  sourceCount: number;
  sourceIds: string[];
  videoIds: string[];
  sourceTypes: Array<"Rockstar" | "YouTube" | "Reddit" | "Newswire" | "Community">;
  entities: OpportunityEntity[];
  relatedArticleIds: string[];
  existingArticleId: string | null;
  existingArticleTitle: string | null;
  existingArticleSlug: string | null;
  action: ArticleAction;
  articleType: "news" | "guide";
  targetKeyword: string;
  internalLinkTargets: string[];
  estimatedReadingMinutes: number;
  estimatedWritingMinutes: number;
  scoringBreakdown: Array<{ signal: string; points: number }>;
  contentType: string;
  status: OpportunityStatus;
  aiDraftId: string | null;
  workspaceId: string | null;
  editorialFocus?: EditorialFocus;
}

export interface BriefingIntake {
  rockstarPosts: number;
  youtubeVideos: number;
  redditDiscussions: number;
  newswireUpdates: number;
  googleNewsPosts: number;
  communityYoutubePosts: number;
  affectedEntities: number;
  outdatedArticles: number;
}

export interface ContentGapItem {
  title: string;
  kind: string;
  slug: string;
  href: string;
  opportunityId: string;
  status: OpportunityStatus;
  aiDraftId: string | null;
}

export interface TrendingKeyword {
  term: string;
  count: number;
}

export interface EditorialRecommendation {
  summary: string;
  publishRockstar: boolean;
  publishCommunity: boolean;
  updateGuidesCount: number;
  trafficGainEstimate: TrafficLevel;
}

export interface EditorBriefingData {
  adminName: string;
  intake: BriefingIntake;
  opportunities: EditorialOpportunity[];
  weeklyGaps: ContentGapItem[];
  trendingKeywords: TrendingKeyword[];
  recommendation: EditorialRecommendation;
  usage: import("@/lib/content-engine/types").ContentEngineUsageStats;
  configured: boolean;
  openAiConfigured: boolean;
}

export interface SourceClusterMember {
  id: string;
  kind: "source" | "video";
  platform: SourcePlatform | "youtube";
  sourceLabel: string;
  title: string;
  content: string;
  url: string;
  publishedAt: string | null;
  isOfficial: boolean;
  isRumor: boolean;
  isSpam: boolean;
  isDuplicate: boolean;
  redditMentionScore: number;
  youtubeViewEstimate: number;
  topicKeys: string[];
}

export interface SourceCluster {
  clusterKey: string;
  title: string;
  topicKeys: string[];
  members: SourceClusterMember[];
}
