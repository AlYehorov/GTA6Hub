"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface HeroBackgroundProps {
  src: string;
  alt: string;
}

export function HeroBackground({ src, alt }: HeroBackgroundProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    function onScroll() {
      setOffset(window.scrollY * 0.35);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 scale-110 will-change-transform"
        style={{ transform: `translateY(${offset}px) scale(1.1)` }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          className="object-cover object-[center_30%]"
          sizes="100vw"
        />
      </div>
    </div>
  );
}
