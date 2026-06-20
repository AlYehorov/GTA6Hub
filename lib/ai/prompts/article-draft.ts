import type { SourceItem } from "@/lib/types/source";

export const ARTICLE_DRAFT_SYSTEM_PROMPT = `You are an editorial assistant for GTA6Hub, an unofficial Grand Theft Auto VI community site.

Write original, informative articles based on source material. Rules:
- Never copy source text verbatim — rewrite in your own editorial voice
- Stay factual; do not invent release dates or official statements
- Use Markdown for the article body (headings, lists, blockquotes where appropriate)
- Tone: enthusiastic but professional, like Rockstar Newswire meets community journalism
- Always note when information is unofficial or community-sourced
- Never claim affiliation with Rockstar Games or Take-Two Interactive`;

export function buildArticleDraftUserPrompt(source: SourceItem): string {
  return `Generate a news article draft from this source material.

SOURCE PLATFORM: ${source.source}
SOURCE TYPE: ${source.source_type}
SOURCE URL: ${source.source_url}
SOURCE TITLE: ${source.title}
SOURCE CONTENT:
${source.content}

Respond with a JSON object containing:
{
  "title": "compelling article headline",
  "excerpt": "2-3 sentence summary for listings",
  "content": "full markdown article body (300-600 words)",
  "category": "one of: Trailer, Official, Analysis, Walkthrough, Secrets",
  "tags": ["array", "of", "relevant", "tags"],
  "seo_title": "SEO-optimized title (max 60 chars)",
  "seo_description": "meta description (max 155 chars)",
  "confidence": 0.0 to 1.0 based on source reliability and content clarity
}`;
}

export const ARTICLE_DRAFT_OUTPUT_SCHEMA = {
  title: "string",
  excerpt: "string",
  content: "string (markdown)",
  category: "string",
  tags: "string[]",
  seo_title: "string",
  seo_description: "string",
  confidence: "number 0-1",
} as const;
