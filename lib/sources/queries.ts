import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { SourceItem } from "@/lib/types/source";

export async function getAllSourceItemsAdmin(limit = 100): Promise<SourceItem[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("source_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

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
