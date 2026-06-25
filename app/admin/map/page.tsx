import Link from "next/link";
import { Plus, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getAllMapPointsAdmin, getMapPointStats } from "@/lib/map/queries";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  MAP_POINT_STATUS_LABELS,
  MAP_POINT_TYPE_LABELS,
} from "@/lib/types/map-point";
import type { MapPointStatus } from "@/lib/types/map-point";
import { cn } from "@/lib/utils";

export default async function AdminMapPage() {
  const configured = isSupabaseAdminConfigured();
  const [points, stats] = configured
    ? await Promise.all([getAllMapPointsAdmin(), getMapPointStats()])
    : [[], { draft: 0, pending: 0, published: 0, rejected: 0 }];

  return (
    <>
      <PageHeader
        title="Map Points"
        description="Manage interactive map locations across Leonida and Vice City."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!configured && (
          <p className="mb-8 rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add `SUPABASE_SERVICE_ROLE_KEY` to enable map management.
          </p>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {(Object.keys(stats) as MapPointStatus[]).map((key) => (
              <StatCard key={key} label={MAP_POINT_STATUS_LABELS[key]} value={stats[key]} />
            ))}
          </div>
          <Link
            href="/admin/map/create"
            className="inline-flex items-center gap-2 rounded-lg bg-gta-pink px-4 py-2 text-sm font-medium text-white hover:bg-gta-pink/90"
          >
            <Plus className="size-4" />
            Add point
          </Link>
        </div>

        {points.length === 0 ? (
          <p className="py-12 text-center text-white/40">
            No map points yet.{" "}
            <Link href="/admin/map/create" className="text-gta-pink hover:underline">
              Create one
            </Link>{" "}
            or run `npm run seed:map`.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">District</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Flags</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {points.map((point) => (
                  <tr key={point.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{point.title}</td>
                    <td className="px-4 py-3 text-white/50">
                      {MAP_POINT_TYPE_LABELS[point.type]}
                    </td>
                    <td className="px-4 py-3 text-white/40">{point.district ?? "—"}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex gap-1">
                        {point.verified && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                            Verified
                          </span>
                        )}
                        {point.spoiler && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                            Spoiler
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={point.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/map/${point.id}`}
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
          <Link href="/map" className="inline-flex items-center gap-1 hover:text-white/50">
            <MapPin className="size-3.5" />
            View public map
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

function StatusBadge({ status }: { status: MapPointStatus }) {
  const styles: Record<MapPointStatus, string> = {
    draft: "bg-white/10 text-white/50",
    pending: "bg-amber-500/10 text-amber-400",
    published: "bg-emerald-500/10 text-emerald-400",
    rejected: "bg-red-500/10 text-red-400",
  };

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", styles[status])}>
      {status}
    </span>
  );
}
