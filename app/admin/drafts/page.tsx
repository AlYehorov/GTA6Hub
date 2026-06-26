import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getAllDraftsAdmin, getDraftStats } from "@/lib/drafts/queries";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { MIN_CONTENT_CONFIDENCE, confidencePercent } from "@/lib/editorial/confidence";
import { formatDate } from "@/lib/utils/format-date";
import {
  SOURCE_LABEL_STYLES,
  SOURCE_PLATFORM_LABELS,
} from "@/lib/types/source";
import type { SourceLabel, SourcePlatform } from "@/lib/types/source";
import type { AiDraftStatus } from "@/lib/types/ai-draft";
import { cn } from "@/lib/utils";

export default async function AdminDraftsPage() {
  const configured = isSupabaseAdminConfigured();
  const [drafts, stats] = configured
    ? await Promise.all([getAllDraftsAdmin(), getDraftStats()])
    : [[], { pending: 0, approved: 0, rejected: 0, published: 0 }];

  return (
    <>
      <PageHeader
        title="AI Drafts"
        description="Review AI-generated drafts before publishing. All drafts appear here for human review."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!configured && (
          <p className="mb-8 rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add `SUPABASE_SERVICE_ROLE_KEY` to enable draft management.
          </p>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
          <StatCard label="Published" value={stats.published} />
        </div>

        {drafts.length === 0 ? (
          <p className="py-12 text-center text-white/40">
            No drafts yet.{" "}
            <Link href="/admin/editor" className="text-gta-pink hover:underline">
              Generate from Editor-in-Chief
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Source link</th>
                  <th className="px-4 py-3 font-medium">Label</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Created</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {drafts.map((draft) => (
                  <tr key={draft.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{draft.title}</td>
                    <td className="px-4 py-3 text-white/50">
                      {SOURCE_PLATFORM_LABELS[draft.source as SourcePlatform]}
                    </td>
                    <td className="hidden max-w-[200px] truncate px-4 py-3 lg:table-cell">
                      {draft.source_url ? (
                        <a
                          href={draft.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-white/40 hover:text-gta-pink"
                        >
                          <span className="truncate">View source</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SourceLabelBadge label={draft.source_label} />
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBadge value={draft.confidence} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={draft.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-white/40 sm:table-cell">
                      {formatDate(draft.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/drafts/${draft.id}`}
                        className="text-white/50 hover:text-white"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = confidencePercent(value);
  const color =
    pct >= confidencePercent(MIN_CONTENT_CONFIDENCE)
      ? "text-emerald-400"
      : "text-red-400";

  return <span className={cn("font-mono text-xs", color)}>{pct}%</span>;
}

function StatusBadge({ status }: { status: AiDraftStatus }) {
  const styles: Record<AiDraftStatus, string> = {
    pending: "bg-amber-500/10 text-amber-400",
    approved: "bg-blue-500/10 text-blue-400",
    rejected: "bg-red-500/10 text-red-400",
    published: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", styles[status])}>
      {status}
    </span>
  );
}

function SourceLabelBadge({ label }: { label: SourceLabel }) {
  const style = SOURCE_LABEL_STYLES[label] ?? SOURCE_LABEL_STYLES.unconfirmed;
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", style.className)}>
      {style.label}
    </span>
  );
}
