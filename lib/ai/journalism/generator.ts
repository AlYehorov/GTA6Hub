import {
  createChatCompletionDetailed,
  isOpenAiConfigured,
} from "@/lib/ai/openai-client";
import { compileJournalismArticle } from "@/lib/ai/journalism/compiler";
import {
  JOURNALISM_ARTICLE_SYSTEM_PROMPT,
  buildJournalismUserPrompt,
} from "@/lib/ai/journalism/prompts";
import {
  formatQualityFailures,
  runQualityCheck,
} from "@/lib/ai/journalism/quality";
import type {
  JournalismArticleJson,
  JournalismDraftResult,
  JournalismGenerationInput,
} from "@/lib/ai/journalism/types";
import type { GeneratedPackDraft } from "@/lib/content-engine/types";
import type { AiGeneratedArticle } from "@/lib/types/ai-draft";
import type { SourceItem } from "@/lib/types/source";
import type { KgEntity } from "@/lib/knowledge-graph/types";
import type { ContentPlanIdea } from "@/lib/content-engine/types";
import type { EditorialOpportunity } from "@/lib/opportunity-engine/types";
import type { Video } from "@/lib/types/video";
import type { ArticleSeoInput } from "@/lib/editorial/types";
import { SOURCE_PLATFORM_LABELS } from "@/lib/types/source";

const MAX_REWRITE_ATTEMPTS = 1;

function extractYoutubeId(url: string): string | undefined {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1];
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

export function buildInputFromSource(
  source: SourceItem,
  entities: KgEntity[] = []
): JournalismGenerationInput {
  return {
    articleType: "news",
    primarySourceLabel: source.source_label,
    sources: [
      {
        id: source.id,
        platform: source.source,
        label: SOURCE_PLATFORM_LABELS[source.source],
        title: source.title,
        url: source.source_url,
        excerpt: source.content,
      },
    ],
    videos: [],
    entities: entities.map((e) => ({
      id: e.id,
      kind: e.kind,
      slug: e.slug,
      title: e.title,
      image_url: e.image_url,
    })),
  };
}

export function buildInputFromPack(
  source: SourceItem,
  idea: ContentPlanIdea,
  entities: KgEntity[]
): JournalismGenerationInput {
  return {
    ...buildInputFromSource(source, entities),
    articleType: idea.category.toLowerCase().includes("guide") ? "guide" : "news",
    targetKeyword: idea.target_keyword,
    contentType: idea.content_type,
    internalLinkTargets: idea.internal_link_targets,
  };
}

export function buildInputFromOpportunity(input: {
  opportunity: EditorialOpportunity;
  sources: SourceItem[];
  videos: Video[];
  entities: KgEntity[];
  existingArticle: ArticleSeoInput | null;
}): JournalismGenerationInput {
  const primaryLabel =
    input.sources.find((s) => s.source_label === "official")?.source_label ??
    input.sources[0]?.source_label ??
    "community";

  return {
    articleType: input.opportunity.articleType,
    primarySourceLabel: primaryLabel,
    opportunityTitle: input.opportunity.title,
    targetKeyword: input.opportunity.targetKeyword,
    contentType: input.opportunity.contentType,
    existingArticle: input.existingArticle
      ? {
          title: input.existingArticle.title,
          slug: input.existingArticle.slug,
          excerpt: input.existingArticle.excerpt,
        }
      : undefined,
    sources: input.sources.map((s) => ({
      id: s.id,
      platform: s.source,
      label: SOURCE_PLATFORM_LABELS[s.source],
      title: s.title,
      url: s.source_url,
      excerpt: s.content,
    })),
    videos: input.videos.map((v) => ({
      id: v.id,
      title: v.title,
      url: v.source_url,
      youtube_id: extractYoutubeId(v.source_url),
      description: v.description,
    })),
    entities: input.entities.map((e) => ({
      id: e.id,
      kind: e.kind,
      slug: e.slug,
      title: e.title,
      image_url: e.image_url,
    })),
    internalLinkTargets: input.opportunity.internalLinkTargets,
  };
}

