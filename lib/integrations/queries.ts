import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type {
  ClaritySnapshot,
  Ga4Snapshot,
  GscSnapshot,
  IntegrationId,
  IntegrationSettingsRow,
  VerificationStatus,
} from "@/lib/integrations/types";

export async function getIntegrationSettings(
  id: IntegrationId
): Promise<IntegrationSettingsRow | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("integration_settings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as IntegrationId,
    property_url: (data.property_url as string | null) ?? null,
    verification_status: data.verification_status as VerificationStatus,
    config: (data.config as Record<string, unknown>) ?? {},
    last_sync_at: (data.last_sync_at as string | null) ?? null,
    updated_at: data.updated_at as string,
  };
}

export async function upsertIntegrationSettings(input: {
  id: IntegrationId;
  propertyUrl?: string | null;
  verificationStatus?: VerificationStatus;
  config?: Record<string, unknown>;
  lastSyncAt?: string | null;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("integration_settings").upsert(
    {
      id: input.id,
      property_url: input.propertyUrl ?? null,
      verification_status: input.verificationStatus ?? "pending",
      config: input.config ?? {},
      last_sync_at: input.lastSyncAt ?? null,
    },
    { onConflict: "id" }
  );

  if (error) throw new Error(error.message);
}

export async function saveAnalyticsSnapshot(input: {
  source: "gsc" | "ga4" | "clarity";
  snapshotType: string;
  data: unknown;
  periodStart?: string;
  periodEnd?: string;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("analytics_snapshots").insert({
    source: input.source,
    snapshot_type: input.snapshotType,
    period_start: input.periodStart ?? null,
    period_end: input.periodEnd ?? null,
    data: input.data,
  });

  if (error) throw new Error(error.message);
}

export async function getLatestSnapshot<T>(
  source: "gsc" | "ga4" | "clarity",
  snapshotType: string
): Promise<{ data: T; createdAt: string } | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("analytics_snapshots")
    .select("data, created_at")
    .eq("source", source)
    .eq("snapshot_type", snapshotType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { data: data.data as T, createdAt: data.created_at as string };
}

export async function getGscSnapshot(): Promise<GscSnapshot | null> {
  const row = await getLatestSnapshot<GscSnapshot>("gsc", "full");
  return row?.data ?? null;
}

export async function getGa4Snapshot(): Promise<Ga4Snapshot | null> {
  const row = await getLatestSnapshot<Ga4Snapshot>("ga4", "full");
  return row?.data ?? null;
}

export async function getClaritySnapshot(): Promise<ClaritySnapshot | null> {
  const row = await getLatestSnapshot<ClaritySnapshot>("clarity", "full");
  return row?.data ?? null;
}

export async function startSyncRun(source: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("analytics_sync_runs")
    .insert({ source, status: "running" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function completeSyncRun(
  runId: string,
  status: "success" | "error" | "partial",
  message: string
): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  await supabase
    .from("analytics_sync_runs")
    .update({
      status,
      message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

export async function getLastSyncTime(
  source: "gsc" | "ga4" | "clarity"
): Promise<string | null> {
  const settings = await getIntegrationSettings(
    source === "gsc" ? "search_console" : source === "ga4" ? "analytics" : "clarity"
  );
  return settings?.last_sync_at ?? null;
}
