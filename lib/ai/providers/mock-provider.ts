import type { SourceItem } from "@/lib/types/source";
import type { AiGeneratedArticle } from "@/lib/types/ai-draft";
import { slugify } from "@/lib/utils/article";
import { SOURCE_PLATFORM_LABELS } from "@/lib/types/source";

/**
 * Mock AI provider — generates structured drafts without an external API.
 * Replace with OpenAI/Anthropic provider when API keys are configured.
 */
export function generateMockDraft(source: SourceItem): AiGeneratedArticle {
  const platformLabel = SOURCE_PLATFORM_LABELS[source.source];
  const category = inferCategory(source);
  const tags = inferTags(source);
  const confidence = inferConfidence(source);

  const title = buildTitle(source);
  const excerpt = buildExcerpt(source, platformLabel);
  const content = buildContent(source, platformLabel);
  const seo_title = `${title} | GTA6Hub`.slice(0, 60);
  const seo_description = excerpt.slice(0, 155);

  return {
    title,
    excerpt,
    content,
    category,
    tags,
    seo_title,
    seo_description,
    confidence,
  };
}

function inferCategory(source: SourceItem): string {
  switch (source.source) {
    case "rockstar_newswire":
      return source.title.toLowerCase().includes("trailer") ? "Trailer" : "Official";
    case "rockstar_youtube":
      return "Trailer";
    case "reddit":
      return "Analysis";
    case "x":
      return "Official";
    default:
      return "Analysis";
  }
}

function inferTags(source: SourceItem): string[] {
  const text = `${source.title} ${source.content}`.toLowerCase();
  const tags: string[] = [];

  if (text.includes("lucia")) tags.push("Lucia");
  if (text.includes("jason")) tags.push("Jason");
  if (text.includes("vice city")) tags.push("Vice City");
  if (text.includes("leonida")) tags.push("Leonida");
  if (text.includes("trailer")) tags.push("Trailer 2");
  if (text.includes("map")) tags.push("Map");

  return tags.length > 0 ? tags : ["Leonida"];
}

function inferConfidence(source: SourceItem): number {
  switch (source.source_label) {
    case "official":
      return source.source === "reddit" ? 0.55 : 0.9;
    case "community":
      return 0.55;
    case "rumor":
      return 0.4;
    case "unconfirmed":
      return 0.5;
    default:
      break;
  }

  switch (source.source) {
    case "rockstar_newswire":
      return 0.92;
    case "rockstar_youtube":
      return 0.9;
    case "x":
      return 0.85;
    case "reddit":
      return 0.55;
    default:
      return 0.5;
  }
}

function buildTitle(source: SourceItem): string {
  const base = source.title.replace(/^Rockstar Games on X: /, "");
  if (base.length <= 80) return base;
  return base.slice(0, 77) + "...";
}

function buildExcerpt(source: SourceItem, platformLabel: string): string {
  return `Based on ${platformLabel}: ${source.content.slice(0, 200).trim()}${source.content.length > 200 ? "..." : ""}`;
}

function buildContent(source: SourceItem, platformLabel: string): string {
  const slug = slugify(source.title);
  const labelNote =
    source.source_label === "official"
      ? "official Rockstar channel"
      : `${source.source_label} — verify against official channels`;

  return `# ${source.title}

*Source: [${platformLabel}](${source.source_url}) (${source.source_label})*

## Summary

${source.content}

## What This Means for GTA VI

This development adds to the growing picture of Leonida ahead of launch. Vice City remains the focal point, with community interest around map scale, protagonist dynamics, and Rockstar's next-gen visual direction.

## Key Takeaways

- Information sourced from **${platformLabel}** (${labelNote})
- GTA6Hub provides editorial coverage; we are not affiliated with Rockstar Games
- More updates expected as Rockstar reveals additional material

## What's Next

We'll continue tracking this story and update our [news hub](/news) as official details emerge.

---
*Draft generated from source \`${slug}\`. Requires human review before publishing.*`;
}
