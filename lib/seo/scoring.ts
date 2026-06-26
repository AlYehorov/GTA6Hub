/**
 * Rule-based SEO scoring (0–100). No OpenAI.
 *
 * Weights (max 100):
 * Title 10 | Description 10 | FAQ 10 | Internal links 15
 * External sources 10 | Hero image 10 | Video 10 | Word count 15
 * Schema 10 | Freshness 10
 */

import type { SeoArticleRecord, SeoScoreBreakdown, SeoScoredArticle } from "@/lib/seo/types";

export const INTERNAL_LINK_PATTERN =
  /\/(characters|locations|vehicles|weapons|businesses|animals|missions|collectibles|news|guides|videos)\/[a-z0-9-]+/gi;

export function countInternalLinks(content: string): number {
  const matches = content.match(INTERNAL_LINK_PATTERN) ?? [];
  return new Set(matches.map((m) => m.toLowerCase())).size;
}

export function countWords(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function countImages(article: SeoArticleRecord): number {
  let count = article.hero_image_url?.trim() ? 1 : 0;
  count += (article.content.match(/!\[.*?\]\(.*?\)/g) ?? []).length;
  return count;
}

export function hasFaqSection(content: string): boolean {
  if (/##\s*faq/i.test(content)) return true;
  if (content.toLowerCase().includes("frequently asked")) return true;
  return (content.match(/\?/g) ?? []).length >= 3;
}

export function hasExternalSource(article: SeoArticleRecord): boolean {
  if (article.source_url?.trim()) return true;
  return /https?:\/\/[^\s)]+/i.test(article.content);
}

function scoreTitle(article: SeoArticleRecord): number {
  const title = article.seo_title?.trim() || article.title.trim();
  return title.length >= 10 ? 10 : title.length > 0 ? 5 : 0;
}

function scoreDescription(article: SeoArticleRecord): number {
  const desc = article.seo_description?.trim() || article.excerpt?.trim() || "";
  return desc.length >= 50 ? 10 : desc.length > 0 ? 5 : 0;
}

function scoreFaq(content: string): number {
  return hasFaqSection(content) ? 10 : 0;
}

function scoreInternalLinks(content: string): number {
  const count = countInternalLinks(content);
  if (count >= 3) return 15;
  if (count === 2) return 10;
  if (count === 1) return 5;
  return 0;
}

function scoreExternalSources(article: SeoArticleRecord): number {
  return hasExternalSource(article) ? 10 : 0;
}

function scoreHeroImage(article: SeoArticleRecord): number {
  return article.hero_image_url?.trim() ? 10 : 0;
}

function scoreVideo(article: SeoArticleRecord): number {
  if (article.video_id) return 10;
  if (/youtube\.com|youtu\.be/i.test(article.content)) return 7;
  return 0;
}

function scoreWordCount(content: string): number {
  const words = countWords(content);
  if (words >= 800) return 15;
  if (words >= 500) return 10;
  if (words >= 250) return 5;
  return 0;
}

function scoreSchema(): number {
  return 10;
}

function scoreFreshness(article: SeoArticleRecord): number {
  const ref = article.updated_at || article.published_at;
  if (!ref) return 0;
  const days = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 14) return 10;
  if (days <= 30) return 8;
  if (days <= 60) return 5;
  if (days <= 90) return 3;
  return 0;
}

export function computeSeoBreakdown(article: SeoArticleRecord): SeoScoreBreakdown {
  return {
    title: scoreTitle(article),
    description: scoreDescription(article),
    faq: scoreFaq(article.content),
    internalLinks: scoreInternalLinks(article.content),
    externalSources: scoreExternalSources(article),
    heroImage: scoreHeroImage(article),
    video: scoreVideo(article),
    wordCount: scoreWordCount(article.content),
    schema: scoreSchema(),
    freshness: scoreFreshness(article),
  };
}

export function scoreSeoArticle(article: SeoArticleRecord): SeoScoredArticle {
  const breakdown = computeSeoBreakdown(article);
  const score = Object.values(breakdown).reduce((sum, n) => sum + n, 0);
  const internalLinkCount = countInternalLinks(article.content);

  return {
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    type: article.type,
    status: article.status,
    category: article.category,
    publishedAt: article.published_at,
    updatedAt: article.updated_at,
    wordCount: countWords(article.content),
    imageCount: countImages(article),
    hasFaq: hasFaqSection(article.content),
    internalLinkCount,
    hasVideo: Boolean(article.video_id) || /youtube\.com|youtu\.be/i.test(article.content),
    score,
    breakdown,
  };
}

export function seoStatusFromScore(
  score: number
): "excellent" | "good" | "needs-work" | "critical" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "needs-work";
  return "critical";
}

export function getImproveReasons(
  scored: SeoScoredArticle,
  options: { isStale?: boolean } = {}
): string[] {
  const reasons: string[] = [];
  const { breakdown } = scored;

  if (breakdown.faq < 10) reasons.push("Missing FAQ");
  if (breakdown.video < 10) reasons.push("No video");
  if (scored.internalLinkCount <= 1) {
    reasons.push(
      scored.internalLinkCount === 0
        ? "No internal links"
        : "Only 1 internal link"
    );
  }
  if (breakdown.description < 10) reasons.push("Missing meta description");
  if (breakdown.heroImage < 10) reasons.push("No hero image");
  if (breakdown.externalSources < 10) reasons.push("No external source link");
  if (breakdown.wordCount < 10) reasons.push("Thin content");
  if (breakdown.freshness < 8 || options.isStale) reasons.push("Old article");

  return reasons;
}
