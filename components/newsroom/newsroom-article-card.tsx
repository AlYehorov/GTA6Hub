import Link from "next/link";
import { Clock, ExternalLink, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils/format-date";
import { EDITORIAL_LABEL_STYLES } from "@/lib/newsroom/labels";
import type { ArticleListItem, ArticleType } from "@/lib/types/article";
import { cn } from "@/lib/utils";

interface NewsroomArticleCardProps {
  article: ArticleListItem;
  type?: ArticleType;
  compact?: boolean;
}

export function NewsroomArticleCard({
  article,
  type = "news",
  compact,
}: NewsroomArticleCardProps) {
  const href = type === "news" ? `/news/${article.slug}` : `/guides/${article.slug}`;
  const labelStyle = EDITORIAL_LABEL_STYLES[article.editorial_label];

  return (
    <article
      className={cn(
        "group rounded-xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-white/12",
        compact ? "p-4" : "p-5 sm:p-6"
      )}
    >
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
        {article.ai_confidence != null && (
          <span className="text-white/30" title="AI-assisted confidence score">
            AI {Math.round(article.ai_confidence * 100)}%
          </span>
        )}
      </div>

      <Link href={href} className="block">
        <h3
          className={cn(
            "font-heading font-semibold leading-snug text-white transition-colors group-hover:text-gta-pink",
            compact ? "text-base" : "text-lg sm:text-xl"
          )}
        >
          {article.title}
        </h3>
        {article.excerpt && !compact && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">{article.excerpt}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-sm text-white/50 group-hover:text-white/80">
          Read article
          <ArrowUpRight className="size-3.5" />
        </span>
      </Link>

      {article.source_url && (
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-white/35 hover:text-gta-cyan"
        >
          Source
          <ExternalLink className="size-3" />
        </a>
      )}
    </article>
  );
}
