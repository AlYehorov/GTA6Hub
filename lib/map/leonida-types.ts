export type LeonidaLayerId =
  | "landmarks"
  | "trailer1"
  | "trailer2"
  | "screenshots"
  | "leaks"
  | "hub";

export interface LeonidaMarkerPhoto {
  url: string;
  credit?: string | null;
  width?: number;
  height?: number;
}

export interface LeonidaMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  layer: LeonidaLayerId;
  category: string;
  tags: string[];
  color: string;
  description?: string | null;
  igPhoto?: LeonidaMarkerPhoto | null;
  realLife?: {
    address?: string | null;
    name?: string | null;
    photo?: LeonidaMarkerPhoto | null;
  } | null;
  source?: string | null;
}

export interface LeonidaLayerMeta {
  id: LeonidaLayerId;
  label: string;
  color: string;
  count: number;
}

export const LEONIDA_LAYER_COLORS: Record<Exclude<LeonidaLayerId, "hub">, string> = {
  landmarks: "#2196F3",
  trailer1: "#00de85",
  trailer2: "#2196F3",
  screenshots: "#E91E63",
  leaks: "#FFC107",
};

export const LEONIDA_LAYER_LABELS: Record<Exclude<LeonidaLayerId, "hub">, string> = {
  landmarks: "Landmarks",
  trailer1: "Trailer 1",
  trailer2: "Trailer 2",
  screenshots: "Screenshots",
  leaks: "Leaks",
};
