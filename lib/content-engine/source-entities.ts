import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { extractEntitiesFromText } from "@/lib/knowledge-graph/extractor";
import {
  getAllKgEntities,
  upsertKgEntityFromDictionary,
} from "@/lib/knowledge-graph/queries";
import type { RelatedEntity } from "@/lib/knowledge-graph/types";
import { kgEntityHref } from "@/lib/knowledge-graph/types";
import type { SourceItem } from "@/lib/types/source";

export async function extractAndLinkSourceEntities(
  source: SourceItem
): Promise<RelatedEntity[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const known = await getAllKgEntities();
  const corpus = `${source.title}\n${source.content}`;
  const matches = extractEntitiesFromText(corpus, known);
  const supabase = createAdminClient();
  const results: RelatedEntity[] = [];

  for (const match of matches) {
    let entity = known.find(
      (e) => e.kind === match.kind && e.slug === match.slug
    );
    if (!entity) {
      entity =
        (await upsertKgEntityFromDictionary({
          kind: match.kind,
          slug: match.slug,
          title: match.title,
          category: match.category,
          first_seen_source: source.id,
          status: "published",
        })) ?? undefined;
      if (entity) known.push(entity);
    }
    if (!entity) continue;

    await supabase.from("source_entities").upsert(
      {
        source_item_id: source.id,
        entity_id: entity.id,
        confidence: match.confidence,
        mention_count: match.mention_count,
        source: "extracted",
      },
      { onConflict: "source_item_id,entity_id" }
    );

    results.push({
      id: entity.id,
      kind: entity.kind,
      slug: entity.slug,
      title: entity.title,
      href: kgEntityHref(entity.kind, entity.slug),
      confidence: match.confidence,
      mention_count: match.mention_count,
    });
  }

  return results;
}

export async function getSourceEntities(
  sourceId: string
): Promise<RelatedEntity[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("source_entities")
    .select(
      "confidence, mention_count, entity:kg_entities(id, kind, slug, title, status)"
    )
    .eq("source_item_id", sourceId);

  const results: RelatedEntity[] = [];
  for (const row of data ?? []) {
    const entity = Array.isArray(row.entity) ? row.entity[0] : row.entity;
    if (!entity || entity.status !== "published") continue;
    results.push({
      id: entity.id as string,
      kind: entity.kind as RelatedEntity["kind"],
      slug: entity.slug as string,
      title: entity.title as string,
      href: kgEntityHref(entity.kind as RelatedEntity["kind"], entity.slug as string),
      confidence: Number(row.confidence),
      mention_count: Number(row.mention_count),
    });
  }
  return results;
}
