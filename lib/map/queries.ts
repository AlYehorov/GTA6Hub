import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { MapPoint, MapPointStatus, MapPointType } from "@/lib/types/map-point";
import type { ArticleRelatedMapPoint } from "@/lib/types/related-content";

function rowToMapPoint(row: Record<string, unknown>): MapPoint {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string,
    type: row.type as MapPointType,
    district: (row.district as string | null) ?? null,
    lat: Number(row.lat),
    lng: Number(row.lng),
    image_url: (row.image_url as string | null) ?? null,
    spoiler: Boolean(row.spoiler),
    verified: Boolean(row.verified),
    status: row.status as MapPointStatus,
    source_url: (row.source_url as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getPublishedMapPoints(): Promise<MapPoint[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("map_points")
    .select("*")
    .eq("status", "published")
    .order("title", { ascending: true });

  if (error) return [];
  return (data ?? []).map(rowToMapPoint);
}

export async function getAllMapPointsAdmin(): Promise<MapPoint[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("map_points")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(rowToMapPoint);
}

export async function getMapPointByIdAdmin(id: string): Promise<MapPoint | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("map_points").select("*").eq("id", id).single();

  if (error || !data) return null;
  return rowToMapPoint(data);
}

export async function getMapPointStats(): Promise<Record<MapPointStatus, number>> {
  const stats: Record<MapPointStatus, number> = {
    draft: 0,
    pending: 0,
    published: 0,
    rejected: 0,
  };

  if (!isSupabaseAdminConfigured()) return stats;

  const supabase = createAdminClient();
  const { data } = await supabase.from("map_points").select("status");

  for (const row of data ?? []) {
    const status = row.status as MapPointStatus;
    if (status in stats) stats[status]++;
  }

  return stats;
}

/**
 * Future: match map points by district/tags mentioned in article content.
 * Returns empty array until article↔map linking is implemented.
 */
export async function getRelatedMapPointsForArticle(
  _articleId: string
): Promise<ArticleRelatedMapPoint[]> {
  void _articleId;
  return [];
}
