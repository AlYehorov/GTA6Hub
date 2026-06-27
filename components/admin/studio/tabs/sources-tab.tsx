import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SourceIngestActions } from "@/components/admin/source-ingest-actions";
import { EditorIntakeStats } from "@/components/admin/editor/editor-intake-stats";
import type { SourcePlatform } from "@/lib/types/source";
import type { EditorBriefingData } from "@/lib/opportunity-engine/types";

export function StudioSourcesTab({
  stats,
  platforms,
  intake,
  configured,
}: {
  stats: { total: number; processed: number; pending: number };
  platforms: SourcePlatform[];
  intake: EditorBriefingData["intake"];
  configured: boolean;
}) {
  return (
    <div className="space-y-6">
      {!configured && (
        <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
          Добавь SUPABASE_SERVICE_ROLE_KEY для ingestion.
        </p>
      )}

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-heading text-xl font-semibold text-white">Подтянуть sources</h2>
        <p className="mt-1 text-sm text-white/45">
          Rockstar Newswire, YouTube, Reddit — без этого в Editor не появятся темы.
        </p>
        <div className="mt-6">
          <SourceIngestActions pendingCount={stats.pending} platforms={platforms} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total sources" value={stats.total} />
        <Stat label="Processed" value={stats.processed} />
        <Stat label="Pending" value={stats.pending} />
      </div>

      <EditorIntakeStats intake={intake} />

      <Link
        href="/admin/sources"
        className="inline-flex items-center gap-2 text-sm text-gta-pink hover:underline"
      >
        Полный список sources
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
