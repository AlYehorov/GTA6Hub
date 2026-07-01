import { GTA6_IMAGES } from "@/lib/constants/images";
import { resolveHeroImageForArticle } from "@/lib/articles/resolve-hero-image";
import { polishPublicExcerpt } from "@/lib/editorial/sanitize";
import type { NewsArticle } from "@/lib/types";
import type { ArticleListItem } from "@/lib/types/article";
import type { CarouselItem, CardVariant } from "@/lib/types";

const NEWS_IMAGES = [
  GTA6_IMAGES.trailer2Header,
  GTA6_IMAGES.heroViceCity,
  GTA6_IMAGES.jasonLucia03Landscape,
  GTA6_IMAGES.luciaPortrait,
  GTA6_IMAGES.jasonDuval04,
];

const NEWS_VARIANTS: CardVariant[] = [
  "landscape",
  "portrait",
  "square",
  "landscape",
  "portrait",
];

export function newsToCarouselItems(articles: NewsArticle[]): CarouselItem[] {
  return articles.map((article, index) => ({
    id: article.id,
    title: article.title,
    subtitle: article.excerpt,
    href: "/newsroom",
    tag: article.category,
    image: NEWS_IMAGES[index % NEWS_IMAGES.length],
    variant: index === 0 ? "hero" : NEWS_VARIANTS[index - 1],
  }));
}

export function articlesToCarouselItems(articles: ArticleListItem[]): CarouselItem[] {
  return articles.map((article, index) => ({
    id: article.id,
    title: article.title,
    subtitle: polishPublicExcerpt(article.excerpt, article.title) ?? "",
    href: article.type === "guide" ? `/guides/${article.slug}` : `/news/${article.slug}`,
    tag: article.editorial_label ?? article.category?.name ?? "News",
    image: resolveHeroImageForArticle(article.hero_image_url, article.slug, index),
    variant: index === 0 ? "hero" : NEWS_VARIANTS[index - 1] ?? "landscape",
  }));
}
