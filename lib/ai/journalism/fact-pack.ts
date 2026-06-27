import type { JournalismGenerationInput } from "@/lib/ai/journalism/types";

export type FactConfidence = "Low" | "Medium" | "High";

export interface OfficialFact {
  text: string;
  source: string;
  sourceUrl: string;
  publishedAt?: string;
}

export interface CommunityReport {
  text: string;
  source: string;
  sourceUrl: string;
  confidence: FactConfidence;
  verified: false;
}

export interface FactPackVideo {
  title: string;
  channel: string;
  url: string;
  youtubeId?: string;
  description: string;
  tier: "official" | "creator";
}

export interface RelatedArticleFact {
  title: string;
  slug: string;
  href: string;
}

export interface ArticleFactPack {
  articleType: "news" | "guide";
  opportunityTitle?: string;
  existingArticle?: { title: string; slug: string; excerpt: string | null };
  officialFacts: OfficialFact[];
  communityReports: CommunityReport[];
  videos: FactPackVideo[];
  relatedArticles: RelatedArticleFact[];
  entities: Array<{ kind: string; slug: string; title: string; href: string }>;
  seo: {
    primaryKeyword: string;
    secondaryKeywords: string[];
    internalLinks: string[];
  };
  sourceCards: Array<{ label: string; platform: string; url: string; tier: number }>;
  verifiedWordCount: number;
  hasOfficialFacts: boolean;
  hasCommunityReports: boolean;
}

const OFFICIAL_PLATFORMS = new Set(["rockstar_newswire", "rockstar_youtube"]);

function sourceTier(platform: string, label: string): number {
  if (OFFICIAL_PLATFORMS.has(platform)) return 1;
  if (label === "official" && platform === "x") return 2;
  if (platform === "rockstar_youtube") return 1;
  if (/youtube/i.test(platform)) return 5;
  if (platform === "reddit") return 6;
  return 7;
}

function isOfficialSource(platform: string, label: string): boolean {
  return OFFICIAL_PLATFORMS.has(platform) || label === "official";
}

function extractFactLines(content: string, max = 10): string[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks = normalized
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 18 && line.length <= 420);

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const chunk of chunks) {
    const key = chunk.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(chunk);
    if (unique.length >= max) break;
  }

  return unique;
}

function communityConfidence(platform: string, label: string): FactConfidence {
  if (platform === "reddit" || label === "rumor") return "Low";
  if (label === "unconfirmed") return "Low";
  if (label === "community") return "Medium";
  return "Low";
}

