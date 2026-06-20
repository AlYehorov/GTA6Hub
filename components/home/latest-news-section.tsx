import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/section-header";
import { NewsCard } from "@/components/shared/news-card";
import { MOCK_LATEST_NEWS } from "@/lib/data/mock-news";
import { cn } from "@/lib/utils";

export function LatestNewsSection() {
  return (
    <section className="border-t border-border/60 bg-card/10">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            title="Latest News"
            description="Fresh updates from the world of Grand Theft Auto VI."
            className="mb-0"
          />
          <Link
            href="/news"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "shrink-0 gap-1 text-gta-cyan hover:text-gta-cyan/80"
            )}
          >
            View all news
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_LATEST_NEWS.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
