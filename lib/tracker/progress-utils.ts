import type {
  CategoryProgress,
  CompletionCategory,
  CompletionItem,
  TrackerOverview,
} from "@/lib/types/completion";

export function buildTrackerOverview(
  categories: CompletionCategory[],
  itemsByCategory: Map<string, CompletionItem[]>,
  completedIds: Set<string>
): TrackerOverview {
  const categoryProgress: CategoryProgress[] = categories.map((category) => {
    const items = itemsByCategory.get(category.id) ?? [];
    const total = items.length;
    const completed = items.filter((i) => completedIds.has(i.id)).length;
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { category, total, completed, remaining, percentage };
  });

  const totalItems = categoryProgress.reduce((s, c) => s + c.total, 0);
  const totalCompleted = categoryProgress.reduce((s, c) => s + c.completed, 0);

  return {
    categories: categoryProgress,
    totalItems,
    totalCompleted,
    overallPercentage: totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0,
  };
}
