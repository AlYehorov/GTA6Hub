import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getKgEntityByKindSlug } from "@/lib/knowledge-graph/queries";
import type { KgEntityKind } from "@/lib/knowledge-graph/types";
import type {
  ContentPlan,
  ContentPlanIdea,
  ContentPlanIdeaInput,
  ContentPlanIdeaStatus,
} from "@/lib/content-engine/types";

function rowToIdea(row: Record<string, unknown>): ContentPlanIdea {
  return {
    id: row.id as string,
    content_plan_id: row.content_plan_id as string,
    idea_key: row.idea_key as string,
    title: row.title as string,
    content_type: row.content_type as string,
    target_keyword: row.target_keyword as string,
    category: row.category as string,
    search_intent: row.search_intent as string,
    entity_ids: (row.entity_ids as string[]) ?? [],
    internal_link_targets: (row.internal_link_targets as string[]) ?? [],
    estimated_value: row.estimated_value as string,
    priority: row.priority as ContentPlanIdea["priority"],
    status: row.status as ContentPlanIdeaStatus,
    ai_draft_id: (row.ai_draft_id as string | null) ?? null,
    workspace_id: (row.workspace_id as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToPlan(row: Record<string, unknown>): ContentPlan {
  return {
    id: row.id as string,
    source_item_id: (row.source_item_id as string | null) ?? null,
    video_id: (row.video_id as string | null) ?? null,
    status: row.status as ContentPlan["status"],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function resolveEntityIdsFromSlugs(
  slugs: string[]
): Promise<string[]> {
  const ids: string[] = [];
  for (const token of slugs) {
    const [kind, slug] = token.split(":");
    if (!kind || !slug) continue;
    const entity = await getKgEntityByKindSlug(kind as KgEntityKind, slug);
    if (entity) ids.push(entity.id);
  }
  return ids;
}

export async function getContentPlanBySourceId(
  sourceId: string
): Promise<ContentPlan | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_plans")
    .select("*")
    .eq("source_item_id", sourceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return rowToPlan(data as Record<string, unknown>);
}

export async function getContentPlanByVideoId(
  videoId: string
): Promise<ContentPlan | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_plans")
    .select("*")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return rowToPlan(data as Record<string, unknown>);
}

export async function getContentPlanIdeas(
  planId: string
): Promise<ContentPlanIdea[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_plan_ideas")
    .select("*")
    .eq("content_plan_id", planId)
    .order("created_at");

  const priorityRank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return (data ?? [])
    .map((row) => rowToIdea(row as Record<string, unknown>))
    .sort(
      (a, b) =>
        (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9)
    );
}

export async function getContentPlanIdeaById(
  ideaId: string
): Promise<ContentPlanIdea | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_plan_ideas")
    .select("*")
    .eq("id", ideaId)
    .maybeSingle();

  if (!data) return null;
  return rowToIdea(data as Record<string, unknown>);
}

export async function getPlanSummariesForSources(
  sourceIds: string[]
): Promise<
  Map<string, { planId: string; ideaCount: number; ideaTitles: string[] }>
> {
  const result = new Map<
    string,
    { planId: string; ideaCount: number; ideaTitles: string[] }
  >();
  if (!isSupabaseAdminConfigured() || sourceIds.length === 0) return result;

  const supabase = createAdminClient();
  const { data: plans } = await supabase
    .from("content_plans")
    .select("id, source_item_id")
    .in("source_item_id", sourceIds);

  const planIds = (plans ?? []).map((p) => p.id as string);
  if (planIds.length === 0) return result;

  const { data: ideas } = await supabase
    .from("content_plan_ideas")
    .select("content_plan_id, title, status")
    .in("content_plan_id", planIds)
    .neq("status", "ignored");

  const ideasByPlan = new Map<string, string[]>();
  for (const idea of ideas ?? []) {
    const planId = idea.content_plan_id as string;
    const bucket = ideasByPlan.get(planId) ?? [];
    bucket.push(idea.title as string);
    ideasByPlan.set(planId, bucket);
  }

  for (const plan of plans ?? []) {
    const sourceId = plan.source_item_id as string;
    const titles = ideasByPlan.get(plan.id as string) ?? [];
    result.set(sourceId, {
      planId: plan.id as string,
      ideaCount: titles.length,
      ideaTitles: titles.slice(0, 5),
    });
  }

  return result;
}

export async function createContentPlanWithIdeas(input: {
  sourceItemId?: string;
  videoId?: string;
  ideas: ContentPlanIdeaInput[];
}): Promise<ContentPlan | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data: planRow, error: planError } = await supabase
    .from("content_plans")
    .insert({
      source_item_id: input.sourceItemId ?? null,
      video_id: input.videoId ?? null,
      status: "active",
    })
    .select("*")
    .single();

  if (planError || !planRow) {
    throw new Error(planError?.message ?? "Failed to create content plan");
  }

  const plan = rowToPlan(planRow as Record<string, unknown>);
  const ideaRows = [];

  for (const idea of input.ideas) {
    const entityIds = await resolveEntityIdsFromSlugs(idea.entity_slugs ?? []);
    ideaRows.push({
      content_plan_id: plan.id,
      idea_key: idea.idea_key,
      title: idea.title,
      content_type: idea.content_type,
      target_keyword: idea.target_keyword,
      category: idea.category,
      search_intent: idea.search_intent,
      entity_ids: entityIds,
      internal_link_targets: idea.internal_link_targets,
      estimated_value: idea.estimated_value,
      priority: idea.priority,
      status: "planned",
    });
  }

  if (ideaRows.length > 0) {
    const { error: ideasError } = await supabase
      .from("content_plan_ideas")
      .insert(ideaRows);
    if (ideasError) throw new Error(ideasError.message);
  }

  return plan;
}

export async function replaceContentPlanIdeas(
  planId: string,
  ideas: ContentPlanIdeaInput[]
): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  await supabase
    .from("content_plan_ideas")
    .delete()
    .eq("content_plan_id", planId)
    .eq("status", "planned");

  const ideaRows = [];
  for (const idea of ideas) {
    const entityIds = await resolveEntityIdsFromSlugs(idea.entity_slugs ?? []);
    ideaRows.push({
      content_plan_id: planId,
      idea_key: idea.idea_key,
      title: idea.title,
      content_type: idea.content_type,
      target_keyword: idea.target_keyword,
      category: idea.category,
      search_intent: idea.search_intent,
      entity_ids: entityIds,
      internal_link_targets: idea.internal_link_targets,
      estimated_value: idea.estimated_value,
      priority: idea.priority,
      status: "planned",
    });
  }

  if (ideaRows.length > 0) {
    const { error } = await supabase.from("content_plan_ideas").insert(ideaRows);
    if (error) throw new Error(error.message);
  }
}

export async function updateContentPlanIdea(
  ideaId: string,
  patch: Partial<{
    status: ContentPlanIdeaStatus;
    ai_draft_id: string | null;
    workspace_id: string | null;
  }>
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("content_plan_ideas")
    .update(patch)
    .eq("id", ideaId);

  return !error;
}

export async function markPlanIgnored(planId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  await supabase
    .from("content_plans")
    .update({ status: "ignored" })
    .eq("id", planId);
}

export async function getKgEntitiesByIds(ids: string[]) {
  if (!isSupabaseAdminConfigured() || ids.length === 0) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("kg_entities")
    .select("*")
    .in("id", ids);

  return data ?? [];
}
