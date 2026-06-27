import {
  isClarityApiConfigured,
  isGa4Configured,
  isSearchConsoleConfigured,
} from "@/lib/integrations/config";
import { fetchClaritySnapshot } from "@/lib/integrations/clarity/client";
import { fetchGa4Snapshot } from "@/lib/integrations/google/ga4-client";
import { fetchGscSnapshot, verifySearchConsoleAccess } from "@/lib/integrations/google/gsc-client";
import {
  completeSyncRun,
  saveAnalyticsSnapshot,
  startSyncRun,
  upsertIntegrationSettings,
} from "@/lib/integrations/queries";
import { getIntegrationsEnv } from "@/lib/integrations/config";

export interface SyncResult {
  source: "gsc" | "ga4" | "clarity";
  success: boolean;
  error?: string;
}

export async function syncSearchConsole(): Promise<SyncResult> {
  if (!isSearchConsoleConfigured()) {
    return { source: "gsc", success: false, error: "Search Console not configured" };
  }

  const runId = await startSyncRun("gsc");
  try {
    const verification = await verifySearchConsoleAccess();
    const snapshot = await fetchGscSnapshot();

    await saveAnalyticsSnapshot({
      source: "gsc",
      snapshotType: "full",
      data: snapshot,
    });

    const env = getIntegrationsEnv();
    await upsertIntegrationSettings({
      id: "search_console",
      propertyUrl: verification.siteUrl ?? env.searchConsoleProperty,
      verificationStatus: verification.verified ? "verified" : "failed",
      lastSyncAt: snapshot.syncedAt,
    });

    if (runId) await completeSyncRun(runId, "success", "GSC sync completed");
    return { source: "gsc", success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "GSC sync failed";
    if (runId) await completeSyncRun(runId, "error", message);
    await upsertIntegrationSettings({
      id: "search_console",
      verificationStatus: "failed",
    });
    return { source: "gsc", success: false, error: message };
  }
}

export async function syncGa4(): Promise<SyncResult> {
  if (!isGa4Configured()) {
    return { source: "ga4", success: false, error: "GA4 not configured" };
  }

  const runId = await startSyncRun("ga4");
  try {
    const snapshot = await fetchGa4Snapshot();

    await saveAnalyticsSnapshot({
      source: "ga4",
      snapshotType: "full",
      data: snapshot,
    });

    await upsertIntegrationSettings({
      id: "analytics",
      propertyUrl: getIntegrationsEnv().ga4PropertyId,
      verificationStatus: "verified",
      lastSyncAt: snapshot.syncedAt,
    });

    if (runId) await completeSyncRun(runId, "success", "GA4 sync completed");
    return { source: "ga4", success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "GA4 sync failed";
    if (runId) await completeSyncRun(runId, "error", message);
    return { source: "ga4", success: false, error: message };
  }
}

export async function syncClarity(): Promise<SyncResult> {
  const runId = await startSyncRun("clarity");
  try {
    const snapshot = await fetchClaritySnapshot();

    await saveAnalyticsSnapshot({
      source: "clarity",
      snapshotType: "full",
      data: snapshot,
    });

    await upsertIntegrationSettings({
      id: "clarity",
      propertyUrl: snapshot.projectId,
      verificationStatus: snapshot.projectId ? "verified" : "not_configured",
      lastSyncAt: snapshot.syncedAt,
    });

    if (runId) await completeSyncRun(runId, "success", "Clarity sync completed");
    return { source: "clarity", success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Clarity sync failed";
    if (runId) await completeSyncRun(runId, "error", message);
    return { source: "clarity", success: false, error: message };
  }
}

export async function syncAllIntegrations(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  if (isSearchConsoleConfigured()) {
    results.push(await syncSearchConsole());
  }
  if (isGa4Configured()) {
    results.push(await syncGa4());
  }
  if (isClarityApiConfigured() || getIntegrationsEnv().clarityProjectId) {
    results.push(await syncClarity());
  }

  return results;
}
