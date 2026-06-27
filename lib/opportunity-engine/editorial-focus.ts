import type { ArticleSeoInput } from "@/lib/editorial/types";
import { kgEntityHref } from "@/lib/knowledge-graph/types";
import type { KgEntityKind } from "@/lib/knowledge-graph/types";
import { topicDefForKey } from "@/lib/opportunity-engine/topics";
import type { EditorialOpportunity } from "@/lib/opportunity-engine/types";
import type { SourceItem } from "@/lib/types/source";
import type { Video } from "@/lib/types/video";

export type FocusArticleType =
  | "news"
  | "guide"
  | "analysis"
  | "comparison"
  | "faq"
  | "timeline"
  | "feature"
  | "opinion";

export type SearchIntent =
  | "informational"
  | "navigational"
  | "transactional"
  | "comparison"
  | "guide";

export type FocusConfidence = "Low" | "Medium" | "High";

export interface EditorialFocusEntity {
  kind: string;
  slug: string;
  title: string;
  href: string;
}

export interface EditorialFocusArticle {
  title: string;
  slug: string;
  href: string;
}

export interface EditorialFocus {
  headline: string;
  primary_story: string;
  secondary_facts: string[];
  background: string[];
  community_points: string[];
  official_points: string[];
  related_entities: EditorialFocusEntity[];
  existing_articles: EditorialFocusArticle[];
  seo_keyword: string;
  search_intent: SearchIntent;
  article_type: FocusArticleType;
  confidence: FocusConfidence;
  reading_time_target: number;
  focus_valid: boolean;
  focus_error?: string;
}

export interface EditorialFocusOverrides {
  headline?: string;
  primary_story?: string;
  article_type?: FocusArticleType;
}

export interface EditorialFocusBuildInput {
  opportunity: EditorialOpportunity;
  sources: SourceItem[];
  videos: Video[];
  articles: ArticleSeoInput[];
}

interface RankedSource {
  source: SourceItem;
  tier: number;
}

function sourceTier(source: SourceItem): number {
  if (source.source === "rockstar_newswire") return 1;
  if (source.source === "rockstar_youtube") return 1;
  if (source.source_label === "official" && source.source === "x") return 2;
  if (source.source_label === "official") return 4;
  if (source.source === "reddit") return 6;
  return 7;
}

function isOfficialSource(source: SourceItem): boolean {
  return (
    source.source === "rockstar_newswire" ||
    source.source === "rockstar_youtube" ||
    source.source_label === "official"
  );
}

function extractLines(content: string, max = 8): string[] {
  return content
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 16 && line.length <= 360)
    .slice(0, max);
}

function uniqueLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }
  return result;
}

function extractPrices(text: string): string[] {
  return [...text.matchAll(/\$\d+(?:\.\d{2})?/g)].map((match) => match[0]);
}

function conflictsWithOfficial(communityLine: string, officialCorpus: string): boolean {
  const communityPrices = extractPrices(communityLine);
  const officialPrices = extractPrices(officialCorpus);
  if (communityPrices.length > 0 && officialPrices.length > 0) {
    return !communityPrices.some((price) => officialPrices.includes(price));
  }
  return false;
}

function detectPrimaryStory(input: {
  clusterKey: string;
  officialLines: string[];
  officialTitles: string[];
  hasOfficial: boolean;
}): string | null {
  const corpus = [...input.officialLines, ...input.officialTitles].join(" ").toLowerCase();

  switch (input.clusterKey) {
    case "pricing":
    case "collector-edition":
      if (/pre-?order|preorder/i.test(corpus)) {
        return "Rockstar opened GTA VI preorders.";
      }
      if (/\$\d+/.test(corpus)) {
        return "Rockstar confirmed GTA VI edition pricing.";
      }
      if (input.hasOfficial) {
        return "Rockstar published new GTA VI pricing information.";
      }
      return null;
    case "trailer-2-details":
      if (/trailer/i.test(corpus)) {
        return "Rockstar released new GTA VI trailer footage with additional Vice City details.";
      }
      return null;
    case "release-date":
      if (/release|launch|coming/i.test(corpus)) {
        return "Rockstar updated the GTA VI release window.";
      }
      return null;
    case "lucia":
      return "Rockstar material adds new detail on Lucia in GTA VI.";
    case "jason":
      return "Rockstar material adds new detail on Jason in GTA VI.";
    case "vehicles":
      return "New GTA VI footage confirms additional vehicles in Leonida.";
    case "map-locations":
      return "Rockstar footage confirms new GTA VI locations across Leonida.";
    case "multiplayer":
      if (/multiplayer|online|co-?op/i.test(corpus)) {
        return "Rockstar addressed GTA VI multiplayer in newly surfaced material.";
      }
      return null;
    case "vice-city-airport":
      return "GTA VI footage spotlights Vice City airport activity.";
    case "customization":
      return "GTA VI footage shows expanded vehicle customization options.";
    case "ammu-nation":
      return "GTA VI footage references Ammu-Nation locations in Leonida.";
    default:
      if (input.officialTitles[0]) {
        return `Rockstar published new GTA VI material: ${trimStoryLead(input.officialTitles[0])}`;
      }
      if (input.officialLines[0]) {
        return trimStoryLead(input.officialLines[0]);
      }
      return null;
  }
}

