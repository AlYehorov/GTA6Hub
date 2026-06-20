import { PageHeader } from "@/components/shared/page-header";
import { SourceIngestActions } from "@/components/admin/source-ingest-actions";
import { getAllSourceItemsAdmin, getSourceItemStats } from "@/lib/sources/queries";
import { getConnectorPlatforms } from "@/lib/sources/registry";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils/format-date";
import { SOURCE_PLATFORM_LABELS } from "@/lib/types/source";
import type { SourcePlatform } from "@/lib/types/source";
import { cn } from "@/lib/utils";

export default async function AdminSourcesPage() {
  const configured = isSupabaseAdminConfigured();
  const [items, stats] = configured
    ? await Promise.all([getAllSourceItemsAdmin(), getSourceItemStats()])
    : [[], { total: 0, processed: 0, pending: 0 }];

  return (
    <>
      <PageHeader
        title="Sources"
        description="External content ingestion — mock connectors for now. AI drafts require human review."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!configured && (
          <p className="mb-8 rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add `SUPABASE_SERVICE_ROLE_KEY` to enable source ingestion.
          </p>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total sources" value={stats.total} />
          <StatCard label="Processed" value={stats.processed} />
          <StatCard label="Pending" value={stats.pending} />
        </div>

        {configured && (
          <div className="mb-10 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="mb-4 text-sm text-white/50">
              Ingest mock data from all connectors and generate AI drafts. Content is never auto-published.
            </p>
            <SourceIngestActions
              pendingCount={stats.pending}
              platforms={getConnectorPlatforms()}
            />
          </div>
        )}

        {items.length === 0 ? (
          <p className="py-12 text-center text-white/40">
            No source items yet. Run ingestion to fetch mock data.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Ingested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="max-w-xs truncate px-4 py-3 font-medium text-white">
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gta-pink"
                      >
                        {item.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-white/50">
                      {SOURCE_PLATFORM_LABELS[item.source as SourcePlatform]}
                    </td>
                    <td className="px-4 py-3 text-white/40">{item.source_type}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <ProcessedBadge processed={item.processed} />
                    </td>
                    <td className="hidden px-4 py-3 text-white/40 md:table-cell">
                      {formatDate(item.created_at)}
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

function ProcessedBadge({ processed }: { processed: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs",
        processed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
      )}
    >
      {processed ? "Processed" : "Pending"}
    </span>
  );
}
