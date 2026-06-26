import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  buildInputFromPack,
  generateJournalismArticle,
  journalismResultToPackDraft,
} from "@/lib/ai/journalism/generator";
import { assertDraftBudget, trackAiUsageEvent } from "@/lib/content-engine/usage";
import type { ContentPlanIdea, GeneratedPackDraft } from "@/lib/content-engine/types";
import type { KgEntity } from "@/lib/knowledge-graph/types";
import { withoutJournalismColumns } from "@/lib/ai/journalism/draft-payload";
import type { SourceItem } from "@/lib/types/source";

export async function generatePackDraft(input: {
  source: SourceItem;
  idea: ContentPlanIdea;
  entities: KgEntity[];
}): Promise<GeneratedPackDraft> {
  await assertDraftBudget();

  const journalismInput = buildInputFromPack(input.source, input.idea, input.entities);
  const { result, usage, rewriteCount } = await generateJournalismArticle(journalismInput);

  await trackAiUsageEvent({
    action: "content_draft",
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    metadata: {
      source_id: input.source.id,
      idea_id: input.idea.id,
      journalism_rewrite_count: rewriteCount,
    },
  });

  return journalismResultToPackDraft(result, {
    title: input.idea.title,
    excerpt: `Coverage of ${input.source.title}.`,
  });
}

export async function savePackDraftAsAiDraft(input: {
  source: SourceItem;
  idea: ContentPlanIdea;
  draft: GeneratedPackDraft;
}): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const basePayload = {
    source_item_id: input.source.id,
    title: input.draft.title,
    excerpt: input.draft.excerpt,
    content: input.draft.content,
    content_blocks: input.draft.content_blocks ?? null,
    category: input.draft.category,
    suggested_tags: input.draft.tags,
    seo_title: input.draft.seo_title,
    seo_description: input.draft.seo_description,
    seo_og_title: input.draft.seo_og_title ?? null,
    seo_twitter_title: input.draft.seo_twitter_title ?? null,
    seo_canonical: input.draft.seo_canonical ?? null,
    seo_keywords: input.draft.seo_keywords ?? null,
    confidence: input.draft.confidence,
    status: "pending" as const,
    content_plan_idea_id: input.idea.id,
  };

  let insertResult = await supabase.from("ai_drafts").insert(basePayload).select("id").single();

  if (insertResult.error?.message?.includes("content_blocks")) {
    insertResult = await supabase
      .from("ai_drafts")
      .insert(withoutJournalismColumns(basePayload))
      .select("id")
      .single();
  }

  const { data, error } = insertResult;
  if (error || !data) throw new Error(error?.message ?? "Failed to save draft");
  return data.id as string;
}
