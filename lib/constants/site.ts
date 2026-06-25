import { GTA6_IMAGES } from "@/lib/constants/images";

export const SITE_NAME = "GTA6Hub";
export const SITE_DESCRIPTION =
  "Your unofficial community hub for Grand Theft Auto VI. News, guides, trailers, characters, vehicles, and interactive maps.";

/** Canonical production domain (used in fallbacks and user-agent strings). */
export const CANONICAL_SITE_URL = "https://www.gtavihub.gg";

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const DEFAULT_OG_IMAGE = GTA6_IMAGES.trailer2Header;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getSiteUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
