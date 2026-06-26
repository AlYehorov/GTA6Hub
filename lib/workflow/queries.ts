import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type {
  EditorialTask,
  EditorialTaskStatus,
  TaskGeneratorCandidate,
} from "@/lib/workflow/types";

const TASK_SELECT = "*";

function rowToTask(row: Record<string, unknown>): EditorialTask {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    priority: row.priority as EditorialTask["priority"],
    estimated_minutes: Number(row.estimated_minutes),
    status: row.status as EditorialTaskStatus,
    created_from: row.created_from as string,
    related_source: (row.related_source as string | null) ?? null,
    related_article: (row.related_article as string | null) ?? null,
    assigned_to: (row.assigned_to as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    completed_at: (row.completed_at as string | null) ?? null,
  };
}

export async function getAllEditorialTasks(): Promise<EditorialTask[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("editorial_tasks")
    .select(TASK_SELECT)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => rowToTask(row as Record<string, unknown>));
}

export async function getEditorialTaskById(
  id: string
): Promise<EditorialTask | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("editorial_tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return rowToTask(data as Record<string, unknown>);
}

export async function getActiveTaskDedupeKeys(): Promise<Set<string>> {
  if (!isSupabaseAdminConfigured()) return new Set();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("editorial_tasks")
    .select("title, created_from, related_source, related_article, category, status");

  const keys = new Set<string>();
  for (const row of data ?? []) {
    const status = row.status as string;
    if (["published", "archived", "cancelled"].includes(status)) continue;
    keys.add(
      buildDedupeKey({
        dedupe_key: "",
        title: row.title as string,
        created_from: row.created_from as string,
        related_source: (row.related_source as string | null) ?? undefined,
        related_article: (row.related_article as string | null) ?? undefined,
        category: row.category as string,
      } as TaskGeneratorCandidate)
    );
  }
  return keys;
}

export function buildDedupeKey(candidate: TaskGeneratorCandidate): string {
  if (candidate.dedupe_key) return candidate.dedupe_key;
  const parts = [
    candidate.created_from,
    candidate.category,
    candidate.related_article ?? "",
    candidate.related_source ?? "",
    candidate.title.toLowerCase().trim(),
  ];
  return parts.join("|");
}

export async function insertEditorialTasks(
  candidates: TaskGeneratorCandidate[]
): Promise<{ inserted: number; skipped: number }> {
  if (!isSupabaseAdminConfigured() || candidates.length === 0) {
    return { inserted: 0, skipped: candidates.length };
  }

  const existing = await getActiveTaskDedupeKeys();
  const supabase = createAdminClient();
  let inserted = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const key = buildDedupeKey(candidate);
    if (existing.has(key)) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("editorial_tasks").insert({
      title: candidate.title,
      description: candidate.description,
      category: candidate.category,
      priority: candidate.priority,
      estimated_minutes: candidate.estimated_minutes,
      status: "opportunity",
      created_from: candidate.created_from,
      related_source: candidate.related_source ?? null,
      related_article: candidate.related_article ?? null,
    });

    if (error) {
      skipped++;
      continue;
    }

    existing.add(key);
    inserted++;
  }

  return { inserted, skipped };
}

export async function updateEditorialTaskStatus(
  id: string,
  status: EditorialTaskStatus,
  assignedTo?: string | null
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;

  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { status };

  if (assignedTo !== undefined) payload.assigned_to = assignedTo;

  if (status === "published" || status === "archived" || status === "cancelled") {
    payload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("editorial_tasks")
    .update(payload)
    .eq("id", id);

  return !error;
}

export async function claimEditorialTask(
  id: string,
  email: string
): Promise<boolean> {
  return updateEditorialTaskStatus(id, "claimed", email);
}
