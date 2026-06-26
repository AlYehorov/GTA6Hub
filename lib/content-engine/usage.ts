import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getOpenAiModel } from "@/lib/ai/openai-client";
import type { ContentEngineUsageStats } from "@/lib/content-engine/types";

export const MAX_PLANS_PER_DAY = 10;
export const MAX_DRAFTS_PER_DAY = 20;
export const MONTHLY_BUDGET_USD = 5;

/** gpt-4o-mini approximate pricing per 1M tokens */
const INPUT_COST_PER_M = 0.15;
const OUTPUT_COST_PER_M = 0.6;

export function estimateCostUsd(
  inputTokens: number,
  outputTokens: number
): number {
  const cost =
    (inputTokens / 1_000_000) * INPUT_COST_PER_M +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_M;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export async function trackAiUsageEvent(input: {
  action: string;
  inputTokens: number;
  outputTokens: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  await supabase.from("ai_usage_events").insert({
    action: input.action,
    model: getOpenAiModel(),
    estimated_input_tokens: input.inputTokens,
    estimated_output_tokens: input.outputTokens,
    estimated_cost_usd: estimateCostUsd(input.inputTokens, input.outputTokens),
    metadata: input.metadata ?? {},
  });
}

function startOfTodayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthUtc(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getContentEngineUsageStats(): Promise<ContentEngineUsageStats> {
  if (!isSupabaseAdminConfigured()) {
    return {
      plansToday: 0,
      draftsToday: 0,
      requestsToday: 0,
      estimatedCostTodayUsd: 0,
      estimatedCostMonthUsd: 0,
      monthlyBudgetUsd: MONTHLY_BUDGET_USD,
      budgetUsedPercent: 0,
      overBudgetWarning: false,
      plansRemainingToday: MAX_PLANS_PER_DAY,
      draftsRemainingToday: MAX_DRAFTS_PER_DAY,
    };
  }

  const supabase = createAdminClient();
  const today = startOfTodayUtc();
  const monthStart = startOfMonthUtc();

  const { data: todayRows } = await supabase
    .from("ai_usage_events")
    .select("action, estimated_cost_usd")
    .gte("created_at", today);

  const { data: monthRows } = await supabase
    .from("ai_usage_events")
    .select("estimated_cost_usd")
    .gte("created_at", monthStart);

  const rows = todayRows ?? [];
  const plansToday = rows.filter((r) => r.action === "content_plan").length;
  const draftsToday = rows.filter(
    (r) => r.action === "content_draft" || r.action === "opportunity_article"
  ).length;
  const estimatedCostTodayUsd = rows.reduce(
    (sum, r) => sum + Number(r.estimated_cost_usd ?? 0),
    0
  );
  const estimatedCostMonthUsd = (monthRows ?? []).reduce(
    (sum, r) => sum + Number(r.estimated_cost_usd ?? 0),
    0
  );
  const budgetUsedPercent = Math.min(
    100,
    Math.round((estimatedCostMonthUsd / MONTHLY_BUDGET_USD) * 100)
  );

  return {
    plansToday,
    draftsToday,
    requestsToday: rows.length,
    estimatedCostTodayUsd: Math.round(estimatedCostTodayUsd * 1000) / 1000,
    estimatedCostMonthUsd: Math.round(estimatedCostMonthUsd * 100) / 100,
    monthlyBudgetUsd: MONTHLY_BUDGET_USD,
    budgetUsedPercent,
    overBudgetWarning: estimatedCostMonthUsd > MONTHLY_BUDGET_USD,
    plansRemainingToday: Math.max(0, MAX_PLANS_PER_DAY - plansToday),
    draftsRemainingToday: Math.max(0, MAX_DRAFTS_PER_DAY - draftsToday),
  };
}

export async function assertPlanBudget(): Promise<void> {
  const stats = await getContentEngineUsageStats();
  if (stats.plansRemainingToday <= 0) {
    throw new Error(`Daily content plan limit reached (${MAX_PLANS_PER_DAY}/day)`);
  }
  if (stats.overBudgetWarning) {
    throw new Error("Estimated monthly OpenAI budget exceeded ($5). Review usage before continuing.");
  }
}

export async function assertDraftBudget(): Promise<void> {
  const stats = await getContentEngineUsageStats();
  if (stats.draftsRemainingToday <= 0) {
    throw new Error(`Daily draft generation limit reached (${MAX_DRAFTS_PER_DAY}/day)`);
  }
  if (stats.overBudgetWarning) {
    throw new Error("Estimated monthly OpenAI budget exceeded ($5). Review usage before continuing.");
  }
}
