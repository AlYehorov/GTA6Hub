import { ContentCarousel } from "@/components/home/content-carousel";
import { FeaturedNewsCard } from "@/components/shared/media-card";
import {
  articlesToCarouselItems,
  newsToCarouselItems,
} from "@/lib/data/news-carousel";
import { MOCK_LATEST_NEWS } from "@/lib/data/mock-news";
import { getPublishedArticles } from "@/lib/articles/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function NewsSection() {
  const articles = isSupabaseConfigured()
    ? await getPublishedArticles("news", 5)
    : [];

  const useLive = articles.length > 0;
  const allItems = useLive
    ? articlesToCarouselItems(articles)
    : newsToCarouselItems(MOCK_LATEST_NEWS.slice(0, 5));

  const [featured, ...rest] = allItems;

  return (
    <section className="section-reveal px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
            Latest News
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/40 sm:text-[0.95rem]">
            Trailers, analysis, and everything happening in Leonida
          </p>
        </div>

        {featured && <FeaturedNewsCard item={featured} />}

        {rest.length > 0 && (
          <ContentCarousel
            title="Latest News"
            seeAllHref="/news"
            items={rest}
            hideHeader
            className="-mx-4 sm:-mx-6 lg:-mx-8"
          />
        )}
      </div>
    </section>
  );
}
