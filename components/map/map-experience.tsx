"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, Globe2 } from "lucide-react";
import { MapCanvas } from "@/components/map/map-canvas";
import { LeonidaCommunityMap } from "@/components/map/leonida-community-map";
import { MapFilters } from "@/components/map/map-filters";
import { MapSearch } from "@/components/map/map-search";
import { MapPointDrawer } from "@/components/map/map-point-drawer";
import { MapSchemeToggle, type MapTileScheme } from "@/components/map/map-scheme-toggle";
import { SpoilerToggle } from "@/components/map/spoiler-toggle";
import { getSavedLocationIds } from "@/lib/actions/saved-content";
import { LEONIDA_COMMUNITY_MAP_URL } from "@/lib/map/leonida-map";
import type { MapPoint, MapPointType } from "@/lib/types/map-point";
import { MAP_POINT_TYPE_LABELS } from "@/lib/types/map-point";
import { cn } from "@/lib/utils";

interface MapExperienceProps {
  points: MapPoint[];
}

type MapView = "community" | "guide";

const ALL_TYPES = Object.keys(MAP_POINT_TYPE_LABELS) as MapPointType[];

export function MapExperience({ points }: MapExperienceProps) {
  const [view, setView] = useState<MapView>("community");
  const [scheme, setScheme] = useState<MapTileScheme>("normal");
  const [search, setSearch] = useState("");
  const [spoilerMode, setSpoilerMode] = useState(false);
  const [activeTypes, setActiveTypes] = useState<Set<MapPointType>>(new Set(ALL_TYPES));
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [savedLocationIds, setSavedLocationIds] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    void getSavedLocationIds().then((ids) => setSavedLocationIds(new Set(ids)));
  }, [selected?.id]);

  const districts = useMemo(
    () => [...new Set(points.map((p) => p.district).filter(Boolean))].sort() as string[],
    [points]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return points.filter((point) => {
      if (!activeTypes.has(point.type)) return false;
      if (activeDistrict && point.district !== activeDistrict) return false;
      if (!q) return true;
      return (
        point.title.toLowerCase().includes(q) ||
        point.description.toLowerCase().includes(q) ||
        (point.district?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [points, activeTypes, activeDistrict, search]);

  const spoilerCount = points.filter((p) => p.spoiler).length;

  function toggleType(type: MapPointType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size === 1) return prev;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function handleSelect(point: MapPoint) {
    setSelected((current) => (current?.id === point.id ? null : point));
    setPanelOpen(true);
  }

  return (
    <div className="relative h-[calc(100dvh-4rem)] min-h-[520px] w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        {view === "community" ? (
          <LeonidaCommunityMap />
        ) : (
          <MapCanvas
            points={filtered}
            spoilerMode={spoilerMode}
            selectedId={selected?.id ?? null}
            scheme={scheme}
            onSelectPoint={handleSelect}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-xl border border-white/10 bg-black/75 p-1 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => setView("community")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-11 sm:min-h-0 sm:py-1.5 sm:text-sm",
                view === "community" ? "bg-gta-pink/20 text-white" : "text-white/55 hover:text-white"
              )}
            >
              <Globe2 className="size-4" />
              State of Leonida
            </button>
            <button
              type="button"
              onClick={() => setView("guide")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-11 sm:min-h-0 sm:py-1.5 sm:text-sm",
                view === "guide" ? "bg-gta-pink/20 text-white" : "text-white/55 hover:text-white"
              )}
            >
              <MapPin className="size-4" />
              GTA6Hub Guide
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {view === "guide" && <MapSchemeToggle scheme={scheme} onChange={setScheme} />}
            <Link
              href={LEONIDA_COMMUNITY_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/75 px-3 py-2 text-xs text-white/70 shadow-lg backdrop-blur-md transition-colors hover:text-white min-h-11 sm:min-h-0 sm:py-1.5"
            >
              Open full map
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>

        {view === "community" ? (
          <p className="pointer-events-none max-w-2xl text-xs text-white/45 sm:text-sm">
            Official community map by the GTA Mapping Community — 1,400+ locations from trailers and
            leaks. Tiles and data courtesy of{" "}
            <a
              href={LEONIDA_COMMUNITY_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto text-gta-pink/90 hover:underline"
            >
              State of Leonida
            </a>
            .
          </p>
        ) : (
          <div className="pointer-events-auto max-w-3xl">
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              className="mb-2 rounded-lg border border-white/10 bg-black/75 px-3 py-2 text-xs text-white/70 backdrop-blur-md sm:hidden"
            >
              {panelOpen ? "Hide filters" : "Show filters & search"}
            </button>
            <div className={cn("space-y-3 rounded-xl border border-white/10 bg-black/75 p-3 backdrop-blur-md sm:block", panelOpen ? "block" : "hidden")}>
              <div className="grid gap-3 sm:grid-cols-2">
                <MapSearch value={search} onChange={setSearch} />
                <SpoilerToggle
                  enabled={spoilerMode}
                  onChange={setSpoilerMode}
                  spoilerCount={spoilerCount}
                />
              </div>
              <MapFilters
                types={ALL_TYPES}
                activeTypes={activeTypes}
                districts={districts}
                activeDistrict={activeDistrict}
                onToggleType={toggleType}
                onDistrictChange={setActiveDistrict}
              />
              <p className="text-xs text-white/40">
                {filtered.length} of {points.length} GTA6Hub locations on the same Leonida map tiles.
              </p>
            </div>
          </div>
        )}
      </div>

      {view === "guide" && (
        <MapPointDrawer
          point={selected}
          spoilerMode={spoilerMode}
          onClose={() => {
            setSelected(null);
            setPanelOpen(false);
          }}
          locationSaved={selected ? savedLocationIds.has(selected.id) : false}
        />
      )}
    </div>
  );
}
