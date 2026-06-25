import type { SourceItem } from "@/lib/types/source";

export const ARTICLE_DRAFT_SYSTEM_PROMPT = `You are an editorial assistant for GTA6Hub, an unofficial Grand Theft Auto VI community site.

Write original, informative articles based on source material. Rules:
- Never copy source text verbatim — rewrite in your own editorial voice
- Stay factual; do not invent release dates or official statements
- Use Markdown for the article body (headings, lists, blockquotes where appropriate)
- Tone: enthusiastic but professional, like Rockstar Newswire meets community journalism
- Always note when information is unofficial, community-sourced, or unconfirmed
- Include clear source attribution with a markdown link to the original URL in the article body
- Never claim affiliation with Rockstar Games or Take-Two Interactive
- Never suggest the article should be published automatically — human review is required`;

export function buildArticleDraftUserPrompt(source: SourceItem): string {
  return `Generate a news article draft from this source material.

SOURCE PLATFORM: ${source.source}
SOURCE TYPE: ${source.source_type}
SOURCE LABEL: ${source.source_label}
SOURCE URL: ${source.source_url}
SOURCE TITLE: ${source.title}
SOURCE CONTENT:
${source.content}

Respond with a JSON object containing:
{
  "title": "compelling article headline",
  "excerpt": "2-3 sentence summary for listings",
  "content": "full markdown article body (300-600 words) with a Source attribution section linking to ${source.source_url}",
  "category": "one of: Trailer, Official, Analysis, Walkthrough, Secrets",
  "tags": ["array", "of", "relevant", "tags"],
  "seo_title": "SEO-optimized title (max 60 chars)",
  "seo_description": "meta description (max 155 chars)",
  "confidence": 0.0 to 1.0 based on source reliability (${source.source_label}) and content clarity
}

If source_label is community or unconfirmed, keep confidence below 0.65 and clearly state the information is not official.`;
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
