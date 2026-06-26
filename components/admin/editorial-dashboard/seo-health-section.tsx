import Link from "next/link";
import type { SeoHealthItem } from "@/lib/editorial/types";
import { EditorialActionButton } from "@/components/admin/editorial-dashboard/editorial-action-button";

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-medium text-white">{score}</span>
    </div>
  );
}

export function SeoHealthSection({ items }: { items: SeoHealthItem[] }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">SEO Health</h2>
      <p className="mt-1 text-sm text-white/45">
        Top 10 weakest published articles (0–100): title, description, FAQ, images,
        video, internal links, schema, word count, freshness
      </p>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No published articles to score.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li
              key={item.articleId}
              className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/articles/${item.articleId}`}
                    className="font-medium text-white hover:underline"
                  >
                    {item.title}
                  </Link>
                  <ScoreBar score={item.score} />
                  <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-white/45 sm:grid-cols-5">
                    {(
                      Object.entries(item.breakdown) as Array<
                        [keyof SeoHealthItem["breakdown"], number]
                      >
                    ).map(([key, value]) => (
                      <div key={key}>
                        <dt className="capitalize">{key.replace(/([A-Z])/g, " $1")}</dt>
                        <dd className="text-white/70">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <EditorialActionButton
                  label="Improve SEO"
                  action={{
                    type: "navigate",
                    href: `/admin/articles/${item.articleId}?focus=seo`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
