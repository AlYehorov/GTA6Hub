import Link from "next/link";
import type { BrokenInternalLink } from "@/lib/seo/types";

export function BrokenLinksSection({
  links,
}: {
  links: BrokenInternalLink[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Broken Internal Links
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Links in article content pointing to missing pages
      </p>

      {links.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No broken internal links detected.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {links.map((link, i) => (
            <li
              key={`${link.articleId}-${link.href}-${i}`}
              className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm"
            >
              <Link
                href={`/admin/articles/${link.articleId}?focus=links`}
                className="font-medium text-white hover:underline"
              >
                {link.articleTitle}
              </Link>
              <p className="mt-1 font-mono text-xs text-red-300/90">{link.href}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
