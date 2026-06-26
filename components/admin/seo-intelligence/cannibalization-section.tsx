import Link from "next/link";
import type { CannibalizationPair } from "@/lib/seo/types";

export function CannibalizationSection({
  pairs,
}: {
  pairs: CannibalizationPair[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Content Cannibalization
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Similar articles competing for the same keywords — consider merging
      </p>

      {pairs.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No cannibalization detected.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {pairs.map((pair) => (
            <li
              key={`${pair.articleAId}-${pair.articleBId}`}
              className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 text-sm"
            >
              <p className="font-medium text-white">
                <Link
                  href={`/admin/articles/${pair.articleAId}`}
                  className="hover:underline"
                >
                  {pair.articleATitle}
                </Link>
                <span className="mx-2 text-white/30">↔</span>
                <Link
                  href={`/admin/articles/${pair.articleBId}`}
                  className="hover:underline"
                >
                  {pair.articleBTitle}
                </Link>
              </p>
              <p className="mt-2 text-xs text-amber-300/80">
                {pair.similarity}% title overlap — {pair.suggestion}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
