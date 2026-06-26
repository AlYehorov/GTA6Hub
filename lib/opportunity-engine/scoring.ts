import type { ContentGap } from "@/lib/editorial/content-gaps";
import type { ArticleSeoInput } from "@/lib/editorial/types";
import { clusterSourceTypes } from "@/lib/opportunity-engine/clustering";
import { topicDefForKey, TRENDING_TERMS } from "@/lib/opportunity-engine/topics";
import type {
  ConfidenceLevel,
  EditorialOpportunity,
  OpportunityEntity,
  SourceCluster,
  TrafficLevel,
} from "@/lib/opportunity-engine/types";

export const SCORE = {
  ROCKSTAR_OFFICIAL: 100,
  MULTI_SOURCE_TOPIC: 40,
  TRENDING_KEYWORD: 30,
  YOUTUBE_50K_VIEWS: 25,
  REDDIT_MANY_MENTIONS: 20,
  KG_ENTITY: 20,
  UPDATE_EXISTING: 15,
  EVERGREEN_GUIDE: 10,
  OLD_RUMOR: -40,
  DUPLICATE: -100,
  SPAM: -100,
} as const;

function starsFromScore(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 120) return 5;
  if (score >= 90) return 4;
  if (score >= 60) return 3;
  if (score >= 35) return 2;
  return 1;
}

