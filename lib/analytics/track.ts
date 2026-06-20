import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsEventPayload,
} from "@/lib/analytics/events";

export async function trackEvent(
  eventName: AnalyticsEventName,
  payload: AnalyticsEventPayload
): Promise<void> {
  const event: AnalyticsEvent = {
    event_name: eventName,
    payload,
    created_at: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", event.event_name, event.payload);
  }

  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  await supabase.from("analytics_events").insert({
    event_name: event.event_name,
    payload: event.payload,
  });
}

export async function trackArticleView(
  articleId: string,
  slug: string,
  type: "news" | "guide"
): Promise<void> {
  await trackEvent("article_view", { article_id: articleId, slug, type });
}

export async function trackSearch(query: string, resultCount: number): Promise<void> {
  await trackEvent("search", { query, result_count: resultCount });
}

export async function trackDraftApproved(draftId: string, source: string): Promise<void> {
  await trackEvent("draft_approved", { draft_id: draftId, source });
}

export async function trackDraftRejected(draftId: string, source: string): Promise<void> {
  await trackEvent("draft_rejected", { draft_id: draftId, source });
}

export async function trackDraftPublished(
  draftId: string,
  source: string,
  articleId: string,
  slug: string
): Promise<void> {
  await trackEvent("draft_published", {
    draft_id: draftId,
    source,
    article_id: articleId,
    slug,
  });
}
