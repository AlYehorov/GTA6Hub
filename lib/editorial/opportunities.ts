import type { SourceItem } from "@/lib/types/source";
import type { ContentGap } from "@/lib/editorial/content-gaps";
import { RECOMMENDED_ARTICLE_IDEAS } from "@/lib/editorial/content-gaps";
import type {
  ContentOpportunity,
  OpportunityCategory,
  OpportunityDifficulty,
} from "@/lib/editorial/types";

interface OpportunityCandidate {
  id: string;
  title: string;
  score: number;
  category: OpportunityCategory;
  difficulty: OpportunityDifficulty;
  rationale: string;
  sourceItemId?: string;
  entityKind?: ContentGap["kind"];
  entitySlug?: string;
}

const TRAFFIC_BY_CATEGORY: Record<OpportunityCategory, number> = {
  News: 12000,
  Guide: 18000,
  Entity: 9000,
  "SEO Gap": 14000,
  "Reddit Trend": 7000,
  Listicle: 22000,
};

const LISTICLE_PATTERNS = [
  { pattern: /all vehicles/i, title: "All Vehicles Seen In GTA 6 Trailers", traffic: 18000 },
  { pattern: /trailer.*breakdown/i, title: "GTA 6 Trailer Breakdown", traffic: 24000 },
  { pattern: /locations/i, title: "All Confirmed GTA 6 Locations", traffic: 20000 },
  { pattern: /lucia/i, title: "Everything We Know About Lucia", traffic: 16000 },
  { pattern: /jason/i, title: "Jason in GTA 6: Confirmed Facts", traffic: 11000 },
  { pattern: /release/i, title: "GTA VI Release Window Explained", traffic: 35000 },
];

function starsFromScore(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}

function estimateTraffic(
  category: OpportunityCategory,
  title: string,
  baseBoost = 0
): number {
  for (const item of LISTICLE_PATTERNS) {
    if (item.pattern.test(title)) return item.traffic;
  }
  return TRAFFIC_BY_CATEGORY[category] + baseBoost;
}

function scoreRockstarSource(source: SourceItem): OpportunityCandidate {
  const isOfficial = source.source_label === "official";
  const isYoutube = source.source === "rockstar_youtube";
  const score =
    (isOfficial ? 50 : 20) +
    (isYoutube ? 15 : 10) +
    (source.processed ? 0 : 20) +
    (source.title.toLowerCase().includes("trailer") ? 15 : 0);

  return {
    id: `source-${source.id}`,
    title: source.title,
    score,
    category: isYoutube ? "Guide" : "News",
    difficulty: isOfficial ? "Easy" : "Medium",
    rationale: `${source.source_label} Rockstar source — draft-ready coverage`,
    sourceItemId: source.id,
  };
}

function scoreRedditSource(source: SourceItem): OpportunityCandidate {
  const engagement = Math.min(source.content.length / 50, 25);
  const score = 35 + engagement + (source.processed ? 0 : 15);

  return {
    id: `reddit-${source.id}`,
    title: source.title.slice(0, 120),
    score,
    category: "Reddit Trend",
    difficulty: "Medium",
    rationale: "Active community discussion — angle for explainer or roundup",
    sourceItemId: source.id,
  };
}

function scoreContentGap(gap: ContentGap): OpportunityCandidate {
  const score =
    60 +
    (gap.reason === "no_entity_page" ? 20 : 10) +
    (gap.kind === "locations" || gap.kind === "characters" ? 10 : 0);

  return {
    id: `gap-${gap.kind}-${gap.slug}`,
    title: `${gap.title} — GTA 6 ${gap.kind.slice(0, -1)} guide`,
    score,
    category: "SEO Gap",
    difficulty: gap.reason === "no_entity_page" ? "Easy" : "Medium",
    rationale:
      gap.reason === "no_entity_page"
        ? "Published entity missing dedicated SEO page"
        : "Entity exists but no supporting article mentions it",
    entityKind: gap.kind,
    entitySlug: gap.slug,
  };
}

function scoreRecommendedIdea(
  idea: string,
  existingTitles: string[]
): OpportunityCandidate | null {
  const lower = idea.toLowerCase();
  if (existingTitles.some((t) => t.toLowerCase().includes(lower.slice(0, 20)))) {
    return null;
  }

  const isListicle = /all |everything|list/i.test(idea);
  return {
    id: `idea-${idea.replace(/\s+/g, "-").toLowerCase().slice(0, 40)}`,
    title: idea,
    score: isListicle ? 72 : 58,
    category: isListicle ? "Listicle" : "Guide",
    difficulty: "Medium",
    rationale: "High-intent evergreen topic from editorial playbook",
  };
}

export function rankContentOpportunities(input: {
  sources: SourceItem[];
  gaps: ContentGap[];
  existingArticleTitles: string[];
  limit?: number;
}): ContentOpportunity[] {
  const candidates: OpportunityCandidate[] = [];

  const rockstar = input.sources
    .filter(
      (s) =>
        s.source === "rockstar_newswire" || s.source === "rockstar_youtube"
    )
    .slice(0, 15);
  const reddit = input.sources.filter((s) => s.source === "reddit").slice(0, 10);

  for (const source of rockstar) {
    candidates.push(scoreRockstarSource(source));
  }
  for (const source of reddit) {
    candidates.push(scoreRedditSource(source));
  }
  for (const gap of input.gaps.slice(0, 15)) {
    candidates.push(scoreContentGap(gap));
  }
  for (const idea of RECOMMENDED_ARTICLE_IDEAS) {
    const scored = scoreRecommendedIdea(idea, input.existingArticleTitles);
    if (scored) candidates.push(scored);
  }

  const seen = new Set<string>();
  const unique = candidates
    .sort((a, b) => b.score - a.score)
    .filter((c) => {
      const key = c.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return unique.slice(0, input.limit ?? 10).map((c) => ({
    id: c.id,
    title: c.title,
    stars: starsFromScore(c.score),
    estimatedMonthlyTraffic: estimateTraffic(c.category, c.title, Math.round(c.score / 5)),
    difficulty: c.difficulty,
    category: c.category,
    rationale: c.rationale,
    sourceItemId: c.sourceItemId,
    entityKind: c.entityKind,
    entitySlug: c.entitySlug,
  }));
}
