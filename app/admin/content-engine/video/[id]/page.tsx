import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ContentPlanIdeaCard } from "@/components/admin/content-engine/content-plan-idea-card";
import { ContentEngineUsageBar } from "@/components/admin/content-engine/content-engine-usage-bar";
import { loadVideoEngineDetail } from "@/lib/content-engine/loader";
import { formatDate } from "@/lib/utils/format-date";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentEngineVideoPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadVideoEngineDetail(id);

  if (!data.video) {
    notFound();
  }

  const video = data.video;

  return (
    <>
      <PageHeader
        title="Video Content Pack"
        description="Content plan for a standalone video (no linked source item)."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <ContentEngineUsageBar
          usage={data.usage}
          openAiConfigured={data.openAiConfigured}
        />

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-2xl font-semibold text-white">
            <a
              href={video.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gta-pink"
            >
              {video.title}
            </a>
          </h2>
          <p className="mt-2 text-sm text-white/45">
            {video.published_at ? formatDate(video.published_at) : "No date"} ·{" "}
            {video.category}
          </p>
          <p className="mt-4 line-clamp-6 text-sm text-white/60">
            {video.description || "No description."}
          </p>
          <p className="mt-4 text-sm text-amber-400/80">
            Video-only entries need source ingestion for full draft/workflow
            support. Link this video to a source item when possible.
          </p>
        </section>

        {data.plan && (
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="font-heading text-xl font-semibold text-white">
              Content plan
            </h2>
            <ul className="mt-6 space-y-4">
              {data.ideas.map((idea) => (
                <ContentPlanIdeaCard key={idea.id} idea={idea} />
              ))}
            </ul>
          </section>
        )}

        <p className="text-center text-xs text-white/30">
          <Link href="/admin/content-engine" className="hover:text-white/50">
            Content engine queue
          </Link>
        </p>
      </div>
    </>
  );
}
