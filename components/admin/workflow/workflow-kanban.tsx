"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EditorialTaskStatus, EditorialTaskWithContext } from "@/lib/workflow/types";
import { KANBAN_STATUSES } from "@/lib/workflow/types";
import { updateWorkflowTaskStatus } from "@/lib/actions/workflow";

const STATUS_LABELS: Record<EditorialTaskStatus, string> = {
  opportunity: "Opportunity",
  claimed: "Claimed",
  drafting: "Drafting",
  seo_review: "SEO Review",
  fact_check: "Fact Check",
  ready: "Ready",
  scheduled: "Scheduled",
  published: "Published",
  needs_update: "Needs Update",
  archived: "Archived",
  cancelled: "Cancelled",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-amber-400",
  low: "text-white/50",
};

export function WorkflowKanban({
  kanban,
}: {
  kanban: Record<EditorialTaskStatus, EditorialTaskWithContext[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDrop(targetStatus: EditorialTaskStatus, taskId: string) {
    startTransition(async () => {
      await updateWorkflowTaskStatus(taskId, targetStatus);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Editorial Kanban
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Drag cards between columns {pending ? "· saving…" : ""}
      </p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {KANBAN_STATUSES.map((status) => (
          <div
            key={status}
            className="min-w-[220px] flex-1 rounded-xl border border-white/[0.08] bg-black/30"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("taskId");
              if (taskId) onDrop(status, taskId);
            }}
          >
            <div className="border-b border-white/[0.06] px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                {STATUS_LABELS[status]}
              </p>
              <p className="text-lg font-semibold text-white">
                {(kanban[status] ?? []).length}
              </p>
            </div>
            <ul className="space-y-2 p-2">
              {(kanban[status] ?? []).map((task) => (
                <li
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("taskId", task.id);
                  }}
                  className="cursor-grab rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 active:cursor-grabbing"
                >
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  <p
                    className={`mt-1 text-xs capitalize ${PRIORITY_COLORS[task.priority]}`}
                  >
                    {task.priority} · {task.estimated_minutes}m
                  </p>
                  <p className="mt-1 text-xs text-white/35">{task.category}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
