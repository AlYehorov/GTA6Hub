import Link from "next/link";
import type { ArticleWorkspaceWithContext } from "@/lib/workspace/types";

function statusLabel(workspace: ArticleWorkspaceWithContext): string {
  if (workspace.reason.toLowerCase().includes("rockstar")) return "Needs Update";
  if (workspace.status === "claimed") return "Claimed";
  if (workspace.status === "in_progress") return "In Progress";
  if (workspace.status === "review") return "Review";
  return "Needs Improvement";
}

export function ArticlesAttentionSection({
  workspaces,
}: {
  workspaces: ArticleWorkspaceWithContext[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        {workspaces.length} Article{workspaces.length === 1 ? "" : "s"} Need Attention
      </h2>
      <p className="mt-1 text-sm text-white/45">
        One improvement workspace per article — checklist inside, not scattered tasks
      </p>

      {workspaces.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">
          No articles need attention. Run a scan to detect SEO gaps and stale content.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {workspaces.map((workspace) => (
            <li
              key={workspace.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-black/20 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{workspace.articleTitle}</p>
                <p className="mt-1 text-sm text-white/45">
                  SEO {workspace.seo_score}
                  {workspace.potential_score > workspace.seo_score
                    ? ` → ${workspace.potential_score}`
                    : ""}
                  {" · "}
                  {statusLabel(workspace)}
                </p>
                {workspace.reason && (
                  <p className="mt-1 text-xs text-gta-pink/70">{workspace.reason}</p>
                )}
                {workspace.assigned_to && (
                  <p className="mt-1 text-xs text-white/35">
                    Locked: {workspace.assigned_to}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">
                  Estimated {workspace.estimated_minutes} min
                </p>
                <Link
                  href={`/admin/workflow/${workspace.id}`}
                  className="mt-2 inline-block rounded-lg border border-gta-pink/30 bg-gta-pink/10 px-4 py-2 text-sm font-medium text-gta-pink hover:bg-gta-pink/20"
                >
                  Improve
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
