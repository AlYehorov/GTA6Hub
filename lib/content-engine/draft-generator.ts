import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  createChatCompletionDetailed,
  isOpenAiConfigured,
} from "@/lib/ai/openai-client";
import {
  CONTENT_PACK_DRAFT_SYSTEM_PROMPT,
  buildContentPackDraftUserPrompt,
} from "@/lib/ai/prompts/content-engine";
import { assertDraftBudget, trackAiUsageEvent } from "@/lib/content-engine/usage";
import type { ContentPlanIdea, GeneratedPackDraft } from "@/lib/content-engine/types";
import type { KgEntity } from "@/lib/knowledge-graph/types";
import type { SourceItem } from "@/lib/types/source";

export async function generatePackDraft(input: {
  source: SourceItem;
  idea: ContentPlanIdea;
  entities: KgEntity[];
}): Promise<GeneratedPackDraft> {
  await assertDraftBudget();

  const entitySlugs = input.entities.map((e) => `${e.kind}:${e.slug}`);

  if (!isOpenAiConfigured()) {
    return buildMockPackDraft(input.source, input.idea, entitySlugs);
  }

  const { content, usage } = await createChatCompletionDetailed({
    messages: [
      { role: "system", content: CONTENT_PACK_DRAFT_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildContentPackDraftUserPrompt({
          source: input.source,
          idea: {
            title: input.idea.title,
            content_type: input.idea.content_type,
            target_keyword: input.idea.target_keyword,
            category: input.idea.category,
            search_intent: input.idea.search_intent,
            internal_link_targets: input.idea.internal_link_targets,
            entity_slugs: entitySlugs,
          },
          entities: input.entities,
        }),
      },
    ],
    temperature: 0.55,
    max_tokens: 2500,
    response_format: { type: "json_object" },
    feature: "content_draft",
    errorPrefix: "Content draft generation failed",
  });

  await trackAiUsageEvent({
    action: "content_draft",
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    metadata: {
      source_id: input.source.id,
      idea_id: input.idea.id,
    },
  });

  const parsed = JSON.parse(content) as Partial<GeneratedPackDraft> & {
    tags?: string[];
  };

  return normalizePackDraft(parsed, input.source, input.idea);
}

function normalizePackDraft(
  parsed: Partial<GeneratedPackDraft> & { tags?: string[] },
  source: SourceItem,
  idea: ContentPlanIdea
): GeneratedPackDraft {
  const title = parsed.title?.trim() || idea.title;
  const slug =
    parsed.slug?.trim() ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  const excerpt = parsed.excerpt?.trim() || `Coverage of ${source.title}.`;
  const body = parsed.content?.trim() || excerpt;
  const confidence = clampConfidence(parsed.confidence, source);

  return {
    title,
    slug,
    excerpt,
    content: body,
    faq: Array.isArray(parsed.faq) ? parsed.faq : [],
    seo_title: (parsed.seo_title?.trim() || title).slice(0, 60),
    seo_description: (parsed.seo_description?.trim() || excerpt).slice(0, 155),
    related_entity_slugs: parsed.related_entity_slugs ?? [],
    internal_link_suggestions: parsed.internal_link_suggestions ?? idea.internal_link_targets,
    confirmed_facts: parsed.confirmed_facts ?? [],
    speculation_notes: parsed.speculation_notes ?? [],
    source_attribution:
      parsed.source_attribution?.trim() ||
      `[${source.title}](${source.source_url})`,
    confidence,
    category: parsed.category?.trim() || idea.category,
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean) : [],
  };
}

function buildMockPackDraft(
  source: SourceItem,
  idea: ContentPlanIdea,
  entitySlugs: string[]
): GeneratedPackDraft {
  return {
    title: idea.title,
    slug: idea.idea_key,
    excerpt: `Editorial draft based on ${source.title}.`,
    content: `## Summary\n\n${source.content.slice(0, 400)}\n\n## Source\n\n[${source.title}](${source.source_url})\n\n## FAQ\n\n**What is this about?** ${idea.title}`,
    faq: [{ question: "What is this about?", answer: idea.title }],
    seo_title: idea.title.slice(0, 60),
    seo_description: idea.target_keyword.slice(0, 155),
    related_entity_slugs: entitySlugs,
    internal_link_suggestions: idea.internal_link_targets,
    confirmed_facts: [source.title],
    speculation_notes: [],
    source_attribution: `[${source.title}](${source.source_url})`,
    confidence: source.source_label === "official" ? 0.85 : 0.55,
    category: idea.category,
    tags: [],
  };
}

function clampConfidence(value: unknown, source: SourceItem): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return source.source_label === "official" ? 0.85 : 0.55;
  }
  const capped =
    source.source_label === "unconfirmed" ? Math.min(num, 0.65) : num;
  return Math.max(0, Math.min(1, capped));
}

export async function savePackDraftAsAiDraft(input: {
  source: SourceItem;
  idea: ContentPlanIdea;
  draft: GeneratedPackDraft;
}): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_drafts")
    .insert({
      source_item_id: input.source.id,
      title: input.draft.title,
      excerpt: input.draft.excerpt,
      content: input.draft.content,
      category: input.draft.category,
      suggested_tags: input.draft.tags,
      seo_title: input.draft.seo_title,
      seo_description: input.draft.seo_description,
      confidence: input.draft.confidence,
      status: "pending",
      content_plan_idea_id: input.idea.id,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save draft");
  return data.id as string;
}
