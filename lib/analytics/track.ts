"use server";

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
  await trackEvent("search_query", { query, result_count: resultCount });
}

export async function trackEntityView(entityKind: string, slug: string): Promise<void> {
  await trackEvent("entity_view", { entity_kind: entityKind, slug });
}

export async function trackRelatedLinkClick(
  sourceEntity: string,
  targetHref: string,
  linkType: string
): Promise<void> {
  await trackEvent("related_link_click", {
    source_entity: sourceEntity,
    target_href: targetHref,
    link_type: linkType,
  });
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

export async function trackTrackerView(categorySlug?: string): Promise<void> {
  await trackEvent("tracker_view", { category_slug: categorySlug });
}

export async function trackItemCompleted(
  itemId: string,
  categoryId: string,
  categorySlug: string
): Promise<void> {
  await trackEvent("item_completed", {
    item_id: itemId,
    category_id: categoryId,
    category_slug: categorySlug,
  });
}

export async function trackCategoryCompleted(
  categoryId: string,
  categorySlug: string,
  percentage: number
): Promise<void> {
  await trackEvent("category_completed", {
    category_id: categoryId,
    category_slug: categorySlug,
    percentage,
  });
}

export async function trackOverallCompletionUpdated(
  percentage: number,
  completedCount: number,
  totalCount: number
): Promise<void> {
  await trackEvent("overall_completion_updated", {
    percentage,
    completed_count: completedCount,
    total_count: totalCount,
  });
}
