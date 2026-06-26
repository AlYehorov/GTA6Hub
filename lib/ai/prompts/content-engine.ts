import type { SourceItem } from "@/lib/types/source";
import type { KgEntity } from "@/lib/knowledge-graph/types";

export const CONTENT_PLAN_SYSTEM_PROMPT = `You are the editorial planning assistant for GTA6Hub (GTAVIHub.gg), an unofficial GTA VI / GTA 6 community newsroom.

Generate a CONTENT PLAN only — not full articles. One cheap JSON response with 5–10 article ideas from a single source.

Rules:
- Never invent leaks, release dates, or Rockstar quotes not in the source
- Prefer ideas that link to known GTA VI entities (characters, locations, vehicles)
- Suggest updates to existing entity pages when the source mentions them
- Mark rumor/community sources with lower priority
- Use content_type from: news_summary, trailer_breakdown, character_update, vehicle_list_update, location_update, faq_article, theory_roundup, timeline_update, entity_page_update, analysis
- search_intent: informational, commercial, navigational, or news
- priority: critical, high, medium, low
- estimated_value: one sentence on traffic/editorial value`;

export function buildContentPlanUserPrompt(input: {
  source: SourceItem;
  entities: KgEntity[];
  weakEntityHints: string[];
}): string {
  const entityList = input.entities
    .map((e) => `- ${e.kind}:${e.slug} (${e.title})`)
    .join("\n");

  const weak = input.weakEntityHints.length
    ? `\nWeak/missing entity coverage to prioritize:\n${input.weakEntityHints.join("\n")}`
    : "";

  return `Create a content plan from this source.

SOURCE PLATFORM: ${input.source.source}
SOURCE LABEL: ${input.source.source_label}
SOURCE URL: ${input.source.source_url}
TITLE: ${input.source.title}
CONTENT:
${input.source.content}

EXTRACTED ENTITIES:
${entityList || "(none)"}
${weak}

Respond with JSON:
{
  "ideas": [
    {
      "idea_key": "kebab-case-unique-key",
      "title": "article idea title",
      "content_type": "news_summary | trailer_breakdown | ...",
      "target_keyword": "primary SEO keyword",
      "category": "Trailer | Official | Analysis | Walkthrough | Secrets",
      "search_intent": "informational",
      "entity_slugs": ["kind:slug"],
      "internal_link_targets": ["/characters/lucia"],
      "estimated_value": "why this matters",
      "priority": "high"
    }
  ]
}

Return 5–10 ideas. No full article bodies.`;
}

export const CONTENT_PACK_DRAFT_SYSTEM_PROMPT = `You are an editorial writer for GTA6Hub (GTAVIHub.gg), unofficial GTA VI newsroom.

Write ONE article draft from a planned idea + source material.

Rules:
- Separate CONFIRMED FACTS from SPECULATION clearly (use ## Confirmed and ## Speculation sections when needed)
- Cite official source with markdown link — never copy source text verbatim
- No fake leaks, invented features, or fabricated Rockstar statements
- No copyrighted song lyrics
- Use GTA 6 / GTA VI naturally
- Include ## FAQ with 3–5 Q&As
- Include ## Related topics with internal link paths only (e.g. /characters/lucia)
- Human review required — never imply auto-publish
- For rumor/unconfirmed sources, keep speculation clearly labeled and confidence low`;

export function buildContentPackDraftUserPrompt(input: {
  source: SourceItem;
  idea: {
    title: string;
    content_type: string;
    target_keyword: string;
    category: string;
    search_intent: string;
    internal_link_targets: string[];
    entity_slugs: string[];
  };
  entities: KgEntity[];
}): string {
  return `Write a full article draft for this planned idea.

IDEA: ${input.idea.title}
CONTENT TYPE: ${input.idea.content_type}
TARGET KEYWORD: ${input.idea.target_keyword}
CATEGORY: ${input.idea.category}
SEARCH INTENT: ${input.idea.search_intent}
SUGGESTED INTERNAL LINKS: ${input.idea.internal_link_targets.join(", ")}
ENTITY TARGETS: ${input.idea.entity_slugs.join(", ")}

SOURCE PLATFORM: ${input.source.source}
SOURCE LABEL: ${input.source.source_label}
SOURCE URL: ${input.source.source_url}
SOURCE TITLE: ${input.source.title}
SOURCE CONTENT:
${input.source.content}

ENTITIES FOR CONTEXT:
${input.entities.map((e) => `- ${e.kind}:${e.slug} — ${e.title}`).join("\n")}

Respond with JSON:
{
  "title": "headline",
  "slug": "url-slug",
  "excerpt": "2-3 sentences",
  "content": "full markdown body with FAQ and source attribution",
  "faq": [{"question": "...", "answer": "..."}],
  "seo_title": "max 60 chars",
  "seo_description": "max 155 chars",
  "related_entity_slugs": ["character:lucia"],
  "internal_link_suggestions": ["/characters/lucia"],
  "confirmed_facts": ["bullet facts from source"],
  "speculation_notes": ["only if applicable"],
  "source_attribution": "markdown link line",
  "confidence": 0.0-1.0,
  "category": "string",
  "tags": ["tag1"]
}`;
}
