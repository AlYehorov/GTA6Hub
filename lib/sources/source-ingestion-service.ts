import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { SourceConnector } from "@/lib/sources/types";
import type { SourceItem, SourceItemInput } from "@/lib/types/source";
import { enforceSourceLabel } from "@/lib/types/source";
import { getAllConnectors, getProductionConnectors } from "@/lib/sources/registry";
import { hashString } from "@/lib/sources/fetch-utils";

export interface IngestionResult {
  inserted: number;
  skipped: number;
  items: SourceItem[];
  errors: string[];
}

export class SourceIngestionService {
  async ingestFromConnector(connector: SourceConnector): Promise<IngestionResult> {
    try {
      const inputs = await connector.fetchItems();
      return this.ingestItems(inputs);
    } catch (err) {
      return {
        inserted: 0,
        skipped: 0,
        items: [],
        errors: [
          `${connector.platform}: ${err instanceof Error ? err.message : "fetch failed"}`,
        ],
      };
    }
  }

  async ingestAllConnectors(): Promise<IngestionResult> {
    return this.ingestFromMultiple(getAllConnectors());
  }

  async ingestProductionConnectors(): Promise<IngestionResult> {
    return this.ingestFromMultiple(getProductionConnectors());
  }

  private async ingestFromMultiple(connectors: SourceConnector[]): Promise<IngestionResult> {
    const merged: IngestionResult = {
      inserted: 0,
      skipped: 0,
      items: [],
      errors: [],
    };

    for (const connector of connectors) {
      const result = await this.ingestFromConnector(connector);
      merged.inserted += result.inserted;
      merged.skipped += result.skipped;
      merged.items.push(...result.items);
      merged.errors.push(...result.errors);
    }

    return merged;
  }

  async ingestItems(inputs: SourceItemInput[]): Promise<IngestionResult> {
    if (!isSupabaseAdminConfigured()) {
      throw new Error("Supabase admin is not configured");
    }

    const supabase = createAdminClient();
    const items: SourceItem[] = [];
    let inserted = 0;
    let skipped = 0;

    for (const raw of inputs) {
      const input: SourceItemInput = {
        ...raw,
        source_label: enforceSourceLabel(raw),
        external_id: raw.external_id || hashString(raw.source_url),
      };

      const { data: byExternalId } = await supabase
        .from("source_items")
        .select("id")
        .eq("source", input.source)
        .eq("external_id", input.external_id)
        .maybeSingle();

      if (byExternalId) {
        skipped++;
        continue;
      }

      const { data: byUrl } = await supabase
        .from("source_items")
        .select("id")
        .eq("source_url", input.source_url)
        .maybeSingle();

      if (byUrl) {
        skipped++;
        continue;
      }

      const { data, error } = await supabase
        .from("source_items")
        .insert({
          source: input.source,
          source_type: input.source_type,
          source_label: input.source_label,
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

    return { inserted, skipped, items, errors: [] };
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
