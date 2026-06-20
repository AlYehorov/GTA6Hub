import type { ArticleListItem, ArticleType } from "@/lib/types/article";
import { ArticleCard } from "@/components/articles/article-card";

interface RelatedArticlesProps {
  articles: ArticleListItem[];
  type: ArticleType;
}

export function RelatedArticles({ articles, type }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="border-t border-white/[0.06] bg-black px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 font-heading text-2xl font-semibold text-white sm:text-3xl">
          Related {type === "news" ? "News" : "Guides"}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} type={type} />
          ))}
        </div>
      </div>
    </section>
  );
}
