import { kgEntityHref } from "@/lib/knowledge-graph/types";
import type { KgEntityKind } from "@/lib/knowledge-graph/types";
import type {
  JournalismArticleJson,
  JournalismBlock,
  JournalismDraftResult,
  JournalismGenerationInput,
  SourceBadge,
} from "@/lib/ai/journalism/types";

const SECTION_ORDER = [
  "what happened",
  "confirmed facts",
  "community discussion",
  "why it matters",
  "what's next",
  "faq",
  "sources",
] as const;

function entityHref(kind: string, slug: string): string {
  try {
    return kgEntityHref(kind as KgEntityKind, slug);
  } catch {
    return `/${kind}s/${slug}`;
  }
}

function compileBlock(block: JournalismBlock): string {
  switch (block.type) {
    case "heading":
      return `${"#".repeat(block.level)} ${block.text.trim()}`;
    case "paragraph":
      return block.text.trim();
    case "quote":
      return block.attribution
        ? `> ${block.text.trim()}\n>\n> — ${block.attribution}`
        : `> ${block.text.trim()}`;
    case "list":
      return block.items
        .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
        .join("\n");
    case "entity":
      return `[${block.label}](${entityHref(block.kind, block.slug)})`;
    case "faq":
      return block.items
        .map((item) => `**${item.question.trim()}**\n\n${item.answer.trim()}`)
        .join("\n\n");
    case "youtube":
      return `[Watch: ${block.title}](https://www.youtube.com/watch?v=${block.youtube_id})`;
    case "sources":
      return block.items
        .map((item) => `- [${item.label}](${item.url})`)
        .join("\n");
    case "image":
      return `![${block.alt}](${block.url})${block.credit ? `\n*${block.credit}*` : ""}`;
    default:
      return "";
  }
}

function sortBlocks(blocks: JournalismBlock[]): JournalismBlock[] {
  const sections: Array<{ key: string; blocks: JournalismBlock[] }> = [];
  let current: JournalismBlock[] = [];

  for (const block of blocks) {
    if (block.type === "heading" && block.level === 2) {
      if (current.length > 0) {
        const heading = current.find((b) => b.type === "heading" && b.level === 2);
        const key =
          heading?.type === "heading" ? heading.text.toLowerCase() : `section-${sections.length}`;
        sections.push({ key, blocks: current });
      }
      current = [block];
    } else {
      current.push(block);
    }
  }

  if (current.length > 0) {
    const heading = current.find((b) => b.type === "heading" && b.level === 2);
    const key =
      heading?.type === "heading" ? heading.text.toLowerCase() : `section-${sections.length}`;
    sections.push({ key, blocks: current });
  }

  const ordered: JournalismBlock[] = [];
  const used = new Set<number>();

  for (const sectionName of SECTION_ORDER) {
    for (let i = 0; i < sections.length; i++) {
      if (used.has(i)) continue;
      if (sections[i].key.includes(sectionName)) {
        ordered.push(...sections[i].blocks);
        used.add(i);
      }
    }
  }

  for (let i = 0; i < sections.length; i++) {
    if (!used.has(i)) ordered.push(...sections[i].blocks);
  }

  return ordered.length > 0 ? ordered : blocks;
}

export function compileJournalismArticle(
  json: JournalismArticleJson,
  input: JournalismGenerationInput
): JournalismDraftResult {
  const blocks = sortBlocks(json.blocks ?? []);
  const compiledSections: string[] = [];

  for (const block of blocks) {
    const text = compileBlock(block);
    if (!text) continue;
    if (block.type === "entity") {
      if (compiledSections.length === 0) {
        compiledSections.push(text);
      } else {
        const last = compiledSections.length - 1;
        compiledSections[last] = `${compiledSections[last]}\n\n${text}`;
      }
      continue;
    }
    compiledSections.push(text);
  }

  const content = compiledSections.join("\n\n").trim();
  const faqBlock = blocks.find((b) => b.type === "faq");
  const faq =
    faqBlock?.type === "faq"
      ? faqBlock.items
      : [];

  const entitySlugs = blocks
    .filter((b): b is Extract<JournalismBlock, { type: "entity" }> => b.type === "entity")
    .map((b) => `${b.kind}:${b.slug}`);

  const internalLinks = [
    ...entitySlugs.map((token) => {
      const [kind, slug] = token.split(":");
      return entityHref(kind ?? "character", slug ?? "");
    }),
    ...(input.internalLinkTargets ?? []),
  ];

  const confirmedFacts = blocks
    .filter((b) => b.type === "paragraph" || b.type === "list")
    .map((b) => (b.type === "paragraph" ? b.text : b.items.join("; ")))
    .slice(0, 6);

  const speculationNotes = blocks
    .filter((b) => b.type === "paragraph")
    .map((b) => b.text)
    .filter((t) =>
      /according to (reddit|community|players|youtube)|players believe|has not been confirmed/i.test(
        t
      )
    );

  const sourcesBlock = blocks.find((b) => b.type === "sources");
  const sourceAttribution =
    sourcesBlock?.type === "sources"
      ? sourcesBlock.items.map((s) => s.label).join(" · ")
      : input.sources.map((s) => s.title).slice(0, 3).join(" · ");

  const badge = json.hero?.source_badge ?? mapSourceBadge(input.primarySourceLabel);

  return {
    title: json.hero?.headline?.trim() || json.seo?.title?.trim() || "GTA 6 Update",
    slug: json.seo?.slug?.trim() || slugifyTitle(json.hero?.headline ?? ""),
    excerpt: json.seo?.excerpt?.trim() || json.hero?.summary?.trim() || "",
    content,
    content_blocks: blocks,
    faq,
    seo_title: (json.seo?.title ?? json.hero?.headline ?? "").slice(0, 60),
    seo_description: (json.seo?.meta_description ?? json.hero?.summary ?? "").slice(0, 155),
    seo_og_title: (json.seo?.og_title ?? json.seo?.title ?? "").slice(0, 60),
    seo_twitter_title: (json.seo?.twitter_title ?? json.seo?.title ?? "").slice(0, 60),
    seo_canonical: json.seo?.canonical ?? "",
    seo_keywords: json.seo?.keywords ?? [],
    related_entity_slugs: entitySlugs,
    internal_link_suggestions: [...new Set(internalLinks)],
    confirmed_facts: confirmedFacts,
    speculation_notes: speculationNotes,
    source_attribution: sourceAttribution,
    confidence: clampConfidence(json.confidence, input.primarySourceLabel),
    category: json.category?.trim() || "Analysis",
    tags: Array.isArray(json.tags) ? json.tags.filter(Boolean) : [],
    source_badge: badge,
    confidence_label: json.hero?.confidence_label ?? "Medium",
  };
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function mapSourceBadge(label: string): SourceBadge {
  if (label === "official") return "Official";
  if (label === "rumor") return "Rumor";
  if (label === "unconfirmed") return "Unconfirmed";
  return "Community";
}

function clampConfidence(value: unknown, sourceLabel: string): number {
  const num = typeof value === "number" ? value : Number(value);
  const base = Number.isFinite(num) ? num : sourceLabel === "official" ? 0.92 : 0.6;
  const capped = sourceLabel === "unconfirmed" || sourceLabel === "rumor"
    ? Math.min(base, 0.72)
    : base;
  return Math.max(0, Math.min(1, capped));
}
