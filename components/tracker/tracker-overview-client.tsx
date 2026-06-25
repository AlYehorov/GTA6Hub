"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { TrackerCategoryCard } from "@/components/tracker/tracker-category-card";
import { TrackerProgressBar } from "@/components/tracker/tracker-progress-bar";
import { useTrackerProgress } from "@/lib/tracker/use-tracker-progress";
import { trackTrackerView } from "@/lib/analytics/track";
import { buildTrackerOverview } from "@/lib/tracker/progress-utils";
import type { CompletionCategory, CompletionItem } from "@/lib/types/completion";

interface TrackerOverviewClientProps {
  categories: CompletionCategory[];
  items: CompletionItem[];
}

export function TrackerOverviewClient({ categories, items }: TrackerOverviewClientProps) {
  const { completedIds, hydrated, overview } = useTrackerProgress({ items });

  useEffect(() => {
    void trackTrackerView();
  }, []);

  const categoryProgress = useMemo(() => {
    const byCategory = new Map<string, CompletionItem[]>();
    for (const item of items) {
      const list = byCategory.get(item.category_id) ?? [];
      list.push(item);
      byCategory.set(item.category_id, list);
    }
    return buildTrackerOverview(categories, byCategory, completedIds).categories.filter(
      (c) => c.total > 0
    );
  }, [categories, items, completedIds]);

  if (!hydrated) {
    return (
      <div className="py-20 text-center text-sm text-white/40">Loading your progress...</div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gta-pink/80">Overall Progress</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-heading text-4xl font-bold text-white sm:text-5xl">
              {overview.percentage}%
            </p>
            <p className="mt-1 text-sm text-white/50">
              {overview.completed} of {overview.total} items completed
            </p>
          </div>
          <p className="text-sm text-white/40">
            {overview.remaining} remaining across Leonida
          </p>
        </div>
        <TrackerProgressBar percentage={overview.percentage} className="mt-6" />
      </div>

      <div>
        <h2 className="mb-4 font-heading text-xl font-semibold text-white">Categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryProgress.map((progress) => (
            <TrackerCategoryCard key={progress.category.id} progress={progress} completedIds={completedIds} />
          ))}
        </div>
      </div>

      {items.length === 0 && (
        <p className="py-12 text-center text-white/40">
          No tracker items published yet. Check back soon.
        </p>
      )}

      <p className="text-center text-xs text-white/30">
        Progress saved locally in your browser.{" "}
        <Link href="/login" className="text-gta-pink/70 hover:underline">
          Sign in
        </Link>{" "}
        to sync across devices and appear on the leaderboard.
      </p>
    </div>
  );
}
