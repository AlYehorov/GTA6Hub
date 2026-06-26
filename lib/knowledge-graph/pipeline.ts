import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { KG_DICTIONARY } from "@/lib/knowledge-graph/dictionaries";
import { extractEntitiesFromArticle, extractEntitiesFromText } from "@/lib/knowledge-graph/extractor";
import {
  getAllKgEntities,
  linkArticleEntity,
  upsertKgEntityFromDictionary,
} from "@/lib/knowledge-graph/queries";

export async function seedDictionaryEntities(): Promise<number> {
  let count = 0;
  for (const entry of KG_DICTIONARY) {
    const result = await upsertKgEntityFromDictionary({
      kind: entry.kind,
      slug: entry.slug,
      title: entry.title,
      aliases: entry.aliases,
      category: entry.category,
      first_seen_source: "dictionary",
      status: "published",
    });
    if (result) count++;
  }
  return count;
}

export async function extractArticleEntities(limit = 100): Promise<{
  articles: number;
  links: number;
  entitiesCreated: number;
}> {
  if (!isSupabaseAdminConfigured()) {
    return { articles: 0, links: 0, entitiesCreated: 0 };
  }

  await seedDictionaryEntities();
  const known = await getAllKgEntities();
  const supabase = createAdminClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, excerpt, content")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(limit);

  let links = 0;
  let entitiesCreated = 0;

  for (const article of articles ?? []) {
    const matches = extractEntitiesFromArticle({
      title: article.title as string,
      excerpt: (article.excerpt as string | null) ?? null,
      content: article.content as string,
    });

    for (const match of matches) {
      const existing = known.find(
        (e) => e.kind === match.kind && e.slug === match.slug
      );
      const entity =
        existing ??
        (await upsertKgEntityFromDictionary({
          kind: match.kind,
          slug: match.slug,
          title: match.title,
          category: match.category,
          first_seen_source: "extracted",
          status: "published",
        }));

      if (!entity) continue;
      if (!existing) {
        known.push(entity);
        entitiesCreated++;
      }

      const ok = await linkArticleEntity(
        article.id as string,
        entity.id,
        match.confidence,
        match.mention_count,
        "extracted"
      );
      if (ok) links++;
    }
  }

  return { articles: articles?.length ?? 0, links, entitiesCreated };
}

export async function extractVideoEntities(limit = 50): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;

  const known = await getAllKgEntities();
  const supabase = createAdminClient();
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, description")
    .eq("status", "published")
    .limit(limit);

  let links = 0;

  for (const video of videos ?? []) {
    const corpus = `${video.title}\n${video.description ?? ""}`;
    const matches = extractEntitiesFromText(corpus, known);

    for (const match of matches) {
      const entity = known.find(
        (e) => e.kind === match.kind && e.slug === match.slug
      );
      if (!entity) continue;

      const { error } = await supabase.from("video_entities").upsert(
        {
          video_id: video.id,
          entity_id: entity.id,
          confidence: match.confidence,
          mention_count: match.mention_count,
          source: "extracted",
        },
        { onConflict: "video_id,entity_id" }
      );
      if (!error) links++;
    }
  }

  return links;
}

export async function extractMapEntities(limit = 100): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;

  const known = await getAllKgEntities();
  const supabase = createAdminClient();
  const { data: points } = await supabase
    .from("map_points")
    .select("id, title, description, district")
    .eq("status", "published")
    .limit(limit);

  let links = 0;

  for (const point of points ?? []) {
    const corpus = [point.title, point.description, point.district]
      .filter(Boolean)
      .join("\n");
    const matches = extractEntitiesFromText(corpus, known);

    for (const match of matches) {
      const entity = known.find(
        (e) => e.kind === match.kind && e.slug === match.slug
      );
      if (!entity) continue;

      const { error } = await supabase.from("map_entities").upsert(
        {
          map_point_id: point.id,
          entity_id: entity.id,
          confidence: match.confidence,
          mention_count: match.mention_count,
          source: "extracted",
        },
        { onConflict: "map_point_id,entity_id" }
      );
      if (!error) links++;
    }
  }

  return links;
}

export async function runKnowledgeGraphExtraction(): Promise<{
  dictionarySeeded: number;
  gameSynced: { synced: number; skipped: number };
  articles: { articles: number; links: number; entitiesCreated: number };
  videoLinks: number;
  mapLinks: number;
}> {
  const { syncKgEntitiesFromGameTables } = await import(
    "@/lib/knowledge-graph/queries"
  );

  const dictionarySeeded = await seedDictionaryEntities();
  const gameSynced = await syncKgEntitiesFromGameTables();
  const articles = await extractArticleEntities(200);
  const videoLinks = await extractVideoEntities(50);
  const mapLinks = await extractMapEntities(100);

  return {
    dictionarySeeded,
    gameSynced,
    articles,
    videoLinks,
    mapLinks,
  };
}
