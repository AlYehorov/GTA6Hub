import type { GameEntityKind } from "@/lib/types/game-entity";

export interface EntityKindConfig {
  kind: GameEntityKind;
  table: string;
  routePrefix: string;
  label: string;
  labelSingular: string;
  trackerCategorySlug?: string;
}

export const ENTITY_KINDS: Record<GameEntityKind, EntityKindConfig> = {
  locations: {
    kind: "locations",
    table: "game_locations",
    routePrefix: "/locations",
    label: "Locations",
    labelSingular: "Location",
    trackerCategorySlug: "collectibles",
  },
  characters: {
    kind: "characters",
    table: "game_characters",
    routePrefix: "/characters",
    label: "Characters",
    labelSingular: "Character",
    trackerCategorySlug: "strangers",
  },
  vehicles: {
    kind: "vehicles",
    table: "game_vehicles",
    routePrefix: "/vehicles",
    label: "Vehicles",
    labelSingular: "Vehicle",
    trackerCategorySlug: "vehicles",
  },
  weapons: {
    kind: "weapons",
    table: "game_weapons",
    routePrefix: "/weapons",
    label: "Weapons",
    labelSingular: "Weapon",
    trackerCategorySlug: "weapons",
  },
  businesses: {
    kind: "businesses",
    table: "game_businesses",
    routePrefix: "/businesses",
    label: "Businesses",
    labelSingular: "Business",
    trackerCategorySlug: "businesses",
  },
  animals: {
    kind: "animals",
    table: "game_animals",
    routePrefix: "/animals",
    label: "Animals",
    labelSingular: "Animal",
    trackerCategorySlug: "animals",
  },
  collectibles: {
    kind: "collectibles",
    table: "game_collectibles",
    routePrefix: "/collectibles",
    label: "Collectibles",
    labelSingular: "Collectible",
    trackerCategorySlug: "collectibles",
  },
  missions: {
    kind: "missions",
    table: "game_missions",
    routePrefix: "/missions",
    label: "Missions",
    labelSingular: "Mission",
    trackerCategorySlug: "main-missions",
  },
};

export const ALL_ENTITY_KINDS = Object.keys(ENTITY_KINDS) as GameEntityKind[];

export function entityHref(kind: GameEntityKind, slug: string): string {
  return `${ENTITY_KINDS[kind].routePrefix}/${slug}`;
}