function trimStoryLead(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 120) return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  return `${trimmed.slice(0, 117).trim()}...`;
}

function classifyArticleType(
  clusterKey: string,
  contentType: string,
  hasOfficial: boolean
): FocusArticleType {
  if (contentType === "faq_article") return "faq";
  if (contentType === "timeline_update") return "timeline";
  if (contentType === "trailer_breakdown") return "analysis";
  if (contentType === "analysis") return "analysis";
  if (contentType === "vehicle_list_update" || contentType === "location_update") return "guide";
  if (contentType === "entity_page_update") return "feature";
  if (clusterKey.startsWith("gap-")) return "guide";
  if (hasOfficial && (contentType === "news_summary" || clusterKey === "release-date")) return "news";
  if (contentType === "character_update") return "guide";
  return hasOfficial ? "news" : "analysis";
}

function detectSearchIntent(keyword: string, articleType: FocusArticleType): SearchIntent {
  const lower = keyword.toLowerCase();
  if (/how much|price|cost|pre-?order|buy/i.test(lower)) return "transactional";
  if (/vs|versus|compare|comparison/i.test(lower)) return "comparison";
  if (articleType === "guide" || articleType === "faq") return "guide";
  if (/map|characters|lucia|jason|vehicles|locations/i.test(lower)) return "navigational";
  return "informational";
}

function buildHeadlineCandidates(input: {
  primaryStory: string;
  seoKeyword: string;
  clusterKey: string;
  articleType: FocusArticleType;
}): string[] {
  const keyword = input.seoKeyword.trim();
  const shortKeyword = keyword.replace(/^GTA 6\s*/i, "").trim() || keyword;

  const candidates = [
    `${capitalizePhrase(shortKeyword)} — What Rockstar Confirmed`,
    `GTA VI ${shortKeyword}: Confirmed Details`,
    input.primaryStory.replace(/\.$/, ""),
    `GTA 6 ${shortKeyword} Explained`,
  ];

  if (input.clusterKey === "pricing") {
    candidates.unshift("GTA VI Preorders and Edition Pricing Confirmed");
    candidates.push("GTA 6 Price: Standard and Ultimate Editions");
  }

  if (input.articleType === "analysis") {
    candidates.push(`GTA VI ${shortKeyword}: Trailer Breakdown`);
  }

  return uniqueLines(candidates.filter(Boolean)).slice(0, 5);
}

function scoreHeadline(headline: string, seoKeyword: string): number {
  let score = 0;
  const lower = headline.toLowerCase();
  const keywordParts = seoKeyword.toLowerCase().split(/\s+/).filter((part) => part.length > 3);

  for (const part of keywordParts) {
    if (lower.includes(part)) score += 12;
  }

  if (lower.includes("gta")) score += 18;
  if (lower.includes("rockstar") || lower.includes("confirmed")) score += 10;
  if (headline.length >= 42 && headline.length <= 72) score += 12;
  if (/everything we know|officially announced\.\.\.|overview/i.test(lower)) score -= 40;
  if (/\$\d+/.test(headline)) score += 8;

  return score;
}

function pickBestHeadline(candidates: string[], seoKeyword: string): string {
  const ranked = [...candidates].sort(
    (a, b) => scoreHeadline(b, seoKeyword) - scoreHeadline(a, seoKeyword)
  );
  return ranked[0] ?? seoKeyword;
}

