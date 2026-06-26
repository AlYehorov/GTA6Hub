import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type {
  DailyCapacity,
  EditorialTask,
  WeeklyWorkflowStats,
  WorkflowMetrics,
} from "@/lib/workflow/types";
import { ACTIVE_TASK_STATUSES } from "@/lib/workflow/types";

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

export function computeDailyCapacity(tasks: EditorialTask[]): DailyCapacity {
  const active = tasks.filter((t) => ACTIVE_TASK_STATUSES.includes(t.status));
  return {
    taskCount: active.length,
    estimatedMinutes: active.reduce((sum, t) => sum + t.estimated_minutes, 0),
  };
}

export function computeWorkflowMetrics(tasks: EditorialTask[]): WorkflowMetrics {
  const today = startOfTodayUtc();
  const completedToday = tasks.filter(
    (t) =>
      t.completed_at &&
      t.completed_at >= today &&
      (t.status === "published" || t.status === "archived")
  );

  const publishedTasks = tasks.filter(
    (t) => t.status === "published" && t.completed_at
  );
  const publishTimes = publishedTasks.map((t) =>
    minutesBetween(t.created_at, t.completed_at!)
  );

  const reviewTasks = tasks.filter(
    (t) =>
      t.completed_at &&
      ["published", "archived"].includes(t.status) &&
      t.updated_at !== t.created_at
  );
  const reviewTimes = reviewTasks.map((t) =>
    minutesBetween(t.created_at, t.completed_at!)
  );

  const openOpportunities = tasks.filter((t) => t.status === "opportunity").length;

  return {
    tasksCompletedToday: completedToday.length,
    averagePublishMinutes:
      publishTimes.length > 0
        ? Math.round(
            publishTimes.reduce((a, b) => a + b, 0) / publishTimes.length
          )
        : null,
    averageReviewMinutes:
      reviewTimes.length > 0
        ? Math.round(
            reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
          )
        : null,
    openOpportunities,
  };
}

export async function computeWeeklyWorkflowStats(): Promise<WeeklyWorkflowStats> {
  if (!isSupabaseAdminConfigured()) {
    return {
      tasksCreated: 0,
      tasksCompleted: 0,
      averageCompletionMinutes: null,
      completionRate: 0,
    };
  }

  const supabase = createAdminClient();
  const weekStart = startOfWeekUtc();

  const [{ count: created }, { data: completedRows }] = await Promise.all([
    supabase
      .from("editorial_tasks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekStart),
    supabase
      .from("editorial_tasks")
      .select("created_at, completed_at, status")
      .gte("completed_at", weekStart)
      .in("status", ["published", "archived"]),
  ]);

  const completed = completedRows ?? [];
  const completionMinutes = completed
    .filter((r) => r.completed_at)
    .map((r) =>
      minutesBetween(r.created_at as string, r.completed_at as string)
    );

  const tasksCreated = created ?? 0;
  const tasksCompleted = completed.length;
  const completionRate =
    tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;

  return {
    tasksCreated,
    tasksCompleted,
    averageCompletionMinutes:
      completionMinutes.length > 0
        ? Math.round(
            completionMinutes.reduce((a, b) => a + b, 0) /
              completionMinutes.length
          )
        : null,
    completionRate,
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
