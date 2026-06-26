"use client";

import type { ContentEngineUsageStats } from "@/lib/content-engine/types";
import { cn } from "@/lib/utils";

interface ContentEngineUsageBarProps {
  usage: ContentEngineUsageStats;
  openAiConfigured: boolean;
}

export function ContentEngineUsageBar({
  usage,
  openAiConfigured,
}: ContentEngineUsageBarProps) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white">
            AI usage & limits
          </h2>
          <p className="mt-1 text-sm text-white/45">
            gpt-4o-mini · budget target ${usage.monthlyBudgetUsd}/month · explicit
            admin actions only
          </p>
        </div>
        {!openAiConfigured && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
            OPENAI_API_KEY not set — heuristic mode
          </span>
        )}
      </div>

      {usage.overBudgetWarning && (
        <p className="mt-4 rounded-lg border border-gta-pink/30 bg-gta-pink/10 px-4 py-3 text-sm text-gta-pink">
          Estimated monthly cost (${usage.estimatedCostMonthUsd.toFixed(2)}) exceeds
          the ${usage.monthlyBudgetUsd} budget. Review usage before generating more.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UsageStat
          label="Plans today"
          value={`${usage.plansToday} / 10`}
          sub={`${usage.plansRemainingToday} remaining`}
        />
        <UsageStat
          label="Drafts today"
          value={`${usage.draftsToday} / 20`}
          sub={`${usage.draftsRemainingToday} remaining`}
        />
        <UsageStat
          label="Cost today"
          value={`$${usage.estimatedCostTodayUsd.toFixed(3)}`}
          sub={`${usage.requestsToday} requests`}
        />
        <UsageStat
          label="Cost this month"
          value={`$${usage.estimatedCostMonthUsd.toFixed(2)}`}
          sub={
            <span
              className={cn(
                usage.budgetUsedPercent >= 80 && "text-amber-400",
                usage.overBudgetWarning && "text-gta-pink"
              )}
            >
              {usage.budgetUsedPercent}% of budget
            </span>
          }
        />
      </div>
    </section>
  );
}

function UsageStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{sub}</p>
    </div>
  );
}
