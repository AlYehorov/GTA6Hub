import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  buildInputFromOpportunity,
  generateJournalismArticle,
  journalismResultToPackDraft,
} from "@/lib/ai/journalism/generator";
import { assertDraftBudget, trackAiUsageEvent } from "@/lib/content-engine/usage";
import {
  applyEditorialFocusOverrides,
  assertEditorialFocusReady,
  buildEditorialFocus,
  type EditorialFocusOverrides,
} from "@/lib/opportunity-engine/editorial-focus";
import { findOpportunityById } from "@/lib/opportunity-engine/loader";
import { upsertOpportunityStatus } from "@/lib/opportunity-engine/queries";
import type { EditorialOpportunity } from "@/lib/opportunity-engine/types";
import { getSourceItemByIdAdmin } from "@/lib/sources/queries";
import { getAllKgEntities } from "@/lib/knowledge-graph/queries";
import { getAllVideosAdmin } from "@/lib/videos/queries";
import { withoutJournalismColumns } from "@/lib/ai/journalism/draft-payload";
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

export async function generateArticleFromOpportunity(
  opportunityId: string,
  focusOverrides?: EditorialFocusOverrides
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

  const editorialFocus = applyEditorialFocusOverrides(
    opportunity.editorialFocus ??
      buildEditorialFocus({
        opportunity,
        sources: resolvedSources,
        videos: resolvedVideos,
        articles: existingArticle ? [existingArticle] : [],
      }),
    focusOverrides
  );

  assertEditorialFocusReady(editorialFocus);

  const journalismInput = buildInputFromOpportunity({
    opportunity,
    sources: resolvedSources,
    videos: resolvedVideos,
    entities: kgEntities,
    existingArticle,
    editorialFocus,
  });

  const { result, usage, rewriteCount } = await generateJournalismArticle(journalismInput);
  const draft = journalismResultToPackDraft(result, {
    title: editorialFocus.headline,
    slug: opportunity.existingArticleSlug ?? undefined,
    excerpt: editorialFocus.primary_story,
  });

  await trackAiUsageEvent({
    action: "opportunity_article",
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    metadata: {
      opportunity_id: opportunityId,
      cluster_key: opportunity.clusterKey,
      journalism_rewrite_count: rewriteCount,
    },
  });

  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin not configured");
  }

  const supabase = createAdminClient();
  const primarySourceId = resolvedSources[0]?.id ?? null;

  if (!primarySourceId) {
    throw new Error("No source items linked to this opportunity — cannot save draft");
  }

  const basePayload = {
    source_item_id: primarySourceId,
    title: draft.title,
    excerpt: draft.excerpt,
    content: draft.content,
    content_blocks: draft.content_blocks ?? null,
    category: draft.category || editorialFocus.article_type,
    suggested_tags: draft.tags,
    seo_title: draft.seo_title,
    seo_description: draft.seo_description,
    seo_og_title: draft.seo_og_title ?? null,
    seo_twitter_title: draft.seo_twitter_title ?? null,
    seo_canonical: draft.seo_canonical ?? null,
    seo_keywords: draft.seo_keywords ?? null,
    confidence: draft.confidence,
    status: "pending" as const,
  };

  let insertResult = await supabase
    .from("ai_drafts")
    .insert({ ...basePayload, opportunity_cluster_key: opportunity.clusterKey })
    .select("id")
    .single();

  if (insertResult.error?.message?.includes("opportunity_cluster_key")) {
    insertResult = await supabase
      .from("ai_drafts")
      .insert(basePayload)
      .select("id")
      .single();
  }

  if (insertResult.error?.message?.includes("content_blocks")) {
    const legacyPayload = withoutJournalismColumns(basePayload);
    insertResult = await supabase
      .from("ai_drafts")
      .insert({ ...legacyPayload, opportunity_cluster_key: opportunity.clusterKey })
      .select("id")
      .single();
    if (insertResult.error?.message?.includes("opportunity_cluster_key")) {
      insertResult = await supabase
        .from("ai_drafts")
        .insert(legacyPayload)
        .select("id")
        .single();
    }
  }

  const { data, error } = insertResult;

  if (error || !data) throw new Error(error?.message ?? "Failed to save draft");

  const draftId = data.id as string;

  try {
    await upsertOpportunityStatus({
      clusterKey: opportunity.clusterKey,
      title: opportunity.title,
      score: opportunity.score,
      status: "draft_generated",
      aiDraftId: draftId,
      metadata: { opportunity_id: opportunityId },
    });
  } catch {
    // editorial_opportunities table may be missing — draft is still valid
  }

  return { draftId, opportunity };
}
