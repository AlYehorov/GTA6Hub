import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleHero } from "@/components/articles/article-hero";
import { ArticleContent } from "@/components/articles/article-content";
import { ArticleTags } from "@/components/articles/article-tags";
import { RelatedArticles } from "@/components/articles/related-articles";
import { SaveArticleButton } from "@/components/profile/save-article-button";
import { ArticleReadTracker } from "@/components/profile/article-read-tracker";
import { getAuthenticatedUserId } from "@/lib/actions/tracker-progress";
import { isArticleSaved } from "@/lib/profile/queries";
import { getRelatedMapPointsForArticle } from "@/lib/map/queries";
import { getArticleBySlug, getRelatedArticles } from "@/lib/articles/queries";
import type { ArticleType } from "@/lib/types/article";
import type { ArticleRelatedContent } from "@/lib/types/related-content";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/constants/site";
import { editorialLabelFromCategory } from "@/lib/newsroom/labels";

async function getArticlePageData(slug: string, type: ArticleType) {
  const article = await getArticleBySlug(slug, type);
  if (!article) notFound();

  const [related, mapPoints] = await Promise.all([
    getRelatedArticles(article.id, type, article.category_id, 3),
    getRelatedMapPointsForArticle(article.id),
  ]);

  const relatedContent: ArticleRelatedContent = { mapPoints };
  void relatedContent;

  return { article, related };
}

export async function generateArticleMetadata(
  slug: string,
  type: ArticleType,
  fallbackTitle: string
): Promise<Metadata> {
  const article = await getArticleBySlug(slug, type);
  if (!article) return { title: fallbackTitle };

  const title = article.seo_title ?? article.title;
  const description = article.seo_description ?? article.excerpt ?? undefined;
  const ogImage = article.hero_image_url
    ? absoluteUrl(article.hero_image_url)
    : absoluteUrl(DEFAULT_OG_IMAGE);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage }],
      type: "article",
      publishedTime: article.published_at ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export async function ArticlePage({ slug, type }: { slug: string; type: ArticleType }) {
  const { article, related } = await getArticlePageData(slug, type);
  const userId = await getAuthenticatedUserId();
  const saved = userId ? await isArticleSaved(userId, article.id) : false;

  const editorialLabel = editorialLabelFromCategory(
    article.category?.slug,
    article.source_label
  );
  const pageUrl = absoluteUrl(`/${type === "guide" ? "guides" : "news"}/${article.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.seo_title ?? article.title,
    description: article.seo_description ?? article.excerpt ?? undefined,
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at,
    image: article.hero_image_url ? [article.hero_image_url] : [absoluteUrl(DEFAULT_OG_IMAGE)],
    author: { "@type": "Organization", name: "GTAVIHub" },
    publisher: {
      "@type": "Organization",
      name: "GTAVIHub",
    },
    mainEntityOfPage: pageUrl,
    url: pageUrl,
  };

  return (
    <div className="bg-black pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleReadTracker articleId={article.id} />
      <ArticleHero article={article} />
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 pb-4 sm:px-6">
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/60">
          {editorialLabel}
        </span>
        {article.ai_confidence != null && (
          <span className="text-xs text-white/35">
            AI-assisted · {Math.round(article.ai_confidence * 100)}% confidence
          </span>
        )}
        <SaveArticleButton articleId={article.id} initialSaved={saved} />
      </div>
      <ArticleContent content={article.content} />
      <ArticleTags tags={article.tags} />
      <RelatedArticles articles={related} type={type} />
    </div>
  );
}
