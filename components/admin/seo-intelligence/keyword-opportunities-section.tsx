import Link from "next/link";
import type { KeywordOpportunity } from "@/lib/seo/types";

export function KeywordOpportunitiesSection({
  opportunities,
}: {
  opportunities: KeywordOpportunity[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Keyword Opportunities
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Potential future pages from titles, sources, entities, and videos — no external APIs
      </p>

      {opportunities.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No new keyword gaps found.</p>
      ) : (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {opportunities.map((opp) => (
            <li
              key={opp.id}
              className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 text-sm"
            >
              <p className="font-medium text-white">{opp.phrase}</p>
              <p className="mt-1 text-xs text-white/40">
                {opp.category} · {opp.source}
              </p>
              <p className="mt-1 text-xs text-white/50">{opp.rationale}</p>
              <Link
                href={`/admin/articles/create?title=${encodeURIComponent(opp.phrase)}&type=guide`}
                className="mt-2 inline-block text-xs text-gta-pink hover:underline"
              >
                Create article →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
