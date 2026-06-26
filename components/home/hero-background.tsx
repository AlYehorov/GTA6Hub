"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DISPLAY_IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/constants/image-display";

interface HeroBackgroundProps {
  src: string;
  alt: string;
}

export function HeroBackground({ src, alt }: HeroBackgroundProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;

    if (prefersReduced || coarsePointer || narrow) {
      return;
    }

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setOffset(window.scrollY * 0.25);
        ticking = false;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translate3d(0, ${offset}px, 0)` }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          fetchPriority="high"
          quality={DISPLAY_IMAGE_QUALITY}
          className="object-cover object-[center_30%]"
          sizes={IMAGE_SIZES.hero}
        />
      </div>
    </div>
  );
}
