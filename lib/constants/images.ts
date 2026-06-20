/**
 * Official Rockstar Games GTA VI promotional artwork & screenshots.
 * Sourced from rockstargames.com/VI/downloads — editorial/fan use only.
 * © Rockstar Games. GTA6Hub is unofficial and not affiliated with Rockstar or Take-Two.
 */
export const GTA6_IMAGES = {
  // Characters
  luciaPortrait: "/images/gta6/lucia-portrait.jpg",
  luciaCaminos02: "/images/gta6/lucia-caminos-02.jpg",
  jasonDuval01: "/images/gta6/jason-duval-01.jpg",
  jasonDuval04: "/images/gta6/jason-duval-04.jpg",
  jasonLuciaMotel: "/images/gta6/jason-lucia-motel.jpg",
  raulBautista: "/images/gta6/raul-bautista.jpg",
  boobieIke: "/images/gta6/boobie-ike.jpg",

  // Key art (use sparingly)
  jasonLucia03Landscape: "/images/gta6/jason-lucia-03-landscape.jpg",
  jasonLucia03Portrait: "/images/gta6/jason-lucia-03-portrait.jpg",

  // Environments & scenes
  viceCityBanner: "/images/gta6/vice-city-banner.jpg",
  viceCityBlank: "/images/gta6/vice-city-blank.jpg",
  trailer2Header: "/images/gta6/trailer-2-header.webp",
} as const;

export type Gta6ImageKey = keyof typeof GTA6_IMAGES;
