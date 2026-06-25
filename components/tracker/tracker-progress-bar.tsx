"use client";

import { cn } from "@/lib/utils";

interface TrackerProgressBarProps {
  percentage: number;
  className?: string;
  size?: "sm" | "md";
}

export function TrackerProgressBar({
  percentage,
  className,
  size = "md",
}: TrackerProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-white/10",
        size === "sm" ? "h-1.5" : "h-2.5",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-gta-pink to-gta-orange transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
