import { GTA6_IMAGES } from "@/lib/constants/images";

/** High-res local Rockstar artwork for editorial fallbacks (2K–4K sources). */
export const EDITORIAL_2K_IMAGES = [
  GTA6_IMAGES.trailer2Header,
  GTA6_IMAGES.heroViceCity,
  GTA6_IMAGES.jasonLucia03Landscape,
  GTA6_IMAGES.luciaPortrait,
  GTA6_IMAGES.jasonDuval04,
  GTA6_IMAGES.viceCityBanner,
  GTA6_IMAGES.jasonLuciaMotel,
  GTA6_IMAGES.luciaCaminos02,
  GTA6_IMAGES.jasonDuval01,
  GTA6_IMAGES.raulBautista,
  GTA6_IMAGES.viceCityBlank,
  GTA6_IMAGES.jasonLucia03Portrait,
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function isLowResolutionHero(url: string): boolean {
  const normalized = url.toLowerCase();
  return (
    normalized.includes("img.youtube.com/vi/") ||
    normalized.includes("hqdefault") ||
    normalized.includes("mqdefault") ||
    normalized.includes("sddefault")
  );
}

export function isHighResolutionHero(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const normalized = url.trim().toLowerCase();
  if (isLowResolutionHero(normalized)) return false;
  if (normalized.startsWith("/images/gta6/")) return true;
  if (normalized.includes("supabase.co/storage/")) return true;
  return /\.(webp|jpg|jpeg|png)(\?|$)/i.test(normalized);
}

/** Prefer hqdefault — maxresdefault is missing for many YouTube videos. */
export function normalizeYouTubeThumbnail(url: string): string {
  if (!url.includes("img.youtube.com/vi/")) return url;
  return url
    .replace(/\/maxresdefault\.jpg$/i, "/hqdefault.jpg")
    .replace(/\/sddefault\.jpg$/i, "/hqdefault.jpg");
}

export function editorialFallbackByIndex(index: number): string {
  return EDITORIAL_2K_IMAGES[index % EDITORIAL_2K_IMAGES.length];
}

export function editorialFallbackBySeed(seed: string): string {
  return editorialFallbackByIndex(hashString(seed));
}

/** Carousel / homepage cards — always unique 2K art per slot. */
export function resolveCarouselHeroImage(
  heroImageUrl: string | null | undefined,
  index: number
): string {
  if (isHighResolutionHero(heroImageUrl)) {
    return heroImageUrl!.trim();
  }
  return editorialFallbackByIndex(index);
}

export function resolveHeroImageUrl(
  heroImageUrl: string | null | undefined,
  seed = "default"
): string {
  if (isHighResolutionHero(heroImageUrl)) {
    return heroImageUrl!.trim();
  }
  if (heroImageUrl?.trim()) {
    return normalizeYouTubeThumbnail(heroImageUrl.trim());
  }
  return editorialFallbackBySeed(seed);
}

export function resolveHeroImageForArticle(
  heroImageUrl: string | null | undefined,
  slug: string,
  index?: number
): string {
  if (index != null) {
    return resolveCarouselHeroImage(heroImageUrl, index);
  }
  return resolveHeroImageUrl(heroImageUrl, slug);
}
