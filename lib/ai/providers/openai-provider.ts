import type { SourceItem } from "@/lib/types/source";
import type { AiGeneratedArticle } from "@/lib/types/ai-draft";
import {
  createChatCompletion,
  isOpenAiConfigured,
} from "@/lib/ai/openai-client";
import {
  ARTICLE_DRAFT_SYSTEM_PROMPT,
  buildArticleDraftUserPrompt,
} from "@/lib/ai/prompts/article-draft";

export { isOpenAiConfigured };

export async function generateOpenAiDraft(source: SourceItem): Promise<AiGeneratedArticle> {
  const content = await createChatCompletion({
    messages: [
      { role: "system", content: ARTICLE_DRAFT_SYSTEM_PROMPT },
      { role: "user", content: buildArticleDraftUserPrompt(source) },
    ],
    temperature: 0.6,
    response_format: { type: "json_object" },
    errorPrefix: "OpenAI request failed",
    feature: "article_draft",
  });

  const parsed = JSON.parse(content) as Partial<AiGeneratedArticle> & { tags?: string[] };

  return normalizeGeneratedArticle(parsed, source);
}

function normalizeGeneratedArticle(
  parsed: Partial<AiGeneratedArticle> & { tags?: string[] },
  source: SourceItem
): AiGeneratedArticle {
  const title = parsed.title?.trim() || source.title;
  const excerpt = parsed.excerpt?.trim() || `Coverage based on ${source.title}.`;
  const body = ensureSourceAttribution(parsed.content?.trim() || excerpt, source);
  const category = parsed.category?.trim() || "Analysis";
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t): t is string => typeof t === "string")
    : [];
  const seo_title = (parsed.seo_title?.trim() || `${title} | GTA6Hub`).slice(0, 60);
  const seo_description = (parsed.seo_description?.trim() || excerpt).slice(0, 155);
  const confidence = clampConfidence(parsed.confidence, source);

  return {
    title,
    excerpt,
    content: body,
    category,
    tags,
    seo_title,
    seo_description,
    confidence,
  };
}

function ensureSourceAttribution(content: string, source: SourceItem): string {
  const attribution = `*Source: [${source.title}](${source.source_url}) — ${source.source_label}*`;
  if (content.includes(source.source_url)) return content;
  return `${attribution}\n\n${content}`;
}

function clampConfidence(value: unknown, source: SourceItem): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return source.source_label === "official" ? 0.85 : 0.55;
  }
  const capped = source.source_label === "unconfirmed" ? Math.min(num, 0.65) : num;
  return Math.max(0, Math.min(1, capped));
}
