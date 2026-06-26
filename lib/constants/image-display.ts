/** Sharp display defaults for homepage and editorial imagery. */
export const DISPLAY_IMAGE_QUALITY = 90;
/** Must match a value in next.config `images.qualities` (75 | 90). */
export const CAROUSEL_IMAGE_QUALITY = 90;

export const IMAGE_SIZES = {
  /** Full-bleed hero — up to 4K source */
  hero: "100vw",
  /** Featured news banner */
  featured: "(max-width: 1536px) 100vw, 1536px",
  /** Large carousel hero card (~720px layout, 2× retina) */
  carouselHero: "(max-width: 768px) 100vw, 1440px",
  /** Landscape / square carousel tiles */
  carouselLandscape: "(max-width: 640px) 55vw, (max-width: 1280px) 400px, 480px",
  /** Portrait carousel tiles */
  carouselPortrait: "(max-width: 640px) 40vw, (max-width: 1280px) 240px, 320px",
} as const;
