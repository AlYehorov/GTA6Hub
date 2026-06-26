/** Community Leonida map (YANIS v13) — tiles by the GTA Mapping Community via State of Leonida. */
export const LEONIDA_MAP_ATTRIBUTION =
  'Map tiles © <a href="https://map.stateofleonida.net/" target="_blank" rel="noopener noreferrer">State of Leonida</a> / GTA Mapping Community';

export const LEONIDA_TILE_URL =
  "https://map.stateofleonida.net/tiles/YANIS/v13/normal/{z}/{x}/{y}.png";

export const LEONIDA_TILE_URL_DARK =
  "https://map.stateofleonida.net/tiles/YANIS/v13/dark/{z}/{x}/{y}.png";

export const LEONIDA_COMMUNITY_MAP_URL = "https://map.stateofleonida.net/?lang=en";

export const LEONIDA_MAP_BOUNDS = {
  south: -8000,
  west: -16500,
  north: 12000,
  east: 3500,
} as const;

export const LEONIDA_MAP_CONFIG = {
  originalSize: { width: 20000, height: 20000 },
  bounds: LEONIDA_MAP_BOUNDS,
  minZoom: 0,
  maxZoom: 8,
  maxNativeZoom: 6,
  tileSize: 256,
} as const;

/** Convert admin seed coords (0–100) to Leonida map coordinates. */
export function percentToLeonidaCoords(lat: number, lng: number): [number, number] {
  const { south, west, north, east } = LEONIDA_MAP_BOUNDS;
  const mapLat = south + (lat / 100) * (north - south);
  const mapLng = west + (lng / 100) * (east - west);
  return [mapLat, mapLng];
}

export function createLeonidaCrs(L: typeof import("leaflet")) {
  const { south, west, north, east } = LEONIDA_MAP_BOUNDS;
  const { width, height } = LEONIDA_MAP_CONFIG.originalSize;
  const { maxNativeZoom } = LEONIDA_MAP_CONFIG;
  const boundsWidth = east - west;
  const boundsHeight = north - south;
  const zoomFactor = Math.pow(2, maxNativeZoom);
  const pxPerUnitX = width / boundsWidth / zoomFactor;
  const pxPerUnitY = height / boundsHeight / zoomFactor;

  return L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(pxPerUnitX, -west * pxPerUnitX, -pxPerUnitY, north * pxPerUnitY),
    scale(zoom: number) {
      return Math.pow(2, zoom);
    },
    zoom(scale: number) {
      return Math.log(scale) / Math.LN2;
    },
  });
}

export function leonidaLatLngBounds(L: typeof import("leaflet")) {
  const { south, west, north, east } = LEONIDA_MAP_BOUNDS;
  return L.latLngBounds(L.latLng(south, west), L.latLng(north, east));
}
