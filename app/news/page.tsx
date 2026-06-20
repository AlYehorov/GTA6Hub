import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ArticleGrid } from "@/components/articles/article-grid";
import { getPublishedArticles } from "@/lib/articles/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "News",
  description: "Latest GTA VI news, trailer breakdowns, and official announcements.",
  path: "/news",
});

export default async function NewsPage() {
  const articles = await getPublishedArticles("news");

  return (
    <>
      <PageHeader
        title="News"
        description="Stay up to date with everything happening in the world of Grand Theft Auto VI."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!isSupabaseConfigured() && (
          <p className="mb-8 rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Supabase is not configured. Add credentials to `.env.local` and run the migration.
          </p>
        )}
        <ArticleGrid articles={articles} type="news" />
      </div>
    </>
  );
}
