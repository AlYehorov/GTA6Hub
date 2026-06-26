"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type MapTileScheme = "normal" | "dark";

interface MapSchemeToggleProps {
  scheme: MapTileScheme;
  onChange: (scheme: MapTileScheme) => void;
  className?: string;
  compact?: boolean;
}

export function MapSchemeToggle({ scheme, onChange, className, compact }: MapSchemeToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-white/10 bg-black/70 p-1 shadow-lg backdrop-blur-md",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("normal")}
        aria-label="Day map"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
          compact ? "size-11 sm:size-9" : "min-h-11 px-3 py-2 text-xs sm:min-h-0 sm:py-1.5",
          scheme === "normal" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
        )}
      >
        <Sun className="size-4 sm:size-3.5" />
        {!compact && <span>Day</span>}
      </button>
      <button
        type="button"
        onClick={() => onChange("dark")}
        aria-label="Night map"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
          compact ? "size-11 sm:size-9" : "min-h-11 px-3 py-2 text-xs sm:min-h-0 sm:py-1.5",
          scheme === "dark" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
        )}
      >
        <Moon className="size-4 sm:size-3.5" />
        {!compact && <span>Night</span>}
      </button>
    </div>
  );
}
