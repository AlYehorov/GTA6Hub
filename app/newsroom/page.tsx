import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { NewsroomArticleCard } from "@/components/newsroom/newsroom-article-card";
import { AmbientToggle } from "@/components/shared/ambient-toggle";
import {
  getEditorialPicks,
  getPublishedArticles,
  getPublishedArticlesByCategory,
  getPublishedArticlesBySourceLabel,
} from "@/lib/articles/queries";
import { createPageMetadata } from "@/lib/metadata";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = createPageMetadata({
  title: "GTA 6 Newsroom — Latest News & Updates",
  description:
    "Latest GTA 6 and GTA VI news, official Rockstar updates, trailer breakdowns, community rumors, and editorial picks from GTAVIHub.",
  path: "/newsroom",
});

export default async function NewsroomPage() {
  const configured = isSupabaseConfigured();
  const [latest, official, trailers, rumors, picks, guides] = configured
    ? await Promise.all([
        getPublishedArticles("news", 12),
        getPublishedArticlesByCategory("news", "official", 8),
        getPublishedArticlesByCategory("news", "trailer", 8),
        getPublishedArticlesBySourceLabel("news", ["unconfirmed", "community", "rumor"], 8),
        getEditorialPicks(6),
        getPublishedArticles("guide", 6),
      ])
    : [[], [], [], [], [], []];

  return (
    <>
      <PageHeader
        title="GTA 6 Newsroom"
        description="Official updates, trailer analysis, community rumors, and editorial picks — updated from live sources."
      />
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/45">
            Official updates, trailer analysis, and community coverage for GTA VI.
          </p>
          <AmbientToggle />
        </div>

        <NewsroomSection id="latest" title="Latest GTA 6 News" articles={latest} empty="No published news yet." />
        <NewsroomSection id="official" title="Official Rockstar Updates" articles={official} />
        <NewsroomSection id="trailers" title="Trailer & Video Updates" articles={trailers} />
        <NewsroomSection id="rumors" title="Community Rumors" articles={rumors} />
        <NewsroomSection id="picks" title="Editorial Picks" articles={picks} />
        <NewsroomSection id="guides" title="Guides" articles={guides} type="guide" />

        <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8 text-sm">
          <Link href="/news" className="text-gta-pink hover:underline">
            All news →
          </Link>
          <Link href="/videos" className="text-gta-cyan hover:underline">
            Video hub →
          </Link>
          <Link href="/guides" className="text-white/60 hover:text-white">
            Guides →
          </Link>
        </div>
      </div>
    </>
  );
}

function NewsroomSection({
  id,
  title,
  articles,
  type = "news",
  empty = "Nothing here yet — check back after the next ingest cycle.",
}: {
  id: string;
  title: string;
  articles: Awaited<ReturnType<typeof getPublishedArticles>>;
  type?: "news" | "guide";
  empty?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-5 font-heading text-xl font-semibold text-white sm:text-2xl">{title}</h2>
      {articles.length === 0 ? (
        <p className="text-sm text-white/40">{empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <NewsroomArticleCard
              key={article.id}
              article={article}
              type={type}
              imageIndex={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
