import Image from "next/image";
import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils/format-date";
import type { ArticleWithRelations } from "@/lib/types/article";

interface ArticleHeroProps {
  article: ArticleWithRelations;
}

export function ArticleHero({ article }: ArticleHeroProps) {
  return (
    <header className="relative bg-black">
      {article.hero_image_url && (
        <div className="relative aspect-[21/9] max-h-[520px] w-full overflow-hidden">
          <Image
            src={article.hero_image_url}
            alt={article.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/45">
          {article.category && <span>{article.category.name}</span>}
          {article.published_at && (
            <>
              <span className="text-white/20">·</span>
              <time dateTime={article.published_at}>
                {formatDate(article.published_at)}
              </time>
            </>
          )}
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1 normal-case tracking-normal">
            <Clock className="size-3" />
            {article.reading_time_minutes} min read
          </span>
        </div>

        <h1 className="font-heading text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="mt-5 text-lg leading-relaxed text-white/60 sm:text-xl">
            {article.excerpt}
          </p>
        )}
      </div>
    </header>
  );
}
