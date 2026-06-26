import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { loadWorkspaceDetailData } from "@/lib/workspace/loader";
import { WorkspaceActions } from "@/components/admin/workflow/workspace-actions";
import { WorkspaceChecklist } from "@/components/admin/workflow/workspace-checklist";
import {
  OneClickActionsSection,
  DashboardLinksSection,
} from "@/components/admin/workflow/workflow-stats-sections";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadWorkspaceDetailData(id);
  if (!data) notFound();

  const { workspace, activity } = data;
  const pendingItems = workspace.checklist.filter((item) => !item.completed).length;

  return (
    <>
      <PageHeader
        title={workspace.articleTitle}
        description={`Article improvement workspace · SEO ${workspace.seo_score}${
          workspace.potential_score > workspace.seo_score
            ? ` → ${workspace.potential_score}`
            : ""
        }`}
      />
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin/workflow"
            className="text-sm text-gta-pink hover:underline"
          >
            ← Back to workflow
          </Link>
          <WorkspaceActions
            workspaceId={workspace.id}
            status={workspace.status}
            articleId={workspace.article_id}
            assignedTo={workspace.assigned_to}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:col-span-1">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Current SEO
            </p>
            <p className="mt-2 font-heading text-4xl font-semibold text-white">
              {workspace.seo_score}
            </p>
            <p className="mt-2 text-sm text-white/50">
              Potential {workspace.potential_score}
            </p>
            <p className="mt-4 text-sm text-white/45">
              Estimated {workspace.estimated_minutes} min · {pendingItems} checklist
              items left
            </p>
            {workspace.reason && (
              <p className="mt-3 text-sm text-gta-pink/80">{workspace.reason}</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:col-span-2">
            <h2 className="font-heading text-lg font-semibold text-white">
              Improvement Checklist
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Deterministic — not separate tasks
            </p>
            <div className="mt-4">
              <WorkspaceChecklist
                workspaceId={workspace.id}
                items={workspace.checklist}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="font-heading text-lg font-semibold text-white">
              Article Preview
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/60">
              {workspace.articlePreview}
              {workspace.articlePreview.length >= 600 ? "…" : ""}
            </p>
          </section>

          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="font-heading text-lg font-semibold text-white">
              Related Rockstar Sources
            </h2>
            {workspace.relatedSources.length === 0 ? (
              <p className="mt-4 text-sm text-white/40">No linked sources.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {workspace.relatedSources.map((source) => (
                  <li key={source.id} className="text-sm text-white/70">
                    {source.title}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SuggestionBlock title="Suggested FAQ" items={workspace.suggestedFaq} />
          <SuggestionBlock
            title="Suggested Links"
            items={workspace.suggestedInternalLinks}
          />
          <SuggestionBlock
            title="Suggested Videos"
            items={workspace.suggestedVideos}
          />
        </div>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-lg font-semibold text-white">Activity</h2>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">No activity yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/[0.06] px-4 py-3 text-sm"
                >
                  <span className="text-white/80">{entry.message}</span>
                  <span className="text-xs text-white/35">
                    {entry.event_type} ·{" "}
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <OneClickActionsSection articleId={workspace.article_id} />
        <DashboardLinksSection />
      </div>
    </>
  );
}

function SuggestionBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">Nothing suggested.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item} className="text-sm text-white/65">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
