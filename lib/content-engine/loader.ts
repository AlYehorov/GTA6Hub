import { isOpenAiConfigured } from "@/lib/ai/openai-client";
import {
  getContentPlanBySourceId,
  getContentPlanByVideoId,
  getContentPlanIdeas,
  getKgEntitiesByIds,
  getPlanSummariesForSources,
} from "@/lib/content-engine/queries";
import {
  extractAndLinkSourceEntities,
  getSourceEntities,
} from "@/lib/content-engine/source-entities";
import { getContentEngineUsageStats } from "@/lib/content-engine/usage";
import type {
  ContentEngineHomeData,
  SourceEngineDetailData,
  SourceQueueItem,
} from "@/lib/content-engine/types";
import { getAllKgEntities, getOrphanEntities } from "@/lib/knowledge-graph/queries";
import type { KgEntity, RelatedEntity } from "@/lib/knowledge-graph/types";
import { kgEntityHref } from "@/lib/knowledge-graph/types";
import { getSourceItemByIdAdmin, getAllSourceItemsAdmin } from "@/lib/sources/queries";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  SOURCE_LABEL_STYLES,
  SOURCE_PLATFORM_LABELS,
} from "@/lib/types/source";
import type { SourceItem, SourcePlatform } from "@/lib/types/source";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllVideosAdmin } from "@/lib/videos/queries";

const QUEUE_SOURCES: SourcePlatform[] = [
  "rockstar_newswire",
  "rockstar_youtube",
  "reddit",
  "google_news",
  "community_youtube",
];

function sourceLabelText(source: SourceItem): string {
  const platform = SOURCE_PLATFORM_LABELS[source.source];
  const label = SOURCE_LABEL_STYLES[source.source_label].label;
  return `${platform} · ${label}`;
}

export async function buildWeakEntityHints(
  entityIds: string[]
): Promise<string[]> {
  const orphans = await getOrphanEntities();
  const orphanIds = new Set(orphans.map((e) => e.id));
  const hints: string[] = [];

  for (const id of entityIds) {
    const orphan = orphans.find((e) => e.id === id);
    if (orphan) {
      hints.push(
        `- ${orphan.kind}:${orphan.slug} (${orphan.title}) — no linked pages yet`
      );
    }
  }

  const all = await getAllKgEntities();
  for (const id of entityIds) {
    if (orphanIds.has(id)) continue;
    const entity = all.find((e) => e.id === id);
    if (entity && !entity.description?.trim()) {
      hints.push(
        `- ${entity.kind}:${entity.slug} (${entity.title}) — weak entity page (missing description)`
      );
    }
  }

  return hints.slice(0, 12);
}

