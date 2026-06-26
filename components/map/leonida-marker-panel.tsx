"use client";

import { X } from "lucide-react";
import { MapSheetHandle } from "@/components/map/map-sheet-handle";
import type { LeonidaMarker } from "@/lib/map/leonida-types";
import { LEONIDA_LAYER_LABELS } from "@/lib/map/leonida-types";
import { cn } from "@/lib/utils";

interface LeonidaMarkerPanelProps {
  marker: LeonidaMarker | null;
  onClose: () => void;
}

export function LeonidaMarkerPanel({ marker, onClose }: LeonidaMarkerPanelProps) {
  const photo = marker?.igPhoto?.url ?? marker?.realLife?.photo?.url ?? null;

  return (
    <>
      {marker && (
        <button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed z-50 flex flex-col border-white/10 bg-[#0a0a0a]/98 transition-transform duration-300 supports-[backdrop-filter]:bg-[#0a0a0a]/95 supports-[backdrop-filter]:backdrop-blur-xl",
          "inset-x-0 bottom-0 max-h-[min(85dvh,640px)] rounded-t-2xl border-t pb-safe lg:inset-y-0 lg:right-0 lg:left-auto lg:w-96 lg:max-h-none lg:rounded-none lg:border-l lg:border-t-0 lg:pb-0",
          marker ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-x-full"
        )}
      >
        {marker ? (
          <>
            <MapSheetHandle />
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:p-5">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base font-semibold text-white sm:text-lg">{marker.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: `${marker.color}22`,
                      color: marker.color,
                    }}
                  >
                    {LEONIDA_LAYER_LABELS[marker.layer as keyof typeof LEONIDA_LAYER_LABELS] ??
                      marker.category}
                  </span>
                  {marker.source && (
                    <span className="text-xs text-white/40">{marker.source}</span>
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

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
              {photo && (
                <div className="mb-4 overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={marker.name}
                    className="aspect-video w-full object-cover"
                    loading="lazy"
                  />
                  {marker.igPhoto?.credit && (
                    <p className="px-3 py-2 text-xs text-white/40">{marker.igPhoto.credit}</p>
                  )}
                </div>
              )}

              {marker.realLife?.address && (
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-white/40">Real-life reference</p>
                  <p className="mt-1 text-sm text-white/70">{marker.realLife.address}</p>
                </div>
              )}

              {marker.description && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                  {marker.description}
                </p>
              )}

              {marker.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {marker.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/50"
                    >
                      {tag}
                    </span>
                  ))}
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
