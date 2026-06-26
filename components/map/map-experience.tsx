"use client";

import dynamic from "next/dynamic";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MapSelection } from "@/components/map/leonida-map-canvas";
import { LeonidaLayerFilters } from "@/components/map/leonida-layer-filters";
import { LeonidaMarkerPanel } from "@/components/map/leonida-marker-panel";
import { MapPointDrawer } from "@/components/map/map-point-drawer";
import { MapSchemeToggle, type MapTileScheme } from "@/components/map/map-scheme-toggle";
import { MapSearch } from "@/components/map/map-search";
import { MapSheetHandle } from "@/components/map/map-sheet-handle";
import { SpoilerToggle } from "@/components/map/spoiler-toggle";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { getSavedLocationIds } from "@/lib/actions/saved-content";
import type { LeonidaLayerId, LeonidaLayerMeta, LeonidaMarker } from "@/lib/map/leonida-types";
import type { MapPoint } from "@/lib/types/map-point";
import { cn } from "@/lib/utils";

const LeonidaMapCanvas = dynamic(
  () => import("@/components/map/leonida-map-canvas").then((mod) => mod.LeonidaMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-0 w-full items-center justify-center bg-[#061018] text-sm text-white/40">
        Loading map…
      </div>
    ),
  }
);

interface MapExperienceProps {
  communityMarkers: LeonidaMarker[];
  communityLayers: LeonidaLayerMeta[];
  hubPoints: MapPoint[];
}

function MapFiltersPanel({
  search,
  onSearchChange,
  hubPoints,
  spoilerMode,
  onSpoilerChange,
  spoilerCount,
  communityLayers,
  hubPointsCount,
  activeLayers,
  onToggleLayer,
  visibleCount,
  compact,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  hubPoints: MapPoint[];
  spoilerMode: boolean;
  onSpoilerChange: (value: boolean) => void;
  spoilerCount: number;
  communityLayers: LeonidaLayerMeta[];
  hubPointsCount: number;
  activeLayers: Set<LeonidaLayerId>;
  onToggleLayer: (layer: LeonidaLayerId) => void;
  visibleCount: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <MapSearch value={search} onChange={onSearchChange} />
        {hubPoints.length > 0 && (
          <SpoilerToggle
            enabled={spoilerMode}
            onChange={onSpoilerChange}
            spoilerCount={spoilerCount}
          />
        )}
      </div>

      <LeonidaLayerFilters
        layers={communityLayers}
        hubCount={hubPointsCount}
        activeLayers={activeLayers}
        onToggleLayer={onToggleLayer}
        compact={compact}
      />

      <p className="text-xs text-white/40">
        {visibleCount.toLocaleString()} locations on the map
      </p>
    </div>
  );
}

