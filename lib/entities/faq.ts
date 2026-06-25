import type { EntityFaqItem, GameEntity, GameEntityKind } from "@/lib/types/game-entity";

const GLOBAL_FAQS: EntityFaqItem[] = [
  {
    question: "Where is Vice City located?",
    answer:
      "Vice City is set in the state of Leonida, inspired by Florida. It sits along the Atlantic coast with beaches, downtown skylines, and keys extending south into the ocean.",
  },
  {
    question: "How large is Leonida?",
    answer:
      "Rockstar has described Leonida as the biggest and most immersive GTA map to date, spanning Vice City, the Keys, swamplands, and rural mainland regions.",
  },
  {
    question: "Who is Jason?",
    answer:
      "Jason is one of GTA VI's protagonists, partnered with Lucia. Trailer footage shows him involved in heists, chases, and survival across Leonida.",
  },
  {
    question: "Can you own businesses in GTA 6?",
    answer:
      "Trailers and previews suggest business ownership and criminal enterprise mechanics return in Leonida, though full details are unconfirmed until launch.",
  },
];

const KIND_FAQS: Partial<Record<GameEntityKind, EntityFaqItem[]>> = {
  locations: [
    {
      question: "What regions are in GTA 6?",
      answer:
        "Known regions include Vice City, the Leonida Keys, Port Gellhorn, Ambrosia, and Mount Kalaga — each with distinct biomes and gameplay.",
    },
  ],
  characters: [
    {
      question: "Who are the GTA 6 protagonists?",
      answer:
        "Lucia and Jason are the confirmed playable duo, with supporting characters like Raul Bautista and Boobie Ike appearing in trailers.",
    },
  ],
  vehicles: [
    {
      question: "What vehicles are in GTA 6?",
      answer:
        "Expect cars, boats, airboats, police cruisers, and aircraft across Vice City and the Leonida wetlands.",
    },
  ],
  animals: [
    {
      question: "What wildlife is in GTA 6?",
      answer:
        "Leonida features alligators, flamingos, sharks, and other wildlife integrated into the open world and ambient ecosystems.",
    },
  ],
  businesses: [
    {
      question: "How do businesses work in GTA 6?",
      answer:
        "Businesses may generate income and tie into the criminal economy — track progress on GTA6Hub as details are confirmed.",
    },
  ],
};

function entitySpecificFaqs(entity: GameEntity, kind: GameEntityKind): EntityFaqItem[] {
  return [
    {
      question: `What is ${entity.title} in GTA 6?`,
      answer: entity.description || `${entity.title} is part of the GTA VI knowledge base on GTA6Hub.`,
    },
    {
      question: `Where can I find ${entity.title}?`,
      answer: `${entity.title} is associated with ${entity.category} content across Leonida. Check the map and tracker for related discoveries.`,
    },
    {
      question: `Is ${entity.title} confirmed for GTA 6?`,
      answer: `Information about ${entity.title} is compiled from official trailers, previews, and community-verified sources. Details may change before launch.`,
    },
  ];
}

export function generateEntityFaqs(entity: GameEntity, kind: GameEntityKind): EntityFaqItem[] {
  const kindFaqs = KIND_FAQS[kind] ?? [];
  const specific = entitySpecificFaqs(entity, kind);

  const combined = [...specific, ...kindFaqs, ...GLOBAL_FAQS];
  const seen = new Set<string>();
  const unique: EntityFaqItem[] = [];

  for (const faq of combined) {
    if (seen.has(faq.question)) continue;
    seen.add(faq.question);
    unique.push(faq);
  }

  return unique.slice(0, 6);
}
