import type { LeonidaLayerId, LeonidaMarker } from "@/lib/map/leonida-types";
import { LEONIDA_LAYER_COLORS } from "@/lib/map/leonida-types";

const LEONIDA_ORIGIN = "https://map.stateofleonida.net";
const GTADB_PHOTO_BASE = "https://map.gtadb.org/photos/6";

const KNOWN_CATEGORIES = new Set([
  "hotel",
  "residential",
  "landmark",
  "shop",
  "restaurant",
  "default",
]);

function categoryFromTags(tags: string[] | undefined): string {
  if (!tags?.length) return "default";
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (KNOWN_CATEGORIES.has(lower)) return lower;
  }
  return "default";
}

function landmarkPhotoUrl(id: string, kind: "ig" | "rl", version?: number | null): string | null {
  const path = `${GTADB_PHOTO_BASE}/${id},${kind}.jpg`;
  return version ? `${path}?v=${version}` : path;
}

function resolveLeonidaAssetUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${LEONIDA_ORIGIN}/${url.replace(/^\//, "")}`;
}

/** GTADB landmark rows: [name, [lng, lat], igSize, address, [rlLat, rlLng], rlSize, tags, colorHex, timestamps] */
export function parseLandmarkDatabase(data: Record<string, unknown>): LeonidaMarker[] {
  const markers: LeonidaMarker[] = [];

  for (const [id, raw] of Object.entries(data)) {
    if (!Array.isArray(raw)) continue;

    const [name, igCoords, igPhoto, address, rlCoords, rlPhoto, tags, colorHex, timestamps] = raw as [
      string,
      [number, number] | undefined,
      [number, number] | undefined,
      string | undefined,
      [number, number] | undefined,
      [number, number] | undefined,
      string[] | undefined,
      string | undefined,
      [number, number, number] | undefined,
    ];

    const hasIg = igCoords && igCoords.length >= 2;
    const hasRl = rlCoords && rlCoords.length >= 2;
    if (!hasIg && !hasRl) continue;

    const tagList = Array.isArray(tags) ? tags : [];
    const igVersion = timestamps?.[1] ?? null;
    const rlVersion = timestamps?.[2] ?? null;

    markers.push({
      id: `landmark_${id}`,
      name: name || address || "Unknown location",
      lat: hasIg ? igCoords![1] : rlCoords![0],
      lng: hasIg ? igCoords![0] : rlCoords![1],
      layer: "landmarks",
      category: categoryFromTags(tagList),
      tags: tagList,
      color: colorHex ? `#${colorHex}` : LEONIDA_LAYER_COLORS.landmarks,
      realLife: {
        address: address ?? null,
        photo:
          rlPhoto && rlPhoto.length >= 2
            ? { url: landmarkPhotoUrl(id, "rl", rlVersion) ?? "", width: rlPhoto[0], height: rlPhoto[1] }
            : null,
      },
      igPhoto:
        igPhoto && igPhoto.length >= 2
          ? { url: landmarkPhotoUrl(id, "ig", igVersion) ?? "", width: igPhoto[0], height: igPhoto[1] }
          : null,
      source: "map.gtadb.org",
    });
  }

  return markers;
}

function parseLocalEntry(
  id: string,
  entry: Record<string, unknown>,
  layer: Exclude<LeonidaLayerId, "hub" | "landmarks">
): LeonidaMarker | null {
  const position = entry.position as { lat?: number; lng?: number } | undefined;
  const lat = typeof entry.lat === "number" ? entry.lat : position?.lat;
  const lng = typeof entry.lng === "number" ? entry.lng : position?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const tags = Array.isArray(entry.tags) ? (entry.tags as string[]) : [];
  const igPhotoRaw = entry.igPhoto as { url?: string; credit?: string } | undefined;
  const realLifeRaw = entry.realLife as
    | { name?: string; address?: string; photo?: { url?: string } }
    | undefined;

  return {
    id: `${layer}_${String(entry.id ?? id)}`,
    name: String(entry.name ?? "Unknown"),
    lat,
    lng,
    layer,
    category: String(entry.category ?? categoryFromTags(tags)),
    tags,
    color: typeof entry.color === "string" ? entry.color : LEONIDA_LAYER_COLORS[layer],
    description: typeof entry.description === "string" ? entry.description : null,
    igPhoto: igPhotoRaw?.url
      ? {
          url: resolveLeonidaAssetUrl(igPhotoRaw.url),
          credit: igPhotoRaw.credit ?? null,
        }
      : null,
    realLife: realLifeRaw
      ? {
          name: realLifeRaw.name ?? null,
          address: realLifeRaw.address ?? null,
          photo: realLifeRaw.photo?.url
            ? { url: resolveLeonidaAssetUrl(realLifeRaw.photo.url) }
            : null,
        }
      : null,
    source: "State of Leonida",
  };
}

/** Trailer / leak / screenshot JSON — object map or array. */
export function parseLocalJsonDatabase(
  data: unknown,
  layer: Exclude<LeonidaLayerId, "hub" | "landmarks">
): LeonidaMarker[] {
  if (Array.isArray(data)) {
    return data
      .map((entry, index) =>
        parseLocalEntry(String(index), entry as Record<string, unknown>, layer)
      )
      .filter((marker): marker is LeonidaMarker => marker !== null);
  }

  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([id, entry]) => parseLocalEntry(id, entry as Record<string, unknown>, layer))
      .filter((marker): marker is LeonidaMarker => marker !== null);
  }

  return [];
}
