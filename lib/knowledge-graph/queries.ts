import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { ALL_ENTITY_KINDS, ENTITY_KINDS } from "@/lib/entities/config";
import {
  GAME_TABLE_TO_KG_KIND,
  kgEntityHref,
  type KgEntity,
  type KgEntityKind,
  type KgLinkSource,
  type RelatedEntity,
} from "@/lib/knowledge-graph/types";

const ENTITY_SELECT = "*";

function rowToEntity(row: Record<string, unknown>): KgEntity {
  return {
    id: row.id as string,
    kind: row.kind as KgEntityKind,
    slug: row.slug as string,
    title: row.title as string,
    aliases: (row.aliases as string[]) ?? [],
    description: (row.description as string) ?? "",
    image_url: (row.image_url as string | null) ?? null,
    category: (row.category as string) ?? "",
    first_seen_source: (row.first_seen_source as string | null) ?? null,
    first_seen_date: (row.first_seen_date as string | null) ?? null,
    status: row.status as KgEntity["status"],
    legacy_game_table: (row.legacy_game_table as string | null) ?? null,
    legacy_game_id: (row.legacy_game_id as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getAllKgEntities(): Promise<KgEntity[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("kg_entities")
    .select(ENTITY_SELECT)
    .order("title");

  return (data ?? []).map((row) => rowToEntity(row as Record<string, unknown>));
}

export async function getKgEntityByKindSlug(
  kind: KgEntityKind,
  slug: string
): Promise<KgEntity | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("kg_entities")
    .select(ENTITY_SELECT)
    .eq("kind", kind)
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;
  return rowToEntity(data as Record<string, unknown>);
}

export async function upsertKgEntityFromDictionary(input: {
  kind: KgEntityKind;
  slug: string;
  title: string;
  aliases?: string[];
  category?: string;
  description?: string;
  image_url?: string | null;
  first_seen_source?: string | null;
  status?: KgEntity["status"];
  legacy_game_table?: string | null;
  legacy_game_id?: string | null;
}): Promise<KgEntity | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kg_entities")
    .upsert(
      {
        kind: input.kind,
        slug: input.slug,
        title: input.title,
        aliases: input.aliases ?? [],
        category: input.category ?? "",
        description: input.description ?? "",
        image_url: input.image_url ?? null,
        first_seen_source: input.first_seen_source ?? "dictionary",
        first_seen_date: new Date().toISOString(),
        status: input.status ?? "published",
        legacy_game_table: input.legacy_game_table ?? null,
        legacy_game_id: input.legacy_game_id ?? null,
      },
      { onConflict: "kind,slug" }
    )
    .select(ENTITY_SELECT)
    .single();

  if (error || !data) return null;
  return rowToEntity(data as Record<string, unknown>);
}

export async function syncKgEntitiesFromGameTables(): Promise<{
  synced: number;
  skipped: number;
}> {
  if (!isSupabaseAdminConfigured()) return { synced: 0, skipped: 0 };

  const supabase = createAdminClient();
  let synced = 0;
  let skipped = 0;

  for (const kind of ALL_ENTITY_KINDS) {
    const config = ENTITY_KINDS[kind as keyof typeof ENTITY_KINDS];
    const kgKind = GAME_TABLE_TO_KG_KIND[config.table];
    if (!kgKind) {
      skipped++;
      continue;
    }

    const { data: rows } = await supabase.from(config.table).select("*");
    for (const row of rows ?? []) {
      const record = row as Record<string, unknown>;
      const result = await upsertKgEntityFromDictionary({
        kind: kgKind,
        slug: record.slug as string,
        title: record.title as string,
        aliases: [],
        category: (record.category as string) ?? kgKind,
        description: (record.description as string) ?? "",
        image_url: (record.image_url as string | null) ?? null,
        first_seen_source: "game_entity_sync",
        status: record.status === "published" ? "published" : "draft",
        legacy_game_table: config.table,
        legacy_game_id: record.id as string,
      });
      if (result) synced++;
      else skipped++;
    }
  }

  return { synced, skipped };
}

export async function linkArticleEntity(
  articleId: string,
  entityId: string,
  confidence: number,
  mentionCount: number,
  source: KgLinkSource = "extracted"
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;

  const supabase = createAdminClient();
  const { error } = await supabase.from("article_entities").upsert(
    {
      article_id: articleId,
      entity_id: entityId,
      confidence,
      mention_count: mentionCount,
      source,
    },
    { onConflict: "article_id,entity_id" }
  );

  return !error;
}

export async function getRelatedEntitiesForArticle(
  articleId: string
): Promise<RelatedEntity[]> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");

  if (!isSupabaseAdminConfigured() && !isSupabaseConfigured()) return [];

  const supabase = isSupabaseAdminConfigured()
    ? createAdminClient()
    : await (async () => {
        const { createClient } = await import("@/lib/supabase/server");
        return createClient();
      })();

  const { data } = await supabase
    .from("article_entities")
    .select(
      "confidence, mention_count, entity:kg_entities(id, kind, slug, title, status)"
    )
    .eq("article_id", articleId)
    .order("mention_count", { ascending: false });

  return mapPublicRelatedEntities(data ?? []);
}

