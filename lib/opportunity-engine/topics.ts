export interface TopicClusterDef {
  key: string;
  title: string;
  keywords: string[];
  contentType: string;
  articleType: "news" | "guide";
  targetKeyword: string;
  evergreen?: boolean;
}

export const TOPIC_CLUSTERS: TopicClusterDef[] = [
  {
    key: "trailer-2-details",
    title: "Trailer 2 Hidden Details You Missed",
    keywords: [
      "trailer 2",
      "second trailer",
      "new trailer",
      "trailer two",
      "hidden detail",
      "easter egg",
      "frame",
    ],
    contentType: "trailer_breakdown",
    articleType: "news",
    targetKeyword: "GTA 6 trailer 2 hidden details",
  },
  {
    key: "pricing",
    title: "Everything We Know About GTA VI Pricing",
    keywords: [
      "pricing",
      "price",
      "cost",
      "pre-order",
      "preorder",
      "pre order",
      "collector edition",
      "ultimate edition",
      "$",
      "how much",
    ],
    contentType: "faq_article",
    articleType: "guide",
    targetKeyword: "GTA 6 price pre order",
    evergreen: true,
  },
  {
    key: "vice-city-airport",
    title: "Vice City Airport Analysis",
    keywords: [
      "airport",
      "vice city airport",
      "international airport",
      "flight",
      "plane",
    ],
    contentType: "location_update",
    articleType: "guide",
    targetKeyword: "GTA 6 Vice City airport",
  },
  {
    key: "lucia",
    title: "Everything We Know About Lucia",
    keywords: ["lucia", "protagonist", "female lead"],
    contentType: "character_update",
    articleType: "guide",
    targetKeyword: "GTA 6 Lucia",
    evergreen: true,
  },
  {
    key: "jason",
    title: "Jason in GTA 6: Confirmed Facts vs Theories",
    keywords: ["jason", "male lead", "co-protagonist"],
    contentType: "character_update",
    articleType: "guide",
    targetKeyword: "GTA 6 Jason",
    evergreen: true,
  },
  {
    key: "release-date",
    title: "GTA VI Release Window Explained",
    keywords: [
      "release date",
      "release window",
      "launch date",
      "when is gta 6",
      "coming out",
      "2025",
      "2026",
    ],
    contentType: "timeline_update",
    articleType: "news",
    targetKeyword: "GTA 6 release date",
    evergreen: true,
  },
  {
    key: "vehicles",
    title: "All GTA 6 Vehicles Seen So Far",
    keywords: [
      "vehicle",
      "car",
      "cars",
      "supercar",
      "motorcycle",
      "boat",
      "helicopter",
    ],
    contentType: "vehicle_list_update",
    articleType: "guide",
    targetKeyword: "GTA 6 vehicles list",
    evergreen: true,
  },
  {
    key: "map-locations",
    title: "All Confirmed GTA 6 Locations",
    keywords: [
      "vice city",
      "leonida",
      "map",
      "location",
      "keys",
      "ambrosia",
      "port gellhorn",
      "grassrivers",
    ],
    contentType: "location_update",
    articleType: "guide",
    targetKeyword: "GTA 6 map locations",
    evergreen: true,
  },
  {
    key: "multiplayer",
    title: "GTA 6 Multiplayer: What We Know",
    keywords: ["multiplayer", "online", "gta online", "co-op", "coop"],
    contentType: "faq_article",
    articleType: "guide",
    targetKeyword: "GTA 6 multiplayer",
    evergreen: true,
  },
  {
    key: "collector-edition",
    title: "GTA 6 Collector Edition Guide",
    keywords: ["collector", "collectors edition", "physical edition", "bonus"],
    contentType: "faq_article",
    articleType: "guide",
    targetKeyword: "GTA 6 collector edition",
  },
  {
    key: "customization",
    title: "GTA 6 Vehicle Customization Explained",
    keywords: ["customization", "customize", "mods", "tuning", "paint"],
    contentType: "analysis",
    articleType: "guide",
    targetKeyword: "GTA 6 vehicle customization",
    evergreen: true,
  },
  {
    key: "ammu-nation",
    title: "Ammu-Nation in GTA 6: What to Expect",
    keywords: ["ammu-nation", "ammunation", "weapons shop", "gun store"],
    contentType: "entity_page_update",
    articleType: "guide",
    targetKeyword: "GTA 6 Ammu-Nation",
    evergreen: true,
  },
];

export const TRENDING_TERMS = [
  "lucia",
  "vice city",
  "trailer 2",
  "trailer",
  "pre order",
  "pre-order",
  "collector edition",
  "leonida",
  "jason",
  "release date",
  "pricing",
  "airport",
  "vehicles",
  "multiplayer",
  "rockstar",
  "gta vi",
  "gta 6",
] as const;

const SPAM_PATTERNS = [
  /free\s+v-?bucks/i,
  /casino/i,
  /crypto/i,
  /giveaway/i,
  /click\s+here/i,
  /telegram/i,
  /discord\.gg/i,
];

export function isSpamText(text: string): boolean {
  return SPAM_PATTERNS.some((p) => p.test(text));
}

export function matchTopicKeys(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const cluster of TOPIC_CLUSTERS) {
    if (cluster.keywords.some((kw) => lower.includes(kw))) {
      matched.push(cluster.key);
    }
  }
  return matched;
}

export function primaryTopicKey(topicKeys: string[]): string | null {
  if (topicKeys.length === 0) return null;
  const priority = TOPIC_CLUSTERS.map((c) => c.key);
  for (const key of priority) {
    if (topicKeys.includes(key)) return key;
  }
  return topicKeys[0] ?? null;
}

export function topicDefForKey(key: string): TopicClusterDef | undefined {
  return TOPIC_CLUSTERS.find((c) => c.key === key);
}

export function parseViewCount(text: string): number {
  const patterns = [
    /([\d,.]+)\s*[Mm]\s*views?/i,
    /([\d,.]+)\s*[Kk]\s*views?/i,
    /([\d,.]+)\s*views?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const raw = match[1].replace(/,/g, "");
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) continue;
    if (/[Mm]/.test(match[0])) return Math.round(num * 1_000_000);
    if (/[Kk]/.test(match[0])) return Math.round(num * 1_000);
    return Math.round(num);
  }
  return 0;
}
