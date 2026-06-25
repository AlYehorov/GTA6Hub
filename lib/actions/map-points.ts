"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { slugify } from "@/lib/utils/article";
import type { MapPointFormData, MapPointStatus } from "@/lib/types/map-point";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function revalidateMapPaths() {
  revalidatePath("/map");
  revalidatePath("/admin/map");
  revalidatePath("/admin");
}

function clampCoord(value: number): number {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function buildPayload(data: MapPointFormData, createdBy?: string | null) {
  return {
    title: data.title.trim(),
    slug: data.slug.trim() || slugify(data.title),
    description: data.description.trim(),
    type: data.type,
    district: data.district.trim() || null,
    lat: clampCoord(data.lat),
    lng: clampCoord(data.lng),
    image_url: data.image_url.trim() || null,
    spoiler: data.spoiler,
    verified: data.verified,
    status: data.status,
    source_url: data.source_url.trim() || null,
    ...(createdBy !== undefined ? { created_by: createdBy } : {}),
  };
}

export async function createMapPoint(data: MapPointFormData): Promise<ActionResult> {
  try {
    const user = await requireAdminUser();
    if (!isSupabaseAdminConfigured()) {
      return { success: false, error: "Supabase admin is not configured" };
    }

    const supabase = createAdminClient();
    const { data: point, error } = await supabase
      .from("map_points")
      .insert(buildPayload(data, user.email))
      .select("id")
      .single();

    if (error || !point) {
      return { success: false, error: error?.message ?? "Failed to create map point" };
    }

    revalidateMapPaths();
    return { success: true, id: point.id };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function updateMapPoint(id: string, data: MapPointFormData): Promise<ActionResult> {
  try {
    await requireAdminUser();
    if (!isSupabaseAdminConfigured()) {
      return { success: false, error: "Supabase admin is not configured" };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("map_points").update(buildPayload(data)).eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidateMapPaths();
    return { success: true, id };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function updateMapPointStatus(
  id: string,
  status: MapPointStatus
): Promise<ActionResult> {
  try {
    await requireAdminUser();
    if (!isSupabaseAdminConfigured()) {
      return { success: false, error: "Supabase admin is not configured" };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("map_points").update({ status }).eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidateMapPaths();
    return { success: true, id };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function deleteMapPoint(id: string): Promise<ActionResult> {
  try {
    await requireAdminUser();
    if (!isSupabaseAdminConfigured()) {
      return { success: false, error: "Supabase admin is not configured" };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("map_points").delete().eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidateMapPaths();
    return { success: true, id };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function createMapPointAndRedirect(data: MapPointFormData): Promise<void> {
  const result = await createMapPoint(data);
  if (result.success && result.id) {
    redirect(`/admin/map/${result.id}`);
  }
  throw new Error(result.error ?? "Failed to create map point");
}
