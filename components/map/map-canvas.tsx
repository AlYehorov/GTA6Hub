"use client";

import Image from "next/image";
import { MapMarker } from "@/components/map/map-marker";
import { MAP_PLACEHOLDER_IMAGE } from "@/lib/map/constants";
import type { MapPoint } from "@/lib/types/map-point";

interface MapCanvasProps {
  points: MapPoint[];
  spoilerMode: boolean;
  selectedId: string | null;
  onSelectPoint: (point: MapPoint) => void;
}

export function MapCanvas({ points, spoilerMode, selectedId, onSelectPoint }: MapCanvasProps) {
  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-white/10 bg-[#061018] shadow-2xl sm:rounded-2xl">
      <Image
        src={MAP_PLACEHOLDER_IMAGE}
        alt="Stylized Leonida map"
        fill
        priority
        className="object-cover opacity-90"
        sizes="(max-width: 768px) 100vw, 80vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

      <div className="absolute inset-0">
        {points.map((point) => (
          <MapMarker
            key={point.id}
            point={point}
            spoilerMode={spoilerMode}
            selected={selectedId === point.id}
            onSelect={onSelectPoint}
          />
        ))}
      </div>

      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg bg-black/60 px-4 py-2 text-sm text-white/50">
            No map points match your filters.
          </p>
        </div>
      )}
    </div>
  );
}