function capitalizePhrase(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function estimateReadingTime(factsCount: number, articleType: FocusArticleType): number {
  if (articleType === "news") return Math.max(3, Math.min(6, 3 + Math.floor(factsCount / 3)));
  if (articleType === "faq") return Math.max(4, Math.min(7, 4 + Math.floor(factsCount / 4)));
  return Math.max(4, Math.min(9, 4 + Math.floor(factsCount / 2)));
}

function findRelatedArticles(
  opportunity: EditorialOpportunity,
  articles: ArticleSeoInput[]
): EditorialFocusArticle[] {
  const related: EditorialFocusArticle[] = [];
  const keyword = opportunity.targetKeyword.toLowerCase();

  for (const article of articles) {
    if (article.id === opportunity.existingArticleId) continue;
    const title = article.title.toLowerCase();
    if (
      title.includes(keyword.slice(0, 18)) ||
      keyword.includes(title.slice(0, 18)) ||
      opportunity.entities.some((entity) => title.includes(entity.title.toLowerCase()))
    ) {
      related.push({
        title: article.title,
        slug: article.slug,
        href: `/${article.type}/${article.slug}`,
      });
    }
  }

  if (opportunity.existingArticleTitle && opportunity.existingArticleSlug) {
    related.unshift({
      title: opportunity.existingArticleTitle,
      slug: opportunity.existingArticleSlug,
      href: `/news/${opportunity.existingArticleSlug}`,
    });
  }

  return uniqueArticles(related).slice(0, 6);
}

function uniqueArticles(articles: EditorialFocusArticle[]): EditorialFocusArticle[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    if (seen.has(article.slug)) return false;
    seen.add(article.slug);
    return true;
  });
}

export function buildEditorialFocus(input: EditorialFocusBuildInput): EditorialFocus {
  const { opportunity, sources, videos, articles } = input;
  const topicDef = topicDefForKey(opportunity.clusterKey);
  const seoKeyword = opportunity.targetKeyword || topicDef?.targetKeyword || opportunity.title;

  const rankedSources: RankedSource[] = sources
    .map((source) => ({ source, tier: sourceTier(source) }))
    .sort((a, b) => a.tier - b.tier);

  const officialSources = rankedSources.filter((item) => isOfficialSource(item.source));
  const communitySources = rankedSources.filter((item) => !isOfficialSource(item.source));

  const officialLines = uniqueLines(
    officialSources.flatMap((item) => extractLines(`${item.source.title}. ${item.source.content}`, 6))
  );
  const officialTitles = officialSources.map((item) => item.source.title);
  const hasOfficial = officialSources.length > 0;

  let primaryStory = detectPrimaryStory({
    clusterKey: opportunity.clusterKey,
    officialLines,
    officialTitles,
    hasOfficial,
  });

  if (!primaryStory && opportunity.clusterKey.startsWith("gap-")) {
    primaryStory = `GTA6Hub should publish a focused guide on ${opportunity.title.replace(/ — GTA 6 Guide$/, "")}.`;
  }

  if (!primaryStory && communitySources.length > 0 && !hasOfficial) {
    const topCommunity = communitySources[0]?.source;
    if (topCommunity) {
      primaryStory = `Community discussion is active around ${trimStoryLead(topCommunity.title).replace(/\.$/, "")}.`;
    }
  }

  const officialCorpus = officialLines.join(" ");
  const communityPoints = uniqueLines(
    communitySources.flatMap((item) =>
      extractLines(`${item.source.title}. ${item.source.content}`, 4)
    )
  ).filter((line) => !conflictsWithOfficial(line, officialCorpus));

  for (const video of videos) {
    const official = /rockstar/i.test(video.title) || /rockstar/i.test(video.source_url);
    if (official) continue;
    const line = trimStoryLead(video.title).replace(/\.$/, "");
    if (!conflictsWithOfficial(line, officialCorpus)) {
      communityPoints.push(`YouTube creators discussed: ${line}`);
    }
  }

  const secondaryFacts = uniqueLines(
    officialLines.filter((line) => {
      if (!primaryStory) return true;
      return !primaryStory.toLowerCase().includes(line.toLowerCase().slice(0, 40));
    })
  ).slice(0, 6);

  const background = uniqueLines(
    topicDef
      ? [`This story sits inside the broader ${topicDef.title.replace(/^Everything We Know About /i, "")} beat.`]
      : []
  ).slice(0, 2);

  const articleType = classifyArticleType(
    opportunity.clusterKey,
    opportunity.contentType,
    hasOfficial
  );
  const searchIntent = detectSearchIntent(seoKeyword, articleType);

  const headlineCandidates = primaryStory
    ? buildHeadlineCandidates({
        primaryStory,
        seoKeyword,
        clusterKey: opportunity.clusterKey,
        articleType,
      })
    : [];
  const headline = primaryStory ? pickBestHeadline(headlineCandidates, seoKeyword) : opportunity.title;

  const relatedEntities: EditorialFocusEntity[] = opportunity.entities.map((entity) => ({
    kind: entity.kind,
    slug: entity.slug,
    title: entity.title,
    href: entity.href,
  }));

  const existingArticles = findRelatedArticles(opportunity, articles);

  const focusValid = Boolean(primaryStory && primaryStory.trim().length > 20);

  return {
    headline,
    primary_story: primaryStory ?? "",
    secondary_facts: secondaryFacts,
    background,
    community_points: communityPoints.slice(0, 6),
    official_points: officialLines.slice(0, 8),
    related_entities: relatedEntities,
    existing_articles: existingArticles,
    seo_keyword: seoKeyword,
    search_intent: searchIntent,
    article_type: articleType,
    confidence: opportunity.confidence,
    reading_time_target: estimateReadingTime(
      secondaryFacts.length + officialLines.length,
      articleType
    ),
    focus_valid: focusValid,
    focus_error: focusValid
      ? undefined
      : "Primary story could not be identified. Edit the primary story before generating.",
  };
}

