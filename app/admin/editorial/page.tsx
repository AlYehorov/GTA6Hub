import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getAllDraftsAdmin } from "@/lib/drafts/queries";
import { getAllSourceItemsAdmin } from "@/lib/sources/queries";
import { getDraftVideosAdmin } from "@/lib/videos/queries";
import {
  RECOMMENDED_ARTICLE_IDEAS,
  detectContentGaps,
} from "@/lib/editorial/content-gaps";
import { SOURCE_PLATFORM_LABELS } from "@/lib/types/source";

export default async function EditorialCalendarPage() {
  const configured = isSupabaseAdminConfigured();

  const [drafts, sources, draftVideos, gaps] = configured
    ? await Promise.all([
        getAllDraftsAdmin(),
        getAllSourceItemsAdmin({ limit: 12 }),
        getDraftVideosAdmin(12),
        detectContentGaps(20),
      ])
    : [[], [], [], []];

  const pendingDrafts = drafts.filter(
    (d) => d.status === "pending"
  );

  return (
    <>
      <PageHeader
        title="Editorial Calendar"
        description="Pending drafts, fresh sources, video backlog, and SEO content gaps."
      />
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        {!configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add SUPABASE_SERVICE_ROLE_KEY to enable editorial data.
          </p>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-white">Pending AI Drafts</h2>
            <Link href="/admin/drafts" className="text-sm text-gta-pink hover:underline">
              Review all →
            </Link>
          </div>
          {pendingDrafts.length === 0 ? (
            <p className="text-sm text-white/40">No pending drafts.</p>
          ) : (
            <ul className="space-y-2">
              {pendingDrafts.slice(0, 8).map((draft) => (
                <li key={draft.id}>
                  <Link
                    href={`/admin/drafts/${draft.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:border-white/12"
                  >
                    <span className="font-medium text-white">{draft.title}</span>
                    <span className="text-xs text-white/40">
                      {SOURCE_PLATFORM_LABELS[draft.source]} · {Math.round(draft.confidence * 100)}% conf
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Latest Sources</h2>
          <ul className="space-y-2">
            {sources.slice(0, 8).map((source) => (
              <li
                key={source.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm"
              >
                <p className="font-medium text-white">{source.title}</p>
                <p className="mt-1 text-xs text-white/40">
                  {SOURCE_PLATFORM_LABELS[source.source]} · {source.source_label} ·{" "}
                  {source.processed ? "processed" : "pending"}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Unpublished Videos</h2>
          {draftVideos.length === 0 ? (
            <p className="text-sm text-white/40">No draft videos in queue.</p>
          ) : (
            <ul className="space-y-2">
              {draftVideos.map((video) => (
                <li
                  key={video.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm"
                >
                  <p className="font-medium text-white">{video.title}</p>
                  <p className="mt-1 text-xs text-white/40">{video.youtube_id}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Recommended Article Ideas</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {RECOMMENDED_ARTICLE_IDEAS.map((idea) => (
              <li
                key={idea}
                className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/70"
              >
                {idea}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Content Gaps</h2>
          {gaps.length === 0 ? (
            <p className="text-sm text-white/40">No gaps detected (or entities not seeded).</p>
          ) : (
            <ul className="space-y-2">
              {gaps.map((gap) => (
                <li
                  key={`${gap.kind}-${gap.slug}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm"
                >
                  <span className="text-white">
                    {gap.title}{" "}
                    <span className="text-white/40">({gap.kind})</span>
                  </span>
                  <span className="text-xs text-amber-400/80">
                    {gap.reason === "no_entity_page" ? "unpublished page" : "no article"} ·{" "}
                    <Link href={gap.entityHref} className="underline">
                      view
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
