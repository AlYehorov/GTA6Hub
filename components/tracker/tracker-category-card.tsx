"use client";

import Link from "next/link";
import {
  Trophy,
  Flag,
  MapPin,
  Zap,
  Users,
  Gem,
  Crosshair,
  Car,
  Building2,
  Home,
  PawPrint,
  TreePine,
  Award,
  Medal,
  Egg,
  KeyRound,
  Sparkles,
  Circle,
  type LucideIcon,
} from "lucide-react";
import { TrackerProgressBar } from "@/components/tracker/tracker-progress-bar";
import type { CategoryProgress } from "@/lib/types/completion";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  trophy: Trophy,
  flag: Flag,
  "map-pin": MapPin,
  zap: Zap,
  users: Users,
  gem: Gem,
  crosshair: Crosshair,
  car: Car,
  building: Building2,
  home: Home,
  "paw-print": PawPrint,
  tree: TreePine,
  award: Award,
  medal: Medal,
  egg: Egg,
  key: KeyRound,
  sparkles: Sparkles,
  circle: Circle,
};

interface TrackerCategoryCardProps {
  progress: CategoryProgress;
  completedIds: Set<string>;
}

export function TrackerCategoryCard({ progress }: TrackerCategoryCardProps) {
  const Icon = ICONS[progress.category.icon] ?? Circle;

  return (
    <Link
      href={`/tracker/${progress.category.slug}`}
      className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/12 hover:bg-white/[0.04]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-white/5 p-2.5 text-gta-pink group-hover:bg-gta-pink/10">
            <Icon className="size-5" />
          </span>
          <div>
            <h3 className="font-medium text-white">{progress.category.title}</h3>
            <p className="mt-0.5 text-xs text-white/40">
              {progress.completed} / {progress.total} completed
            </p>
          </div>
        </div>
        <span className={cn("font-mono text-sm", progress.percentage >= 100 ? "text-emerald-400" : "text-white/60")}>
          {progress.percentage}%
        </span>
      </div>
      <TrackerProgressBar percentage={progress.percentage} size="sm" />
      {progress.remaining > 0 && (
        <p className="mt-2 text-xs text-white/35">{progress.remaining} remaining</p>
      )}
    </Link>
  );
}
