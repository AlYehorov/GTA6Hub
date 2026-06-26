import type { EditorialOpportunity } from "@/lib/opportunity-engine/types";
import type { SourceItem } from "@/lib/types/source";
import type { Video } from "@/lib/types/video";
import type { KgEntity } from "@/lib/knowledge-graph/types";
import type { ArticleSeoInput } from "@/lib/editorial/types";

export const OPPORTUNITY_ARTICLE_SYSTEM_PROMPT = `You are the Editor-in-Chief writer for GTA6Hub (GTAVIHub.gg), an unofficial GTA VI community newsroom.

Write ONE high-quality article from a curated editorial opportunity — not from a single raw source.

Rules:
- Synthesize clustered sources — never treat one Reddit post as the whole story
- Separate CONFIRMED FACTS from SPECULATION clearly (## Confirmed / ## Speculation)
- Cite official sources with markdown links — never copy text verbatim
- No fake leaks, invented features, or fabricated Rockstar statements
- No copyrighted song lyrics
- Use GTA 6 / GTA VI naturally
- Include ## FAQ with 3–5 Q&As
- Include ## Related topics with internal link paths only
- If improving an existing article, focus on what is new since last update
- Human review required — never imply auto-publish
- For low-confidence community angles, label speculation clearly`;

export function buildOpportunityArticleUserPrompt(input: {
  opportunity: EditorialOpportunity;
  sources: SourceItem[];
  videos: Video[];
  entities: KgEntity[];
  existingArticle: ArticleSeoInput | null;
  internalLinks: string[];
}): string {
  const sourceBlock = input.sources
    .map(
      (s) =>
        `- [${s.source}] ${s.title} (${s.source_label})\n  URL: ${s.source_url}\n  Excerpt: ${s.content.slice(0, 400)}`
    )
    .join("\n");

  const videoBlock = input.videos
    .map(
      (v) =>
        `- [YouTube] ${v.title}\n  URL: ${v.source_url}\n  ${v.description.slice(0, 300)}`
    )
    .join("\n");

  const entityBlock = input.entities
    .map((e) => `- ${e.kind}:${e.slug} — ${e.title}`)
    .join("\n");

  const improveBlock = input.existingArticle
    ? `EXISTING ARTICLE TO IMPROVE:
Title: ${input.existingArticle.title}
Slug: ${input.existingArticle.slug}
Current excerpt: ${input.existingArticle.excerpt ?? ""}
`
    : "No existing article — create new.";

  return `Write one article for this editorial opportunity.

OPPORTUNITY TITLE: ${input.opportunity.title}
SUMMARY: ${input.opportunity.summary}
ACTION: ${input.opportunity.action === "improve" ? "Improve existing article" : "Create new article"}
ARTICLE TYPE: ${input.opportunity.articleType}
CONTENT TYPE: ${input.opportunity.contentType}
TARGET KEYWORD: ${input.opportunity.targetKeyword}
CONFIDENCE: ${input.opportunity.confidence}
TRAFFIC ESTIMATE: ${input.opportunity.trafficEstimate}

${improveBlock}

CLUSTERED SOURCES (${input.sources.length}):
${sourceBlock || "(none)"}

VIDEOS (${input.videos.length}):
${videoBlock || "(none)"}

KNOWLEDGE GRAPH ENTITIES:
${entityBlock || "(none)"}

INTERNAL LINK TARGETS:
${input.internalLinks.join(", ") || "(suggest from entities)"}

Respond with JSON:
{
  "title": "headline",
  "slug": "url-slug",
  "excerpt": "2-3 sentences",
  "content": "full markdown with FAQ and attribution",
  "faq": [{"question": "...", "answer": "..."}],
  "seo_title": "max 60 chars",
  "seo_description": "max 155 chars",
  "related_entity_slugs": ["character:lucia"],
  "internal_link_suggestions": ["/characters/lucia"],
  "confirmed_facts": ["bullet facts"],
  "speculation_notes": ["if applicable"],
  "source_attribution": "markdown links to sources",
  "confidence": 0.0-1.0,
  "category": "string",
  "tags": ["tag1"]
}`;
}
