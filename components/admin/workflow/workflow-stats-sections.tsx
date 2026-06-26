import Link from "next/link";
import type {
  DailyCapacity,
  OpenAiUsageStats,
  WeeklyWorkflowStats,
  WorkflowMetrics,
} from "@/lib/workflow/types";

export function WorkflowStatsBar({
  dailyCapacity,
  weeklyStats,
  metrics,
  openAiUsage,
}: {
  dailyCapacity: DailyCapacity;
  weeklyStats: WeeklyWorkflowStats;
  metrics: WorkflowMetrics;
  openAiUsage: OpenAiUsageStats;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <StatCard
        title="Today's workload"
        value={`${dailyCapacity.taskCount} tasks`}
        sub={`Estimated ${dailyCapacity.estimatedMinutes} minutes`}
      />
      <StatCard
        title="Weekly progress"
        value={`${weeklyStats.tasksCompleted}/${weeklyStats.tasksCreated}`}
        sub={`${weeklyStats.completionRate}% completion${
          weeklyStats.averageCompletionMinutes
            ? ` · avg ${weeklyStats.averageCompletionMinutes}m`
            : ""
        }`}
      />
      <StatCard
        title="Success metrics"
        value={`${metrics.tasksCompletedToday} done today`}
        sub={`${metrics.openOpportunities} open opportunities${
          metrics.averagePublishMinutes
            ? ` · avg publish ${metrics.averagePublishMinutes}m`
            : ""
        }`}
      />
      <StatCard
        title="OpenAI budget"
        value={`$${openAiUsage.estimatedMonthlyCostUsd.toFixed(2)} / $${openAiUsage.budgetCapUsd}`}
        sub={`${openAiUsage.requestsToday} today · ${openAiUsage.requestsThisMonth} this month · ${openAiUsage.budgetUsedPercent}% used`}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-wider text-white/40">{title}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{sub}</p>
    </div>
  );
}

export function OneClickActionsSection() {
  return (
    <section className="rounded-2xl border border-gta-pink/20 bg-gta-pink/5 p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        One-Click Actions
      </h2>
      <p className="mt-1 text-sm text-white/45">Never auto-publish</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <ActionLink href="/admin/sources" label="Generate Draft" />
        <ActionLink href="/admin/seo" label="Improve SEO" />
        <ActionLink href="/admin/articles" label="Generate FAQ" />
        <ActionLink href="/admin/seo#inventory" label="Internal Links" />
      </div>
    </section>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm text-white hover:border-gta-pink/40"
    >
      {label}
    </Link>
  );
}

export function TaskHistorySection({
  history,
}: {
  history: Array<{ id: string; title: string; status: string; completed_at: string | null }>;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">Task History</h2>
      <p className="mt-1 text-sm text-white/45">Completed, archived, cancelled</p>

      {history.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No completed tasks yet.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {history.slice(0, 20).map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-4 py-3 text-sm"
            >
              <span className="text-white">{task.title}</span>
              <span className="text-xs text-white/40">
                {task.status}
                {task.completed_at
                  ? ` · ${new Date(task.completed_at).toLocaleDateString()}`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DashboardLinksSection() {
  return (
    <p className="text-center text-xs text-white/30">
      <Link href="/admin/dashboard" className="hover:text-white/50">
        Editorial dashboard
      </Link>
      {" · "}
      <Link href="/admin/seo" className="hover:text-white/50">
        SEO command center
      </Link>
      {" · "}
      <Link href="/admin" className="hover:text-white/50">
        Admin hub
      </Link>
    </p>
  );
}
