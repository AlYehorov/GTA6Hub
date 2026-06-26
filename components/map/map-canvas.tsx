"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import {
  createLeonidaCrs,
  LEONIDA_MAP_ATTRIBUTION,
  LEONIDA_MAP_CONFIG,
  LEONIDA_TILE_URL,
  leonidaLatLngBounds,
  percentToLeonidaCoords,
} from "@/lib/map/leonida-map";
import { MAP_TYPE_COLORS } from "@/lib/map/constants";
import type { MapPoint } from "@/lib/types/map-point";
import { MAP_POINT_TYPE_LABELS } from "@/lib/types/map-point";

interface MapCanvasProps {
  points: MapPoint[];
  spoilerMode: boolean;
  selectedId: string | null;
  onSelectPoint: (point: MapPoint) => void;
}

export function MapCanvas({ points, spoilerMode, selectedId, onSelectPoint }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;

      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) return;

      const crs = createLeonidaCrs(L);
      const bounds = leonidaLatLngBounds(L);

      const map = L.map(containerRef.current, {
        crs,
        minZoom: LEONIDA_MAP_CONFIG.minZoom,
        maxZoom: LEONIDA_MAP_CONFIG.maxZoom,
        maxBounds: bounds,
        maxBoundsViscosity: 0.85,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(LEONIDA_TILE_URL, {
        minZoom: LEONIDA_MAP_CONFIG.minZoom,
        maxZoom: LEONIDA_MAP_CONFIG.maxZoom,
        maxNativeZoom: LEONIDA_MAP_CONFIG.maxNativeZoom,
        tileSize: LEONIDA_MAP_CONFIG.tileSize,
        noWrap: true,
        bounds,
        attribution: LEONIDA_MAP_ATTRIBUTION,
      }).addTo(map);

      map.fitBounds(bounds);
      mapRef.current = map;
    }

    void initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;

    async function renderMarkers() {
      const L = (await import("leaflet")).default;
      const activeMap = mapRef.current;
      if (cancelled || !activeMap) return;

      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];

      for (const point of points) {
        const hidden = point.spoiler && !spoilerMode;
        const [lat, lng] = percentToLeonidaCoords(Number(point.lat), Number(point.lng));
        const color = MAP_TYPE_COLORS[point.type];
        const selected = selectedId === point.id;
        const label = hidden ? MAP_POINT_TYPE_LABELS[point.type] : point.title;

        const icon = L.divIcon({
          className: "leonida-map-marker",
          html: `<span class="leonida-map-marker__dot${selected ? " is-selected" : ""}${hidden ? " is-spoiler" : ""}" style="--marker-color:${color}"></span><span class="leonida-map-marker__label">${label}</span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(activeMap);
        marker.on("click", () => onSelectPoint(point));
        markersRef.current.push(marker);
      }
    }

    void renderMarkers();

    return () => {
      cancelled = true;
    };
  }, [points, spoilerMode, selectedId, onSelectPoint]);

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-white/10 bg-[#061018] shadow-2xl sm:rounded-2xl">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <p className="rounded-lg bg-black/60 px-4 py-2 text-sm text-white/50">
            No map points match your filters.
          </p>
        </div>
      )}
    </div>
  );
}
