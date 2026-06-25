"use client";

import { cn } from "@/lib/utils";

interface SpoilerToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  spoilerCount: number;
}

export function SpoilerToggle({ enabled, onChange, spoilerCount }: SpoilerToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
      <span className="text-sm text-white/70">Show spoilers</span>
      {spoilerCount > 0 && (
        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
          {spoilerCount}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative ml-auto h-6 w-11 rounded-full transition-colors",
          enabled ? "bg-gta-pink/80" : "bg-white/20"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            enabled ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </label>
  );
}
