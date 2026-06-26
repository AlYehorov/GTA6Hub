"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import {
  claimEditorialTask,
  insertEditorialTasks,
  updateEditorialTaskStatus,
} from "@/lib/workflow/queries";
import { generateEditorialTaskCandidates } from "@/lib/workflow/task-generator";
import type { EditorialTaskStatus } from "@/lib/workflow/types";

const WORKFLOW_PATHS = ["/admin/workflow", "/admin/dashboard", "/admin/seo"];

function revalidateWorkflow() {
  for (const path of WORKFLOW_PATHS) {
    revalidatePath(path);
  }
}

export async function generateWorkflowTasks(): Promise<{
  success: boolean;
  inserted?: number;
  skipped?: number;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const candidates = await generateEditorialTaskCandidates();
    const result = await insertEditorialTasks(candidates);
    revalidateWorkflow();
    return { success: true, ...result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Generation failed",
    };
  }
}

export async function claimWorkflowTask(taskId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAdminUser();
    const ok = await claimEditorialTask(taskId, user.email ?? "admin");
    if (!ok) return { success: false, error: "Failed to claim task" };
    revalidateWorkflow();
    return { success: true };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function updateWorkflowTaskStatus(
  taskId: string,
  status: EditorialTaskStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminUser();
    const ok = await updateEditorialTaskStatus(taskId, status);
    if (!ok) return { success: false, error: "Failed to update task" };
    revalidateWorkflow();
    return { success: true };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function markWorkflowTaskReady(taskId: string) {
  return updateWorkflowTaskStatus(taskId, "ready");
}

export async function completeWorkflowTask(taskId: string) {
  return updateWorkflowTaskStatus(taskId, "published");
}

export async function archiveWorkflowTask(taskId: string) {
  return updateWorkflowTaskStatus(taskId, "archived");
}

export async function cancelWorkflowTask(taskId: string) {
  return updateWorkflowTaskStatus(taskId, "cancelled");
}