export function applyEditorialFocusOverrides(
  focus: EditorialFocus,
  overrides?: EditorialFocusOverrides
): EditorialFocus {
  if (!overrides) return focus;

  const next: EditorialFocus = {
    ...focus,
    headline: overrides.headline?.trim() || focus.headline,
    primary_story: overrides.primary_story?.trim() || focus.primary_story,
    article_type: overrides.article_type ?? focus.article_type,
  };

  next.focus_valid = Boolean(next.primary_story.trim().length > 20);
  next.focus_error = next.focus_valid
    ? undefined
    : "Primary story is required before generation.";

  return next;
}

export function assertEditorialFocusReady(focus: EditorialFocus): void {
  if (!focus.focus_valid || !focus.primary_story.trim()) {
    throw new Error(
      focus.focus_error ??
        "Primary story could not be identified. Edit Editorial Focus before generating."
    );
  }
}

export function formatEditorialFocusForPrompt(focus: EditorialFocus): string {
  return `EDITORIAL FOCUS (single story — do not change the angle)

HEADLINE (use exactly):
${focus.headline}

PRIMARY STORY (this is the only story):
${focus.primary_story}

ARTICLE TYPE: ${focus.article_type}
SEARCH INTENT: ${focus.search_intent}
SEO KEYWORD: ${focus.seo_keyword}
CONFIDENCE: ${focus.confidence}
TARGET READING TIME: ${focus.reading_time_target} min

SECONDARY FACTS (supporting only):
${focus.secondary_facts.map((fact) => `- ${fact}`).join("\n") || "None"}

OFFICIAL POINTS:
${focus.official_points.map((fact) => `- ${fact}`).join("\n") || "None"}

COMMUNITY POINTS (attribute, never as fact):
${focus.community_points.map((fact) => `- ${fact}`).join("\n") || "None"}

BACKGROUND (max 2 short paragraphs if used):
${focus.background.map((fact) => `- ${fact}`).join("\n") || "None"}

RELATED ENTITIES:
${focus.related_entities.map((entity) => `- ${entity.title} → ${entity.href}`).join("\n") || "None"}

EXISTING ARTICLES:
${focus.existing_articles.map((article) => `- ${article.title} → ${article.href}`).join("\n") || "None"}

RULE: Write ONLY about the primary story. Do not pivot to generic GTA VI announcements.`;
}

export function mapFocusArticleTypeToDraftType(
  articleType: FocusArticleType
): "news" | "guide" {
  if (articleType === "news" || articleType === "analysis" || articleType === "opinion") {
    return "news";
  }
  return "guide";
}

export function entityHrefFromParts(kind: string, slug: string): string {
  try {
    return kgEntityHref(kind as KgEntityKind, slug);
  } catch {
    return `/${kind}s/${slug}`;
  }
}

export function enrichOpportunitiesWithEditorialFocus(
  opportunities: EditorialOpportunity[],
  context: {
    sources: SourceItem[];
    videos: Video[];
    articles: ArticleSeoInput[];
  }
): EditorialOpportunity[] {
  const sourceMap = new Map(context.sources.map((source) => [source.id, source]));
  const videoMap = new Map(context.videos.map((video) => [video.id, video]));

  return opportunities.map((opportunity) => ({
    ...opportunity,
    editorialFocus: buildEditorialFocus({
      opportunity,
      sources: opportunity.sourceIds
        .map((id) => sourceMap.get(id))
        .filter((source): source is SourceItem => Boolean(source)),
      videos: opportunity.videoIds
        .map((id) => videoMap.get(id))
        .filter((video): video is Video => Boolean(video)),
      articles: context.articles,
    }),
  }));
}
