import type { SourceItem } from "@/lib/types/source";
import type { AiGeneratedArticle } from "@/lib/types/ai-draft";
import {
  ARTICLE_DRAFT_SYSTEM_PROMPT,
  buildArticleDraftUserPrompt,
} from "@/lib/ai/prompts/article-draft";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

export async function generateOpenAiDraft(source: SourceItem): Promise<AiGeneratedArticle> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ARTICLE_DRAFT_SYSTEM_PROMPT },
        { role: "user", content: buildArticleDraftUserPrompt(source) },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

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

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
