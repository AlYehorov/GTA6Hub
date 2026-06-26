import type { TrendingKeyword } from "@/lib/opportunity-engine/types";

export function TrendingKeywordsSection({
  keywords,
}: {
  keywords: TrendingKeyword[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">Trending Keywords</h2>
      <p className="mt-1 text-sm text-white/45">
        Frequency across ingested sources (last 7 days)
      </p>

      {keywords.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">No trending terms yet.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span
              key={kw.term}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/70"
            >
              {kw.term}
              <span className="ml-2 text-xs text-white/35">{kw.count}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
