import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { GameEntity, GameEntityKind } from "@/lib/types/game-entity";
import { ALL_ENTITY_KINDS, ENTITY_KINDS } from "@/lib/entities/config";

function rowToEntity(row: Record<string, unknown>): GameEntity {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    image_url: (row.image_url as string | null) ?? null,
    category: row.category as string,
    seo_title: (row.seo_title as string | null) ?? null,
    seo_description: (row.seo_description as string | null) ?? null,
    status: row.status as GameEntity["status"],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getEntityBySlug(
  kind: GameEntityKind,
  slug: string
): Promise<GameEntity | null> {
  if (!isSupabaseConfigured()) return null;

  const { table } = ENTITY_KINDS[kind];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return rowToEntity(data);
}

export async function getPublishedEntities(kind: GameEntityKind): Promise<GameEntity[]> {
  if (!isSupabaseConfigured()) return [];

  const { table } = ENTITY_KINDS[kind];
  const supabase = await createClient();
  const { data } = await supabase
    .from(table)
    .select("*")
    .eq("status", "published")
    .order("title", { ascending: true });

  return (data ?? []).map(rowToEntity);
}

export async function getAllPublishedEntitySlugs(): Promise<
  { kind: GameEntityKind; slug: string; updated_at: string }[]
> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const results: { kind: GameEntityKind; slug: string; updated_at: string }[] = [];

  await Promise.all(
    ALL_ENTITY_KINDS.map(async (kind) => {
      const { table } = ENTITY_KINDS[kind];
      const { data } = await supabase
        .from(table)
        .select("slug, updated_at")
        .eq("status", "published");

      for (const row of data ?? []) {
        results.push({
          kind,
          slug: row.slug as string,
          updated_at: row.updated_at as string,
        });
      }
    })
  );

  return results;
}

export async function searchEntities(query: string, limit = 5): Promise<
  { kind: GameEntityKind; entity: GameEntity }[]
> {
  if (!isSupabaseConfigured()) return [];

  const sanitized = query.replace(/[%_,]/g, " ").trim();
  const pattern = `%${sanitized}%`;
  const supabase = await createClient();
  const results: { kind: GameEntityKind; entity: GameEntity }[] = [];

  await Promise.all(
    ALL_ENTITY_KINDS.map(async (kind) => {
      const { table } = ENTITY_KINDS[kind];
      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("status", "published")
        .or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)
        .limit(limit);

      for (const row of data ?? []) {
        results.push({ kind, entity: rowToEntity(row) });
      }
    })
  );

  return results;
}

export async function getRelatedEntities(
  kind: GameEntityKind,
  excludeSlug: string,
  limit = 5
): Promise<{ kind: GameEntityKind; entity: GameEntity }[]> {
  const published = await getPublishedEntities(kind);
  const others = published.filter((e) => e.slug !== excludeSlug).slice(0, 2);

  const crossKind = ALL_ENTITY_KINDS.filter((k) => k !== kind);
  const extra: { kind: GameEntityKind; entity: GameEntity }[] = [];

  for (const k of crossKind) {
    if (extra.length >= limit - others.length) break;
    const items = await getPublishedEntities(k);
    const item = items.find((e) => e.slug !== excludeSlug);
    if (item) extra.push({ kind: k, entity: item });
  }

  return [
    ...others.map((entity) => ({ kind, entity })),
    ...extra,
  ].slice(0, limit);
}
