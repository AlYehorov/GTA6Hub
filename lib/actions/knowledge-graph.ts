"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { runKnowledgeGraphExtraction } from "@/lib/knowledge-graph/pipeline";
import { syncKgEntitiesFromGameTables } from "@/lib/knowledge-graph/queries";

const PATHS = ["/admin/entities", "/admin/dashboard"];

function revalidate() {
  for (const path of PATHS) {
    revalidatePath(path);
  }
}

export async function runKgExtraction(): Promise<{
  success: boolean;
  result?: Awaited<ReturnType<typeof runKnowledgeGraphExtraction>>;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await runKnowledgeGraphExtraction();
    revalidate();
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}

export async function syncKgFromGameEntities(): Promise<{
  success: boolean;
  synced?: number;
  skipped?: number;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await syncKgEntitiesFromGameTables();
    revalidate();
    return { success: true, ...result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Sync failed",
    };
  }
}