function countWords(texts: string[]): number {
  return texts
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function buildArticleFactPack(input: JournalismGenerationInput): ArticleFactPack {
  const sortedSources = [...input.sources].sort(
    (a, b) => sourceTier(a.platform, a.sourceLabel) - sourceTier(b.platform, b.sourceLabel)
  );

  const officialFacts: OfficialFact[] = [];
  const communityReports: CommunityReport[] = [];

  for (const source of sortedSources) {
    const lines = extractFactLines(source.excerpt, 8);
    const official = isOfficialSource(source.platform, source.sourceLabel);

    if (official) {
      for (const text of lines) {
        officialFacts.push({
          text,
          source: source.label,
          sourceUrl: source.url,
          publishedAt: source.publishedAt ?? undefined,
        });
      }
      if (lines.length === 0 && source.title) {
        officialFacts.push({
          text: source.title,
          source: source.label,
          sourceUrl: source.url,
          publishedAt: source.publishedAt ?? undefined,
        });
      }
      continue;
    }

    for (const text of lines) {
      communityReports.push({
        text,
        source: source.label,
        sourceUrl: source.url,
        confidence: communityConfidence(source.platform, source.sourceLabel),
        verified: false,
      });
    }
    if (lines.length === 0 && source.title) {
      communityReports.push({
        text: source.title,
        source: source.label,
        sourceUrl: source.url,
        confidence: communityConfidence(source.platform, source.sourceLabel),
        verified: false,
      });
    }
  }

  const videos: FactPackVideo[] = input.videos.map((video) => {
    const official = /rockstar/i.test(video.title) || /rockstar/i.test(video.url);
    return {
      title: video.title,
      channel: official ? "Rockstar Games" : "YouTube Creator",
      url: video.url,
      youtubeId: video.youtube_id,
      description: video.description.slice(0, 400),
      tier: official ? "official" : "creator",
    };
  });

  const relatedArticles: RelatedArticleFact[] = input.existingArticle
    ? [
        {
          title: input.existingArticle.title,
          slug: input.existingArticle.slug,
          href: `/news/${input.existingArticle.slug}`,
        },
      ]
    : [];

  const entities = input.entities.map((entity) => ({
    kind: entity.kind,
    slug: entity.slug,
    title: entity.title,
    href: entity.href ?? `/${entity.kind}s/${entity.slug}`,
  }));

  const secondaryKeywords = [
    input.targetKeyword,
    input.contentType,
    input.opportunityTitle,
  ].filter((value): value is string => Boolean(value && value.trim()));

  const verifiedTexts = [
    ...officialFacts.map((f) => f.text),
    ...videos.filter((v) => v.tier === "official").map((v) => `${v.title}. ${v.description}`),
  ];

  return {
    articleType: input.articleType,
    opportunityTitle: input.opportunityTitle,
    existingArticle: input.existingArticle,
    officialFacts: dedupeOfficialFacts(officialFacts),
    communityReports: dedupeCommunityReports(communityReports),
    videos,
    relatedArticles,
    entities,
    seo: {
      primaryKeyword: input.targetKeyword ?? input.opportunityTitle ?? "GTA 6",
      secondaryKeywords: [...new Set(secondaryKeywords)].slice(0, 8),
      internalLinks: input.internalLinkTargets ?? entities.map((e) => e.href),
    },
    sourceCards: sortedSources.map((source) => ({
      label: source.label,
      platform: source.platform,
      url: source.url,
      tier: sourceTier(source.platform, source.sourceLabel),
    })),
    verifiedWordCount: countWords(verifiedTexts),
    hasOfficialFacts: officialFacts.length > 0,
    hasCommunityReports: communityReports.length > 0 || videos.some((v) => v.tier === "creator"),
  };
}

function dedupeOfficialFacts(facts: OfficialFact[]): OfficialFact[] {
  const seen = new Set<string>();
  const result: OfficialFact[] = [];
  for (const fact of facts) {
    const key = fact.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(fact);
  }
  return result;
}

function dedupeCommunityReports(reports: CommunityReport[]): CommunityReport[] {
  const seen = new Set<string>();
  const result: CommunityReport[] = [];
  for (const report of reports) {
    const key = report.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(report);
  }
  return result;
}

export function formatFactPackForPrompt(pack: ArticleFactPack): string {
  const officialBlock =
    pack.officialFacts.length > 0
      ? pack.officialFacts
          .map((f) => `- ${f.text}\n  Source: ${f.source}`)
          .join("\n")
      : "None provided. Do not invent official facts.";

  const communityBlock =
    pack.communityReports.length > 0
      ? pack.communityReports
          .map(
            (r) =>
              `- ${r.text}\n  Source: ${r.source} | Confidence: ${r.confidence} | Unverified`
          )
          .join("\n")
      : "None provided. Omit Community Discussion section.";

  const videoBlock =
    pack.videos.length > 0
      ? pack.videos
          .map(
            (v) =>
              `- ${v.title} (${v.channel})\n  URL: ${v.url}\n  ${v.description.slice(0, 280)}`
          )
          .join("\n")
      : "None provided.";

  const relatedBlock =
    pack.relatedArticles.length > 0
      ? pack.relatedArticles.map((a) => `- ${a.title} → ${a.href}`).join("\n")
      : "None.";

  const entityBlock =
    pack.entities.length > 0
      ? pack.entities.map((e) => `- ${e.title} (${e.kind}:${e.slug}) → ${e.href}`).join("\n")
      : "None.";

  return `OFFICIAL FACTS (Rockstar wins over all community claims)
${officialBlock}

COMMUNITY REPORTS (never state as fact)
${communityBlock}

VIDEOS
${videoBlock}

RELATED ARTICLES
${relatedBlock}

KG ENTITIES
${entityBlock}

SEO TARGET
Primary keyword: ${pack.seo.primaryKeyword}
Secondary keywords: ${pack.seo.secondaryKeywords.join(", ") || "None"}
Internal links: ${pack.seo.internalLinks.join(", ") || "None"}

VERIFIED WORD COUNT: ${pack.verifiedWordCount}
${pack.verifiedWordCount < 300 ? "SHORT ARTICLE MODE: keep copy tight. Do not inflate." : ""}`;
}
