import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleHero } from "@/components/articles/article-hero";
import { ArticleContent } from "@/components/articles/article-content";
import { ArticleTags } from "@/components/articles/article-tags";
import { RelatedArticles } from "@/components/articles/related-articles";
import { getArticleBySlug, getRelatedArticles } from "@/lib/articles/queries";
import type { ArticleType } from "@/lib/types/article";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/constants/site";

async function getArticlePageData(slug: string, type: ArticleType) {
  const article = await getArticleBySlug(slug, type);
  if (!article) notFound();

  const related = await getRelatedArticles(
    article.id,
    type,
    article.category_id,
    3
  );

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

  return (
    <div className="bg-black pt-16">
      <ArticleHero article={article} />
      <ArticleContent content={article.content} />
      <ArticleTags tags={article.tags} />
      <RelatedArticles articles={related} type={type} />
    </div>
  );
}
