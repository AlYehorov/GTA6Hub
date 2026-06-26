import type { KgEntityKind } from "@/lib/knowledge-graph/types";

export interface DictionaryEntry {
  kind: KgEntityKind;
  slug: string;
  title: string;
  aliases: string[];
  category: string;
}

/**
 * Seed dictionary for deterministic extraction.
 * Aliases are matched with word-boundary regex — no OpenAI.
 */
export const KG_DICTIONARY: DictionaryEntry[] = [
  // Characters
  { kind: "character", slug: "lucia", title: "Lucia", aliases: ["Lucia Caminos"], category: "protagonist" },
  { kind: "character", slug: "jason", title: "Jason", aliases: ["Jason Duval"], category: "protagonist" },
  { kind: "character", slug: "raul-bautista", title: "Raul Bautista", aliases: ["Raul"], category: "supporting" },
  { kind: "character", slug: "boobie-ike", title: "Boobie Ike", aliases: ["Boobie"], category: "supporting" },
  { kind: "character", slug: "cal", title: "Cal", aliases: [], category: "supporting" },
  { kind: "character", slug: "drequan-priest", title: "Drequan Priest", aliases: ["Drequan"], category: "supporting" },
  { kind: "character", slug: "real-dimez", title: "Real Dimez", aliases: [], category: "supporting" },
  { kind: "character", slug: "brian-hedricks", title: "Brian Hedricks", aliases: ["Brian"], category: "supporting" },

  // Locations
  { kind: "location", slug: "vice-city", title: "Vice City", aliases: ["Vice City skyline", "Miami"], category: "city" },
  { kind: "location", slug: "leonida-keys", title: "Leonida Keys", aliases: ["the Keys", "Florida Keys"], category: "islands" },
  { kind: "location", slug: "port-gellhorn", title: "Port Gellhorn", aliases: [], category: "town" },
  { kind: "location", slug: "ambrosia", title: "Ambrosia", aliases: [], category: "region" },
  { kind: "location", slug: "mount-kalaga", title: "Mount Kalaga", aliases: ["Kalaga"], category: "landmark" },
  { kind: "location", slug: "grassrivers", title: "Grassrivers", aliases: ["Everglades", "swamps"], category: "wildlife" },
  { kind: "location", slug: "ocean-drive", title: "Ocean Drive", aliases: [], category: "district" },
  { kind: "location", slug: "leonida", title: "Leonida", aliases: ["State of Leonida", "Florida"], category: "state" },

  // Vehicles (representative)
  { kind: "vehicle", slug: "speedboat", title: "Speedboat", aliases: ["speedboats"], category: "boat" },
  { kind: "vehicle", slug: "helicopter", title: "Helicopter", aliases: ["chopper", "choppers"], category: "air" },

  // Weapons
  { kind: "weapon", slug: "assault-rifle", title: "Assault Rifle", aliases: ["AR", "rifle"], category: "firearm" },

  // Businesses / brands
  { kind: "business", slug: "vice-city-nightclub", title: "Vice City Nightclub", aliases: ["nightclub"], category: "nightlife" },
  { kind: "brand", slug: "rockstar-games", title: "Rockstar Games", aliases: ["Rockstar"], category: "studio" },
  { kind: "brand", slug: "vinewood", title: "Vinewood", aliases: [], category: "media" },

  // Organizations
  { kind: "organization", slug: "leonida-state-police", title: "Leonida State Police", aliases: ["LSP", "police"], category: "law" },
  { kind: "organization", slug: "drug-cartel", title: "Drug Cartel", aliases: ["cartel"], category: "crime" },

  // Songs / media
  { kind: "song", slug: "love-is-a-long-road", title: "Love Is a Long Road", aliases: ["Love is a Long Road"], category: "soundtrack" },

  // Animals
  { kind: "animal", slug: "alligator", title: "Alligator", aliases: ["gator", "gators", "alligators"], category: "wildlife" },
  { kind: "animal", slug: "flamingo", title: "Flamingo", aliases: ["flamingos"], category: "wildlife" },
];

export const KG_REGEX_PATTERNS: Array<{
  kind: KgEntityKind;
  slug: string;
  title: string;
  pattern: RegExp;
  category: string;
}> = [
  {
    kind: "location",
    slug: "vice-city",
    title: "Vice City",
    pattern: /\bvice\s+city\b/gi,
    category: "city",
  },
  {
    kind: "character",
    slug: "lucia",
    title: "Lucia",
    pattern: /\blucia\b/gi,
    category: "protagonist",
  },
  {
    kind: "character",
    slug: "jason",
    title: "Jason",
    pattern: /\bjason\b/gi,
    category: "protagonist",
  },
  {
    kind: "location",
    slug: "leonida",
    title: "Leonida",
    pattern: /\b(?:state\s+of\s+)?leonida\b/gi,
    category: "state",
  },
  {
    kind: "brand",
    slug: "rockstar-games",
    title: "Rockstar Games",
    pattern: /\brockstar\s+games?\b/gi,
    category: "studio",
  },
];
