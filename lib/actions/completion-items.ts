"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { CompletionItemFormData, CompletionItemStatus } from "@/lib/types/completion";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function revalidateTrackerPaths() {
  revalidatePath("/tracker");
  revalidatePath("/admin/tracker");
  revalidatePath("/admin");
}

function buildPayload(data: CompletionItemFormData) {
  return {
    category_id: data.category_id,
    title: data.title.trim(),
    description: data.description.trim(),
    spoiler: data.spoiler,
    difficulty: data.difficulty,
    image_url: data.image_url.trim() || null,
    sort_order: data.sort_order,
    status: data.status,
  };
}

export async function createCompletionItem(data: CompletionItemFormData): Promise<ActionResult> {
  try {
    await requireAdminUser();
    if (!isSupabaseAdminConfigured()) {
      return { success: false, error: "Supabase admin is not configured" };
    }

    const supabase = createAdminClient();
    const { data: item, error } = await supabase
      .from("completion_items")
      .insert(buildPayload(data))
      .select("id")
      .single();

    if (error || !item) {
      return { success: false, error: error?.message ?? "Failed to create item" };
    }

    revalidateTrackerPaths();
    return { success: true, id: item.id };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function updateCompletionItem(
  id: string,
  data: CompletionItemFormData
): Promise<ActionResult> {
  try {
    await requireAdminUser();
    if (!isSupabaseAdminConfigured()) {
      return { success: false, error: "Supabase admin is not configured" };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("completion_items").update(buildPayload(data)).eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidateTrackerPaths();
    return { success: true, id };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function updateCompletionItemStatus(
  id: string,
  status: CompletionItemStatus
): Promise<ActionResult> {
  try {
    await requireAdminUser();
    if (!isSupabaseAdminConfigured()) {
      return { success: false, error: "Supabase admin is not configured" };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("completion_items").update({ status }).eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidateTrackerPaths();
    return { success: true, id };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function deleteCompletionItem(id: string): Promise<ActionResult> {
  try {
    await requireAdminUser();
    if (!isSupabaseAdminConfigured()) {
      return { success: false, error: "Supabase admin is not configured" };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("completion_items").delete().eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidateTrackerPaths();
    return { success: true, id };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}