function trafficFromScore(score: number, sourceCount: number): TrafficLevel {
  if (score >= 120 || sourceCount >= 5) return "Very High";
  if (score >= 90) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

function confidenceFromCluster(cluster: SourceCluster): ConfidenceLevel {
  const hasOfficial = cluster.members.some((m) => m.isOfficial);
  const rumorOnly = cluster.members.every((m) => m.isRumor || m.platform === "reddit");
  if (hasOfficial) return "High";
  if (rumorOnly) return "Low";
  return "Medium";
}

function findMatchingArticle(
  cluster: SourceCluster,
  articles: ArticleSeoInput[]
): ArticleSeoInput | null {
  const titleLower = cluster.title.toLowerCase();
  const topicDef = topicDefForKey(cluster.clusterKey);

  for (const article of articles) {
    const aTitle = article.title.toLowerCase();
    if (
      aTitle.includes(titleLower.slice(0, 24)) ||
      titleLower.includes(aTitle.slice(0, 24))
    ) {
      return article;
    }
    if (topicDef?.targetKeyword) {
      const kw = topicDef.targetKeyword.toLowerCase();
      if (aTitle.includes(kw.slice(0, 20)) || kw.includes(aTitle.slice(0, 20))) {
        return article;
      }
    }
  }
  return null;
}

function countTrendingHits(cluster: SourceCluster): number {
  const corpus = cluster.members
    .map((m) => `${m.title} ${m.content}`)
    .join(" ")
    .toLowerCase();
  return TRENDING_TERMS.filter((term) => corpus.includes(term)).length;
}

function estimateReadingMinutes(contentType: string): number {
  if (contentType === "news_summary") return 4;
  if (contentType === "trailer_breakdown") return 8;
  if (contentType === "faq_article") return 6;
  return 7;
}

function estimateWritingMinutes(score: number): number {
  if (score >= 100) return 45;
  if (score >= 70) return 35;
  return 25;
}

export function scoreCluster(
  cluster: SourceCluster,
  input: {
    articles: ArticleSeoInput[];
    entityMap: Map<string, OpportunityEntity>;
    gaps: ContentGap[];
  }
): { score: number; breakdown: Array<{ signal: string; points: number }> } {
  const breakdown: Array<{ signal: string; points: number }> = [];
  let score = 0;

  const hasOfficial = cluster.members.some((m) => m.isOfficial);
  if (hasOfficial) {
    breakdown.push({ signal: "Rockstar official source", points: SCORE.ROCKSTAR_OFFICIAL });
    score += SCORE.ROCKSTAR_OFFICIAL;
  }

  const uniquePlatforms = new Set(cluster.members.map((m) => m.platform));
  if (cluster.members.length >= 2 && uniquePlatforms.size >= 2) {
    breakdown.push({
      signal: "Multiple sources on same topic",
      points: SCORE.MULTI_SOURCE_TOPIC,
    });
    score += SCORE.MULTI_SOURCE_TOPIC;
  } else if (cluster.members.length >= 3) {
    breakdown.push({
      signal: "Multiple sources on same topic",
      points: SCORE.MULTI_SOURCE_TOPIC,
    });
    score += SCORE.MULTI_SOURCE_TOPIC;
  }

  const trendingHits = countTrendingHits(cluster);
  if (trendingHits >= 2) {
    const pts = SCORE.TRENDING_KEYWORD;
    breakdown.push({ signal: "Trending keywords", points: pts });
    score += pts;
  }

  const maxViews = Math.max(...cluster.members.map((m) => m.youtubeViewEstimate), 0);
  if (maxViews >= 50_000) {
    breakdown.push({ signal: "YouTube 50k+ views", points: SCORE.YOUTUBE_50K_VIEWS });
    score += SCORE.YOUTUBE_50K_VIEWS;
  }

  const redditScore = cluster.members.reduce((s, m) => s + m.redditMentionScore, 0);
  if (redditScore >= 40) {
    breakdown.push({ signal: "Reddit discussion volume", points: SCORE.REDDIT_MANY_MENTIONS });
    score += SCORE.REDDIT_MANY_MENTIONS;
  }

  const topicDef = topicDefForKey(cluster.clusterKey);
  const relatedGaps = input.gaps.filter((g) =>
    cluster.topicKeys.some((key) => {
      const def = topicDefForKey(key);
      return def?.keywords.some(
        (kw) =>
          g.title.toLowerCase().includes(kw) ||
          g.slug.replace(/-/g, " ").includes(kw)
      );
    })
  );
  if (relatedGaps.length > 0 || cluster.topicKeys.length > 0) {
    breakdown.push({ signal: "Knowledge Graph entities", points: SCORE.KG_ENTITY });
    score += SCORE.KG_ENTITY;
  }

  const existing = findMatchingArticle(cluster, input.articles);
  if (existing) {
    breakdown.push({ signal: "Updates existing article", points: SCORE.UPDATE_EXISTING });
    score += SCORE.UPDATE_EXISTING;
  }

  if (topicDef?.evergreen) {
    breakdown.push({ signal: "Evergreen guide topic", points: SCORE.EVERGREEN_GUIDE });
    score += SCORE.EVERGREEN_GUIDE;
  }

  const allRumorOld = cluster.members.every((m) => m.isRumor);
  if (allRumorOld && !hasOfficial) {
    breakdown.push({ signal: "Old rumor sources", points: SCORE.OLD_RUMOR });
    score += SCORE.OLD_RUMOR;
  }

  const allDuplicate = cluster.members.every((m) => m.isDuplicate);
  if (allDuplicate) {
    breakdown.push({ signal: "Duplicate of existing article", points: SCORE.DUPLICATE });
    score += SCORE.DUPLICATE;
  }

  if (cluster.members.some((m) => m.isSpam)) {
    breakdown.push({ signal: "Spam detected", points: SCORE.SPAM });
    score += SCORE.SPAM;
  }

  return { score, breakdown };
}

export function clusterToOpportunity(
  cluster: SourceCluster,
  scored: { score: number; breakdown: Array<{ signal: string; points: number }> },
  input: {
    articles: ArticleSeoInput[];
    entityMap: Map<string, OpportunityEntity>;
    statusMap: Map<string, { status: EditorialOpportunity["status"]; aiDraftId: string | null; workspaceId: string | null }>;
  }
): EditorialOpportunity | null {
  if (scored.score < 20) return null;
  if (cluster.members.every((m) => m.isDuplicate)) return null;

  const topicDef = topicDefForKey(cluster.clusterKey);
  const existing = findMatchingArticle(cluster, input.articles);
  const sourceTypes = clusterSourceTypes(cluster.members);
  const confidence = confidenceFromCluster(cluster);
  const traffic = trafficFromScore(scored.score, cluster.members.length);
  const contentType = topicDef?.contentType ?? "news_summary";
  const articleType = topicDef?.articleType ?? (sourceTypes.includes("Rockstar") ? "news" : "guide");

  const sourceIds = cluster.members
    .filter((m) => m.kind === "source")
    .map((m) => m.id);
  const videoIds = cluster.members
    .filter((m) => m.kind === "video")
    .map((m) => m.id);

  const entities: OpportunityEntity[] = [];
  for (const key of cluster.topicKeys) {
    const gap = input.entityMap.get(key);
    if (gap) entities.push(gap);
  }

  const internalLinkTargets = entities.map((e) => e.href);
  const relatedArticleIds = existing ? [existing.id] : [];

  const summaryParts = [
    `${cluster.members.length} source${cluster.members.length === 1 ? "" : "s"} clustered`,
    sourceTypes.join(", "),
  ];
  if (existing) summaryParts.push(`improves "${existing.title}"`);

  const persisted = input.statusMap.get(cluster.clusterKey);

  return {
    id: `opp-${cluster.clusterKey}`,
    clusterKey: cluster.clusterKey,
    title: cluster.title,
    summary: summaryParts.join(" · "),
    score: scored.score,
    stars: starsFromScore(scored.score),
    confidence,
    trafficEstimate: traffic,
    seoEstimate: traffic,
    sourceCount: cluster.members.length,
    sourceIds,
    videoIds,
    sourceTypes,
    entities,
    relatedArticleIds,
    existingArticleId: existing?.id ?? null,
    existingArticleTitle: existing?.title ?? null,
    existingArticleSlug: existing?.slug ?? null,
    action: existing ? "improve" : "create",
    articleType,
    targetKeyword: topicDef?.targetKeyword ?? cluster.title,
    internalLinkTargets,
    estimatedReadingMinutes: estimateReadingMinutes(contentType),
    estimatedWritingMinutes: estimateWritingMinutes(scored.score),
    scoringBreakdown: scored.breakdown,
    contentType,
    status: persisted?.status ?? "open",
    aiDraftId: persisted?.aiDraftId ?? null,
    workspaceId: persisted?.workspaceId ?? null,
  };
}
