import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  createChatCompletionDetailed,
  isOpenAiConfigured,
} from "@/lib/ai/openai-client";
import {
  OPPORTUNITY_ARTICLE_SYSTEM_PROMPT,
  buildOpportunityArticleUserPrompt,
} from "@/lib/ai/prompts/opportunity-article";
import { assertDraftBudget, trackAiUsageEvent } from "@/lib/content-engine/usage";
import type { GeneratedPackDraft } from "@/lib/content-engine/types";
import { findOpportunityById } from "@/lib/opportunity-engine/loader";
import { upsertOpportunityStatus } from "@/lib/opportunity-engine/queries";
import type { EditorialOpportunity } from "@/lib/opportunity-engine/types";
import { getSourceItemByIdAdmin } from "@/lib/sources/queries";
import { getAllKgEntities } from "@/lib/knowledge-graph/queries";
import { getAllVideosAdmin } from "@/lib/videos/queries";
import type { SourceItem } from "@/lib/types/source";

async function fetchExistingArticle(
  articleId: string
): Promise<import("@/lib/editorial/types").ArticleSeoInput | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, slug, type, excerpt, content, hero_image_url, seo_title, seo_description, video_id, published_at, updated_at"
    )
    .eq("id", articleId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    title: data.title as string,
    slug: data.slug as string,
    type: data.type as "news" | "guide",
    excerpt: (data.excerpt as string | null) ?? null,
    content: (data.content as string) ?? "",
    hero_image_url: (data.hero_image_url as string | null) ?? null,
    seo_title: (data.seo_title as string | null) ?? null,
    seo_description: (data.seo_description as string | null) ?? null,
    video_id: (data.video_id as string | null) ?? null,
    published_at: (data.published_at as string | null) ?? null,
    updated_at: data.updated_at as string,
  };
}

function normalizeDraft(
  parsed: Partial<GeneratedPackDraft>,
  opportunity: EditorialOpportunity
): GeneratedPackDraft {
  const title = parsed.title?.trim() || opportunity.title;
  const slug =
    parsed.slug?.trim() ||
    opportunity.existingArticleSlug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  const excerpt = parsed.excerpt?.trim() || opportunity.summary;
  const body = parsed.content?.trim() || excerpt;

  return {
    title,
    slug,
    excerpt,
    content: body,
    faq: Array.isArray(parsed.faq) ? parsed.faq : [],
    seo_title: (parsed.seo_title?.trim() || title).slice(0, 60),
    seo_description: (parsed.seo_description?.trim() || excerpt).slice(0, 155),
    related_entity_slugs: parsed.related_entity_slugs ?? [],
    internal_link_suggestions:
      parsed.internal_link_suggestions ?? opportunity.internalLinkTargets,
    confirmed_facts: parsed.confirmed_facts ?? [],
    speculation_notes: parsed.speculation_notes ?? [],
    source_attribution: parsed.source_attribution?.trim() || opportunity.summary,
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : opportunity.confidence === "High"
          ? 0.85
          : opportunity.confidence === "Medium"
            ? 0.65
            : 0.45,
    category: parsed.category?.trim() || opportunity.articleType,
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean) : [],
  };
}

export async function generateArticleFromOpportunity(
  opportunityId: string
): Promise<{ draftId: string; opportunity: EditorialOpportunity }> {
  await assertDraftBudget();

  const opportunity = await findOpportunityById(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found — refresh briefing");

  const [sources, videos, allKg, existingArticle] = await Promise.all([
    Promise.all(opportunity.sourceIds.map((id) => getSourceItemByIdAdmin(id))),
    getAllVideosAdmin(),
    getAllKgEntities(),
    opportunity.existingArticleId
      ? fetchExistingArticle(opportunity.existingArticleId)
      : Promise.resolve(null),
  ]);

  const resolvedSources = sources.filter(Boolean) as SourceItem[];
  const resolvedVideos = videos.filter((v) => opportunity.videoIds.includes(v.id));
  const entityIds = new Set(opportunity.entities.map((e) => e.id));
  const kgEntities = allKg.filter((e) => entityIds.has(e.id));

  if (!isOpenAiConfigured()) {
    throw new Error("OPENAI_API_KEY required to generate articles");
  }

  const { content, usage } = await createChatCompletionDetailed({
    messages: [
      { role: "system", content: OPPORTUNITY_ARTICLE_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildOpportunityArticleUserPrompt({
          opportunity,
          sources: resolvedSources,
          videos: resolvedVideos,
          entities: kgEntities,
          existingArticle,
          internalLinks: opportunity.internalLinkTargets,
        }),
      },
    ],
    temperature: 0.55,
    max_tokens: 2800,
    response_format: { type: "json_object" },
    feature: "opportunity_article",
    errorPrefix: "Opportunity article generation failed",
  });

  await trackAiUsageEvent({
    action: "opportunity_article",
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    metadata: {
      opportunity_id: opportunityId,
      cluster_key: opportunity.clusterKey,
    },
  });

  const parsed = JSON.parse(content) as Partial<GeneratedPackDraft>;
  const draft = normalizeDraft(parsed, opportunity);

  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin not configured");
  }

  const supabase = createAdminClient();
  const primarySourceId = resolvedSources[0]?.id ?? null;

  const { data, error } = await supabase
    .from("ai_drafts")
    .insert({
      source_item_id: primarySourceId,
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      category: draft.category,
      suggested_tags: draft.tags,
      seo_title: draft.seo_title,
      seo_description: draft.seo_description,
      confidence: draft.confidence,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save draft");

  const draftId = data.id as string;

  await upsertOpportunityStatus({
    clusterKey: opportunity.clusterKey,
    title: opportunity.title,
    score: opportunity.score,
    status: "draft_generated",
    aiDraftId: draftId,
    metadata: { opportunity_id: opportunityId },
  });

  return { draftId, opportunity };
}
