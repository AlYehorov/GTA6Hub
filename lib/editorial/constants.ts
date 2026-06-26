/** Articles older than this with newer Rockstar sources are flagged for update. */
export const OUTDATED_ARTICLE_DAYS = 30;

/** Entity kinds shown in Missing SEO Pages (weapons excluded — low search intent). */
export const SEO_ENTITY_KINDS = [
  "characters",
  "locations",
  "vehicles",
  "businesses",
  "animals",
  "missions",
  "collectibles",
] as const;

export type SeoEntityKind = (typeof SEO_ENTITY_KINDS)[number];
