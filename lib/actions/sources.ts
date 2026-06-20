"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { ingestAndDraftWorkflow } from "@/lib/workflows/ingest-and-draft-workflow";
import type { SourcePlatform } from "@/lib/types/source";

export interface ActionResult {
  success: boolean;
  error?: string;
  result?: {
    ingested: number;
    skipped: number;
    draftsCreated: number;
    errors: string[];
  };
}

function revalidateSourcePaths() {
  revalidatePath("/admin/sources");
  revalidatePath("/admin/drafts");
  revalidatePath("/admin");
}

export async function runFullIngestionWorkflow(): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  try {
    const result = await ingestAndDraftWorkflow.runAll();
    revalidateSourcePaths();
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Workflow failed",
    };
  }
}

export async function runPlatformIngestion(
  platform: SourcePlatform
): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  try {
    const result = await ingestAndDraftWorkflow.runForPlatform(platform);
    revalidateSourcePaths();
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Workflow failed",
    };
  }
}

export async function processPendingSources(): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  try {
    const result = await ingestAndDraftWorkflow.processUnprocessedSources();
    revalidateSourcePaths();
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Processing failed",
    };
  }
}