function mapPublicRelatedEntities(rows: unknown[]): RelatedEntity[] {
  const results: RelatedEntity[] = [];

  for (const row of rows) {
    const record = row as {
      confidence: number;
      mention_count: number;
      entity: Record<string, unknown> | Array<Record<string, unknown>> | null;
    };
    const entity = Array.isArray(record.entity) ? record.entity[0] : record.entity;
    if (!entity || entity.status !== "published") continue;

    const kind = entity.kind as KgEntityKind;
    const slug = entity.slug as string;
    results.push({
      id: entity.id as string,
      kind,
      slug,
      title: entity.title as string,
      href: kgEntityHref(kind, slug),
      confidence: Number(record.confidence),
      mention_count: Number(record.mention_count),
    });
  }

  return results;
}

export async function getEntityLinkCounts(): Promise<{
  articles: number;
  videos: number;
  maps: number;
}> {
  if (!isSupabaseAdminConfigured()) {
    return { articles: 0, videos: 0, maps: 0 };
  }

  const supabase = createAdminClient();
  const [{ count: articles }, { count: videos }, { count: maps }] =
    await Promise.all([
      supabase.from("article_entities").select("*", { count: "exact", head: true }),
      supabase.from("video_entities").select("*", { count: "exact", head: true }),
      supabase.from("map_entities").select("*", { count: "exact", head: true }),
    ]);

  return {
    articles: articles ?? 0,
    videos: videos ?? 0,
    maps: maps ?? 0,
  };
}

export async function getOrphanEntities(): Promise<
  Array<KgEntity & { articleCount: number; videoCount: number; mapCount: number }>
> {
  const entities = await getAllKgEntities();
  if (entities.length === 0) return [];

  const supabase = createAdminClient();
  const [articleLinks, videoLinks, mapLinks] = await Promise.all([
    supabase.from("article_entities").select("entity_id"),
    supabase.from("video_entities").select("entity_id"),
    supabase.from("map_entities").select("entity_id"),
  ]);

  const articleCounts = new Map<string, number>();
  const videoCounts = new Map<string, number>();
  const mapCounts = new Map<string, number>();

  for (const row of articleLinks.data ?? []) {
    const id = row.entity_id as string;
    articleCounts.set(id, (articleCounts.get(id) ?? 0) + 1);
  }
  for (const row of videoLinks.data ?? []) {
    const id = row.entity_id as string;
    videoCounts.set(id, (videoCounts.get(id) ?? 0) + 1);
  }
  for (const row of mapLinks.data ?? []) {
    const id = row.entity_id as string;
    mapCounts.set(id, (mapCounts.get(id) ?? 0) + 1);
  }

  return entities
    .map((entity) => ({
      ...entity,
      articleCount: articleCounts.get(entity.id) ?? 0,
      videoCount: videoCounts.get(entity.id) ?? 0,
      mapCount: mapCounts.get(entity.id) ?? 0,
    }))
    .filter((e) => e.articleCount + e.videoCount + e.mapCount === 0);
}
