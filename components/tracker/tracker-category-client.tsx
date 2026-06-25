"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
import { TrackerItemRow } from "@/components/tracker/tracker-item-row";
import { TrackerProgressBar } from "@/components/tracker/tracker-progress-bar";
import { TrackerSpoilerToggle } from "@/components/tracker/tracker-spoiler-toggle";
import { useTrackerProgress } from "@/lib/tracker/use-tracker-progress";
import { trackTrackerView } from "@/lib/analytics/track";
import type { CompletionCategory, CompletionItem } from "@/lib/types/completion";

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

interface TrackerCategoryClientProps {
  category: CompletionCategory;
  items: CompletionItem[];
}

export function TrackerCategoryClient({ category, items }: TrackerCategoryClientProps) {
  const [spoilerMode, setSpoilerMode] = useState(false);
  const { completedIds, hydrated, overview, toggleItem } = useTrackerProgress({
    items,
    categoryId: category.id,
    categorySlug: category.slug,
  });

  useEffect(() => {
    void trackTrackerView(category.slug);
  }, [category.slug]);

  const spoilerCount = useMemo(() => items.filter((i) => i.spoiler).length, [items]);
  const Icon = ICONS[category.icon] ?? Circle;

  if (!hydrated) {
    return (
      <div className="py-20 text-center text-sm text-white/40">Loading your progress...</div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/tracker"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        All categories
      </Link>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-gta-pink/10 p-3 text-gta-pink">
            <Icon className="size-6" />
          </span>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              {category.title}
            </h1>
            <p className="mt-2 text-sm text-white/50">
              {overview.completed} completed · {overview.remaining} remaining
            </p>
          </div>
          <p className="font-mono text-2xl text-white/70">{overview.percentage}%</p>
        </div>
        <TrackerProgressBar percentage={overview.percentage} className="mt-6" />
      </div>

      {spoilerCount > 0 && (
        <TrackerSpoilerToggle
          enabled={spoilerMode}
          onChange={setSpoilerMode}
          spoilerCount={spoilerCount}
        />
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <TrackerItemRow
            key={item.id}
            item={item}
            completed={completedIds.has(item.id)}
            spoilerMode={spoilerMode}
            onToggle={toggleItem}
          />
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-12 text-center text-white/40">No items in this category yet.</p>
      )}
    </div>
  );
}
