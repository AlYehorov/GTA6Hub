"use client";

import { useState } from "react";
import Image from "next/image";
import { DISPLAY_IMAGE_QUALITY } from "@/lib/constants/image-display";
import { resolveHeroImageUrl } from "@/lib/articles/resolve-hero-image";
import { cn } from "@/lib/utils";

interface SafeArticleImageProps {
  src: string | null | undefined;
  alt: string;
  seed: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  featured?: boolean;
}

export function SafeArticleImage({
  src,
  alt,
  seed,
  fill = true,
  className,
  sizes,
  priority,
  featured,
}: SafeArticleImageProps) {
  const primary = resolveHeroImageUrl(src, seed);
  const fallback = resolveHeroImageUrl(null, `${seed}-fallback`);
  const [currentSrc, setCurrentSrc] = useState(primary);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      priority={priority}
      quality={DISPLAY_IMAGE_QUALITY}
      className={cn("object-cover", className)}
      sizes={sizes ?? (featured ? "100vw" : "(max-width:768px) 100vw, 400px")}
      onError={() => {
        if (currentSrc !== fallback) setCurrentSrc(fallback);
      }}
    />
  );
}
