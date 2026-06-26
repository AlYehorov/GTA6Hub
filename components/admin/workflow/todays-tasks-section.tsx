import Link from "next/link";
import type { EditorialTaskWithContext } from "@/lib/workflow/types";
import { WorkflowTaskActions } from "@/components/admin/workflow/workflow-task-actions";

const STATUS_LABELS: Record<string, string> = {
  opportunity: "Opportunity",
  claimed: "Claimed",
  drafting: "Drafting",
  seo_review: "SEO Review",
  fact_check: "Fact Check",
  ready: "Ready",
  scheduled: "Scheduled",
  needs_update: "Needs Update",
};

export function TodaysTasksSection({
  todayByStatus,
}: {
  todayByStatus: Record<string, EditorialTaskWithContext[]>;
}) {
  const groups = Object.entries(todayByStatus).filter(([, tasks]) => tasks.length > 0);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Today&apos;s Tasks
      </h2>
      <p className="mt-1 text-sm text-white/45">Active work grouped by status</p>

      {groups.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">
          No active tasks.{" "}
          <Link href="#generator" className="text-gta-pink hover:underline">
            Generate tasks
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map(([status, tasks]) => (
            <div key={status}>
              <h3 className="text-sm font-medium uppercase tracking-wider text-white/50">
                {STATUS_LABELS[status] ?? status}
              </h3>
              <ul className="mt-3 space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{task.title}</p>
                        <p className="mt-1 text-xs text-white/45">
                          <span className="capitalize text-gta-pink/80">
                            {task.priority}
                          </span>
                          {" · "}
                          {task.estimated_minutes} min · {task.category}
                        </p>
                      </div>
                    </div>
                    <WorkflowTaskActions
                      taskId={task.id}
                      status={task.status}
                      relatedArticle={task.related_article}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
