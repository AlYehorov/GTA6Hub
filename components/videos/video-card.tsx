import Link from "next/link";
import { Play } from "lucide-react";
import { VIDEO_CATEGORY_LABELS, type Video } from "@/lib/types/video";
import { formatDate } from "@/lib/utils/format-date";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const thumb = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;

  return (
    <Link
      href={`/videos/${video.slug}`}
      className="group block overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-white/12"
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={video.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/80">
          {VIDEO_CATEGORY_LABELS[video.category]}
        </span>
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-gta-pink/90 text-white">
            <Play className="size-5 fill-current" />
          </span>
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-heading text-base font-semibold leading-snug text-white group-hover:text-gta-pink">
          {video.title}
        </h3>
        <p className="mt-1 text-xs text-white/40">
          {video.source_channel}
          {video.published_at ? ` · ${formatDate(video.published_at)}` : ""}
        </p>
      </div>
    </Link>
  );
}
