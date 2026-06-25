"use client";

import { Check, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompletionItem } from "@/lib/types/completion";
import { COMPLETION_DIFFICULTY_LABELS } from "@/lib/types/completion";

interface TrackerItemRowProps {
  item: CompletionItem;
  completed: boolean;
  spoilerMode: boolean;
  onToggle: (item: CompletionItem) => void;
}

export function TrackerItemRow({
  item,
  completed,
  spoilerMode,
  onToggle,
}: TrackerItemRowProps) {
  const hidden = item.spoiler && !spoilerMode;

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors",
        completed && "border-emerald-500/20 bg-emerald-500/[0.03]"
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
          completed
            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
            : "border-white/20 bg-white/5 text-transparent hover:border-gta-pink/40"
        )}
      >
        <Check className="size-3.5" />
      </button>

      <div className="min-w-0 flex-1">
        {hidden ? (
          <div className="flex items-center gap-2 text-white/50">
            <EyeOff className="size-4 shrink-0" />
            <p className="font-medium blur-sm select-none">Spoiler item</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn("font-medium text-white", completed && "text-white/70 line-through")}>
                {item.title}
              </h3>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40">
                {COMPLETION_DIFFICULTY_LABELS[item.difficulty]}
              </span>
              {item.spoiler && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                  Spoiler
                </span>
              )}
            </div>
            <p className={cn("mt-1 text-sm text-white/50", hidden && "blur-sm")}>
              {item.description}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
