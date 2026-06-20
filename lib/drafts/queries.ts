import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { AiDraftListItem, AiDraftWithSource } from "@/lib/types/ai-draft";
import type { SourcePlatform } from "@/lib/types/source";

export async function getAllDraftsAdmin(): Promise<AiDraftListItem[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_drafts")
    .select(`
      id, title, confidence, status, created_at,
      source_item:source_items(source)
    `)
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((row) => {
    const sourceItem = row.source_item as unknown as { source: SourcePlatform } | null;
    return {
      id: row.id as string,
      title: row.title as string,
      source: sourceItem?.source ?? "rockstar_newswire",
      confidence: Number(row.confidence),
      status: row.status as AiDraftListItem["status"],
      created_at: row.created_at as string,
    };
  });
}

export async function getDraftByIdAdmin(id: string): Promise<AiDraftWithSource | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_drafts")
    .select(`
      *,
      source_item:source_items(id, source, source_type, source_url, title, published_at)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const { source_item, ...draft } = data;
  return {
    ...(draft as unknown as Omit<AiDraftWithSource, "source_item">),
    source_item: source_item as unknown as AiDraftWithSource["source_item"],
  };
}

export async function getDraftStats(): Promise<Record<string, number>> {
  if (!isSupabaseAdminConfigured()) {
    return { pending: 0, approved: 0, rejected: 0, published: 0 };
  }

  const supabase = createAdminClient();
  const { data } = await supabase.from("ai_drafts").select("status");

  const stats = { pending: 0, approved: 0, rejected: 0, published: 0 };
  for (const row of data ?? []) {
    const status = row.status as keyof typeof stats;
    if (status in stats) stats[status]++;
  }
  return stats;
}
