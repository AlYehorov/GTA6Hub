import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { SourceConnector } from "@/lib/sources/types";
import type { SourceItem, SourceItemInput } from "@/lib/types/source";
import { getAllConnectors } from "@/lib/sources/registry";

export interface IngestionResult {
  inserted: number;
  skipped: number;
  items: SourceItem[];
}

export class SourceIngestionService {
  async ingestFromConnector(connector: SourceConnector): Promise<IngestionResult> {
    const inputs = await connector.fetchItems();
    return this.ingestItems(inputs);
  }

  async ingestAllConnectors(): Promise<IngestionResult> {
    const allInputs = await Promise.all(
      getAllConnectors().map((c) => c.fetchItems())
    );
    return this.ingestItems(allInputs.flat());
  }

  async ingestItems(inputs: SourceItemInput[]): Promise<IngestionResult> {
    if (!isSupabaseAdminConfigured()) {
      throw new Error("Supabase admin is not configured");
    }

    const supabase = createAdminClient();
    const items: SourceItem[] = [];
    let inserted = 0;
    let skipped = 0;

    for (const input of inputs) {
      const { data: existing } = await supabase
        .from("source_items")
        .select("id")
        .eq("source", input.source)
        .eq("external_id", input.external_id)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { data, error } = await supabase
        .from("source_items")
        .insert({
          source: input.source,
          source_type: input.source_type,
          source_url: input.source_url,
          external_id: input.external_id,
          title: input.title,
          content: input.content,
          published_at: input.published_at ?? null,
          processed: false,
        })
        .select("*")
        .single();

      if (error) throw new Error(`Ingest failed: ${error.message}`);
      items.push(data as SourceItem);
      inserted++;
    }

    return { inserted, skipped, items };
  }

  async getUnprocessedItems(limit = 50): Promise<SourceItem[]> {
    if (!isSupabaseAdminConfigured()) return [];

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("source_items")
      .select("*")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as SourceItem[];
  }

  async markProcessed(id: string): Promise<void> {
    if (!isSupabaseAdminConfigured()) return;

    const supabase = createAdminClient();
    await supabase.from("source_items").update({ processed: true }).eq("id", id);
  }
}

export const sourceIngestionService = new SourceIngestionService();
