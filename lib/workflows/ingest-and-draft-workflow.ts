import { sourceIngestionService } from "@/lib/sources/source-ingestion-service";
import { aiDraftService } from "@/lib/ai/ai-draft-service";
import { upsertVideoFromYoutubeSource } from "@/lib/videos/queries";
import { isGta6SourceItem } from "@/lib/gta6/content-filter";
import type { SourceItem, SourcePlatform } from "@/lib/types/source";
import { getConnector } from "@/lib/sources/registry";

export interface WorkflowResult {
  ingested: number;
  skipped: number;
  draftsCreated: number;
  errors: string[];
}

/**
 * End-to-end workflow: ingest sources → generate AI drafts.
 * Never publishes — human review is mandatory.
 */
export class IngestAndDraftWorkflow {
  /** Production cron cycle: real connectors + all unprocessed items. */
  async runFullCycle(): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      ingested: 0,
      skipped: 0,
      draftsCreated: 0,
      errors: [],
    };

    try {
      const ingestion = await sourceIngestionService.ingestProductionConnectors();
      result.ingested = ingestion.inserted;
      result.skipped = ingestion.skipped;
      result.errors.push(...ingestion.errors);

      for (const source of ingestion.items) {
        try {
          await this.processSource(source, result);
        } catch (err) {
          result.errors.push(
            err instanceof Error ? err.message : `Draft failed for ${source.id}`
          );
        }
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : "Ingestion failed");
    }

    const backlog = await this.processUnprocessedSources();
    result.draftsCreated += backlog.draftsCreated;
    result.errors.push(...backlog.errors);

    return result;
  }

  async runAll(): Promise<WorkflowResult> {
    return this.runIngestion(() => sourceIngestionService.ingestAllConnectors());
  }

  async runForPlatform(platform: SourcePlatform): Promise<WorkflowResult> {
    const connector = getConnector(platform);
    return this.runIngestion(() => sourceIngestionService.ingestFromConnector(connector));
  }

  async processUnprocessedSources(): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      ingested: 0,
      skipped: 0,
      draftsCreated: 0,
      errors: [],
    };

    const unprocessed = await sourceIngestionService.getUnprocessedItems();

    for (const source of unprocessed) {
      try {
        await this.processSource(source, result);
      } catch (err) {
        result.errors.push(
          err instanceof Error ? err.message : `Failed to process ${source.id}`
        );
      }
    }

    return result;
  }

  private async runIngestion(
    ingestFn: () => ReturnType<typeof sourceIngestionService.ingestAllConnectors>
  ): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      ingested: 0,
      skipped: 0,
      draftsCreated: 0,
      errors: [],
    };

    try {
      const ingestion = await ingestFn();
      result.ingested = ingestion.inserted;
      result.skipped = ingestion.skipped;
      result.errors.push(...ingestion.errors);

      for (const source of ingestion.items) {
        try {
          await this.processSource(source, result);
        } catch (err) {
          result.errors.push(
            err instanceof Error ? err.message : `Draft failed for ${source.id}`
          );
        }
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : "Ingestion failed");
    }

    return result;
  }

  private async processSource(source: SourceItem, result: WorkflowResult): Promise<void> {
    if (!isGta6SourceItem(source)) {
      await sourceIngestionService.markProcessed(source.id);
      result.skipped++;
      return;
    }

    await this.prepareSourceSideEffects(source);
    const draft = await aiDraftService.createDraft(source);
    await sourceIngestionService.markProcessed(source.id);
    if (draft) result.draftsCreated++;
    else result.skipped++;
  }

  private async prepareSourceSideEffects(source: SourceItem): Promise<void> {
    if (source.source_type !== "youtube_video" || source.source !== "rockstar_youtube") {
      return;
    }

    await upsertVideoFromYoutubeSource({
      title: source.title,
      youtube_id: source.external_id,
      description: source.content,
      source_url: source.source_url,
      source_item_id: source.id,
      published_at: source.published_at,
      autoPublish: true,
    });
  }
}

export const ingestAndDraftWorkflow = new IngestAndDraftWorkflow();
