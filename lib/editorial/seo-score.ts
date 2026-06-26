import type { ArticleSeoInput, SeoHealthItem } from "@/lib/editorial/types";
import type { SeoArticleRecord } from "@/lib/seo/types";
import {
  getImproveReasons,
  scoreSeoArticle,
} from "@/lib/seo/scoring";

function toSeoArticleRecord(article: ArticleSeoInput): SeoArticleRecord {
  return {
    ...article,
    status: "published",
    category: null,
    source_url: null,
  };
}

function toHealthItem(scored: ReturnType<typeof scoreSeoArticle>): SeoHealthItem {
  return {
    articleId: scored.articleId,
    title: scored.title,
    slug: scored.slug,
    type: scored.type,
    score: scored.score,
    breakdown: {
      title: scored.breakdown.title,
      description: scored.breakdown.description,
      faq: scored.breakdown.faq,
      images: scored.breakdown.heroImage,
      video: scored.breakdown.video,
      internalLinks: scored.breakdown.internalLinks,
      schema: scored.breakdown.schema,
      wordCount: scored.breakdown.wordCount,
      freshness: scored.breakdown.freshness,
    },
  };
}

/** Editorial dashboard compatibility wrapper around Milestone 4 scoring. */
export function scoreArticleSeo(article: ArticleSeoInput): SeoHealthItem {
  return toHealthItem(scoreSeoArticle(toSeoArticleRecord(article)));
}

export function getWeakestArticles(
  articles: ArticleSeoInput[],
  limit = 10
): SeoHealthItem[] {
  return articles
    .map((a) => scoreArticleSeo(a))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

export { getImproveReasons };
