import Link from "next/link";
import { Clock, ExternalLink, ArrowUpRight } from "lucide-react";
import { SafeArticleImage } from "@/components/articles/safe-article-image";
import { formatDate } from "@/lib/utils/format-date";
import { polishPublicExcerpt } from "@/lib/editorial/sanitize";
import { EDITORIAL_LABEL_STYLES } from "@/lib/newsroom/labels";
import type { ArticleListItem, ArticleType } from "@/lib/types/article";
import { cn } from "@/lib/utils";

interface NewsroomArticleCardProps {
  article: ArticleListItem;
  type?: ArticleType;
  compact?: boolean;
  imageIndex?: number;
}

export function NewsroomArticleCard({
  article,
  type = "news",
  compact,
  imageIndex,
}: NewsroomArticleCardProps) {
  const href = type === "news" ? `/news/${article.slug}` : `/guides/${article.slug}`;
  const labelStyle = EDITORIAL_LABEL_STYLES[article.editorial_label];
  const excerpt = polishPublicExcerpt(article.excerpt, article.title);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-white/12",
        compact ? "" : ""
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
          <SafeArticleImage
            src={article.hero_image_url}
            seed={article.slug}
            imageIndex={imageIndex}
            alt={article.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        <div className={cn(compact ? "p-4" : "p-5 sm:p-6")}>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={cn("rounded-full px-2.5 py-0.5 font-medium", labelStyle.bg, labelStyle.text)}>
              {article.editorial_label}
            </span>
            {article.published_at && (
              <time dateTime={article.published_at} className="text-white/40">
                {formatDate(article.published_at)}
              </time>
            )}
            <span className="flex items-center gap-1 text-white/40">
              <Clock className="size-3" />
              {article.reading_time_minutes} min
            </span>
          </div>

          <h3
            className={cn(
              "font-heading font-semibold leading-snug text-white transition-colors group-hover:text-gta-pink",
              compact ? "text-base" : "text-lg sm:text-xl"
            )}
          >
            {article.title}
          </h3>
          {excerpt && !compact && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">{excerpt}</p>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-sm text-white/50 group-hover:text-white/80">
            Read article
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </Link>

      {article.source_url && (
        <div className={cn("border-t border-white/[0.04]", compact ? "px-4 pb-4" : "px-5 pb-5 sm:px-6 sm:pb-6")}>
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-white/35 hover:text-gta-cyan"
          >
            Source
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </article>
  );
}
