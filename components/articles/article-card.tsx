import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils/format-date";
import type { ArticleListItem, ArticleType } from "@/lib/types/article";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  article: ArticleListItem;
  type: ArticleType;
  featured?: boolean;
}

export function ArticleCard({ article, type, featured }: ArticleCardProps) {
  const href = type === "news" ? `/news/${article.slug}` : `/guides/${article.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "group block overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-white/[0.06] transition-all duration-500 hover:ring-white/12",
        featured ? "col-span-full lg:col-span-2" : ""
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-zinc-900",
          featured ? "aspect-[21/9] min-h-[220px]" : "aspect-[16/10]"
        )}
      >
        {article.hero_image_url ? (
          <Image
            src={article.hero_image_url}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            sizes={featured ? "100vw" : "(max-width:768px) 100vw, 400px"}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-white/45">
          {article.category && (
            <span className="uppercase tracking-[0.2em]">{article.category.name}</span>
          )}
          {article.published_at && (
            <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {article.reading_time_minutes} min
          </span>
        </div>

        <h2
          className={cn(
            "font-heading font-semibold leading-snug text-white transition-transform duration-300 group-hover:-translate-y-0.5",
            featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
          )}
        >
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50 sm:text-base">
            {article.excerpt}
          </p>
        )}

        <span className="mt-4 inline-flex items-center gap-1 text-sm text-white/60 transition-colors group-hover:text-gta-pink">
          Read more
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