export async function loadContentEngineHome(): Promise<ContentEngineHomeData> {
  const configured = isSupabaseAdminConfigured();
  const openAiConfigured = isOpenAiConfigured();

  if (!configured) {
    return {
      queue: [],
      usage: await getContentEngineUsageStats(),
      configured: false,
      openAiConfigured,
    };
  }

  const [sources, videos, usage] = await Promise.all([
    getAllSourceItemsAdmin({ limit: 60 }),
    getAllVideosAdmin(),
    getContentEngineUsageStats(),
  ]);

  const queueSources = sources.filter((s) => QUEUE_SOURCES.includes(s.source));
  const sourceIds = queueSources.map((s) => s.id);
  const planSummaries = await getPlanSummariesForSources(sourceIds);

  const supabase = createAdminClient();
  const { data: entityRows } = await supabase
    .from("source_entities")
    .select(
      "source_item_id, confidence, mention_count, entity:kg_entities(id, kind, slug, title, status)"
    )
    .in("source_item_id", sourceIds);

  const entitiesBySource = new Map<string, RelatedEntity[]>();
  for (const row of entityRows ?? []) {
    const sourceId = row.source_item_id as string;
    const entity = Array.isArray(row.entity) ? row.entity[0] : row.entity;
    if (!entity || entity.status !== "published") continue;
    const bucket = entitiesBySource.get(sourceId) ?? [];
    bucket.push({
      id: entity.id as string,
      kind: entity.kind as RelatedEntity["kind"],
      slug: entity.slug as string,
      title: entity.title as string,
      href: kgEntityHref(entity.kind as RelatedEntity["kind"], entity.slug as string),
      confidence: Number(row.confidence),
      mention_count: Number(row.mention_count),
    });
    entitiesBySource.set(sourceId, bucket);
  }

  const queue: SourceQueueItem[] = queueSources.map((source) => {
    const summary = planSummaries.get(source.id);
    return {
      id: source.id,
      kind: "source",
      title: source.title,
      sourceLabel: sourceLabelText(source),
      sourcePlatform: SOURCE_PLATFORM_LABELS[source.source],
      date: source.published_at ?? source.created_at,
      url: source.source_url,
      processed: source.processed,
      entities: entitiesBySource.get(source.id) ?? [],
      articleIdeas: summary?.ideaTitles ?? [],
      hasPlan: Boolean(summary),
      planId: summary?.planId ?? null,
      ideaCount: summary?.ideaCount ?? 0,
    };
  });

  const { data: videoPlans } = await supabase
    .from("content_plans")
    .select("video_id")
    .not("video_id", "is", null);

  const plannedVideoIds = new Set(
    (videoPlans ?? []).map((p) => p.video_id as string)
  );

  for (const video of videos) {
    if (plannedVideoIds.has(video.id)) continue;
    if (video.source_item_id) continue;

    queue.push({
      id: video.id,
      kind: "video",
      title: video.title,
      sourceLabel: "Video · draft",
      sourcePlatform: "YouTube",
      date: video.published_at ?? video.created_at,
      url: video.source_url,
      processed: false,
      entities: [],
      articleIdeas: [],
      hasPlan: false,
      planId: null,
      ideaCount: 0,
    });
  }

  queue.sort(
    (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
  );

  return {
    queue: queue.slice(0, 50),
    usage,
    configured: true,
    openAiConfigured,
  };
}

export async function loadSourceEngineDetail(
  sourceId: string
): Promise<SourceEngineDetailData> {
  const configured = isSupabaseAdminConfigured();
  const openAiConfigured = isOpenAiConfigured();

  if (!configured) {
    return {
      source: null,
      video: null,
      entities: [],
      kgEntities: [],
      plan: null,
      ideas: [],
      usage: await getContentEngineUsageStats(),
      configured: false,
      openAiConfigured,
    };
  }

  const source = await getSourceItemByIdAdmin(sourceId);
  if (!source) {
    return {
      source: null,
      video: null,
      entities: [],
      kgEntities: [],
      plan: null,
      ideas: [],
      usage: await getContentEngineUsageStats(),
      configured: true,
      openAiConfigured,
    };
  }

  let entities = await getSourceEntities(sourceId);
  if (entities.length === 0) {
    entities = await extractAndLinkSourceEntities(source);
  }

  const [plan, usage] = await Promise.all([
    getContentPlanBySourceId(sourceId),
    getContentEngineUsageStats(),
  ]);

  const ideas = plan ? await getContentPlanIdeas(plan.id) : [];
  const entityIds = new Set<string>();
  for (const e of entities) entityIds.add(e.id);
  for (const idea of ideas) {
    for (const id of idea.entity_ids) entityIds.add(id);
  }

  const kgEntities = (await getKgEntitiesByIds(Array.from(entityIds))) as KgEntity[];

  return {
    source,
    video: null,
    entities,
    kgEntities,
    plan,
    ideas,
    usage,
    configured: true,
    openAiConfigured,
  };
}

export async function loadVideoEngineDetail(
  videoId: string
): Promise<SourceEngineDetailData> {
  const configured = isSupabaseAdminConfigured();
  const openAiConfigured = isOpenAiConfigured();

  if (!configured) {
    return {
      source: null,
      video: null,
      entities: [],
      kgEntities: [],
      plan: null,
      ideas: [],
      usage: await getContentEngineUsageStats(),
      configured: false,
      openAiConfigured,
    };
  }

  const supabase = createAdminClient();
  const { data: videoRow } = await supabase
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .maybeSingle();

  if (!videoRow) {
    return {
      source: null,
      video: null,
      entities: [],
      kgEntities: [],
      plan: null,
      ideas: [],
      usage: await getContentEngineUsageStats(),
      configured: true,
      openAiConfigured,
    };
  }

  if (videoRow.source_item_id) {
    return loadSourceEngineDetail(videoRow.source_item_id as string);
  }

  const video = {
    id: videoRow.id as string,
    title: videoRow.title as string,
    description: (videoRow.description as string) ?? "",
    source_url: videoRow.source_url as string,
    published_at: (videoRow.published_at as string | null) ?? null,
    category: videoRow.category as string,
  };

  const [plan, usage] = await Promise.all([
    getContentPlanByVideoId(videoId),
    getContentEngineUsageStats(),
  ]);

  const ideas = plan ? await getContentPlanIdeas(plan.id) : [];

  const { data: entityRows } = await supabase
    .from("video_entities")
    .select(
      "confidence, mention_count, entity:kg_entities(id, kind, slug, title, status)"
    )
    .eq("video_id", videoId);

  const entities: RelatedEntity[] = [];
  for (const row of entityRows ?? []) {
    const entity = Array.isArray(row.entity) ? row.entity[0] : row.entity;
    if (!entity || entity.status !== "published") continue;
    entities.push({
      id: entity.id as string,
      kind: entity.kind as RelatedEntity["kind"],
      slug: entity.slug as string,
      title: entity.title as string,
      href: kgEntityHref(entity.kind as RelatedEntity["kind"], entity.slug as string),
      confidence: Number(row.confidence),
      mention_count: Number(row.mention_count),
    });
  }

  const entityIds = new Set(entities.map((e) => e.id));
  for (const idea of ideas) {
    for (const id of idea.entity_ids) entityIds.add(id);
  }
  const kgEntities = (await getKgEntitiesByIds(Array.from(entityIds))) as KgEntity[];

  return {
    source: null,
    video,
    entities,
    kgEntities,
    plan,
    ideas,
    usage,
    configured: true,
    openAiConfigured,
  };
}

export async function resolveKgEntitiesForSource(
  source: SourceItem
): Promise<{ entities: RelatedEntity[]; kgEntities: KgEntity[]; weakHints: string[] }> {
  let entities = await getSourceEntities(source.id);
  if (entities.length === 0) {
    entities = await extractAndLinkSourceEntities(source);
  }
  const allKg = await getAllKgEntities();
  const kgEntities = allKg.filter((e) => entities.some((r) => r.id === e.id));
  const weakHints = await buildWeakEntityHints(entities.map((e) => e.id));
  return { entities, kgEntities, weakHints };
}
