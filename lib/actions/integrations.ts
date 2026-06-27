"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { upsertIntegrationSettings } from "@/lib/integrations/queries";
import {
  syncAllIntegrations,
  syncClarity,
  syncGa4,
  syncSearchConsole,
} from "@/lib/integrations/sync";
import type { VerificationStatus } from "@/lib/integrations/types";

export interface ActionResult {
  success: boolean;
  error?: string;
}

const INTEGRATION_PATHS = [
  "/admin/integrations/search-console",
  "/admin/integrations/analytics",
  "/admin/integrations/clarity",
  "/admin/insights",
  "/admin/dashboard",
];

function revalidate() {
  for (const path of INTEGRATION_PATHS) {
    revalidatePath(path);
  }
}

export async function syncIntegration(
  source: "gsc" | "ga4" | "clarity" | "all"
): Promise<ActionResult & { results?: Array<{ source: string; success: boolean; error?: string }> }> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    if (source === "all") {
      const results = await syncAllIntegrations();
      revalidate();
      return {
        success: results.every((r) => r.success),
        results,
        error: results.find((r) => !r.success)?.error,
      };
    }

    const result =
      source === "gsc"
        ? await syncSearchConsole()
        : source === "ga4"
          ? await syncGa4()
          : await syncClarity();

    revalidate();
    return result;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Sync failed",
    };
  }
}

export async function saveSearchConsoleProperty(
  propertyUrl: string
): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await upsertIntegrationSettings({
      id: "search_console",
      propertyUrl: propertyUrl.trim(),
      verificationStatus: "pending",
    });
    revalidate();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Save failed",
    };
  }
}

export async function saveIntegrationConfig(input: {
  id: "search_console" | "analytics" | "clarity";
  propertyUrl?: string;
  verificationStatus?: VerificationStatus;
}): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await upsertIntegrationSettings({
      id: input.id,
      propertyUrl: input.propertyUrl,
      verificationStatus: input.verificationStatus,
    });
    revalidate();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Save failed",
    };
  }
}
