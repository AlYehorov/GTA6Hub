"use client";

import { ExternalLink, X, BadgeCheck, EyeOff } from "lucide-react";
import { SaveLocationButton } from "@/components/profile/save-location-button";
import { cn } from "@/lib/utils";
import type { MapPoint } from "@/lib/types/map-point";
import { MAP_POINT_TYPE_LABELS } from "@/lib/types/map-point";
import { MAP_TYPE_COLORS } from "@/lib/map/constants";

interface MapPointDrawerProps {
  point: MapPoint | null;
  spoilerMode: boolean;
  onClose: () => void;
  locationSaved?: boolean;
}

export function MapPointDrawer({ point, spoilerMode, onClose, locationSaved }: MapPointDrawerProps) {
  const hidden = point?.spoiler && !spoilerMode;

  return (
    <>
      {point && (
        <button
          type="button"
          aria-label="Close drawer"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed z-50 flex flex-col border-white/10 bg-[#0a0a0a]/98 transition-transform duration-300 supports-[backdrop-filter]:bg-[#0a0a0a]/95 supports-[backdrop-filter]:backdrop-blur-xl",
          "inset-x-0 bottom-0 max-h-[70vh] max-h-[70dvh] rounded-t-2xl border-t pb-safe lg:inset-y-0 lg:right-0 lg:left-auto lg:w-96 lg:max-h-none lg:rounded-none lg:border-l lg:border-t-0 lg:pb-0",
          point ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-x-full"
        )}
      >
        {point ? (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
              <div className="min-w-0 flex-1">
                {hidden ? (
                  <div className="flex items-center gap-2 text-white/50">
                    <EyeOff className="size-4 shrink-0" />
                    <h2 className="font-heading text-lg font-semibold">Spoiler Location</h2>
                  </div>
                ) : (
                  <h2 className="font-heading text-lg font-semibold text-white">{point.title}</h2>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: `${MAP_TYPE_COLORS[point.type]}22`,
                      color: MAP_TYPE_COLORS[point.type],
                    }}
                  >
                    {MAP_POINT_TYPE_LABELS[point.type]}
                  </span>
                  {point.district && (
                    <span className="text-xs text-white/40">{point.district}</span>
                  )}
                  {point.verified && !hidden && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                      <BadgeCheck className="size-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {hidden ? (
                <p className="text-sm leading-relaxed text-white/50">
                  This location contains potential spoilers. Enable spoiler mode to reveal details.
                </p>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                  {point.description}
                </p>
              )}

              {point.source_url && !hidden && (
                <a
                  href={point.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-gta-pink hover:underline"
                >
                  View source
                  <ExternalLink className="size-3.5" />
                </a>
              )}

              {!hidden && (
                <div className="mt-4">
                  <SaveLocationButton mapPointId={point.id} initialSaved={locationSaved} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="hidden p-8 text-center text-sm text-white/40 lg:block">
            Select a marker to view details
          </div>
        )}
      </aside>
    </>
  );
}
