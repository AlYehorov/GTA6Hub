import type { ArticleFactPack } from "@/lib/ai/journalism/fact-pack";
import { kgEntityHref } from "@/lib/knowledge-graph/types";
import type { KgEntityKind } from "@/lib/knowledge-graph/types";
import type {
  EditorArticleJson,
  JournalismArticleJson,
  JournalismBlock,
  JournalismDraftResult,
  JournalismGenerationInput,
  SourceBadge,
} from "@/lib/ai/journalism/types";

function entityHref(kind: string, slug: string): string {
  try {
    return kgEntityHref(kind as KgEntityKind, slug);
  } catch {
    return `/${kind}s/${slug}`;
  }
}

function mapSourceKind(
  platform: string
): "rockstar_newswire" | "reddit" | "youtube" | "community" | "official_trailer" {
  if (platform === "rockstar_newswire") return "rockstar_newswire";
  if (platform === "rockstar_youtube") return "official_trailer";
  if (platform === "reddit") return "reddit";
  if (platform.includes("youtube")) return "youtube";
  return "community";
}

export function editorJsonToJournalismJson(
  editor: EditorArticleJson,
  factPack: ArticleFactPack,
  input: JournalismGenerationInput
): JournalismArticleJson {
  const blocks: JournalismBlock[] = [];

  for (const section of editor.sections ?? []) {
    if (!section.heading?.trim()) continue;
    blocks.push({ type: "heading", level: 2, text: section.heading.trim() });
    for (const paragraph of section.paragraphs ?? []) {
      const text = paragraph.trim();
      if (!text) continue;
      blocks.push({ type: "paragraph", text });
    }
  }

  for (const entity of editor.related_entities ?? []) {
    blocks.push({
      type: "entity",
      kind: entity.kind,
      slug: entity.slug,
      label: entity.label,
    });
  }

  if (editor.faq && editor.faq.length > 0) {
    blocks.push({ type: "heading", level: 2, text: "FAQ" });
    blocks.push({ type: "faq", items: editor.faq });
  }

  if (factPack.relatedArticles.length > 0) {
    blocks.push({ type: "heading", level: 2, text: "Related Coverage" });
    for (const article of factPack.relatedArticles) {
      blocks.push({
        type: "paragraph",
        text: `See our coverage: ${article.title}`,
      });
    }
  }

  blocks.push({ type: "heading", level: 2, text: "Sources" });
  blocks.push({
    type: "sources",
    items: factPack.sourceCards.map((source) => ({
      label: source.label,
      kind: mapSourceKind(source.platform),
      url: source.url,
    })),
  });

  for (const video of factPack.videos) {
    const youtubeId = video.youtubeId;
    if (!youtubeId) continue;
    blocks.push({
      type: "youtube",
      youtube_id: youtubeId,
      title: video.title,
    });
  }

  const badge = mapSourceBadge(input.primarySourceLabel);

  return {
    hero: {
      headline: editor.title?.trim() ?? "GTA 6 Update",
      summary: editor.summary?.trim() ?? "",
      source_badge: badge,
      confidence_label: factPack.hasOfficialFacts ? "High" : "Medium",
    },
    blocks,
    seo: {
      title: (editor.seo?.title ?? editor.title ?? "").slice(0, 60),
      meta_description: (editor.seo?.description ?? editor.summary ?? "").slice(0, 155),
      slug: editor.seo?.slug ?? slugifyTitle(editor.title ?? ""),
      og_title: (editor.seo?.og_title ?? editor.seo?.title ?? editor.title ?? "").slice(0, 60),
      twitter_title: (editor.seo?.twitter_title ?? editor.seo?.title ?? editor.title ?? "").slice(0, 60),
      canonical: editor.seo?.canonical ?? "",
      keywords: editor.seo?.keywords ?? factPack.seo.secondaryKeywords,
      excerpt: editor.summary?.trim() ?? "",
    },
    confidence: editor.confidence ?? (factPack.hasOfficialFacts ? 0.9 : 0.6),
    category: editor.category?.trim() || "Analysis",
    tags: editor.tags ?? [],
  };
}

export function compileJournalismArticle(
  json: JournalismArticleJson,
  input: JournalismGenerationInput
): JournalismDraftResult {
  const blocks = json.blocks ?? [];
  const compiledSections: string[] = [];

  for (const block of blocks) {
    const text = compileBlock(block);
    if (!text) continue;
    compiledSections.push(text);
  }

  const content = compiledSections.join("\n\n").trim();
  const faqBlock = blocks.find((b) => b.type === "faq");
  const faq = faqBlock?.type === "faq" ? faqBlock.items : [];

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
    .filter((b) => b.type === "paragraph")
    .map((b) => b.text)
    .slice(0, 8);

  const speculationNotes = blocks
    .filter((b) => b.type === "paragraph")
    .map((b) => b.text)
    .filter((t) =>
      /community reports|reddit users|according to creators|unverified|not confirmed/i.test(t)
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

export function compileEditorArticle(
  editor: EditorArticleJson,
  factPack: ArticleFactPack,
  input: JournalismGenerationInput
): JournalismDraftResult {
  const journalism = editorJsonToJournalismJson(editor, factPack, input);
  if (input.editorialFocus?.headline) {
    journalism.hero.headline = input.editorialFocus.headline;
    journalism.seo.title = input.editorialFocus.headline.slice(0, 60);
  }
  return compileJournalismArticle(journalism, input);
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
      return block.items.map((item) => `- [${item.label}](${item.url})`).join("\n");
    case "image":
      return `![${block.alt}](${block.url})${block.credit ? `\n*${block.credit}*` : ""}`;
    default:
      return "";
  }
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
  const capped =
    sourceLabel === "unconfirmed" || sourceLabel === "rumor" ? Math.min(base, 0.72) : base;
  return Math.max(0, Math.min(1, capped));
}
