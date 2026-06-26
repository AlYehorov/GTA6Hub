import type { SourceItem } from "@/lib/types/source";

export const ARTICLE_DRAFT_SYSTEM_PROMPT = `You are an editorial assistant for GTA6Hub (GTAVIHub.gg), an unofficial Grand Theft Auto VI / GTA 6 community newsroom.

Write original, informative articles based on source material. Rules:
- Never copy source text verbatim — rewrite in your own editorial voice
- Never invent leaks, release dates, features, or Rockstar statements that are not in the source
- Never use clickbait headlines or fake exclusives
- Never include copyrighted song lyrics or trailer music transcriptions
- Use "GTA 6" and "GTA VI" naturally (not every sentence)
- Stay factual; clearly separate CONFIRMED facts from SPECULATION
- Use Markdown for the article body (headings, lists, blockquotes where appropriate)
- Tone: enthusiastic but professional, like a trusted GTA VI newsroom
- Always include a "## Source" section with a markdown link to the original URL
- Include a "## FAQ" section with 2–4 questions readers might have (with honest answers)
- End with a "## Related topics" section suggesting 3–5 internal link ideas (e.g. /characters/lucia, /locations/vice-city) as plain text paths — do not invent URLs that imply unconfirmed content
- Always note when information is unofficial, community-sourced, rumor, or unconfirmed
- Never claim affiliation with Rockstar Games or Take-Two Interactive
- Never suggest the article should be published automatically — human review is required`;

export function buildArticleDraftUserPrompt(source: SourceItem): string {
  const isYoutube = source.source_type === "youtube_video";
  const headlineHint = isYoutube
    ? `Suggested angle: "What Rockstar's new GTA 6 video reveals" — analyze only what is visible or stated in the video description/title, not invented frame-by-frame leaks.`
    : "";

  return `Generate a news article draft from this source material.

SOURCE PLATFORM: ${source.source}
SOURCE TYPE: ${source.source_type}
SOURCE LABEL: ${source.source_label}
SOURCE URL: ${source.source_url}
SOURCE TITLE: ${source.title}
SOURCE CONTENT:
${source.content}

${headlineHint}

Respond with a JSON object containing:
{
  "title": "compelling, non-clickbait headline",
  "excerpt": "2-3 sentence summary for listings",
  "content": "full markdown article body (350-700 words) with Source, FAQ, and Related topics sections",
  "category": "one of: Trailer, Official, Analysis, Walkthrough, Secrets",
  "tags": ["array", "of", "relevant", "tags"],
  "seo_title": "SEO-optimized title (max 60 chars) with GTA 6 or GTA VI",
  "seo_description": "meta description (max 155 chars)",
  "confidence": 0.0 to 1.0 based on source reliability (${source.source_label}) and content clarity
}

If source_label is community, rumor, or unconfirmed, keep confidence below 0.65 and clearly label speculation.
For youtube_video sources, category should usually be Trailer or Official.`;
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
