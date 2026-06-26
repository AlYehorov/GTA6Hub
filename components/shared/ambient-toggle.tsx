"use client";

import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AmbientToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      disabled
      title="Ambient mode coming soon"
      className={cn(
        "inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/40",
        className
      )}
      aria-label="Ambient mode coming soon"
    >
      <Volume2 className="size-4" />
      Ambient mode coming soon
    </button>
  );
}
