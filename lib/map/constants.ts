import type { MapPointType } from "@/lib/types/map-point";

export const MAP_PLACEHOLDER_IMAGE = "/map/leonida-placeholder.svg";

export const MAP_TYPE_COLORS: Record<MapPointType, string> = {
  location: "#ff6b9d",
  business: "#ffb347",
  safehouse: "#6bcb77",
  vehicle: "#4dabf7",
  weapon: "#ff8787",
  easter_egg: "#da77f2",
  collectible: "#ffd43b",
  wildlife: "#63e6be",
  activity: "#74c0fc",
  mystery: "#adb5bd",
};
