import type { SourceItem } from "@/lib/types/source";
import type { ContentGap } from "@/lib/editorial/content-gaps";
import type {
  ContentOpportunity,
  OpportunityCategory,
  OpportunityDifficulty,
} from "@/lib/editorial/types";
import { rankEditorialOpportunities } from "@/lib/opportunity-engine/ranker";
import { getOpportunityStatusMap } from "@/lib/opportunity-engine/queries";
import { getAllVideosAdmin } from "@/lib/videos/queries";

const CATEGORY_MAP: Record<string, OpportunityCategory> = {
  news_summary: "News",
  trailer_breakdown: "Guide",
  character_update: "Entity",
  location_update: "Entity",
  vehicle_list_update: "Listicle",
  faq_article: "Guide",
  entity_page_update: "SEO Gap",
  analysis: "Guide",
  timeline_update: "News",
  theory_roundup: "Reddit Trend",
};

function difficultyFromConfidence(
  confidence: string
): OpportunityDifficulty {
  if (confidence === "High") return "Easy";
  if (confidence === "Medium") return "Medium";
  return "Hard";
}

function trafficNumber(level: string): number {
  if (level === "Very High") return 28000;
  if (level === "High") return 18000;
  if (level === "Medium") return 9000;
  return 4000;
}

export async function rankContentOpportunities(input: {
  sources: SourceItem[];
  gaps: ContentGap[];
  existingArticleTitles: string[];
  limit?: number;
}): Promise<ContentOpportunity[]> {
  const articles = input.existingArticleTitles.map((title, index) => ({
    id: `title-${index}`,
    title,
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    type: "guide" as const,
    excerpt: null,
    content: "",
    hero_image_url: null,
    seo_title: null,
    seo_description: null,
    video_id: null,
    published_at: null,
    updated_at: new Date().toISOString(),
  }));

  const [videos, statusMap] = await Promise.all([
    getAllVideosAdmin(),
    getOpportunityStatusMap(),
  ]);

  const ranked = rankEditorialOpportunities({
    sources: input.sources,
    videos,
    articles,
    gaps: input.gaps,
    entities: [],
    statusMap,
    limit: input.limit ?? 10,
  });

  return ranked.map((opp) => ({
    id: opp.id,
    title: opp.title,
    stars: opp.stars,
    estimatedMonthlyTraffic: trafficNumber(opp.trafficEstimate),
    difficulty: difficultyFromConfidence(opp.confidence),
    category: CATEGORY_MAP[opp.contentType] ?? "Guide",
    rationale: opp.summary,
    sourceItemId: opp.sourceIds[0],
    entityKind: opp.entities[0]?.kind as import("@/lib/types/game-entity").GameEntityKind | undefined,
    entitySlug: opp.entities[0]?.slug,
  }));
}
