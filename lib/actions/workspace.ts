"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { estimateMinutes, estimatePotentialScore } from "@/lib/workspace/checklist";
import { scanArticleWorkspaces } from "@/lib/workspace/generator";
import {
  claimArticleWorkspace,
  getArticleWorkspaceById,
  logWorkspaceActivity,
  updateArticleWorkspace,
} from "@/lib/workspace/queries";
import type { WorkspaceChecklistItem } from "@/lib/workspace/types";

const WORKFLOW_PATHS = ["/admin/workflow", "/admin/dashboard", "/admin/seo"];

function revalidateWorkflow(workspaceId?: string) {
  for (const path of WORKFLOW_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/admin/workflow");
  if (workspaceId) {
    revalidatePath(`/admin/workflow/${workspaceId}`);
  }
}

export async function scanWorkspaces(): Promise<{
  success: boolean;
  created?: number;
  refreshed?: number;
  skipped?: number;
  merged?: number;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await scanArticleWorkspaces();
    revalidateWorkflow();
    return { success: true, ...result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Scan failed",
    };
  }
}

export async function claimWorkspace(workspaceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAdminUser();
    const workspace = await getArticleWorkspaceById(workspaceId);
    if (!workspace) return { success: false, error: "Workspace not found" };
    if (
      workspace.assigned_to &&
      workspace.assigned_to !== user.email &&
      workspace.status === "claimed"
    ) {
      return { success: false, error: "Workspace locked by another editor" };
    }

    const ok = await claimArticleWorkspace(workspaceId, user.email ?? "admin");
    if (!ok) return { success: false, error: "Failed to claim workspace" };

    await logWorkspaceActivity(
      workspaceId,
      "claimed",
      `Claimed by ${user.email ?? "admin"}`
    );
    revalidateWorkflow(workspaceId);
    return { success: true };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function startWorkspaceImprovement(workspaceId: string) {
  try {
    await requireAdminUser();
    const ok = await updateArticleWorkspace(workspaceId, {
      status: "in_progress",
    });
    if (!ok) return { success: false, error: "Failed to update workspace" };
    await logWorkspaceActivity(workspaceId, "started", "Improvement in progress");
    revalidateWorkflow(workspaceId);
    return { success: true };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function completeWorkspace(workspaceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAdminUser();
    const workspace = await getArticleWorkspaceById(workspaceId);
    if (!workspace) return { success: false, error: "Workspace not found" };
    if (
      workspace.assigned_to &&
      workspace.assigned_to !== user.email &&
      ["claimed", "in_progress", "review"].includes(workspace.status)
    ) {
      return { success: false, error: "Workspace locked by another editor" };
    }

    const ok = await updateArticleWorkspace(workspaceId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    if (!ok) return { success: false, error: "Failed to complete workspace" };

    await logWorkspaceActivity(workspaceId, "completed", "Improvement completed");
    revalidateWorkflow(workspaceId);
    return { success: true };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function archiveWorkspace(workspaceId: string) {
  try {
    await requireAdminUser();
    const ok = await updateArticleWorkspace(workspaceId, {
      status: "archived",
      completed_at: new Date().toISOString(),
    });
    if (!ok) return { success: false, error: "Failed to archive workspace" };
    await logWorkspaceActivity(workspaceId, "archived", "Workspace archived");
    revalidateWorkflow(workspaceId);
    return { success: true };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

export async function toggleWorkspaceChecklistItem(
  workspaceId: string,
  itemKey: string,
  completed: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAdminUser();
    const workspace = await getArticleWorkspaceById(workspaceId);
    if (!workspace) return { success: false, error: "Workspace not found" };
    if (
      workspace.assigned_to &&
      workspace.assigned_to !== user.email &&
      ["claimed", "in_progress"].includes(workspace.status)
    ) {
      return { success: false, error: "Workspace locked by another editor" };
    }

    const checklist = workspace.checklist.map((entry: WorkspaceChecklistItem) =>
      entry.key === itemKey ? { ...entry, completed } : entry
    );

    const ok = await updateArticleWorkspace(workspaceId, {
      checklist,
      estimated_minutes: estimateMinutes(checklist),
      potential_score: estimatePotentialScore(workspace.seo_score, checklist),
      status:
        workspace.status === "needs_improvement" ? "in_progress" : workspace.status,
    });
    if (!ok) return { success: false, error: "Failed to update checklist" };

    const item = checklist.find((entry) => entry.key === itemKey);
    if (item && completed) {
      await logWorkspaceActivity(
        workspaceId,
        "checklist_completed",
        `${item.label} marked done`
      );
    }

    revalidateWorkflow(workspaceId);
    return { success: true };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

// Backward-compatible aliases for legacy task actions (no-op redirects)
export async function generateWorkflowTasks() {
  return scanWorkspaces();
}

export async function claimWorkflowTask(taskId: string) {
  return claimWorkspace(taskId);
}

export async function completeWorkflowTask(taskId: string) {
  return completeWorkspace(taskId);
}

export async function markWorkflowTaskReady(taskId: string) {
  return startWorkspaceImprovement(taskId);
}

export async function updateWorkflowTaskStatus(
  taskId?: string,
  status?: string
) {
  void taskId;
  void status;
  return { success: false, error: "Use workspace actions" };
}

export async function archiveWorkflowTask(taskId: string) {
  return archiveWorkspace(taskId);
}

export async function cancelWorkflowTask(taskId: string) {
  return archiveWorkspace(taskId);
}
