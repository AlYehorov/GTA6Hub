import Link from "next/link";
import { OUTDATED_ARTICLE_DAYS } from "@/lib/editorial/constants";
import type { OutdatedArticle } from "@/lib/editorial/types";
import { EditorialActionButton } from "@/components/admin/editorial-dashboard/editorial-action-button";

export function OutdatedArticlesSection({
  articles,
}: {
  articles: OutdatedArticle[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Outdated Articles
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Published articles older than {OUTDATED_ARTICLE_DAYS} days with newer Rockstar
        sources available
      </p>

      {articles.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No outdated articles flagged.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {articles.map((article) => (
            <li
              key={article.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-sm"
            >
              <div>
                <span className="rounded bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-300">
                  Needs Update
                </span>
                <p className="mt-2 font-medium text-white">{article.title}</p>
                <p className="mt-1 text-xs text-white/40">
                  Last updated {article.daysSinceUpdate} days ago · New Rockstar:{" "}
                  {article.newestRockstarSourceTitle}
                </p>
              </div>
              <div className="flex gap-2">
                <EditorialActionButton
                  label="Update Draft"
                  action={{
                    type: "navigate",
                    href: `/admin/articles/${article.id}?focus=content`,
                  }}
                />
                <Link
                  href={`/${article.type === "guide" ? "guides" : "news"}/${article.slug}`}
                  className="text-xs text-white/50 hover:text-white"
                >
                  View live →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
