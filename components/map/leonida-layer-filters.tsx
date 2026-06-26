"use client";

import { cn } from "@/lib/utils";
import type { LeonidaLayerId, LeonidaLayerMeta } from "@/lib/map/leonida-types";

interface LeonidaLayerFiltersProps {
  layers: LeonidaLayerMeta[];
  hubCount: number;
  activeLayers: Set<LeonidaLayerId>;
  onToggleLayer: (layer: LeonidaLayerId) => void;
  compact?: boolean;
}

const MOBILE_LAYER_LABELS: Partial<Record<LeonidaLayerId, string>> = {
  trailer1: "T1",
  trailer2: "T2",
  screenshots: "Shots",
  hub: "Guide",
};

export function LeonidaLayerFilters({
  layers,
  hubCount,
  activeLayers,
  onToggleLayer,
  compact = false,
}: LeonidaLayerFiltersProps) {
  const hubActive = activeLayers.has("hub");

  return (
    <div className="carousel-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:snap-none">
      {layers.map((layer) => {
        const active = activeLayers.has(layer.id);
        const label = compact ? (MOBILE_LAYER_LABELS[layer.id] ?? layer.label) : layer.label;
        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => onToggleLayer(layer.id)}
            className={cn(
              "shrink-0 snap-start rounded-full border px-3 py-2.5 text-sm transition-colors min-h-11 sm:min-h-0 sm:py-1 sm:text-xs",
              active
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
            )}
          >
            <span
              className="mr-1.5 inline-block size-2 rounded-full"
              style={{ backgroundColor: layer.color }}
            />
            {label}
            <span className="ml-1 text-white/35">({layer.count})</span>
          </button>
        );
      })}

      {hubCount > 0 && (
        <button
          type="button"
          onClick={() => onToggleLayer("hub")}
          className={cn(
            "shrink-0 snap-start rounded-full border px-3 py-2.5 text-sm transition-colors min-h-11 sm:min-h-0 sm:py-1 sm:text-xs",
            hubActive
              ? "border-gta-pink/40 bg-gta-pink/10 text-gta-pink"
              : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
          )}
        >
          <span className="mr-1.5 inline-block size-2 rounded-full bg-gta-pink" />
          {compact ? "Guide" : "GTA6Hub Guide"}
          <span className="ml-1 text-white/35">({hubCount})</span>
        </button>
      )}
    </div>
  );
}
