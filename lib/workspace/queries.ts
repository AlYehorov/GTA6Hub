import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type {
  ArticleWorkspace,
  ArticleWorkspaceStatus,
  WorkspaceActivity,
  WorkspaceChecklistItem,
} from "@/lib/workspace/types";

const WORKSPACE_SELECT = "*";

function rowToWorkspace(row: Record<string, unknown>): ArticleWorkspace {
  return {
    id: row.id as string,
    article_id: row.article_id as string,
    status: row.status as ArticleWorkspaceStatus,
    seo_score: Number(row.seo_score),
    potential_score: Number(row.potential_score),
    estimated_minutes: Number(row.estimated_minutes),
    checklist: (row.checklist as WorkspaceChecklistItem[]) ?? [],
    reason: (row.reason as string) ?? "",
    related_source_ids: (row.related_source_ids as string[]) ?? [],
    assigned_to: (row.assigned_to as string | null) ?? null,
    locked_at: (row.locked_at as string | null) ?? null,
    article_content_hash: (row.article_content_hash as string) ?? "",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    completed_at: (row.completed_at as string | null) ?? null,
  };
}

function rowToActivity(row: Record<string, unknown>): WorkspaceActivity {
  return {
    id: row.id as string,
    workspace_id: row.workspace_id as string,
    event_type: row.event_type as string,
    message: (row.message as string) ?? "",
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  };
}

export async function getAllArticleWorkspaces(): Promise<ArticleWorkspace[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("article_workspaces")
    .select(WORKSPACE_SELECT)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => rowToWorkspace(row as Record<string, unknown>));
}

export async function getArticleWorkspaceById(
  id: string
): Promise<ArticleWorkspace | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("article_workspaces")
    .select(WORKSPACE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return rowToWorkspace(data as Record<string, unknown>);
}

export async function getActiveWorkspaceByArticleId(
  articleId: string
): Promise<ArticleWorkspace | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("article_workspaces")
    .select(WORKSPACE_SELECT)
    .eq("article_id", articleId)
    .order("updated_at", { ascending: false });

  const active = (data ?? []).find(
    (row) => !["completed", "archived"].includes(row.status as string)
  );
  if (!active) return null;
  return rowToWorkspace(active as Record<string, unknown>);
}

export async function getActiveWorkspaceArticleIds(): Promise<Set<string>> {
  if (!isSupabaseAdminConfigured()) return new Set();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("article_workspaces")
    .select("article_id, status");

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const status = row.status as string;
    if (!["completed", "archived"].includes(status)) {
      ids.add(row.article_id as string);
    }
  }
  return ids;
}

export async function insertArticleWorkspace(
  payload: Omit<
    ArticleWorkspace,
    "id" | "created_at" | "updated_at" | "completed_at" | "locked_at"
  >
): Promise<ArticleWorkspace | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("article_workspaces")
    .insert({
      article_id: payload.article_id,
      status: payload.status,
      seo_score: payload.seo_score,
      potential_score: payload.potential_score,
      estimated_minutes: payload.estimated_minutes,
      checklist: payload.checklist,
      reason: payload.reason,
      related_source_ids: payload.related_source_ids,
      assigned_to: payload.assigned_to,
      article_content_hash: payload.article_content_hash,
    })
    .select(WORKSPACE_SELECT)
    .single();

  if (error || !data) return null;
  return rowToWorkspace(data as Record<string, unknown>);
}

export async function updateArticleWorkspace(
  id: string,
  patch: Partial<
    Pick<
      ArticleWorkspace,
      | "status"
      | "seo_score"
      | "potential_score"
      | "estimated_minutes"
      | "checklist"
      | "reason"
      | "related_source_ids"
      | "assigned_to"
      | "locked_at"
      | "article_content_hash"
      | "completed_at"
    >
  >
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("article_workspaces")
    .update(patch)
    .eq("id", id);

  return !error;
}

export async function claimArticleWorkspace(
  id: string,
  email: string
): Promise<boolean> {
  const now = new Date().toISOString();
  return updateArticleWorkspace(id, {
    status: "claimed",
    assigned_to: email,
    locked_at: now,
  });
}

export async function logWorkspaceActivity(
  workspaceId: string,
  eventType: string,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  await supabase.from("article_workspace_activity").insert({
    workspace_id: workspaceId,
    event_type: eventType,
    message,
    metadata,
  });
}

export async function getWorkspaceActivity(
  workspaceId: string,
  limit = 30
): Promise<WorkspaceActivity[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("article_workspace_activity")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => rowToActivity(row as Record<string, unknown>));
}
