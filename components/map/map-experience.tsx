"use client";

import { useMemo, useState } from "react";
import { MapCanvas } from "@/components/map/map-canvas";
import { MapFilters } from "@/components/map/map-filters";
import { MapSearch } from "@/components/map/map-search";
import { MapPointDrawer } from "@/components/map/map-point-drawer";
import { SpoilerToggle } from "@/components/map/spoiler-toggle";
import type { MapPoint, MapPointType } from "@/lib/types/map-point";
import { MAP_POINT_TYPE_LABELS } from "@/lib/types/map-point";

interface MapExperienceProps {
  points: MapPoint[];
}

const ALL_TYPES = Object.keys(MAP_POINT_TYPE_LABELS) as MapPointType[];

export function MapExperience({ points }: MapExperienceProps) {
  const [search, setSearch] = useState("");
  const [spoilerMode, setSpoilerMode] = useState(false);
  const [activeTypes, setActiveTypes] = useState<Set<MapPointType>>(new Set(ALL_TYPES));
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapPoint | null>(null);

  const districts = useMemo(
    () =>
      [...new Set(points.map((p) => p.district).filter(Boolean))].sort() as string[],
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
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] flex-col bg-black pt-16 lg:flex-row">
      <div className="flex flex-1 flex-col p-4 sm:p-6 lg:pr-[26rem]">
        <header className="mb-4 sm:mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gta-pink/80">Leonida</p>
          <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Interactive Map
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Explore Vice City, the Keys, and beyond — {filtered.length} of {points.length}{" "}
            locations
          </p>
        </header>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <MapSearch value={search} onChange={setSearch} />
          <SpoilerToggle
            enabled={spoilerMode}
            onChange={setSpoilerMode}
            spoilerCount={spoilerCount}
          />
        </div>

        <div className="mb-4">
          <MapFilters
            types={ALL_TYPES}
            activeTypes={activeTypes}
            districts={districts}
            activeDistrict={activeDistrict}
            onToggleType={toggleType}
            onDistrictChange={setActiveDistrict}
          />
        </div>

        <div className="flex-1">
          <MapCanvas
            points={filtered}
            spoilerMode={spoilerMode}
            selectedId={selected?.id ?? null}
            onSelectPoint={handleSelect}
          />
        </div>
      </div>

      <MapPointDrawer
        point={selected}
        spoilerMode={spoilerMode}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
