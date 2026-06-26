import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { VideoCard } from "@/components/videos/video-card";
import { AmbientToggle } from "@/components/shared/ambient-toggle";
import { getPublishedVideos } from "@/lib/videos/queries";
import { VIDEO_CATEGORY_LABELS, type VideoCategory } from "@/lib/types/video";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "GTA 6 Videos — Official Trailers & Breakdowns",
  description:
    "Watch official GTA 6 and GTA VI videos from Rockstar Games. Trailers, updates, and community analysis on GTAVIHub.",
  path: "/videos",
});

const CATEGORY_ORDER: VideoCategory[] = [
  "official_trailer",
  "official_video",
  "trailer_breakdown",
  "community_analysis",
  "news_recap",
];

export default async function VideosPage() {
  const videos = await getPublishedVideos(50);
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    videos: videos.filter((v) => v.category === category),
  })).filter((g) => g.videos.length > 0);

  return (
    <>
      <PageHeader
        title="Video Hub"
        description="Official Rockstar YouTube embeds — trailers, updates, and video news for GTA VI."
      />
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/45">
            Official YouTube embeds only. No autoplay. No copyrighted audio tracks hosted here.
          </p>
          <AmbientToggle />
        </div>

        {videos.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <p className="text-white/50">No videos published yet.</p>
            <p className="mt-2 text-sm text-white/35">
              Run source ingestion from{" "}
              <Link href="/admin/sources" className="text-gta-pink hover:underline">
                Admin → Sources
              </Link>{" "}
              to pull Rockstar YouTube uploads.
            </p>
          </div>
        ) : (
          grouped.map(({ category, videos: items }) => (
            <section key={category}>
              <h2 className="mb-5 font-heading text-xl font-semibold text-white">
                {VIDEO_CATEGORY_LABELS[category]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </section>
          ))
        )}

        <p className="text-center text-xs text-white/30">
          Videos © Rockstar Games. Embedded via YouTube for informational purposes.
        </p>
      </div>
    </>
  );
}
