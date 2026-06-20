import type { ArticleListItem, ArticleType } from "@/lib/types/article";
import { ArticleCard } from "@/components/articles/article-card";

interface ArticleGridProps {
  articles: ArticleListItem[];
  type: ArticleType;
}

export function ArticleGrid({ articles, type }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <p className="py-16 text-center text-white/40">
        No {type === "news" ? "news" : "guides"} published yet. Check back soon.
      </p>
    );
  }

  const [featured, ...rest] = articles;

  return (
    <div className="space-y-6">
      {featured && (
        <ArticleCard article={featured} type={type} featured />
      )}
      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <ArticleCard key={article.id} article={article} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}
