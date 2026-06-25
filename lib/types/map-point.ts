export type MapPointType =
  | "location"
  | "business"
  | "safehouse"
  | "vehicle"
  | "weapon"
  | "easter_egg"
  | "collectible"
  | "wildlife"
  | "activity"
  | "mystery";

export type MapPointStatus = "draft" | "pending" | "published" | "rejected";

export interface MapPoint {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: MapPointType;
  district: string | null;
  lat: number;
  lng: number;
  image_url: string | null;
  spoiler: boolean;
  verified: boolean;
  status: MapPointStatus;
  source_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MapPointFormData {
  title: string;
  slug: string;
  description: string;
  type: MapPointType;
  district: string;
  lat: number;
  lng: number;
  image_url: string;
  spoiler: boolean;
  verified: boolean;
  status: MapPointStatus;
  source_url: string;
}

export const MAP_POINT_TYPE_LABELS: Record<MapPointType, string> = {
  location: "Location",
  business: "Business",
  safehouse: "Safehouse",
  vehicle: "Vehicle",
  weapon: "Weapon",
  easter_egg: "Easter Egg",
  collectible: "Collectible",
  wildlife: "Wildlife",
  activity: "Activity",
  mystery: "Mystery",
};

export const MAP_POINT_STATUS_LABELS: Record<MapPointStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  published: "Published",
  rejected: "Rejected",
};

/** Normalized map coordinates: lng = horizontal (0–100), lat = vertical (0–100). */
export const MAP_COORDINATE_MAX = 100;
