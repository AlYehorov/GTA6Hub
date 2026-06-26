"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselScrollRailProps {
  title: string;
  seeAllHref: string;
  children: ReactNode;
  className?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

export function CarouselScrollRail({
  title,
  seeAllHref,
  children,
  className,
  subtitle,
  hideHeader = false,
}: CarouselScrollRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -el.clientWidth * 0.7 : el.clientWidth * 0.7;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "mb-7 flex items-end justify-between gap-4 px-4 sm:px-6 lg:px-8",
          hideHeader && "hidden"
        )}
      >
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/40 sm:text-[0.95rem]">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label={`Scroll ${title} left`}
              className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label={`Scroll ${title} right`}
              className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <Link
            href={seeAllHref}
            className="flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/80"
          >
            See all
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="carousel-scroll flex items-end gap-3 overflow-x-auto px-4 pb-4 sm:gap-4 sm:px-6 lg:gap-5 lg:px-8"
      >
        {children}
      </div>
    </div>
  );
}
