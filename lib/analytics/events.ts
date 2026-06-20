export type AnalyticsEventName =
  | "article_view"
  | "search"
  | "draft_approved"
  | "draft_rejected"
  | "draft_published";

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

export type AnalyticsEventPayload =
  | ArticleViewPayload
  | SearchPayload
  | DraftActionPayload
  | DraftPublishedPayload;

export interface AnalyticsEvent<T extends AnalyticsEventName = AnalyticsEventName> {
  event_name: T;
  payload: AnalyticsEventPayload;
  created_at?: string;
}
