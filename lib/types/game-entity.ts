export type GameEntityStatus = "draft" | "published";

export type GameEntityKind =
  | "locations"
  | "characters"
  | "vehicles"
  | "weapons"
  | "businesses"
  | "animals"
  | "collectibles"
  | "missions";

export interface GameEntity {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  seo_title: string | null;
  seo_description: string | null;
  status: GameEntityStatus;
  created_at: string;
  updated_at: string;
}

export interface EntityFaqItem {
  question: string;
  answer: string;
}

export interface RelatedLink {
  title: string;
  href: string;
  type: string;
}

export interface EntityPageData {
  entity: GameEntity;
  faqs: EntityFaqItem[];
  relatedArticles: RelatedLink[];
  relatedGuides: RelatedLink[];
  relatedTracker: RelatedLink[];
  relatedEntities: RelatedLink[];
}
