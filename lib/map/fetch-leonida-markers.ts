import { unstable_cache } from "next/cache";
import { parseLandmarkDatabase, parseLocalJsonDatabase } from "@/lib/map/leonida-parsers";
import type { LeonidaLayerMeta, LeonidaMarker } from "@/lib/map/leonida-types";
import { LEONIDA_LAYER_COLORS, LEONIDA_LAYER_LABELS } from "@/lib/map/leonida-types";

const LEONIDA_ORIGIN = "https://map.stateofleonida.net";

const LOCAL_DATABASES = [
  { layer: "trailer1" as const, file: "data/trailer1.json" },
  { layer: "trailer2" as const, file: "data/trailer2.json" },
  { layer: "screenshots" as const, file: "data/screenshots.json" },
  { layer: "leaks" as const, file: "data/leaks.json" },
] as const;

async function fetchLeonidaJson<T>(path: string): Promise<T> {
  const response = await fetch(`${LEONIDA_ORIGIN}/${path}`, {
    headers: { Referer: `${LEONIDA_ORIGIN}/` },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Leonida fetch failed (${response.status}): ${path}`);
  }

  return response.json() as Promise<T>;
}

async function loadLeonidaMarkersUncached(): Promise<{
  markers: LeonidaMarker[];
  layers: LeonidaLayerMeta[];
}> {
  const [landmarksRaw, ...localResults] = await Promise.all([
    fetchLeonidaJson<Record<string, unknown>>("proxy.php"),
    ...LOCAL_DATABASES.map(async ({ layer, file }) => ({
      layer,
      data: await fetchLeonidaJson<unknown>(file),
    })),
  ]);

  const landmarks = parseLandmarkDatabase(landmarksRaw);
  const localMarkers = localResults.flatMap(({ layer, data }) =>
    parseLocalJsonDatabase(data, layer)
  );
  const markers = [...landmarks, ...localMarkers];

  const layers: LeonidaLayerMeta[] = [
    {
      id: "landmarks",
      label: LEONIDA_LAYER_LABELS.landmarks,
      color: LEONIDA_LAYER_COLORS.landmarks,
      count: landmarks.length,
    },
    ...LOCAL_DATABASES.map(({ layer }) => ({
      id: layer,
      label: LEONIDA_LAYER_LABELS[layer],
      color: LEONIDA_LAYER_COLORS[layer],
      count: localMarkers.filter((marker) => marker.layer === layer).length,
    })),
  ];

  return { markers, layers };
}

export const getLeonidaMarkers = unstable_cache(
  loadLeonidaMarkersUncached,
  ["leonida-map-markers"],
  { revalidate: 3600, tags: ["leonida-map"] }
);
