import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type {
  ArticleWorkspace,
  DailyWorkspaceCapacity,
  WeeklyWorkspaceStats,
  WorkspaceMetrics,
} from "@/lib/workspace/types";
import { ACTIVE_WORKSPACE_STATUSES } from "@/lib/workspace/types";
import { estimateMinutes } from "@/lib/workspace/checklist";

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekUtc(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function minutesBetween(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60)
  );
}

export function computeDailyWorkspaceCapacity(
  workspaces: ArticleWorkspace[]
): DailyWorkspaceCapacity {
  const active = workspaces.filter((w) =>
    ACTIVE_WORKSPACE_STATUSES.includes(w.status)
  );
  return {
    articleCount: active.length,
    estimatedMinutes: active.reduce((sum, w) => sum + w.estimated_minutes, 0),
  };
}

export function computeWorkspaceMetrics(
  workspaces: ArticleWorkspace[]
): WorkspaceMetrics {
  const today = startOfTodayUtc();
  const active = workspaces.filter((w) =>
    ACTIVE_WORKSPACE_STATUSES.includes(w.status)
  );
  const completedToday = workspaces.filter(
    (w) => w.completed_at && w.completed_at >= today && w.status === "completed"
  );

  const completed = workspaces.filter(
    (w) => w.status === "completed" && w.completed_at
  );

  const seoGains = completed
    .filter((w) => w.potential_score > w.seo_score)
    .map((w) => w.potential_score - w.seo_score);

  const improvementTimes = completed.map((w) =>
    minutesBetween(w.created_at, w.completed_at!)
  );

  return {
    articlesNeedingAttention: active.length,
    averageSeoGain:
      seoGains.length > 0
        ? Math.round(seoGains.reduce((a, b) => a + b, 0) / seoGains.length)
        : null,
    averageImprovementMinutes:
      improvementTimes.length > 0
        ? Math.round(
            improvementTimes.reduce((a, b) => a + b, 0) /
              improvementTimes.length
          )
        : null,
    completedImprovementsToday: completedToday.length,
    openWorkspaces: active.length,
  };
}

export async function computeWeeklyWorkspaceStats(): Promise<WeeklyWorkspaceStats> {
  if (!isSupabaseAdminConfigured()) {
    return {
      workspacesCreated: 0,
      workspacesCompleted: 0,
      averageCompletionMinutes: null,
      completionRate: 0,
      averageSeoGain: null,
    };
  }

  const supabase = createAdminClient();
  const weekStart = startOfWeekUtc();

  const [{ count: created }, { data: completedRows }] = await Promise.all([
    supabase
      .from("article_workspaces")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekStart),
    supabase
      .from("article_workspaces")
      .select("created_at, completed_at, seo_score, potential_score, status")
      .gte("completed_at", weekStart)
      .eq("status", "completed"),
  ]);

  const completed = completedRows ?? [];
  const completionMinutes = completed
    .filter((r) => r.completed_at)
    .map((r) =>
      minutesBetween(r.created_at as string, r.completed_at as string)
    );

  const seoGains = completed
    .filter(
      (r) =>
        Number(r.potential_score) > Number(r.seo_score)
    )
    .map((r) => Number(r.potential_score) - Number(r.seo_score));

  const workspacesCreated = created ?? 0;
  const workspacesCompleted = completed.length;
  const completionRate =
    workspacesCreated > 0
      ? Math.round((workspacesCompleted / workspacesCreated) * 100)
      : 0;

  return {
    workspacesCreated,
    workspacesCompleted,
    averageCompletionMinutes:
      completionMinutes.length > 0
        ? Math.round(
            completionMinutes.reduce((a, b) => a + b, 0) /
              completionMinutes.length
          )
        : null,
    completionRate,
    averageSeoGain:
      seoGains.length > 0
        ? Math.round(seoGains.reduce((a, b) => a + b, 0) / seoGains.length)
        : null,
  };
}

const OPENAI_EVENT_NAMES = [
  "openai_request",
  "openai_draft",
  "openai_daily_report",
  "openai_seo_editor",
  "openai_weekly_seo_report",
];

const ESTIMATED_COST_PER_REQUEST_USD = 0.003;
const MONTHLY_BUDGET_USD = 5;

export async function computeOpenAiUsageStats() {
  if (!isSupabaseAdminConfigured()) {
    return {
      requestsToday: 0,
      requestsThisMonth: 0,
      estimatedMonthlyCostUsd: 0,
      budgetCapUsd: MONTHLY_BUDGET_USD,
      budgetUsedPercent: 0,
    };
  }

  const supabase = createAdminClient();
  const today = startOfTodayUtc();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [{ count: todayCount }, { count: monthCount }] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .in("event_name", OPENAI_EVENT_NAMES)
      .gte("created_at", today),
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .in("event_name", OPENAI_EVENT_NAMES)
      .gte("created_at", monthStart.toISOString()),
  ]);

  const requestsThisMonth = monthCount ?? 0;
  const estimatedMonthlyCostUsd =
    Math.round(requestsThisMonth * ESTIMATED_COST_PER_REQUEST_USD * 100) / 100;
  const budgetUsedPercent = Math.min(
    100,
    Math.round((estimatedMonthlyCostUsd / MONTHLY_BUDGET_USD) * 100)
  );

  return {
    requestsToday: todayCount ?? 0,
    requestsThisMonth,
    estimatedMonthlyCostUsd,
    budgetCapUsd: MONTHLY_BUDGET_USD,
    budgetUsedPercent,
  };
}

export function recalcWorkspaceEstimates(
  workspace: ArticleWorkspace
): Pick<ArticleWorkspace, "estimated_minutes" | "potential_score"> {
  return {
    estimated_minutes: estimateMinutes(workspace.checklist),
    potential_score: workspace.potential_score,
  };
}
