import {
  createChatCompletionDetailed,
  isOpenAiConfigured,
} from "@/lib/ai/openai-client";
import { compileEditorArticle } from "@/lib/ai/journalism/compiler";
import { buildArticleFactPack } from "@/lib/ai/journalism/fact-pack";
import {
  EDITOR_SYSTEM_PROMPT,
  buildEditorUserPrompt,
} from "@/lib/ai/journalism/prompts";
import {
  formatQualityFailures,
  runEditorQualityCheck,
} from "@/lib/ai/journalism/quality";
import {
  formatFactualGuardFailures,
  runFactualGuardCheck,
  discussesNegativeSalesForReview,
} from "@/lib/ai/journalism/factual-guard";
import { runOpenAiFactualReview } from "@/lib/ai/journalism/factual-review";
import type {
  EditorArticleJson,
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
import { mapFocusArticleTypeToDraftType } from "@/lib/opportunity-engine/editorial-focus";
import { SOURCE_PLATFORM_LABELS } from "@/lib/types/source";
import { kgEntityHref } from "@/lib/knowledge-graph/types";
import type { KgEntityKind } from "@/lib/knowledge-graph/types";

const MAX_REWRITE_ATTEMPTS = 2;

function collectRewriteNotes(
  qualityFailures: ReturnType<typeof runEditorQualityCheck>["failures"],
  factualFailures: ReturnType<typeof runFactualGuardCheck>["failures"],
  aiReviewIssues: string[]
): string {
  const blocks: string[] = [];
  if (qualityFailures.length > 0) {
    blocks.push(formatQualityFailures(qualityFailures));
  }
  if (factualFailures.length > 0) {
    blocks.push(formatFactualGuardFailures(factualFailures));
  }
  if (aiReviewIssues.length > 0) {
    blocks.push(aiReviewIssues.map((issue) => `- ${issue}`).join("\n"));
  }
  return blocks.filter(Boolean).join("\n");
}

function extractYoutubeId(url: string): string | undefined {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1];
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
        sourceLabel: source.source_label,
        title: source.title,
        url: source.source_url,
        excerpt: source.content,
        publishedAt: source.published_at,
      },
    ],
    videos: [],
    entities: entities.map((entity) => ({
      id: entity.id,
      kind: entity.kind,
      slug: entity.slug,
      title: entity.title,
      image_url: entity.image_url,
      href: kgEntityHref(entity.kind as KgEntityKind, entity.slug),
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
  editorialFocus?: import("@/lib/opportunity-engine/editorial-focus").EditorialFocus;
}): JournalismGenerationInput {
  const primaryLabel =
    input.sources.find((source) => source.source_label === "official")?.source_label ??
    input.sources[0]?.source_label ??
    "community";

  return {
    articleType: input.editorialFocus
      ? mapFocusArticleTypeToDraftType(input.editorialFocus.article_type)
      : input.opportunity.articleType,
    primarySourceLabel: primaryLabel,
    editorialFocus: input.editorialFocus,
    opportunityTitle: input.editorialFocus?.headline ?? input.opportunity.title,
    targetKeyword: input.editorialFocus?.seo_keyword ?? input.opportunity.targetKeyword,
    contentType: input.opportunity.contentType,
    existingArticle: input.existingArticle
      ? {
          title: input.existingArticle.title,
          slug: input.existingArticle.slug,
          excerpt: input.existingArticle.excerpt,
        }
      : undefined,
    sources: input.sources.map((source) => ({
      id: source.id,
      platform: source.source,
      label: SOURCE_PLATFORM_LABELS[source.source],
      sourceLabel: source.source_label,
      title: source.title,
      url: source.source_url,
      excerpt: source.content,
      publishedAt: source.published_at,
    })),
    videos: input.videos.map((video) => ({
      id: video.id,
      title: video.title,
      url: video.source_url,
      youtube_id: extractYoutubeId(video.source_url),
      description: video.description,
    })),
    entities: input.entities.map((entity) => ({
      id: entity.id,
      kind: entity.kind,
      slug: entity.slug,
      title: entity.title,
      image_url: entity.image_url,
      href: kgEntityHref(entity.kind as KgEntityKind, entity.slug),
    })),
    internalLinkTargets: input.opportunity.internalLinkTargets,
  };
}

async function callEditorModel(
  input: JournalismGenerationInput,
  factPack: ReturnType<typeof buildArticleFactPack>,
  rewriteNotes?: string
): Promise<{ json: EditorArticleJson; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const { content, usage } = await createChatCompletionDetailed({
    messages: [
      { role: "system", content: EDITOR_SYSTEM_PROMPT },
      { role: "user", content: buildEditorUserPrompt(input, factPack, rewriteNotes) },
    ],
    temperature: 0.35,
    max_tokens: 2800,
    response_format: { type: "json_object" },
    feature: "journalism_article",
    errorPrefix: "Editor article generation failed",
  });

  const json = JSON.parse(content) as EditorArticleJson;
  return { json, usage };
}

export async function generateJournalismArticle(
  input: JournalismGenerationInput
): Promise<{
  result: JournalismDraftResult;
  usage: { prompt_tokens: number; completion_tokens: number };
  rewriteCount: number;
}> {
  const factPack = buildArticleFactPack(input);

  if (!isOpenAiConfigured()) {
    return {
      result: buildMockEditorDraft(input, factPack),
      usage: { prompt_tokens: 0, completion_tokens: 0 },
      rewriteCount: 0,
    };
  }

  let totalUsage = { prompt_tokens: 0, completion_tokens: 0 };
  let rewriteCount = 0;
  let rewriteNotes: string | undefined;
  let lastConfidenceCap: number | null = null;

  for (let attempt = 0; attempt <= MAX_REWRITE_ATTEMPTS; attempt++) {
    const { json, usage } = await callEditorModel(input, factPack, rewriteNotes);
    totalUsage = {
      prompt_tokens: totalUsage.prompt_tokens + usage.prompt_tokens,
      completion_tokens: totalUsage.completion_tokens + usage.completion_tokens,
    };

    const qualityReport = runEditorQualityCheck(json, factPack);
    const factualReport = runFactualGuardCheck(json, factPack);
    let aiReviewIssues: string[] = [];

    if (!factualReport.passed || discussesNegativeSalesForReview(JSON.stringify(json))) {
      const aiReview = await runOpenAiFactualReview(json, factPack);
      if (aiReview && !aiReview.passed) {
        aiReviewIssues = aiReview.issues;
        lastConfidenceCap = Math.min(lastConfidenceCap ?? 1, aiReview.suggestedConfidence);
      }
    }

    const passed =
      qualityReport.passed && factualReport.passed && aiReviewIssues.length === 0;

    if (passed) {
      return {
        result: compileEditorArticle(json, factPack, input),
        usage: totalUsage,
        rewriteCount,
      };
    }

    lastConfidenceCap =
      factualReport.confidenceCap != null
        ? Math.min(lastConfidenceCap ?? 1, factualReport.confidenceCap)
        : lastConfidenceCap;

    if (attempt >= MAX_REWRITE_ATTEMPTS) {
      return {
        result: compileEditorArticle(json, factPack, input, {
          confidenceCap: lastConfidenceCap,
        }),
        usage: totalUsage,
        rewriteCount,
      };
    }

    rewriteCount += 1;
    rewriteNotes = collectRewriteNotes(
      qualityReport.failures,
      factualReport.failures,
      aiReviewIssues
    );
  }

  return {
    result: buildMockEditorDraft(input, factPack),
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

export function journalismResultToAiArticle(result: JournalismDraftResult): AiGeneratedArticle {
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

function buildMockEditorDraft(
  input: JournalismGenerationInput,
  factPack: ReturnType<typeof buildArticleFactPack>
): JournalismDraftResult {
  const headline = input.opportunityTitle ?? factPack.officialFacts[0]?.text ?? "GTA VI Update";
  const summary =
    factPack.officialFacts[0]?.text?.slice(0, 200) ??
    factPack.communityReports[0]?.text?.slice(0, 200) ??
    "Latest GTA VI coverage.";

  const sections: EditorArticleJson["sections"] = [];

  if (factPack.officialFacts.length > 0) {
    sections.push({
      heading: "Confirmed Facts",
      paragraphs: factPack.officialFacts.slice(0, 4).map((fact) => fact.text),
    });
  }

  if (factPack.communityReports.length > 0) {
    sections.push({
      heading: "Community Discussion",
      paragraphs: factPack.communityReports
        .slice(0, 3)
        .map((report) => `Community reports suggest ${report.text} This has not been confirmed by Rockstar.`),
    });
  }

  sections.push({
    heading: "What This Means",
    paragraphs: [
      factPack.hasOfficialFacts
        ? "Rockstar's official materials define what players can treat as confirmed ahead of launch."
        : "This story currently rests on unverified community discussion.",
    ],
  });

  const editor: EditorArticleJson = {
    title: headline.slice(0, 100),
    summary,
    sections,
    faq: [],
    seo: {
      title: headline.slice(0, 60),
      description: summary.slice(0, 155),
      slug: headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80),
      keywords: factPack.seo.secondaryKeywords,
    },
    confidence: factPack.hasOfficialFacts ? 0.85 : 0.55,
    category: "Analysis",
    tags: [],
  };

  return compileEditorArticle(editor, factPack, input);
}
