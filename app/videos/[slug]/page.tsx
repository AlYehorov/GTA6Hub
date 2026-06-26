import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { YoutubeEmbed } from "@/components/videos/youtube-embed";
import { NewsroomArticleCard } from "@/components/newsroom/newsroom-article-card";
import { getVideoBySlug } from "@/lib/videos/queries";
import { getPublishedArticles, getPublishedArticlesByCategory } from "@/lib/articles/queries";
import { VIDEO_CATEGORY_LABELS } from "@/lib/types/video";
import { absoluteUrl, getSiteUrl } from "@/lib/constants/site";
import { createPageMetadata } from "@/lib/metadata";
import { formatDate } from "@/lib/utils/format-date";

interface VideoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) return { title: "Video Not Found" };

  return createPageMetadata({
    title: `${video.title} — GTA 6 Video`,
    description: video.description.slice(0, 155) || `Watch ${video.title} on GTAVIHub.`,
    path: `/videos/${slug}`,
  });
}

export default async function VideoDetailPage({ params }: VideoPageProps) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) notFound();

  const [relatedNews, relatedGuides] = await Promise.all([
    getPublishedArticlesByCategory("news", "trailer", 4),
    getPublishedArticles("guide", 4),
  ]);

  const pageUrl = absoluteUrl(`/videos/${video.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`,
    uploadDate: video.published_at ?? video.created_at,
    embedUrl: `https://www.youtube.com/embed/${video.youtube_id}`,
    contentUrl: video.source_url,
    publisher: {
      "@type": "Organization",
      name: video.source_channel,
    },
    url: pageUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title={video.title}
        description={`${VIDEO_CATEGORY_LABELS[video.category]} · ${video.source_channel}`}
      />
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <YoutubeEmbed youtubeId={video.youtube_id} title={video.title} />

        <div className="flex flex-wrap items-center gap-3 text-sm text-white/45">
          {video.published_at && <time dateTime={video.published_at}>{formatDate(video.published_at)}</time>}
          <a
            href={video.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gta-cyan hover:underline"
          >
            Watch on YouTube
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {video.description && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="mb-2 font-heading text-lg font-semibold text-white">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/65">{video.description}</p>
          </div>
        )}

        {relatedNews.length > 0 && (
          <section>
            <h2 className="mb-4 font-heading text-xl font-semibold text-white">Related Articles</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedNews.map((article) => (
                <NewsroomArticleCard key={article.id} article={article} compact />
              ))}
            </div>
          </section>
        )}

        {relatedGuides.length > 0 && (
          <section>
            <h2 className="mb-4 font-heading text-xl font-semibold text-white">Related Guides</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedGuides.map((article) => (
                <NewsroomArticleCard key={article.id} article={article} type="guide" compact />
              ))}
            </div>
          </section>
        )}

        <p className="text-xs text-white/30">
          Source: {video.source_channel} · {getSiteUrl()}
        </p>
      </div>
    </>
  );
}
