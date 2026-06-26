import { createChatCompletion, isOpenAiConfigured } from "@/lib/ai/openai-client";
import {
  SEO_AI_EDITOR_SYSTEM,
  buildSeoAiEditorUserPrompt,
} from "@/lib/ai/prompts/seo-ai-editor";
import {
  SEO_WEEKLY_REPORT_SYSTEM,
  buildSeoWeeklyReportUserPrompt,
} from "@/lib/ai/prompts/seo-weekly-report";
import { fetchArticleForAiEditor } from "@/lib/seo/queries";
import {
  getImproveReasons,
  scoreSeoArticle,
} from "@/lib/seo/scoring";
import type { AiEditorResult, WeeklyReportInput, WeeklySeoReportResult } from "@/lib/seo/types";

export async function runSeoAiEditor(
  articleId: string
): Promise<{ success: boolean; result?: AiEditorResult; error?: string }> {
  if (!isOpenAiConfigured()) {
    return { success: false, error: "OPENAI_API_KEY is not configured" };
  }

  const article = await fetchArticleForAiEditor(articleId);
  if (!article) {
    return { success: false, error: "Article not found" };
  }

  const scored = scoreSeoArticle(article);
  const improveReasons = getImproveReasons(scored);

  try {
    const content = await createChatCompletion({
      messages: [
        { role: "system", content: SEO_AI_EDITOR_SYSTEM },
        {
          role: "user",
          content: buildSeoAiEditorUserPrompt({
            title: article.title,
            seo_title: article.seo_title,
            seo_description: article.seo_description,
            excerpt: article.excerpt,
            content: article.content,
            category: article.category,
            score: scored.score,
            improveReasons,
          }),
        },
      ],
      temperature: 0.5,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      errorPrefix: "SEO AI Editor failed",
      feature: "seo_ai_editor",
    });

    const parsed = JSON.parse(content) as Partial<AiEditorResult>;
    const result: AiEditorResult = {
      seo_title: String(parsed.seo_title ?? article.seo_title ?? article.title).slice(0, 60),
      seo_description: String(
        parsed.seo_description ?? article.seo_description ?? article.excerpt ?? ""
      ).slice(0, 155),
      faq_markdown: String(parsed.faq_markdown ?? ""),
      internal_link_suggestions: Array.isArray(parsed.internal_link_suggestions)
        ? parsed.internal_link_suggestions.filter((s): s is string => typeof s === "string")
        : [],
      notes: String(parsed.notes ?? ""),
    };

    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "AI Editor failed",
    };
  }
}

function fallbackWeeklyReport(snapshot: WeeklyReportInput): string {
  const weakest = [...snapshot.inventory]
    .filter((a) => a.status === "published")
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const winners = [...snapshot.inventory]
    .filter((a) => a.status === "published")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return `## Weekly SEO Report

### Biggest Winners
${winners.map((a) => `- **${a.title}** (${a.score}/100)`).join("\n") || "- None"}

### Weakest Pages
${weakest.map((a) => `- **${a.title}** (${a.score}/100)`).join("\n") || "- None"}

### Missing Entity Coverage
${snapshot.coverage
  .filter((c) => c.percent < 50)
  .map((c) => `- ${c.label}: ${c.percent}%`)
  .join("\n") || "- All categories above 50%"}

### Pages to Update
${snapshot.freshnessFlags.map((f) => `- ${f.title} (${f.daysSinceUpdate}d old)`).join("\n") || "- None flagged"}

### Pages to Merge
${snapshot.cannibalization.map((c) => `- "${c.articleATitle}" ↔ "${c.articleBTitle}"`).join("\n") || "- None detected"}

### Traffic Opportunities
${snapshot.keywordOpportunities.slice(0, 5).map((k) => `- ${k.phrase}`).join("\n") || "- None"}

*Configure OPENAI_API_KEY for an AI-written weekly report.*`;
}

/** On-demand only — never called on page load. Budget: part of $5/month cap. */
export async function generateWeeklySeoReport(
  snapshot: WeeklyReportInput
): Promise<WeeklySeoReportResult> {
  const generatedAt = new Date().toISOString();

  if (!isOpenAiConfigured()) {
    return {
      markdown: fallbackWeeklyReport(snapshot),
      generatedAt,
    };
  }

  try {
    const compact = {
      topWinners: snapshot.inventory
        .filter((a) => a.status === "published")
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((a) => ({ title: a.title, score: a.score })),
      weakest: snapshot.improveQueue.slice(0, 8),
      coverage: snapshot.coverage,
      freshness: snapshot.freshnessFlags.slice(0, 8),
      mergeCandidates: snapshot.cannibalization.slice(0, 6),
      keywords: snapshot.keywordOpportunities.slice(0, 10),
      brokenLinkCount: snapshot.brokenLinks.length,
    };

    const markdown = await createChatCompletion({
      messages: [
        { role: "system", content: SEO_WEEKLY_REPORT_SYSTEM },
        {
          role: "user",
          content: buildSeoWeeklyReportUserPrompt(compact as unknown as Record<string, unknown>),
        },
      ],
      temperature: 0.4,
      max_tokens: 900,
      errorPrefix: "Weekly SEO report failed",
      feature: "weekly_seo_report",
    });

    return { markdown, generatedAt };
  } catch (err) {
    return {
      markdown: fallbackWeeklyReport(snapshot),
      generatedAt,
      error: err instanceof Error ? err.message : "Report generation failed",
    };
  }
}
