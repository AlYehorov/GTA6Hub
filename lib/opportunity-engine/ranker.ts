import type { ContentGap } from "@/lib/editorial/content-gaps";
import type { ArticleSeoInput } from "@/lib/editorial/types";
import { buildSourceClusters } from "@/lib/opportunity-engine/clustering";
import { clusterToOpportunity, scoreCluster } from "@/lib/opportunity-engine/scoring";
import type { EditorialOpportunity, OpportunityEntity } from "@/lib/opportunity-engine/types";
import type { SourceItem } from "@/lib/types/source";
import type { Video } from "@/lib/types/video";

export function rankEditorialOpportunities(input: {
  sources: SourceItem[];
  videos: Video[];
  articles: ArticleSeoInput[];
  gaps: ContentGap[];
  entities: OpportunityEntity[];
  statusMap: Map<
    string,
    {
      status: EditorialOpportunity["status"];
      aiDraftId: string | null;
      workspaceId: string | null;
    }
  >;
  limit?: number;
}): EditorialOpportunity[] {
  const existingTitles = input.articles.map((a) => a.title);
  const clusters = buildSourceClusters({
    sources: input.sources,
    videos: input.videos,
    existingArticleTitles: existingTitles,
  });

  const entityMap = new Map<string, OpportunityEntity>();
  for (const entity of input.entities) {
    entityMap.set(entity.slug, entity);
    entityMap.set(entity.title.toLowerCase(), entity);
  }

  const opportunities: EditorialOpportunity[] = [];

  for (const cluster of clusters) {
    const scored = scoreCluster(cluster, {
      articles: input.articles,
      entityMap,
      gaps: input.gaps,
    });
    const opp = clusterToOpportunity(cluster, scored, {
      articles: input.articles,
      entityMap,
      statusMap: input.statusMap,
    });
    if (!opp) continue;
    if (opp.status === "ignored") continue;
    opportunities.push(opp);
  }

  for (const gap of input.gaps.slice(0, 12)) {
    const gapClusterKey = `gap-${gap.kind}-${gap.slug}`;
    if (opportunities.some((o) => o.clusterKey === gapClusterKey)) continue;
    if (input.statusMap.get(gapClusterKey)?.status === "ignored") continue;

    const entity: OpportunityEntity = {
      id: `${gap.kind}-${gap.slug}`,
      kind: gap.kind,
      slug: gap.slug,
      title: gap.title,
      href: gap.entityHref,
    };

    const score =
      55 +
      (gap.reason === "no_entity_page" ? 20 : 10) +
      (gap.kind === "characters" || gap.kind === "locations" ? 10 : 0);

    opportunities.push({
      id: `opp-${gapClusterKey}`,
      clusterKey: gapClusterKey,
      title: `${gap.title} — GTA 6 Guide`,
      summary: `Content gap · no ${gap.reason === "no_entity_page" ? "entity page" : "supporting article"}`,
      score,
      stars: score >= 90 ? 4 : score >= 60 ? 3 : 2,
      confidence: "Medium",
      trafficEstimate: gap.kind === "characters" ? "High" : "Medium",
      seoEstimate: "High",
      sourceCount: 0,
      sourceIds: [],
      videoIds: [],
      sourceTypes: [],
      entities: [entity],
      relatedArticleIds: [],
      existingArticleId: null,
      existingArticleTitle: null,
      existingArticleSlug: null,
      action: "create",
      articleType: "guide",
      targetKeyword: `${gap.title} GTA 6`,
      internalLinkTargets: [gap.entityHref],
      estimatedReadingMinutes: 6,
      estimatedWritingMinutes: 30,
      scoringBreakdown: [{ signal: "SEO content gap", points: score }],
      contentType: "entity_page_update",
      status: input.statusMap.get(gapClusterKey)?.status ?? "open",
      aiDraftId: input.statusMap.get(gapClusterKey)?.aiDraftId ?? null,
      workspaceId: input.statusMap.get(gapClusterKey)?.workspaceId ?? null,
    });
  }

  const seen = new Set<string>();
  return opportunities
    .sort((a, b) => b.score - a.score)
    .filter((o) => {
      const key = o.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, input.limit ?? 12);
}
