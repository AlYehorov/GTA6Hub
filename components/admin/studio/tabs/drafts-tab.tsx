import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { confidencePercent } from "@/lib/editorial/confidence";
import { formatDate } from "@/lib/utils/format-date";
import { SOURCE_PLATFORM_LABELS } from "@/lib/types/source";
import type { SourcePlatform } from "@/lib/types/source";
import type { AiDraftListItem, AiDraftStatus } from "@/lib/types/ai-draft";
import { cn } from "@/lib/utils";

export function StudioDraftsTab({
  drafts,
  stats,
}: {
  drafts: AiDraftListItem[];
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    published: number;
  };
}) {
  const actionable = drafts.filter((d) => d.status === "pending" || d.status === "approved");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-heading text-xl font-semibold text-white">Review → Approve → Publish</h2>
        <p className="mt-1 text-sm text-white/45">
          Official sources: approve при confidence ≥ 90%. Community/media (Reddit, Google News): от 50% —
          на сайте будет пометка unverified.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Pending" value={stats.pending} highlight={stats.pending > 0} />
        <Stat label="Approved" value={stats.approved} />
        <Stat label="Rejected" value={stats.rejected} />
        <Stat label="Published" value={stats.published} />
      </div>

      {actionable.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/40">
          Нет черновиков на review. Сгенерируй статью во вкладке Editor.
        </p>
      ) : (
        <ul className="space-y-3">
          {actionable.slice(0, 12).map((draft) => (
            <li
              key={draft.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-4"
            >
              <div>
                <p className="font-medium text-white">{draft.title}</p>
                <p className="mt-1 text-xs text-white/45">
                  {SOURCE_PLATFORM_LABELS[draft.source as SourcePlatform]} ·{" "}
                  {formatDate(draft.created_at)} · confidence{" "}
                  {confidencePercent(draft.confidence)}%
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={draft.status} />
                <Link
                  href={`/admin/drafts/${draft.id}`}
                  className="rounded-lg border border-gta-pink/40 px-3 py-1.5 text-xs text-gta-pink hover:bg-gta-pink/10"
                >
                  Review
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/admin/drafts"
        className="inline-flex items-center gap-2 text-sm text-gta-pink hover:underline"
      >
        Все drafts
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        highlight
          ? "border-gta-pink/30 bg-gta-pink/5"
          : "border-white/[0.06] bg-white/[0.02]"
      )}
    >
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: AiDraftStatus }) {
  const styles: Record<AiDraftStatus, string> = {
    pending: "bg-amber-500/10 text-amber-400",
    approved: "bg-emerald-500/10 text-emerald-400",
    rejected: "bg-red-500/10 text-red-400",
    published: "bg-white/10 text-white/60",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs capitalize", styles[status])}>
      {status}
    </span>
  );
}
