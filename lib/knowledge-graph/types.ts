export const KG_ENTITY_KINDS = [
  "character",
  "location",
  "vehicle",
  "weapon",
  "mission",
  "business",
  "animal",
  "brand",
  "song",
  "organization",
] as const;

export type KgEntityKind = (typeof KG_ENTITY_KINDS)[number];

export type KgEntityStatus = "draft" | "published";
export type KgLinkSource = "manual" | "extracted" | "rule" | "sync";

export interface KgEntity {
  id: string;
  kind: KgEntityKind;
  slug: string;
  title: string;
  aliases: string[];
  description: string;
  image_url: string | null;
  category: string;
  first_seen_source: string | null;
  first_seen_date: string | null;
  status: KgEntityStatus;
  legacy_game_table: string | null;
  legacy_game_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface KgEntityLink {
  entity_id: string;
  confidence: number;
  source: KgLinkSource;
  mention_count: number;
}

export interface RelatedEntity {
  id: string;
  kind: KgEntityKind;
  slug: string;
  title: string;
  href: string;
  confidence: number;
  mention_count: number;
}

export interface KgDuplicateGroup {
  normalizedTitle: string;
  entities: KgEntity[];
}

export interface KgMergeSuggestion {
  entityA: KgEntity;
  entityB: KgEntity;
  reason: string;
  score: number;
}

export interface KgOrphanEntity extends KgEntity {
  articleCount: number;
  videoCount: number;
  mapCount: number;
}

export interface KgAdminData {
  totalEntities: number;
  byKind: Record<KgEntityKind, number>;
  totalArticleLinks: number;
  totalVideoLinks: number;
  totalMapLinks: number;
  duplicates: KgDuplicateGroup[];
  aliasCollisions: Array<{ alias: string; entities: KgEntity[] }>;
  orphans: KgOrphanEntity[];
  mergeSuggestions: KgMergeSuggestion[];
  recentEntities: KgEntity[];
  configured: boolean;
}

/** Maps kg kind → existing public route prefix (backward compatible URLs). */
export const KG_KIND_ROUTE_PREFIX: Partial<Record<KgEntityKind, string>> = {
  character: "/characters",
  location: "/locations",
  vehicle: "/vehicles",
  weapon: "/weapons",
  mission: "/missions",
  business: "/businesses",
  animal: "/animals",
};

export function kgEntityHref(kind: KgEntityKind, slug: string): string {
  const prefix = KG_KIND_ROUTE_PREFIX[kind];
  if (prefix) return `${prefix}/${slug}`;
  return `/search?q=${encodeURIComponent(slug)}`;
}

/** Maps game_* table → kg kind for sync. */
export const GAME_TABLE_TO_KG_KIND: Record<string, KgEntityKind> = {
  game_characters: "character",
  game_locations: "location",
  game_vehicles: "vehicle",
  game_weapons: "weapon",
  game_missions: "mission",
  game_businesses: "business",
  game_animals: "animal",
};
