"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type MapTileScheme = "normal" | "dark";

interface MapSchemeToggleProps {
  scheme: MapTileScheme;
  onChange: (scheme: MapTileScheme) => void;
  className?: string;
}

export function MapSchemeToggle({ scheme, onChange, className }: MapSchemeToggleProps) {
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
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors min-h-11 sm:min-h-0 sm:py-1.5",
          scheme === "normal" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
        )}
      >
        <Sun className="size-3.5" />
        Day
      </button>
      <button
        type="button"
        onClick={() => onChange("dark")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors min-h-11 sm:min-h-0 sm:py-1.5",
          scheme === "dark" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
        )}
      >
        <Moon className="size-3.5" />
        Night
      </button>
    </div>
  );
}
