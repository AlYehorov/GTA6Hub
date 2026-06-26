import Link from "next/link";
import type { ContentOpportunity } from "@/lib/editorial/types";
import { EditorialActionButton } from "@/components/admin/editorial-dashboard/editorial-action-button";

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="text-amber-400" aria-label={`${stars} out of 5 stars`}>
      {"★".repeat(stars)}
      <span className="text-white/20">{"★".repeat(5 - stars)}</span>
    </span>
  );
}

function formatTraffic(n: number): string {
  return n.toLocaleString("en-US");
}

export function ContentOpportunitiesSection({
  opportunities,
}: {
  opportunities: ContentOpportunity[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Content Opportunities
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Top 10 ranked by source signal, SEO gaps, and editorial playbook — no extra
        OpenAI calls
      </p>

      {opportunities.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No opportunities detected yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {opportunities.map((opp) => (
            <li
              key={opp.id}
              className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <StarRating stars={opp.stars} />
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
                      {opp.category}
                    </span>
                  </div>
                  <p className="mt-2 font-medium text-white">{opp.title}</p>
                  <p className="mt-1 text-xs text-white/40">{opp.rationale}</p>
                  <dl className="mt-3 flex flex-wrap gap-6 text-sm">
                    <div>
                      <dt className="text-white/40">Estimated Monthly Traffic</dt>
                      <dd className="font-medium text-gta-pink">
                        {formatTraffic(opp.estimatedMonthlyTraffic)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/40">Difficulty</dt>
                      <dd className="font-medium text-white">{opp.difficulty}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {opp.sourceItemId ? (
                    <EditorialActionButton
                      label="Generate Draft"
                      action={{
                        type: "generate-draft",
                        sourceItemId: opp.sourceItemId,
                      }}
                    />
                  ) : (
                    <EditorialActionButton
                      label="Generate Draft"
                      action={{
                        type: "navigate",
                        href: `/admin/articles/create?title=${encodeURIComponent(opp.title)}&type=guide`,
                      }}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-white/35">
        Scores are heuristic from Rockstar sources, Reddit, entity gaps, and curated
        ideas.{" "}
        <Link href="/admin/sources" className="text-gta-pink hover:underline">
          Manage sources →
        </Link>
      </p>
    </section>
  );
}
