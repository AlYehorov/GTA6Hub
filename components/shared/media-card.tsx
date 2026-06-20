import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardVariant, CarouselItem } from "@/lib/types";

interface MediaCardProps {
  item: CarouselItem;
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  hero: "min-w-[86vw] sm:min-w-[560px] lg:min-w-[720px] aspect-[16/9]",
  landscape: "min-w-[272px] sm:min-w-[340px] lg:min-w-[400px] aspect-[16/10]",
  portrait: "min-w-[156px] sm:min-w-[190px] lg:min-w-[220px] aspect-[2/3]",
  square: "min-w-[168px] sm:min-w-[210px] lg:min-w-[240px] aspect-square",
};

export function MediaCard({ item, className, style }: MediaCardProps) {
  const variant = item.variant ?? "square";

  return (
    <Link
      href={item.href}
      style={style}
      className={cn(
        "group relative block shrink-0 snap-start overflow-hidden rounded-xl bg-zinc-950",
        "ring-1 ring-white/[0.06] transition-all duration-500 ease-out",
        "hover:ring-white/12 hover:shadow-2xl hover:shadow-black/50",
        VARIANT_STYLES[variant],
        className
      )}
    >
      <Image
        src={item.image}
        alt={item.title}
        fill
        className={cn(
          "object-cover transition-transform duration-[850ms] ease-out group-hover:scale-[1.08]",
          item.imagePosition ?? "object-center"
        )}
        sizes={
          variant === "hero"
            ? "(max-width: 768px) 86vw, 720px"
            : "(max-width: 640px) 180px, 280px"
        }
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent transition-opacity duration-500 group-hover:from-black group-hover:via-black/50" />

      <div className="absolute inset-x-0 bottom-0 p-4 transition-transform duration-500 ease-out group-hover:-translate-y-1.5 sm:p-5">
        {item.tag && (
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">
            {item.tag}
          </span>
        )}
        <h3
          className={cn(
            "font-heading font-semibold leading-snug tracking-tight text-white transition-transform duration-500 group-hover:-translate-y-0.5",
            variant === "hero"
              ? "text-xl sm:text-2xl lg:text-[1.75rem]"
              : variant === "landscape"
                ? "text-base sm:text-lg"
                : "text-sm sm:text-[0.95rem]"
          )}
        >
          {item.title}
        </h3>
        <p
          className={cn(
            "mt-1 line-clamp-2 text-white/50 transition-colors duration-300 group-hover:text-white/70",
            variant === "hero" ? "text-sm sm:text-base" : "text-xs sm:text-sm"
          )}
        >
          {item.subtitle}
        </p>
      </div>
    </Link>
  );
}

interface FeaturedNewsCardProps {
  item: CarouselItem;
}

export function FeaturedNewsCard({ item }: FeaturedNewsCardProps) {
  return (
    <Link
      href={item.href}
      className="group relative mb-8 block overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-white/[0.08] transition-all duration-500 hover:ring-white/15"
    >
      <div className="relative aspect-[21/9] min-h-[220px] w-full sm:min-h-[280px] lg:min-h-[320px]">
        <Image
          src={item.image}
          alt={item.title}
          fill
          priority
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
          <span className="mb-3 w-fit text-[10px] font-medium uppercase tracking-[0.3em] text-gta-pink/90">
            {item.tag ?? "Featured"}
          </span>
          <h3 className="max-w-3xl font-heading text-2xl font-semibold leading-[1.1] tracking-tight text-white transition-transform duration-500 group-hover:-translate-y-1 sm:text-3xl lg:text-[2rem]">
            {item.title}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
            {item.subtitle}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors group-hover:text-white">
            Read article
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
