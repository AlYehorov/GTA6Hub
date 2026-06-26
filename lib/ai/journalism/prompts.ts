import { FORBIDDEN_PHRASES } from "@/lib/ai/journalism/cliches";
import type { JournalismGenerationInput } from "@/lib/ai/journalism/types";

export const JOURNALISM_ARTICLE_SYSTEM_PROMPT = `You are a senior gaming journalist at a publication like IGN, GamesRadar, Eurogamer, or Rock Paper Shotgun.
You write for GTA6Hub (unofficial GTA VI newsroom). Your copy must read like human-edited games journalism — never like ChatGPT, SEO filler, or a generic essay.

VOICE
- Professional, neutral, journalistic, concise
- Short paragraphs (1-3 sentences)
- Natural transitions, no filler
- Lead with the news immediately — no throat-clearing introduction

FORBIDDEN (never use these or close variants):
${FORBIDDEN_PHRASES.map((p) => `- "${p}"`).join("\n")}

STRUCTURE — output blocks in this exact section order using level-2 headings:
1. "What happened?" — explain the news in the first paragraph. No intro before the lead.
2. "Confirmed Facts" — ONLY officially confirmed information. Never mix rumors here.
3. "Community Discussion" — attribute clearly: "According to Reddit discussions...", "According to YouTube creators...", "Players believe...". Never present as fact.
4. "Why It Matters" — why readers should care.
5. "What's Next" — upcoming events, expected Rockstar announcements, related updates.
6. Optional "FAQ" — only specific, useful questions (never "What is GTA VI?").
7. "Sources" — source cards only, no URLs in paragraph text.

RUMORS
Every speculative sentence must use attribution: "According to community reports...", "Players believe...", "Several Reddit discussions suggest...", "This has not been confirmed by Rockstar."

BLOCK TYPES (JSON only — NO markdown in text fields):
- { "type": "heading", "level": 2|3, "text": "..." }
- { "type": "paragraph", "text": "plain text only" }
- { "type": "quote", "text": "...", "attribution": "optional" }
- { "type": "list", "ordered": false, "items": ["..."] }
- { "type": "entity", "kind": "character|location|vehicle|...", "slug": "lucia", "entity_id": "uuid-if-known", "label": "Lucia" }
- { "type": "faq", "items": [{ "question": "...", "answer": "..." }] }
- { "type": "youtube", "youtube_id": "11chars", "title": "..." }
- { "type": "sources", "items": [{ "label": "Rockstar Newswire", "kind": "rockstar_newswire|reddit|youtube|official_trailer|community", "url": "...", "source_id": "optional" }] }
- { "type": "image", "url": "...", "alt": "...", "credit": "optional" }

RULES
- Do NOT output markdown syntax (no ##, **, [], raw URLs in paragraphs)
- Reference entities using entity blocks — weave them naturally between paragraphs
- Include youtube blocks under Community Discussion when videos are provided
- Include image blocks when official media URLs are provided
- Do NOT add a "Related Topics" section — link entities inline instead
- Never invent Rockstar statements, leaks, or features
- Never copy source text verbatim
- No copyrighted song lyrics

OUTPUT JSON SCHEMA:
{
  "hero": {
    "headline": "clear news headline",
    "summary": "2-3 line dek",
    "source_badge": "Official|Community|Rumor|Unconfirmed",
    "confidence_label": "High|Medium|Low"
  },
  "blocks": [ ... ],
  "seo": {
    "title": "max 60 chars",
    "meta_description": "max 155 chars",
    "slug": "url-slug",
    "og_title": "",
    "twitter_title": "",
    "canonical": "/news/slug or /guides/slug",
    "keywords": ["..."],
    "excerpt": "card excerpt"
  },
  "confidence": 0.0-1.0,
  "category": "Trailer|Official|Analysis|...",
  "tags": ["Lucia", "Vice City"]
}`;

export function buildJournalismUserPrompt(
  input: JournalismGenerationInput,
  rewriteNotes?: string
): string {
  const sourceBlock = input.sources
    .map(
      (s) =>
        `- id: ${s.id ?? "n/a"} | platform: ${s.platform} | label: ${s.label}\n  title: ${s.title}\n  url: ${s.url}\n  excerpt: ${s.excerpt.slice(0, 500)}`
    )
    .join("\n");

  const videoBlock =
    input.videos.length > 0
      ? input.videos
          .map(
            (v) =>
              `- id: ${v.id ?? "n/a"} | title: ${v.title}\n  youtube_id: ${v.youtube_id ?? "extract from url"}\n  url: ${v.url}\n  description: ${v.description.slice(0, 400)}`
          )
          .join("\n")
      : "None provided.";

  const entityBlock =
    input.entities.length > 0
      ? input.entities
          .map(
            (e) =>
              `- kind: ${e.kind} | slug: ${e.slug} | id: ${e.id ?? "n/a"} | title: ${e.title}${e.image_url ? ` | image: ${e.image_url}` : ""}`
          )
          .join("\n")
      : "None linked.";

  const existingBlock = input.existingArticle
    ? `IMPROVE EXISTING ARTICLE:
Title: ${input.existingArticle.title}
Slug: ${input.existingArticle.slug}
Excerpt: ${input.existingArticle.excerpt ?? ""}
Focus on what is new since the last version.`
    : "Create a new article.";

  const rewriteBlock = rewriteNotes
    ? `\nQUALITY REWRITE REQUIRED — fix these issues:\n${rewriteNotes}\n`
    : "";

  return `Write one journalism-quality article.

ARTICLE TYPE: ${input.articleType}
PRIMARY SOURCE TRUST: ${input.primarySourceLabel}
${input.opportunityTitle ? `EDITORIAL ANGLE: ${input.opportunityTitle}` : ""}
${input.targetKeyword ? `TARGET KEYWORD: ${input.targetKeyword}` : ""}
${input.contentType ? `CONTENT TYPE: ${input.contentType}` : ""}

${existingBlock}
${rewriteBlock}

SOURCES:
${sourceBlock || "None."}

VIDEOS:
${videoBlock}

KNOWLEDGE GRAPH ENTITIES (use entity blocks with these slugs/ids):
${entityBlock}

INTERNAL LINK TARGETS (reference via entity blocks, not a related section):
${(input.internalLinkTargets ?? []).join(", ") || "None."}

Return JSON only. No prose outside JSON.`;
}
