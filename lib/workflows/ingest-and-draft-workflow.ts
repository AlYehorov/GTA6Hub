import { sourceIngestionService } from "@/lib/sources/source-ingestion-service";
import { aiDraftService } from "@/lib/ai/ai-draft-service";
import type { SourcePlatform } from "@/lib/types/source";
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
        await aiDraftService.createDraft(source);
        await sourceIngestionService.markProcessed(source.id);
        result.draftsCreated++;
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

      for (const source of ingestion.items) {
        try {
          await aiDraftService.createDraft(source);
          await sourceIngestionService.markProcessed(source.id);
          result.draftsCreated++;
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
}

export const ingestAndDraftWorkflow = new IngestAndDraftWorkflow();
