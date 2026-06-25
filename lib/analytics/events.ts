export type AnalyticsEventName =
  | "article_view"
  | "search"
  | "draft_approved"
  | "draft_rejected"
  | "draft_published"
  | "tracker_view"
  | "item_completed"
  | "category_completed"
  | "overall_completion_updated";

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

export type AnalyticsEventPayload =
  | ArticleViewPayload
  | SearchPayload
  | DraftActionPayload
  | DraftPublishedPayload
  | TrackerViewPayload
  | ItemCompletedPayload
  | CategoryCompletedPayload
  | OverallCompletionPayload;

export interface AnalyticsEvent<T extends AnalyticsEventName = AnalyticsEventName> {
  event_name: T;
  payload: AnalyticsEventPayload;
  created_at?: string;
}