export function MapExperience({
  communityMarkers,
  communityLayers,
  hubPoints,
}: MapExperienceProps) {
  const isMobile = useIsMobile();
  const [scheme, setScheme] = useState<MapTileScheme>("normal");
  const [search, setSearch] = useState("");
  const [spoilerMode, setSpoilerMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<MapSelection | null>(null);
  const [savedLocationIds, setSavedLocationIds] = useState<Set<string>>(new Set());
  const [activeLayers, setActiveLayers] = useState<Set<LeonidaLayerId>>(
    () => new Set([...communityLayers.map((layer) => layer.id), ...(hubPoints.length ? (["hub"] as const) : [])])
  );

  const hasSelection = selected !== null;
  const overlayOpen = isMobile && (filtersOpen || hasSelection);
  const selectedHubPointId =
    selected?.kind === "hub" ? selected.point.id : null;

  useEffect(() => {
    void getSavedLocationIds().then((ids) => setSavedLocationIds(new Set(ids)));
  }, [selectedHubPointId]);

  useEffect(() => {
    if (!isMobile || !overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobile, overlayOpen]);

  const filteredCommunity = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return communityMarkers;
    return communityMarkers.filter((marker) => {
      return (
        marker.name.toLowerCase().includes(q) ||
        marker.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (marker.realLife?.address?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [communityMarkers, search]);

  const filteredHub = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hubPoints.filter((point) => {
      if (!q) return true;
      return (
        point.title.toLowerCase().includes(q) ||
        point.description.toLowerCase().includes(q) ||
        (point.district?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [hubPoints, search]);

  const visibleCount = useMemo(() => {
    const community = filteredCommunity.filter((marker) => activeLayers.has(marker.layer)).length;
    const hub = activeLayers.has("hub") ? filteredHub.length : 0;
    return community + hub;
  }, [filteredCommunity, filteredHub, activeLayers]);

  const spoilerCount = hubPoints.filter((point) => point.spoiler).length;

  function toggleLayer(layer: LeonidaLayerId) {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        if (next.size === 1) return prev;
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  }

  function handleSelect(selection: MapSelection | null) {
    setSelected(selection);
    if (selection) setFiltersOpen(false);
  }

  const selectedCommunity = selected?.kind === "community" ? selected.marker : null;
  const selectedHub = selected?.kind === "hub" ? selected.point : null;

  const filtersPanelProps = {
    search,
    onSearchChange: setSearch,
    hubPoints,
    spoilerMode,
    onSpoilerChange: setSpoilerMode,
    spoilerCount,
    communityLayers,
    hubPointsCount: hubPoints.length,
    activeLayers,
    onToggleLayer: toggleLayer,
    visibleCount,
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-0 bg-[#061018]",
        isMobile ? "map-mobile-mode" : "pt-[calc(4.75rem+env(safe-area-inset-top))]"
      )}
    >
      <div
        className={cn(
          "relative h-full w-full min-h-0",
          isMobile && "pt-[calc(4.75rem+env(safe-area-inset-top))]"
        )}
      >
        <LeonidaMapCanvas
          communityMarkers={filteredCommunity}
          hubPoints={filteredHub}
          activeLayers={activeLayers}
          spoilerMode={spoilerMode}
          scheme={scheme}
          selected={selected}
          onSelect={handleSelect}
          showMarkerLabels={!isMobile}
        />
      </div>

      {/* Desktop controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden flex-col gap-3 p-3 sm:p-4 lg:flex">
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <MapSchemeToggle scheme={scheme} onChange={setScheme} />
        </div>

        <div className="pointer-events-auto max-w-4xl">
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/75 p-3 backdrop-blur-md">
            <MapFiltersPanel {...filtersPanelProps} />
          </div>
        </div>
      </div>

      {/* Mobile top-right: day/night */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:hidden">
        <MapSchemeToggle
          scheme={scheme}
          onChange={setScheme}
          compact
          className="pointer-events-auto"
        />
      </div>

      {/* Mobile bottom toolbar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-black/85 p-2 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors",
              filtersOpen
                ? "bg-gta-pink/15 text-gta-pink"
                : "bg-white/5 text-white/80 hover:bg-white/10"
            )}
          >
            {filtersOpen ? <X className="size-4" /> : <SlidersHorizontal className="size-4" />}
            Filters
          </button>
          <span className="shrink-0 rounded-xl bg-white/5 px-3 py-2.5 text-xs text-white/55">
            {visibleCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Mobile filters sheet */}
      {isMobile && filtersOpen && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[min(78dvh,640px)] flex-col rounded-t-2xl border-t border-white/10 bg-[#0a0a0a]/98 pb-safe supports-[backdrop-filter]:bg-[#0a0a0a]/95 supports-[backdrop-filter]:backdrop-blur-xl lg:hidden">
            <MapSheetHandle />
            <div className="flex items-center justify-between border-b border-white/10 px-4 pb-3">
              <h2 className="font-heading text-base font-semibold text-white">Map filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white/50 hover:bg-white/10"
                aria-label="Close filters"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <MapFiltersPanel {...filtersPanelProps} compact />
            </div>
          </div>
        </>
      )}

      <LeonidaMarkerPanel marker={selectedCommunity} onClose={() => handleSelect(null)} />

      {selectedHub && (
        <MapPointDrawer
          point={selectedHub}
          spoilerMode={spoilerMode}
          onClose={() => handleSelect(null)}
          locationSaved={savedLocationIds.has(selectedHub.id)}
        />
      )}
    </div>
  );
}
