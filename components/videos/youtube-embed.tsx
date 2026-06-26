interface YoutubeEmbedProps {
  youtubeId: string;
  title: string;
  className?: string;
}

export function YoutubeEmbed({ youtubeId, title, className }: YoutubeEmbedProps) {
  return (
    <div className={className}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}
