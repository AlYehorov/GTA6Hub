import type { EditorialOpportunity } from "@/lib/opportunity-engine/types";
import { OpportunityCard } from "@/components/admin/editor/opportunity-card";

export function OpportunitiesSection({
  opportunities,
}: {
  opportunities: EditorialOpportunity[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Today&apos;s Top Opportunities
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Clustered, scored, and deduplicated — OpenAI only when you click Generate Article.
      </p>

      {opportunities.length === 0 ? (
        <p className="mt-8 text-center text-sm text-white/40">
          No strong opportunities right now. Ingest more sources or check back after Rockstar
          news.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </ul>
      )}
    </section>
  );
}
