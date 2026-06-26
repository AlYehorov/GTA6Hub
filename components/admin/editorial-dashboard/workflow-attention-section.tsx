import Link from "next/link";
import { getAllArticleWorkspaces } from "@/lib/workspace/queries";
import { ACTIVE_WORKSPACE_STATUSES } from "@/lib/workspace/types";

export async function WorkflowAttentionSection() {
  const workspaces = await getAllArticleWorkspaces();
  const active = workspaces.filter((w) =>
    ACTIVE_WORKSPACE_STATUSES.includes(w.status)
  );
  const estimatedMinutes = active.reduce((sum, w) => sum + w.estimated_minutes, 0);

  return (
    <section className="rounded-2xl border border-gta-pink/20 bg-gta-pink/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white">
            {active.length} Article{active.length === 1 ? "" : "s"} Need Attention
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Article workspaces — not scattered micro-tasks · estimated {estimatedMinutes} min
          </p>
        </div>
        <Link
          href="/admin/workflow"
          className="rounded-lg border border-gta-pink/30 bg-gta-pink/10 px-4 py-2 text-sm font-medium text-gta-pink hover:bg-gta-pink/20"
        >
          Open Workflow
        </Link>
      </div>
    </section>
  );
}
