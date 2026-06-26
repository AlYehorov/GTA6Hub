import {
  createChatCompletionDetailed,
  isOpenAiConfigured,
} from "@/lib/ai/openai-client";
import {
  CONTENT_PLAN_SYSTEM_PROMPT,
  buildContentPlanUserPrompt,
} from "@/lib/ai/prompts/content-engine";
import type { ContentPlanIdeaInput } from "@/lib/content-engine/types";
import { kgEntityHref, type KgEntity } from "@/lib/knowledge-graph/types";
import type { SourceItem } from "@/lib/types/source";
import { assertPlanBudget, trackAiUsageEvent } from "@/lib/content-engine/usage";

function slugifyKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function generateContentPlan(input: {
  source: SourceItem;
  entities: KgEntity[];
  weakEntityHints: string[];
}): Promise<ContentPlanIdeaInput[]> {
  await assertPlanBudget();

  if (!isOpenAiConfigured()) {
    return buildHeuristicPlan(input);
  }

  const { content, usage } = await createChatCompletionDetailed({
    messages: [
      { role: "system", content: CONTENT_PLAN_SYSTEM_PROMPT },
      { role: "user", content: buildContentPlanUserPrompt(input) },
    ],
    temperature: 0.5,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    feature: "content_plan",
    errorPrefix: "Content plan generation failed",
  });

  await trackAiUsageEvent({
    action: "content_plan",
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    metadata: { source_id: input.source.id },
  });

  const parsed = JSON.parse(content) as {
    ideas?: Array<Partial<ContentPlanIdeaInput> & { entity_slugs?: string[] }>;
  };

  return (parsed.ideas ?? []).map((idea, index) => ({
    idea_key: idea.idea_key?.trim() || slugifyKey(idea.title ?? `idea-${index}`),
    title: idea.title?.trim() || `Article idea ${index + 1}`,
    content_type: idea.content_type?.trim() || "news_summary",
    target_keyword: idea.target_keyword?.trim() || input.source.title,
    category: idea.category?.trim() || "Analysis",
    search_intent: idea.search_intent?.trim() || "informational",
    entity_slugs: idea.entity_slugs ?? [],
    internal_link_targets: idea.internal_link_targets ?? [],
    estimated_value: idea.estimated_value?.trim() || "Editorial coverage",
    priority: (idea.priority as ContentPlanIdeaInput["priority"]) ?? "medium",
  }));
}

function buildHeuristicPlan(input: {
  source: SourceItem;
  entities: KgEntity[];
}): ContentPlanIdeaInput[] {
  const links = input.entities.map((e) => kgEntityHref(e.kind, e.slug));
  const ideas: ContentPlanIdeaInput[] = [
    {
      idea_key: "news-summary",
      title: `News: ${input.source.title}`,
      content_type: "news_summary",
      target_keyword: `${input.source.title} GTA 6`,
      category: "Official",
      search_intent: "news",
      entity_slugs: input.entities.map((e) => `${e.kind}:${e.slug}`),
      internal_link_targets: links.slice(0, 5),
      estimated_value: "Timely news coverage",
      priority: "high",
    },
  ];

  if (input.source.source_type === "youtube_video") {
    ideas.push({
      idea_key: "trailer-breakdown",
      title: `Trailer breakdown: ${input.source.title}`,
      content_type: "trailer_breakdown",
      target_keyword: `GTA 6 trailer breakdown`,
      category: "Trailer",
      search_intent: "informational",
      entity_slugs: input.entities.map((e) => `${e.kind}:${e.slug}`),
      internal_link_targets: links.slice(0, 5),
      estimated_value: "High search interest for trailer analysis",
      priority: "high",
    });
  }

  return ideas;
}
