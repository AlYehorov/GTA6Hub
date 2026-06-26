import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  findAliasCollisions,
  findDuplicateGroups,
  suggestMerges,
} from "@/lib/knowledge-graph/analyzer";
import {
  getAllKgEntities,
  getEntityLinkCounts,
  getOrphanEntities,
} from "@/lib/knowledge-graph/queries";
import type { KgAdminData, KgEntityKind } from "@/lib/knowledge-graph/types";
import { KG_ENTITY_KINDS } from "@/lib/knowledge-graph/types";

export async function loadKgAdminData(): Promise<KgAdminData> {
  const configured = isSupabaseAdminConfigured();

  if (!configured) {
    return {
      totalEntities: 0,
      byKind: Object.fromEntries(
        KG_ENTITY_KINDS.map((k) => [k, 0])
      ) as Record<KgEntityKind, number>,
      totalArticleLinks: 0,
      totalVideoLinks: 0,
      totalMapLinks: 0,
      duplicates: [],
      aliasCollisions: [],
      orphans: [],
      mergeSuggestions: [],
      recentEntities: [],
      configured: false,
    };
  }

  const [entities, linkCounts, orphans] = await Promise.all([
    getAllKgEntities(),
    getEntityLinkCounts(),
    getOrphanEntities(),
  ]);

  const byKind = Object.fromEntries(
    KG_ENTITY_KINDS.map((k) => [k, 0])
  ) as Record<KgEntityKind, number>;
  for (const entity of entities) {
    byKind[entity.kind] = (byKind[entity.kind] ?? 0) + 1;
  }

  const duplicates = findDuplicateGroups(entities);
  const aliasCollisions = findAliasCollisions(entities);
  const mergeSuggestions = suggestMerges(entities).slice(0, 20);
  const recentEntities = [...entities]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 12);

  return {
    totalEntities: entities.length,
    byKind,
    totalArticleLinks: linkCounts.articles,
    totalVideoLinks: linkCounts.videos,
    totalMapLinks: linkCounts.maps,
    duplicates: duplicates.slice(0, 15),
    aliasCollisions: aliasCollisions.slice(0, 15),
    orphans: orphans.slice(0, 20),
    mergeSuggestions,
    recentEntities,
    configured: true,
  };
}
