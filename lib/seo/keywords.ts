import type { KeywordOpportunity } from "@/lib/seo/types";
import type { SeoEntityKind } from "@/lib/editorial/constants";
import { ENTITY_KINDS } from "@/lib/entities/config";

interface KeywordSeed {
  phrase: string;
  source: KeywordOpportunity["source"];
  category: string;
  rationale: string;
}

const PATTERN_SEEDS: KeywordSeed[] = [
  {
    phrase: "GTA 6 release date",
    source: "pattern",
    category: "High intent",
    rationale: "Evergreen search query — no dedicated page detected",
  },
  {
    phrase: "GTA 6 map size",
    source: "pattern",
    category: "Guide",
    rationale: "Common comparison query for Leonida coverage",
  },
  {
    phrase: "GTA 6 multiplayer",
    source: "pattern",
    category: "Guide",
    rationale: "Frequent community question — confirm facts only",
  },
  {
    phrase: "All GTA 6 vehicles",
    source: "pattern",
    category: "Listicle",
    rationale: "List-style query from trailer footage",
  },
  {
    phrase: "GTA 6 businesses",
    source: "pattern",
    category: "Guide",
    rationale: "Business ownership interest from previews",
  },
];

function corpusIncludes(corpus: string, phrase: string): boolean {
  const normalized = phrase.toLowerCase();
  const slug = normalized.replace(/\s+/g, "-");
  return corpus.includes(normalized) || corpus.includes(slug);
}

export function generateKeywordOpportunities(input: {
  articleTitles: string[];
  sourceTitles: string[];
  entityTitles: Array<{ title: string; kind: SeoEntityKind }>;
  videoTitles: string[];
  limit?: number;
}): KeywordOpportunity[] {
  const corpus = [
    ...input.articleTitles,
    ...input.sourceTitles,
  ]
    .join(" ")
    .toLowerCase();

  const seeds: KeywordSeed[] = [...PATTERN_SEEDS];

  for (const { title, kind } of input.entityTitles) {
    seeds.push({
      phrase: `${title} GTA 6 guide`,
      source: "entity",
      category: ENTITY_KINDS[kind].labelSingular,
      rationale: `Entity "${title}" — dedicated guide opportunity`,
    });
  }

  for (const title of input.sourceTitles.slice(0, 20)) {
    if (title.length < 12) continue;
    seeds.push({
      phrase: title.slice(0, 80),
      source: "source",
      category: "News",
      rationale: "Recent source headline without matching article title",
    });
  }

  for (const title of input.videoTitles.slice(0, 15)) {
    seeds.push({
      phrase: `${title} breakdown`,
      source: "video",
      category: "Trailer",
      rationale: "Video coverage angle not yet in article titles",
    });
  }

  const seen = new Set<string>();
  const opportunities: KeywordOpportunity[] = [];

  for (const seed of seeds) {
    const key = seed.phrase.toLowerCase().slice(0, 50);
    if (seen.has(key)) continue;
    if (corpusIncludes(corpus, seed.phrase)) continue;
    seen.add(key);

    opportunities.push({
      id: `kw-${key.replace(/\s+/g, "-").slice(0, 40)}`,
      phrase: seed.phrase,
      source: seed.source,
      category: seed.category,
      rationale: seed.rationale,
    });
  }

  return opportunities.slice(0, input.limit ?? 20);
}
