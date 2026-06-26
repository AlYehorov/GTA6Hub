import type { SourceItem } from "@/lib/types/source";
import type { KgEntity, RelatedEntity } from "@/lib/knowledge-graph/types";

export type ContentPlanIdeaStatus =
  | "planned"
  | "draft_generated"
  | "ignored"
  | "workflow_sent";

export type ContentPlanStatus = "active" | "completed" | "ignored";

export type ContentPackType =
  | "news_summary"
  | "trailer_breakdown"
  | "character_update"
  | "vehicle_list_update"
  | "location_update"
  | "faq_article"
  | "theory_roundup"
  | "timeline_update"
  | "entity_page_update"
  | "analysis";

export interface ContentPlanIdea {
  id: string;
  content_plan_id: string;
  idea_key: string;
  title: string;
  content_type: string;
  target_keyword: string;
  category: string;
  search_intent: string;
  entity_ids: string[];
  internal_link_targets: string[];
  estimated_value: string;
  priority: "critical" | "high" | "medium" | "low";
  status: ContentPlanIdeaStatus;
  ai_draft_id: string | null;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPlan {
  id: string;
  source_item_id: string | null;
  video_id: string | null;
  status: ContentPlanStatus;
  created_at: string;
  updated_at: string;
  ideas?: ContentPlanIdea[];
}

export interface ContentPlanIdeaInput {
  idea_key: string;
  title: string;
  content_type: string;
  target_keyword: string;
  category: string;
  search_intent: string;
  entity_slugs?: string[];
  internal_link_targets: string[];
  estimated_value: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface SourceQueueItem {
  id: string;
  kind: "source" | "video";
  title: string;
  sourceLabel: string;
  sourcePlatform: string;
  date: string | null;
  url: string;
  processed: boolean;
  entities: RelatedEntity[];
  articleIdeas: string[];
  hasPlan: boolean;
  planId: string | null;
  ideaCount: number;
}

export interface ContentEngineUsageStats {
  plansToday: number;
  draftsToday: number;
  requestsToday: number;
  estimatedCostTodayUsd: number;
  estimatedCostMonthUsd: number;
  monthlyBudgetUsd: number;
  budgetUsedPercent: number;
  overBudgetWarning: boolean;
  plansRemainingToday: number;
  draftsRemainingToday: number;
}

export interface ContentEngineHomeData {
  queue: SourceQueueItem[];
  usage: ContentEngineUsageStats;
  configured: boolean;
  openAiConfigured: boolean;
}

export interface SourceEngineDetailData {
  source: SourceItem | null;
  video: {
    id: string;
    title: string;
    description: string;
    source_url: string;
    published_at: string | null;
    category: string;
  } | null;
  entities: RelatedEntity[];
  kgEntities: KgEntity[];
  plan: ContentPlan | null;
  ideas: ContentPlanIdea[];
  usage: ContentEngineUsageStats;
  configured: boolean;
  openAiConfigured: boolean;
}

import type { JournalismBlock } from "@/lib/ai/journalism/types";

export interface GeneratedPackDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_blocks?: JournalismBlock[];
  faq: Array<{ question: string; answer: string }>;
  seo_title: string;
  seo_description: string;
  seo_og_title?: string;
  seo_twitter_title?: string;
  seo_canonical?: string;
  seo_keywords?: string[];
  related_entity_slugs: string[];
  internal_link_suggestions: string[];
  confirmed_facts: string[];
  speculation_notes: string[];
  source_attribution: string;
  confidence: number;
  category: string;
  tags: string[];
}
