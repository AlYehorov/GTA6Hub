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

export async function getOpportunityDraftLinksFromAiDrafts(): Promise<
  Map<string, { aiDraftId: string; status: OpportunityStatus }>
> {
  const map = new Map<string, { aiDraftId: string; status: OpportunityStatus }>();
  if (!isSupabaseAdminConfigured()) return map;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ai_drafts")
    .select("id, opportunity_cluster_key, status")
    .not("opportunity_cluster_key", "is", null)
    .order("created_at", { ascending: false });

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
