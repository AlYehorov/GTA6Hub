export type AnalyticsEventName =
  | "article_view"
  | "search"
  | "draft_approved"
  | "draft_rejected"
  | "draft_published"
  | "tracker_view"
  | "item_completed"
  | "category_completed"
  | "overall_completion_updated"
  | "entity_view"
  | "search_query"
  | "related_link_click"
  | "openai_request"
  | "openai_draft"
  | "openai_daily_report"
  | "openai_seo_editor"
  | "openai_weekly_seo_report";

export interface ArticleViewPayload {
  article_id: string;
  slug: string;
  type: "news" | "guide";
}

export interface SearchPayload {
  query: string;
  result_count: number;
}

export interface DraftActionPayload {
  draft_id: string;
  source: string;
}

export interface DraftPublishedPayload extends DraftActionPayload {
  article_id: string;
  slug: string;
}

export interface TrackerViewPayload {
  category_slug?: string;
}

export interface ItemCompletedPayload {
  item_id: string;
  category_id: string;
  category_slug: string;
}

export interface CategoryCompletedPayload {
  category_id: string;
  category_slug: string;
  percentage: number;
}

export interface OverallCompletionPayload {
  percentage: number;
  completed_count: number;
  total_count: number;
}

export interface EntityViewPayload {
  entity_kind: string;
  slug: string;
}

export interface SearchQueryPayload {
  query: string;
  result_count: number;
}

export interface RelatedLinkClickPayload {
  source_entity: string;
  target_href: string;
  link_type: string;
}

export interface OpenAiRequestPayload {
  feature: string;
  model?: string;
}

export type AnalyticsEventPayload =
  | ArticleViewPayload
  | SearchPayload
  | DraftActionPayload
  | DraftPublishedPayload
  | TrackerViewPayload
  | ItemCompletedPayload
  | CategoryCompletedPayload
  | OverallCompletionPayload
  | EntityViewPayload
  | SearchQueryPayload
  | RelatedLinkClickPayload
  | OpenAiRequestPayload;

export interface AnalyticsEvent<T extends AnalyticsEventName = AnalyticsEventName> {
  event_name: T;
  payload: AnalyticsEventPayload;
  created_at?: string;
}
