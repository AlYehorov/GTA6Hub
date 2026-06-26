import type { EditorialRecommendation } from "@/lib/opportunity-engine/types";

export function EditorialRecommendationSection({
  recommendation,
}: {
  recommendation: EditorialRecommendation;
}) {
  return (
    <section className="rounded-2xl border border-gta-pink/20 bg-gta-pink/5 p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Editorial Recommendation
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-white/75">
        {recommendation.summary}
      </p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-white/40">
            Estimated traffic gain
          </dt>
          <dd className="mt-1 font-heading text-2xl font-semibold text-gta-pink">
            {recommendation.trafficGainEstimate}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-white/40">Focus</dt>
          <dd className="mt-1 text-sm text-white/70">
            {recommendation.publishRockstar && "Rockstar coverage · "}
            {recommendation.publishCommunity && "Community angle · "}
            {recommendation.updateGuidesCount > 0 &&
              `Update ${recommendation.updateGuidesCount} guide${recommendation.updateGuidesCount === 1 ? "" : "s"}`}
          </dd>
        </div>
      </dl>
    </section>
  );
}
