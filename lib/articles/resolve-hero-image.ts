import { GTA6_IMAGES } from "@/lib/constants/images";

const FALLBACK_IMAGES = [
  GTA6_IMAGES.trailer2Header,
  GTA6_IMAGES.viceCityBanner,
  GTA6_IMAGES.luciaCaminos02,
  GTA6_IMAGES.jasonLuciaMotel,
  GTA6_IMAGES.jasonDuval04,
  GTA6_IMAGES.heroViceCity,
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Prefer hqdefault — maxresdefault is missing for many YouTube videos. */
export function normalizeYouTubeThumbnail(url: string): string {
  if (!url.includes("img.youtube.com/vi/")) return url;
  return url
    .replace(/\/maxresdefault\.jpg$/i, "/hqdefault.jpg")
    .replace(/\/sddefault\.jpg$/i, "/hqdefault.jpg");
}

export function resolveHeroImageUrl(
  heroImageUrl: string | null | undefined,
  seed = "default"
): string {
  if (heroImageUrl?.trim()) {
    return normalizeYouTubeThumbnail(heroImageUrl.trim());
  }
  const index = hashString(seed) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

export function resolveHeroImageForArticle(
  heroImageUrl: string | null | undefined,
  slug: string
): string {
  return resolveHeroImageUrl(heroImageUrl, slug);
}
