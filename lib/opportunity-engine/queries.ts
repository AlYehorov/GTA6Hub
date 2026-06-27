import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { OpportunityStatus } from "@/lib/opportunity-engine/types";

export interface PersistedOpportunityRow {
  cluster_key: string;
  status: OpportunityStatus;
  ai_draft_id: string | null;
  workspace_id: string | null;
}

export async function getOpportunityStatusMap(): Promise<
  Map<
    string,
    {
      status: OpportunityStatus;
      aiDraftId: string | null;
      workspaceId: string | null;
    }
  >
> {
  const map = new Map<
    string,
    {
      status: OpportunityStatus;
      aiDraftId: string | null;
      workspaceId: string | null;
    }
  >();

  if (!isSupabaseAdminConfigured()) return map;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("editorial_opportunities")
    .select("cluster_key, status, ai_draft_id, workspace_id");

  for (const row of data ?? []) {
    map.set(row.cluster_key as string, {
      status: row.status as OpportunityStatus,
      aiDraftId: (row.ai_draft_id as string | null) ?? null,
      workspaceId: (row.workspace_id as string | null) ?? null,
    });
  }

  return map;
}

export async function upsertOpportunityStatus(input: {
  clusterKey: string;
  title: string;
  score: number;
  status: OpportunityStatus;
  aiDraftId?: string | null;
  workspaceId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("editorial_opportunities").upsert(
    {
      cluster_key: input.clusterKey,
      title: input.title,
      score: input.score,
      status: input.status,
      ai_draft_id: input.aiDraftId ?? null,
      workspace_id: input.workspaceId ?? null,
      metadata: input.metadata ?? {},
    },
    { onConflict: "cluster_key" }
  );

  if (error) throw new Error(error.message);
}

export async function resetOpportunityByClusterKey(clusterKey: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("editorial_opportunities")
    .update({ status: "open", ai_draft_id: null })
    .eq("cluster_key", clusterKey);

  if (error) throw new Error(error.message);
}

export async function resetOpportunityByDraftId(draftId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("editorial_opportunities")
    .update({ status: "open", ai_draft_id: null })
    .eq("ai_draft_id", draftId);

  if (error) throw new Error(error.message);
}

function isMissingOpportunityClusterColumn(message: string | undefined): boolean {
  return Boolean(message?.includes("opportunity_cluster_key"));
}

export async function getClusterKeyForDraft(draftId: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();

  const { data: opportunity } = await supabase
    .from("editorial_opportunities")
    .select("cluster_key")
    .eq("ai_draft_id", draftId)
    .maybeSingle();

  const fromOpportunity = (opportunity?.cluster_key as string | null) ?? null;
  if (fromOpportunity) return fromOpportunity;

  const { data: draft, error } = await supabase
    .from("ai_drafts")
    .select("opportunity_cluster_key")
    .eq("id", draftId)
    .maybeSingle();

  if (error && isMissingOpportunityClusterColumn(error.message)) {
    return null;
  }
  if (error) throw new Error(error.message);

  return (draft?.opportunity_cluster_key as string | null) ?? null;
}

export async function markOpportunityPublishedByDraftId(draftId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();

  await supabase
    .from("editorial_opportunities")
    .update({ status: "workflow_sent" })
    .eq("ai_draft_id", draftId);

  const { data: draft, error } = await supabase
    .from("ai_drafts")
    .select("opportunity_cluster_key")
    .eq("id", draftId)
    .maybeSingle();

  if (error?.message?.includes("opportunity_cluster_key")) return;
  if (error) throw new Error(error.message);

  const clusterKey = (draft?.opportunity_cluster_key as string | null) ?? null;
  if (!clusterKey) return;

  await supabase
    .from("editorial_opportunities")
    .update({ status: "workflow_sent", ai_draft_id: draftId })
    .eq("cluster_key", clusterKey);
}

export async function getOpportunityDraftLinksFromAiDrafts(): Promise<
  Map<string, { aiDraftId: string; status: OpportunityStatus }>
> {
  const map = new Map<string, { aiDraftId: string; status: OpportunityStatus }>();
  if (!isSupabaseAdminConfigured()) return map;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_drafts")
    .select("id, opportunity_cluster_key, status")
    .not("opportunity_cluster_key", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingOpportunityClusterColumn(error.message)) return map;
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const key = row.opportunity_cluster_key as string;
    if (!key || map.has(key)) continue;
    const draftStatus = row.status as string;
    map.set(key, {
      aiDraftId: row.id as string,
      status: draftStatus === "published" ? "workflow_sent" : "draft_generated",
    });
  }

  return map;
}
