import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ContentPlanIdeaCard } from "@/components/admin/content-engine/content-plan-idea-card";
import { ContentEngineUsageBar } from "@/components/admin/content-engine/content-engine-usage-bar";
import { SourceEngineActions } from "@/components/admin/content-engine/source-engine-actions";
import { loadSourceEngineDetail } from "@/lib/content-engine/loader";
import { formatDate } from "@/lib/utils/format-date";
import {
  SOURCE_LABEL_STYLES,
  SOURCE_PLATFORM_LABELS,
} from "@/lib/types/source";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentEngineSourcePage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadSourceEngineDetail(id);

  if (!data.source) {
    notFound();
  }

  const source = data.source;

  return (
    <>
      <PageHeader
        title="Source Content Pack"
        description="Content plan, entity links, and per-idea draft generation."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {!data.configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Apply migration 015 and configure Supabase admin credentials.
          </p>
        )}

        <ContentEngineUsageBar
          usage={data.usage}
          openAiConfigured={data.openAiConfigured}
        />

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
                  {SOURCE_PLATFORM_LABELS[source.source]}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${SOURCE_LABEL_STYLES[source.source_label].className}`}
                >
                  {SOURCE_LABEL_STYLES[source.source_label].label}
                </span>
              </div>
              <h2 className="mt-3 font-heading text-2xl font-semibold text-white">
                <a
                  href={source.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gta-pink"
                >
                  {source.title}
                </a>
              </h2>
              <p className="mt-2 text-sm text-white/45">
                {source.published_at
                  ? formatDate(source.published_at)
                  : formatDate(source.created_at)}
              </p>
            </div>
            <SourceEngineActions
              sourceId={source.id}
              hasPlan={Boolean(data.plan)}
            />
          </div>

          <div className="mt-6 rounded-lg border border-white/[0.06] bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Source excerpt
            </p>
            <p className="mt-2 line-clamp-6 text-sm text-white/60">
              {source.content || "No content body."}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-xl font-semibold text-white">
            Extracted entities
          </h2>
          {data.entities.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">
              No entities linked yet. Click Extract Entities to run the knowledge
              graph extractor.
            </p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {data.entities.map((entity) => (
                <li key={entity.id}>
                  <Link
                    href={entity.href}
                    className="rounded-md border border-white/[0.06] px-3 py-1.5 text-sm text-white/70 hover:text-gta-pink"
                  >
                    {entity.title}
                    <span className="ml-2 text-xs text-white/35">
                      {Math.round(entity.confidence * 100)}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-xl font-semibold text-white">
            Content plan
          </h2>
          {!data.plan ? (
            <p className="mt-4 text-sm text-white/40">
              No plan yet. Generate Plan runs one low-cost OpenAI call for 5–10
              article ideas.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-white/45">
                Plan created {formatDate(data.plan.created_at)} ·{" "}
                {data.ideas.filter((i) => i.status !== "ignored").length} active
                ideas
              </p>
              <ul className="mt-6 space-y-4">
                {data.ideas.map((idea) => (
                  <ContentPlanIdeaCard key={idea.id} idea={idea} />
                ))}
              </ul>
            </>
          )}
        </section>

        <p className="text-center text-xs text-white/30">
          <Link href="/admin/content-engine" className="hover:text-white/50">
            Content engine queue
          </Link>
          {" · "}
          <Link href="/admin/sources" className="hover:text-white/50">
            Sources
          </Link>
        </p>
      </div>
    </>
  );
}