async function callJournalismModel(
  input: JournalismGenerationInput,
  rewriteNotes?: string
): Promise<{ json: JournalismArticleJson; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const { content, usage } = await createChatCompletionDetailed({
    messages: [
      { role: "system", content: JOURNALISM_ARTICLE_SYSTEM_PROMPT },
      { role: "user", content: buildJournalismUserPrompt(input, rewriteNotes) },
    ],
    temperature: 0.45,
    max_tokens: 3200,
    response_format: { type: "json_object" },
    feature: "journalism_article",
    errorPrefix: "Journalism article generation failed",
  });

  const json = JSON.parse(content) as JournalismArticleJson;
  enrichBlocksFromInput(json, input);
  return { json, usage };
}

function enrichBlocksFromInput(
  json: JournalismArticleJson,
  input: JournalismGenerationInput
): void {
  if (!Array.isArray(json.blocks)) json.blocks = [];

  const hasSources = json.blocks.some((b) => b.type === "sources");
  if (!hasSources && input.sources.length > 0) {
    json.blocks.push({
      type: "sources",
      items: input.sources.map((s) => ({
        label: s.label,
        kind: mapSourceKind(s.platform),
        url: s.url,
        source_id: s.id,
      })),
    });
  }

  const hasYoutube = json.blocks.some((b) => b.type === "youtube");
  if (!hasYoutube) {
    for (const video of input.videos) {
      const youtube_id = video.youtube_id ?? extractYoutubeId(video.url);
      if (!youtube_id) continue;
      json.blocks.push({
        type: "youtube",
        youtube_id,
        title: video.title,
      });
    }
  }

  const hasImage = json.blocks.some((b) => b.type === "image");
  if (!hasImage) {
    const heroImage =
      input.entities.find((e) => e.image_url)?.image_url ??
      input.sources.find((s) => /rockstar|newswire|youtube/i.test(s.platform))?.url;
    if (heroImage && heroImage.startsWith("http")) {
      json.blocks.unshift({
        type: "image",
        url: heroImage,
        alt: input.opportunityTitle ?? input.sources[0]?.title ?? "GTA VI",
        credit: "Rockstar Games",
      });
    }
  }

  if (!json.hero?.source_badge) {
    json.hero = {
      headline: json.hero?.headline ?? "",
      summary: json.hero?.summary ?? "",
      source_badge:
        input.primarySourceLabel === "official"
          ? "Official"
          : input.primarySourceLabel === "rumor"
            ? "Rumor"
            : input.primarySourceLabel === "unconfirmed"
              ? "Unconfirmed"
              : "Community",
      confidence_label: json.hero?.confidence_label ?? "Medium",
    };
  }
}

export async function generateJournalismArticle(
  input: JournalismGenerationInput
): Promise<{
  result: JournalismDraftResult;
  usage: { prompt_tokens: number; completion_tokens: number };
  rewriteCount: number;
}> {
  if (!isOpenAiConfigured()) {
    return {
      result: buildMockJournalismDraft(input),
      usage: { prompt_tokens: 0, completion_tokens: 0 },
      rewriteCount: 0,
    };
  }

  let totalUsage = { prompt_tokens: 0, completion_tokens: 0 };
  let rewriteCount = 0;
  let rewriteNotes: string | undefined;

  for (let attempt = 0; attempt <= MAX_REWRITE_ATTEMPTS; attempt++) {
    const { json, usage } = await callJournalismModel(input, rewriteNotes);
    totalUsage = {
      prompt_tokens: totalUsage.prompt_tokens + usage.prompt_tokens,
      completion_tokens: totalUsage.completion_tokens + usage.completion_tokens,
    };

    const report = runQualityCheck(json);
    if (report.passed) {
      return {
        result: compileJournalismArticle(json, input),
        usage: totalUsage,
        rewriteCount,
      };
    }

    if (attempt >= MAX_REWRITE_ATTEMPTS) {
      return {
        result: compileJournalismArticle(json, input),
        usage: totalUsage,
        rewriteCount,
      };
    }

    rewriteCount += 1;
    rewriteNotes = formatQualityFailures(report.failures);
  }

  return {
    result: buildMockJournalismDraft(input),
    usage: totalUsage,
    rewriteCount,
  };
}

