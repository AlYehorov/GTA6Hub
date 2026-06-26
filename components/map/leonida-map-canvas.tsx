"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import type { LayerGroup, Map as LeafletMap, Marker as LeafletMarker, TileLayer } from "leaflet";
import {
  createLeonidaCrs,
  LEONIDA_MAP_ATTRIBUTION,
  LEONIDA_MAP_CONFIG,
  LEONIDA_TILE_URL,
  LEONIDA_TILE_URL_DARK,
  leonidaLatLngBounds,
  percentToLeonidaCoords,
} from "@/lib/map/leonida-map";
import type { LeonidaLayerId, LeonidaMarker } from "@/lib/map/leonida-types";
import type { MapTileScheme } from "@/components/map/map-scheme-toggle";
import { MAP_TYPE_COLORS } from "@/lib/map/constants";
import type { MapPoint } from "@/lib/types/map-point";
import { MAP_POINT_TYPE_LABELS } from "@/lib/types/map-point";

interface MarkerClusterLayer extends LayerGroup {
  addLayers(layers: LeafletMarker[]): this;
  clearLayers(): this;
}

export type MapSelection =
  | { kind: "community"; marker: LeonidaMarker }
  | { kind: "hub"; point: MapPoint };

interface LeonidaMapCanvasProps {
  communityMarkers: LeonidaMarker[];
  hubPoints: MapPoint[];
  activeLayers: Set<LeonidaLayerId>;
  spoilerMode: boolean;
  scheme: MapTileScheme;
  selected: MapSelection | null;
  onSelect: (selection: MapSelection | null) => void;
  showMarkerLabels?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function refreshMapSize(map: LeafletMap) {
  map.invalidateSize({ pan: false });
}

export function LeonidaMapCanvas({
  communityMarkers,
  hubPoints,
  activeLayers,
  spoilerMode,
  scheme,
  selected,
  onSelect,
  showMarkerLabels = true,
}: LeonidaMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const clusterRef = useRef<MarkerClusterLayer | null>(null);
  const hubMarkersRef = useRef<LeafletMarker[]>([]);
  const onSelectRef = useRef(onSelect);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let map: LeafletMap | null = null;

    try {
      const crs = createLeonidaCrs(L);
      const bounds = leonidaLatLngBounds(L);

      map = L.map(container, {
        crs,
        minZoom: LEONIDA_MAP_CONFIG.minZoom,
        maxZoom: LEONIDA_MAP_CONFIG.maxZoom,
        maxBounds: bounds,
        maxBoundsViscosity: 0.85,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
      });

      const tileLayer = L.tileLayer(LEONIDA_TILE_URL, {
        minZoom: LEONIDA_MAP_CONFIG.minZoom,
        maxZoom: LEONIDA_MAP_CONFIG.maxZoom,
        maxNativeZoom: LEONIDA_MAP_CONFIG.maxNativeZoom,
        tileSize: LEONIDA_MAP_CONFIG.tileSize,
        noWrap: true,
        bounds,
        attribution: LEONIDA_MAP_ATTRIBUTION,
        crossOrigin: true,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

      const clusterFactory = (
        L as typeof L & { markerClusterGroup?: (options?: object) => MarkerClusterLayer }
      ).markerClusterGroup;

      const cluster = clusterFactory
        ? clusterFactory({
            chunkedLoading: true,
            chunkInterval: 80,
            chunkDelay: 30,
            maxClusterRadius: 56,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            disableClusteringAtZoom: 7,
          })
        : L.layerGroup();

      map.addLayer(cluster);
      map.fitBounds(bounds);

      mapRef.current = map;
      tileLayerRef.current = tileLayer;
      clusterRef.current = cluster as MarkerClusterLayer;

      const syncSize = () => {
        if (map) refreshMapSize(map);
      };

      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(container);

      map.whenReady(() => {
        if (disposed || !map) return;
        syncSize();
        map.fitBounds(bounds);
        setMapReady(true);
      });

      window.setTimeout(syncSize, 0);
      window.setTimeout(syncSize, 120);
      window.setTimeout(syncSize, 400);

      const onResize = () => syncSize();
      window.addEventListener("resize", onResize);

      return () => {
        disposed = true;
        window.removeEventListener("resize", onResize);
        resizeObserver?.disconnect();
        clusterRef.current?.clearLayers();
        clusterRef.current = null;
        hubMarkersRef.current.forEach((marker) => marker.remove());
        hubMarkersRef.current = [];
        if (map) {
          map.remove();
          map = null;
        }
        mapRef.current = null;
        tileLayerRef.current = null;
        setMapReady(false);
      };
    } catch (error) {
      console.error("Leonida map init failed:", error);
      setMapError("Map failed to load. Please refresh the page.");
      return undefined;
    }
  }, []);

  useEffect(() => {
    const tileLayer = tileLayerRef.current;
    if (!tileLayer) return;
    tileLayer.setUrl(scheme === "dark" ? LEONIDA_TILE_URL_DARK : LEONIDA_TILE_URL);
  }, [scheme]);

  useEffect(() => {
    if (!mapReady) return;

    const cluster = clusterRef.current;
    if (!cluster) return;

    let cancelled = false;
    const visible = communityMarkers.filter((marker) => activeLayers.has(marker.layer));

    const render = () => {
      if (cancelled || !clusterRef.current) return;

      clusterRef.current.clearLayers();
      const layers: LeafletMarker[] = [];

      for (const marker of visible) {
        const isSelected =
          selected?.kind === "community" && selected.marker.id === marker.id;

        const icon = L.divIcon({
          className: "leonida-map-marker",
          html: `<span class="leonida-map-marker__dot${isSelected ? " is-selected" : ""}" style="--marker-color:${marker.color}"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const leafletMarker = L.marker([marker.lat, marker.lng], { icon });
        leafletMarker.on("click", () => onSelectRef.current({ kind: "community", marker }));
        layers.push(leafletMarker);
      }

      for (const layer of layers) {
        clusterRef.current?.addLayer(layer);
      }
    };

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
    const idleId = idle(render);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId as number);
      }
    };
  }, [communityMarkers, activeLayers, selected, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    let cancelled = false;
    const mapInstance = mapRef.current;

    const render = () => {
      if (cancelled) return;

      for (const marker of hubMarkersRef.current) {
        marker.remove();
      }
      hubMarkersRef.current = [];

      if (!activeLayers.has("hub")) return;

      for (const point of hubPoints) {
        const hidden = point.spoiler && !spoilerMode;
        const [lat, lng] = percentToLeonidaCoords(Number(point.lat), Number(point.lng));
        const color = MAP_TYPE_COLORS[point.type];
        const isSelected = selected?.kind === "hub" && selected.point.id === point.id;
        const label = hidden ? MAP_POINT_TYPE_LABELS[point.type] : point.title;
        const labelHtml =
          showMarkerLabels && !hidden
            ? `<span class="leonida-map-marker__label">${escapeHtml(label)}</span>`
            : "";

        const icon = L.divIcon({
          className: "leonida-map-marker",
          html: `<span class="leonida-map-marker__dot${isSelected ? " is-selected" : ""}${hidden ? " is-spoiler" : ""}" style="--marker-color:${color}"></span>${labelHtml}`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const leafletMarker = L.marker([lat, lng], { icon, zIndexOffset: 500 }).addTo(mapInstance);
        leafletMarker.on("click", () => onSelectRef.current({ kind: "hub", point }));
        hubMarkersRef.current.push(leafletMarker);
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [hubPoints, activeLayers, spoilerMode, selected, mapReady, showMarkerLabels]);

  useEffect(() => {
    const activeMap = mapRef.current;
    if (!activeMap || !selected) return;

    const [lat, lng] =
      selected.kind === "community"
        ? [selected.marker.lat, selected.marker.lng]
        : percentToLeonidaCoords(Number(selected.point.lat), Number(selected.point.lng));

    activeMap.panTo([lat, lng], { animate: true });
  }, [selected]);

  return (
    <div className="leonida-map-shell relative h-full w-full min-h-0 overflow-hidden bg-[#061018]">
      <div ref={containerRef} className="leonida-map-container absolute inset-0 z-0" />
      {mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-white/60">
          {mapError}
        </div>
      )}
    </div>
  );
}
