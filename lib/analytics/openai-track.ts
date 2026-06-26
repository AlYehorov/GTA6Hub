"use server";

import { trackEvent } from "@/lib/analytics/track";
import type { AnalyticsEventName } from "@/lib/analytics/events";
import { getOpenAiModel } from "@/lib/ai/openai-client";

const FEATURE_EVENT_MAP: Record<string, AnalyticsEventName> = {
  article_draft: "openai_draft",
  daily_report: "openai_daily_report",
  seo_ai_editor: "openai_seo_editor",
  weekly_seo_report: "openai_weekly_seo_report",
};

export async function trackOpenAiRequest(feature: string): Promise<void> {
  const eventName = FEATURE_EVENT_MAP[feature] ?? "openai_request";
  await trackEvent(eventName, {
    feature,
    model: getOpenAiModel(),
  });
}
