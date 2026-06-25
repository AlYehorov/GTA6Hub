import type { MapPointType } from "@/lib/types/map-point";

/** Lightweight map point reference for article cross-linking (Sprint 6+). */
export interface ArticleRelatedMapPoint {
  id: string;
  title: string;
  slug: string;
  type: MapPointType;
  district: string | null;
  verified: boolean;
  spoiler: boolean;
}

/** Container for future related-content blocks on article pages. */
export interface ArticleRelatedContent {
  mapPoints: ArticleRelatedMapPoint[];
}
