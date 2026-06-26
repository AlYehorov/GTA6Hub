import type {
  EditorialOpportunity,
  EditorialRecommendation,
  TrafficLevel,
} from "@/lib/opportunity-engine/types";

export function buildEditorialRecommendation(input: {
  opportunities: EditorialOpportunity[];
  outdatedCount: number;
}): EditorialRecommendation {
  const top = input.opportunities[0];
  const hasRockstar = input.opportunities.some((o) =>
    o.sourceTypes.includes("Rockstar") || o.sourceTypes.includes("Newswire")
  );
  const hasCommunity = input.opportunities.some(
    (o) => o.sourceTypes.includes("Reddit") || o.confidence === "Low"
  );
  const updateGuides = Math.min(3, input.outdatedCount);

  let trafficGain: TrafficLevel = "Medium";
  if (top?.trafficEstimate === "Very High") trafficGain = "High";
  else if (top?.stars && top.stars >= 4) trafficGain = "High";
  else if (!top) trafficGain = "Low";

  const parts: string[] = [];
  if (hasRockstar) parts.push("publish one Rockstar article");
  if (hasCommunity) parts.push("publish one community article");
  if (updateGuides > 0) {
    parts.push(
      `update ${updateGuides} existing guide${updateGuides === 1 ? "" : "s"}`
    );
  }
  if (parts.length === 0) parts.push("focus on SEO gap guides");

  return {
    summary: `Today's best strategy: ${parts.join(", ")}.`,
    publishRockstar: hasRockstar,
    publishCommunity: hasCommunity,
    updateGuidesCount: updateGuides,
    trafficGainEstimate: trafficGain,
  };
}
