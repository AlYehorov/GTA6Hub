import Link from "next/link";
import { NewsroomArticleCard } from "@/components/newsroom/newsroom-article-card";
import { ContentCarousel } from "@/components/home/content-carousel";
import { FeaturedNewsCard } from "@/components/shared/media-card";
import {
  articlesToCarouselItems,
  newsToCarouselItems,
} from "@/lib/data/news-carousel";
import { MOCK_LATEST_NEWS } from "@/lib/data/mock-news";
import { getHomepageArticleSections } from "@/lib/home/queries";
import type { ArticleListItem } from "@/lib/types/article";

export async function HomeNewsroomSections() {
  const live = await getHomepageArticleSections();

  if (!live) {
    const allItems = newsToCarouselItems(MOCK_LATEST_NEWS.slice(0, 5));
    const [featured, ...rest] = allItems;
    return (
      <section className="section-reveal px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title="Latest News" href="/newsroom" />
          {featured && <FeaturedNewsCard item={featured} />}
          {rest.length > 0 && (
            <ContentCarousel title="Latest News" seeAllHref="/newsroom" items={rest} hideHeader className="-mx-4 sm:-mx-6 lg:-mx-8" />
          )}
        </div>
      </section>
    );
  }

  const [featured, ...restLatest] = articlesToCarouselItems(live.latest);

  return (
    <div className="space-y-14 px-4 sm:px-6 lg:px-8">
      <section className="section-reveal mx-auto max-w-7xl">
        <SectionHeader title="Latest News" href="/newsroom" subtitle="Live from the GTAVIHub newsroom" />
        {featured && <FeaturedNewsCard item={featured} />}
        {restLatest.length > 0 && (
          <ContentCarousel
            title="Latest News"
            seeAllHref="/newsroom"
            items={restLatest}
            hideHeader
            className="-mx-4 sm:-mx-6 lg:-mx-8"
          />
        )}
      </section>

      <HomeArticleRow title="Official Updates" articles={live.official} href="/newsroom#official" />
      <HomeArticleRow title="Trailer Breakdowns" articles={live.trailers} href="/newsroom#trailers" />
      <HomeArticleRow title="Community Rumors" articles={live.rumors} href="/newsroom#rumors" />
      <HomeArticleRow title="Guides" articles={live.guides} type="guide" href="/guides" />
    </div>
  );
}

function SectionHeader({
  title,
  href,
  subtitle,
}: {
  title: string;
  href: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-sm text-white/40">{subtitle}</p>}
      </div>
      <Link href={href} className="text-sm text-white/45 hover:text-white">
        See all →
      </Link>
    </div>
  );
}

function HomeArticleRow({
  title,
  articles,
  href,
  type = "news",
}: {
  title: string;
  articles: ArticleListItem[];
  href: string;
  type?: "news" | "guide";
}) {
  if (articles.length === 0) return null;

  return (
    <section className="section-reveal mx-auto max-w-7xl">
      <SectionHeader title={title} href={href} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {articles.slice(0, 4).map((article, index) => (
          <NewsroomArticleCard
            key={article.id}
            article={article}
            type={type}
            compact
            imageIndex={index}
          />
        ))}
      </div>
    </section>
  );
}