export function journalismResultToPackDraft(
  result: JournalismDraftResult,
  fallback?: { title?: string; slug?: string; excerpt?: string }
): GeneratedPackDraft {
  return {
    title: result.title || fallback?.title || "GTA 6 Update",
    slug: result.slug || fallback?.slug || "gta-6-update",
    excerpt: result.excerpt || fallback?.excerpt || "",
    content: result.content,
    content_blocks: result.content_blocks,
    faq: result.faq,
    seo_title: result.seo_title,
    seo_description: result.seo_description,
    seo_og_title: result.seo_og_title,
    seo_twitter_title: result.seo_twitter_title,
    seo_canonical: result.seo_canonical,
    seo_keywords: result.seo_keywords,
    related_entity_slugs: result.related_entity_slugs,
    internal_link_suggestions: result.internal_link_suggestions,
    confirmed_facts: result.confirmed_facts,
    speculation_notes: result.speculation_notes,
    source_attribution: result.source_attribution,
    confidence: result.confidence,
    category: result.category,
    tags: result.tags,
  };
}

export function journalismResultToAiArticle(
  result: JournalismDraftResult
): AiGeneratedArticle {
  return {
    title: result.title,
    excerpt: result.excerpt,
    content: result.content,
    category: result.category,
    tags: result.tags,
    seo_title: result.seo_title,
    seo_description: result.seo_description,
    confidence: result.confidence,
  };
}

function buildMockJournalismDraft(
  input: JournalismGenerationInput
): JournalismDraftResult {
  const source = input.sources[0];
  const headline = input.opportunityTitle ?? source?.title ?? "GTA VI Update";
  const summary = source?.excerpt?.slice(0, 200) ?? "Latest GTA VI development coverage.";

  const json: JournalismArticleJson = {
    hero: {
      headline,
      summary,
      source_badge:
        input.primarySourceLabel === "official" ? "Official" : "Community",
      confidence_label: "Medium",
    },
    blocks: [
      { type: "heading", level: 2, text: "What happened?" },
      {
        type: "paragraph",
        text: summary,
      },
      { type: "heading", level: 2, text: "Confirmed Facts" },
      {
        type: "list",
        ordered: false,
        items: source ? [source.title] : ["No official confirmation in this mock draft."],
      },
      { type: "heading", level: 2, text: "Why It Matters" },
      {
        type: "paragraph",
        text: "This update shapes how players read Rockstar's rollout ahead of launch.",
      },
      { type: "heading", level: 2, text: "What's Next" },
      {
        type: "paragraph",
        text: "Rockstar has not announced a follow-up. GTA6Hub will update if official material drops.",
      },
      {
        type: "sources",
        items: input.sources.map((s) => ({
          label: s.label,
          kind: mapSourceKind(s.platform),
          url: s.url,
          source_id: s.id,
        })),
      },
    ],
    seo: {
      title: headline.slice(0, 60),
      meta_description: summary.slice(0, 155),
      slug: headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80),
      og_title: headline.slice(0, 60),
      twitter_title: headline.slice(0, 60),
      canonical: "",
      keywords: input.targetKeyword ? [input.targetKeyword] : [],
      excerpt: summary,
    },
    confidence: input.primarySourceLabel === "official" ? 0.85 : 0.55,
    category: "Analysis",
    tags: [],
  };

  return compileJournalismArticle(json, input);
}
