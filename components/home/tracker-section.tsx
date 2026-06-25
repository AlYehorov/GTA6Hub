import { TrackerSectionClient } from "@/components/home/tracker-section-client";
import {
  getAllPublishedItems,
  getCompletionCategories,
  getTrackerPublicTotals,
} from "@/lib/tracker/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function TrackerSection() {
  if (!isSupabaseConfigured()) return null;

  const [items, categories, totals] = await Promise.all([
    getAllPublishedItems(),
    getCompletionCategories(),
    getTrackerPublicTotals(),
  ]);

  if (items.length === 0) return null;

  return (
    <TrackerSectionClient
      items={items}
      totalCategories={categories.length || totals.categoryCount}
    />
  );
}
