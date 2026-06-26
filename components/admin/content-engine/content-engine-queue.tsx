import Link from "next/link";
import type { SourceQueueItem } from "@/lib/content-engine/types";
import { formatDate } from "@/lib/utils/format-date";
import { ContentEngineQueueActions } from "@/components/admin/content-engine/content-engine-queue-actions";

interface ContentEngineQueueProps {
  queue: SourceQueueItem[];
}

export function ContentEngineQueue({ queue }: ContentEngineQueueProps) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Source-to-Content Queue
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Unprocessed sources, videos, Reddit discussions, and Rockstar posts. Generate
        a cheap content plan first, then drafts per idea.
      </p>

      {queue.length === 0 ? (
        <p className="mt-8 text-center text-sm text-white/40">
          No queue items. Ingest sources from the Sources admin page.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {queue.map((item) => (
            <li
              key={`${item.kind}-${item.id}`}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
                      {item.sourceLabel}
                    </span>
                    {item.hasPlan && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                        {item.ideaCount} ideas
                      </span>
                    )}
                    {item.processed && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/40">
                        processed
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-medium text-white">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gta-pink"
                    >
                      {item.title}
                    </a>
                  </h3>
                  <p className="mt-1 text-xs text-white/40">
                    {item.date ? formatDate(item.date) : "No date"} ·{" "}
                    {item.sourcePlatform}
                  </p>
                </div>

                <ContentEngineQueueActions
                  itemId={item.id}
                  kind={item.kind}
                  hasPlan={item.hasPlan}
                />
              </div>

              {item.entities.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-white/35">
                    Linked entities
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.entities.slice(0, 8).map((entity) => (
                      <Link
                        key={entity.id}
                        href={entity.href}
                        className="rounded-md border border-white/[0.06] px-2 py-1 text-xs text-white/60 hover:text-gta-pink"
                      >
                        {entity.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {item.articleIdeas.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-white/35">
                    Content plan ideas
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-white/55">
                    {item.articleIdeas.map((idea) => (
                      <li key={idea}>· {idea}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
