"use client";

import { cn } from "@/lib/utils";
import {
  MAP_POINT_TYPE_LABELS,
  type MapPointType,
} from "@/lib/types/map-point";
import { MAP_TYPE_COLORS } from "@/lib/map/constants";

interface MapFiltersProps {
  types: MapPointType[];
  activeTypes: Set<MapPointType>;
  districts: string[];
  activeDistrict: string | null;
  onToggleType: (type: MapPointType) => void;
  onDistrictChange: (district: string | null) => void;
}

export function MapFilters({
  types,
  activeTypes,
  districts,
  activeDistrict,
  onToggleType,
  onDistrictChange,
}: MapFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const active = activeTypes.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggleType(type)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
              )}
            >
              <span
                className="mr-1.5 inline-block size-2 rounded-full"
                style={{ backgroundColor: MAP_TYPE_COLORS[type] }}
              />
              {MAP_POINT_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {districts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-white/40">District</span>
          <button
            type="button"
            onClick={() => onDistrictChange(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              activeDistrict === null
                ? "border-gta-pink/40 bg-gta-pink/10 text-gta-pink"
                : "border-white/10 text-white/40"
            )}
          >
            All
          </button>
          {districts.map((district) => (
            <button
              key={district}
              type="button"
              onClick={() => onDistrictChange(district)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                activeDistrict === district
                  ? "border-gta-pink/40 bg-gta-pink/10 text-gta-pink"
                  : "border-white/10 text-white/40 hover:text-white/60"
              )}
            >
              {district}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
