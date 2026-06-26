import Link from "next/link";
import type { ImproveQueueItem } from "@/lib/seo/types";
import { SeoAiEditorPanel } from "@/components/admin/seo-intelligence/seo-ai-editor-panel";

export function ImproveQueueSection({
  items,
}: {
  items: ImproveQueueItem[];
}) {
  const top = items.slice(0, 8);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">Improve Queue</h2>
      <p className="mt-1 text-sm text-white/45">Weakest pages with actionable reasons</p>

      {top.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">All published articles look healthy.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {top.map((item) => (
            <li
              key={item.articleId}
              className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/articles/${item.articleId}?focus=seo`}
                    className="font-medium text-white hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-gta-pink">Score {item.score}/100</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {item.reasons.map((reason) => (
                      <li
                        key={reason}
                        className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/60"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={`/admin/articles/${item.articleId}?focus=seo`}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:border-gta-pink/40"
                >
                  Improve
                </Link>
              </div>
              <div className="mt-4">
                <SeoAiEditorPanel
                  articleId={item.articleId}
                  articleTitle={item.title}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
