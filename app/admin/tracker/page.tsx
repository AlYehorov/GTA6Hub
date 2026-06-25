import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getAllCompletionItemsAdmin } from "@/lib/tracker/queries";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { COMPLETION_DIFFICULTY_LABELS } from "@/lib/types/completion";
import type { CompletionItemStatus } from "@/lib/types/completion";
import { cn } from "@/lib/utils";

export default async function AdminTrackerPage() {
  const configured = isSupabaseAdminConfigured();
  const items = configured ? await getAllCompletionItemsAdmin() : [];

  const published = items.filter((i) => i.status === "published").length;
  const drafts = items.filter((i) => i.status === "draft").length;
  const spoilers = items.filter((i) => i.spoiler).length;

  return (
    <>
      <PageHeader
        title="Completion Tracker"
        description="Manage tracker items — missions, collectibles, achievements, and completion categories."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!configured && (
          <p className="mb-8 rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add `SUPABASE_SERVICE_ROLE_KEY` to enable tracker management.
          </p>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Published" value={published} />
            <StatCard label="Drafts" value={drafts} />
            <StatCard label="Spoilers" value={spoilers} />
          </div>
          <Link
            href="/admin/tracker/create"
            className="inline-flex items-center gap-2 rounded-lg bg-gta-pink px-4 py-2 text-sm font-medium text-white hover:bg-gta-pink/90"
          >
            <Plus className="size-4" />
            Add item
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="py-12 text-center text-white/40">
            No tracker items yet.{" "}
            <Link href="/admin/tracker/create" className="text-gta-pink hover:underline">
              Create one
            </Link>{" "}
            or run `npm run seed:tracker`.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Difficulty</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Flags</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{item.title}</td>
                    <td className="px-4 py-3 text-white/50">{item.category.title}</td>
                    <td className="hidden px-4 py-3 text-white/40 sm:table-cell">
                      {COMPLETION_DIFFICULTY_LABELS[item.difficulty]}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {item.spoiler && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                          Spoiler
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/tracker/${item.id}`}
                        className="text-white/50 hover:text-white"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-white/30">
          <Link href="/tracker" className="inline-flex items-center gap-1 hover:text-white/50">
            <Trophy className="size-3.5" />
            View public tracker
          </Link>
        </p>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: CompletionItemStatus }) {
  const styles: Record<CompletionItemStatus, string> = {
    draft: "bg-white/10 text-white/50",
    published: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", styles[status])}>
      {status}
    </span>
  );
}
