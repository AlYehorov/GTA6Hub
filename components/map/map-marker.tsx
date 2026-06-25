"use client";

import { cn } from "@/lib/utils";
import type { MapPoint } from "@/lib/types/map-point";
import { MAP_TYPE_COLORS } from "@/lib/map/constants";
import { MAP_POINT_TYPE_LABELS } from "@/lib/types/map-point";
import { BadgeCheck } from "lucide-react";

interface MapMarkerProps {
  point: MapPoint;
  spoilerMode: boolean;
  selected: boolean;
  onSelect: (point: MapPoint) => void;
}

export function MapMarker({ point, spoilerMode, selected, onSelect }: MapMarkerProps) {
  const hidden = point.spoiler && !spoilerMode;
  const color = MAP_TYPE_COLORS[point.type];

  return (
    <button
      type="button"
      aria-label={hidden ? "Spoiler location" : point.title}
      className={cn(
        "absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gta-pink",
        selected && "z-20 scale-125"
      )}
      style={{ left: `${point.lng}%`, top: `${point.lat}%` }}
      onClick={() => onSelect(point)}
    >
      <span className="relative flex items-center justify-center">
        <span
          className={cn(
            "block size-3.5 rounded-full border-2 border-white/80 shadow-lg sm:size-4",
            hidden && "blur-sm opacity-60"
          )}
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}88` }}
        />
        {point.verified && !hidden && (
          <BadgeCheck
            className="absolute -right-2 -top-2 size-3.5 text-emerald-400 drop-shadow sm:size-4"
            aria-label="Verified"
          />
        )}
        {selected && !hidden && (
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-40"
            style={{ backgroundColor: color }}
          />
        )}
      </span>
      {!hidden && (
        <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden max-w-[120px] -translate-x-1/2 truncate rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white/80 sm:block">
          {point.title}
        </span>
      )}
      {hidden && (
        <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white/50">
          {MAP_POINT_TYPE_LABELS[point.type]}
        </span>
      )}
    </button>
  );
}
