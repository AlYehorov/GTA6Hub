"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchUserProgressIds,
  isUserAuthenticated,
  setItemProgress,
  syncLocalProgressToServer,
} from "@/lib/actions/tracker-progress";
import {
  trackCategoryCompleted,
  trackItemCompleted,
  trackOverallCompletionUpdated,
} from "@/lib/analytics/track";
import type { CompletionItem, LocalProgressEntry } from "@/lib/types/completion";
import { TRACKER_STORAGE_KEY } from "@/lib/types/completion";

function readLocalProgress(): LocalProgressEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalProgressEntry[];
  } catch {
    return [];
  }
}

function writeLocalProgress(entries: LocalProgressEntry[]) {
  localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(entries));
}

interface UseTrackerProgressOptions {
  items: CompletionItem[];
  categoryId?: string;
  categorySlug?: string;
}

export function useTrackerProgress({
  items,
  categoryId,
  categorySlug,
}: UseTrackerProgressOptions) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const authed = await isUserAuthenticated();
      if (cancelled) return;

      setIsAuthenticated(authed);

      if (authed) {
        const serverIds = await fetchUserProgressIds();
        if (!cancelled) setCompletedIds(new Set(serverIds));
      } else {
        const local = readLocalProgress();
        if (!cancelled) setCompletedIds(new Set(local.map((e) => e.itemId)));
      }

      if (!cancelled) setHydrated(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const overview = useMemo(() => {
    const scoped = categoryId ? items.filter((i) => i.category_id === categoryId) : items;
    const total = scoped.length;
    const completed = scoped.filter((i) => completedIds.has(i.id)).length;
    return {
      total,
      completed,
      remaining: total - completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [items, completedIds, categoryId]);

  const toggleItem = useCallback(
    async (item: CompletionItem) => {
      const wasCompleted = completedIds.has(item.id);
      const nextCompleted = !wasCompleted;

      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (nextCompleted) next.add(item.id);
        else next.delete(item.id);
        return next;
      });

      if (isAuthenticated) {
        await setItemProgress(item.id, nextCompleted);
      } else {
        const entries = readLocalProgress().filter((e) => e.itemId !== item.id);
        if (nextCompleted) {
          entries.push({ itemId: item.id, completedAt: new Date().toISOString() });
        }
        writeLocalProgress(entries);
      }

      if (nextCompleted) {
        void trackItemCompleted(item.id, item.category_id, categorySlug ?? "all");

        const scoped = categoryId
          ? items.filter((i) => i.category_id === categoryId)
          : items;
        const newCompleted = scoped.filter(
          (i) => i.id === item.id || completedIds.has(i.id)
        ).length;
        const pct = scoped.length > 0 ? Math.round((newCompleted / scoped.length) * 100) : 0;

        if (pct === 100 && categoryId && categorySlug) {
          void trackCategoryCompleted(categoryId, categorySlug, 100);
        }

        const allCompleted = items.filter(
          (i) => i.id === item.id || completedIds.has(i.id)
        ).length;
        const overallPct =
          items.length > 0 ? Math.round((allCompleted / items.length) * 100) : 0;
        void trackOverallCompletionUpdated(overallPct, allCompleted, items.length);
      }
    },
    [completedIds, isAuthenticated, items, categoryId, categorySlug]
  );

  const recentCompleted = useMemo(() => {
    if (isAuthenticated) {
      return items
        .filter((i) => completedIds.has(i.id))
        .slice(0, 3)
        .map((i) => ({ id: i.id, title: i.title }));
    }
    const local = readLocalProgress();
    const byId = new Map(items.map((i) => [i.id, i]));
    return local
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 3)
      .map((e) => byId.get(e.itemId))
      .filter(Boolean)
      .map((i) => ({ id: i!.id, title: i!.title }));
  }, [completedIds, isAuthenticated, items]);

  return {
    completedIds,
    hydrated,
    isAuthenticated,
    overview,
    toggleItem,
    recentCompleted,
    syncToServer: async () => {
      const ids = [...completedIds];
      return syncLocalProgressToServer(ids);
    },
  };
}

export function getLocalOverallPercentage(items: CompletionItem[]): number {
  const local = readLocalProgress();
  const ids = new Set(local.map((e) => e.itemId));
  if (items.length === 0) return 0;
  const completed = items.filter((i) => ids.has(i.id)).length;
  return Math.round((completed / items.length) * 100);
}

export function getLocalRecentCompleted(items: CompletionItem[]) {
  const local = readLocalProgress();
  const byId = new Map(items.map((i) => [i.id, i]));
  return local
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 3)
    .map((e) => byId.get(e.itemId))
    .filter(Boolean)
    .map((i) => ({ id: i!.id, title: i!.title }));
}
