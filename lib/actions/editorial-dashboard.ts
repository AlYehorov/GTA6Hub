"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { confidenceThresholdPercent } from "@/lib/editorial/confidence";
import { aiDraftService } from "@/lib/ai/ai-draft-service";
import { getSourceItemByIdAdmin } from "@/lib/sources/queries";
import { sourceIngestionService } from "@/lib/sources/source-ingestion-service";
import { ingestAndDraftWorkflow } from "@/lib/workflows/ingest-and-draft-workflow";
import { isGta6SourceItem } from "@/lib/gta6/content-filter";
import {
  editorialReportCacheTag,
  getEditorialDailyReport,
} from "@/lib/editorial/daily-report";

export interface EditorialActionResult {
  success: boolean;
  error?: string;
  draftId?: string;
  redirectTo?: string;
}

function revalidateEditorialPaths() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/editorial");
  revalidatePath("/admin/drafts");
  revalidatePath("/admin/articles");
  revalidateTag(editorialReportCacheTag());
}

export async function refreshEditorialDailyReport(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  revalidateTag(editorialReportCacheTag());
  await getEditorialDailyReport({ bypassCache: true });
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function generateDraftFromSource(
  sourceItemId: string
): Promise<EditorialActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  const source = await getSourceItemByIdAdmin(sourceItemId);
  if (!source) return { success: false, error: "Source not found" };

  if (!isGta6SourceItem(source)) {
    return { success: false, error: "Source is not GTA 6 related" };
  }

  try {
    const draft = await aiDraftService.createDraft(source);
    await sourceIngestionService.markProcessed(source.id);
    revalidateEditorialPaths();
    if (!draft) {
      const min = confidenceThresholdPercent(source.source_label);
      return {
        success: false,
        error: `Draft confidence below ${min}% threshold for ${source.source_label} sources — not saved`,
      };
    }
    return {
      success: true,
      draftId: draft.id,
      redirectTo: `/admin/drafts/${draft.id}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Draft generation failed",
    };
  }
}

export async function processPendingSourcesFromDashboard(): Promise<EditorialActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  try {
    await ingestAndDraftWorkflow.processUnprocessedSources();
    revalidateEditorialPaths();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Processing failed",
    };
  }
}
