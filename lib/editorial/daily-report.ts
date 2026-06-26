/**
 * Editorial daily report — ONE OpenAI request per UTC day.
 *
 * Cost target: < $0.50/day (gpt-4o-mini, max_tokens: 600).
 * Cached via unstable_cache (24h revalidate) so repeat dashboard visits
 * do not trigger additional API calls. Use "Refresh Report" to bypass cache.
 */

import { unstable_cache } from "next/cache";
import { createChatCompletion, isOpenAiConfigured } from "@/lib/ai/openai-client";
import {
  buildEditorialReportSnapshot,
  loadEditorialDashboardData,
} from "@/lib/editorial/dashboard-data";
import {
  EDITORIAL_DAILY_REPORT_SYSTEM,
  buildEditorialDailyReportUserPrompt,
} from "@/lib/ai/prompts/editorial-daily-report";
import type { DailyReportResult, EditorialReportSnapshot } from "@/lib/editorial/types";

function todayCacheKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function callOpenAiForReport(
  snapshot: Record<string, unknown>
): Promise<string> {
  return createChatCompletion({
    messages: [
      { role: "system", content: EDITORIAL_DAILY_REPORT_SYSTEM },
      {
        role: "user",
        content: buildEditorialDailyReportUserPrompt(snapshot),
      },
    ],
    temperature: 0.4,
    max_tokens: 600,
    errorPrefix: "OpenAI report failed",
    feature: "daily_report",
  });
}

function fallbackReport(snapshot: EditorialReportSnapshot): string {
  const s = snapshot.summary;
  return `Good morning ${snapshot.adminName}.

**Yesterday**
- ${s.newRockstarNews} new Rockstar Newswire items
- ${s.newVideos} new videos
- ${s.redditDiscussions} Reddit discussions ingested
- ${s.newAiDrafts} new AI drafts
- ${s.draftsWaitingReview} drafts awaiting review
- ${s.publishedToday} articles published
- ${s.articlesUpdatedToday} articles updated

**Recommendation**
- **Publish:** Review pending drafts in /admin/drafts
- **Update:** ${snapshot.topOutdated[0] ?? "No outdated pages flagged"}
- **Generate:** ${snapshot.topOpportunities[0]?.title ?? "Check content opportunities on the dashboard"}

*Configure OPENAI_API_KEY for an AI-written morning briefing.*`;
}

async function resolveSnapshot(
  snapshot?: EditorialReportSnapshot
): Promise<EditorialReportSnapshot> {
  if (snapshot) return snapshot;
  const data = await loadEditorialDashboardData();
  return buildEditorialReportSnapshot(data);
}

async function generateFreshReport(
  snapshot?: EditorialReportSnapshot
): Promise<DailyReportResult> {
  const resolved = await resolveSnapshot(snapshot);
  const generatedAt = new Date().toISOString();

  if (!isOpenAiConfigured()) {
    return {
      markdown: fallbackReport(resolved),
      generatedAt,
      cached: false,
    };
  }

  try {
    const markdown = await callOpenAiForReport(
      resolved as unknown as Record<string, unknown>
    );
    return { markdown, generatedAt, cached: false };
  } catch (err) {
    return {
      markdown: fallbackReport(resolved),
      generatedAt,
      cached: false,
      error: err instanceof Error ? err.message : "Report generation failed",
    };
  }
}

export async function getEditorialDailyReport(
  options: { bypassCache?: boolean; snapshot?: EditorialReportSnapshot } = {}
): Promise<DailyReportResult> {
  if (options.bypassCache) {
    return generateFreshReport(options.snapshot);
  }

  const dateKey = todayCacheKey();
  const snapshot = options.snapshot;

  const cached = unstable_cache(
    async () => generateFreshReport(snapshot),
    ["editorial-daily-report", dateKey, snapshot ? "with-snapshot" : "standalone"],
    {
      revalidate: 86400,
      tags: [editorialReportCacheTag()],
    }
  );

  const result = await cached();
  return { ...result, cached: true };
}

export function editorialReportCacheTag(): string {
  return `editorial-daily-report-${todayCacheKey()}`;
}
