import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { SourceItem, SourcePlatform } from "@/lib/types/source";

export interface SourceItemFilters {
  source?: SourcePlatform;
  processed?: boolean;
  limit?: number;
}

export async function getAllSourceItemsAdmin(
  filters: SourceItemFilters = {}
): Promise<SourceItem[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  let query = supabase
    .from("source_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  if (filters.processed !== undefined) {
    query = query.eq("processed", filters.processed);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as SourceItem[];
}

export async function getSourceItemStats(): Promise<{
  total: number;
  processed: number;
  pending: number;
}> {
  if (!isSupabaseAdminConfigured()) {
    return { total: 0, processed: 0, pending: 0 };
  }

  const supabase = createAdminClient();
  const { data } = await supabase.from("source_items").select("processed");

  const items = data ?? [];
  const processed = items.filter((i) => i.processed).length;

  return {
    total: items.length,
    processed,
    pending: items.length - processed,
  };
}
