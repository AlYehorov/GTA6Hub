import Link from "next/link";
import type { InternalLinkSuggestion } from "@/lib/editorial/types";
import { EditorialActionButton } from "@/components/admin/editorial-dashboard/editorial-action-button";

export function InternalLinksSection({
  suggestions,
}: {
  suggestions: InternalLinkSuggestion[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Internal Link Suggestions
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Published articles that mention topics but lack internal links
      </p>

      {suggestions.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No link gaps detected.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {suggestions.map((item) => (
            <li
              key={item.articleId}
              className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-white/40">Article</p>
                  <Link
                    href={`/admin/articles/${item.articleId}`}
                    className="font-medium text-white hover:underline"
                  >
                    {item.articleTitle}
                  </Link>
                  <p className="mt-3 text-white/40">Should link to</p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {item.suggestedLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80 hover:border-gta-pink/30"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <EditorialActionButton
                  label="Suggest Internal Links"
                  action={{
                    type: "navigate",
                    href: `/admin/articles/${item.articleId}?focus=links`,
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
