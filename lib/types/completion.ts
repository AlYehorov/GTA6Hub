export type CompletionDifficulty = "easy" | "medium" | "hard";
export type CompletionItemStatus = "draft" | "published";

export interface CompletionCategory {
  id: string;
  slug: string;
  title: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface CompletionItem {
  id: string;
  category_id: string;
  title: string;
  description: string;
  spoiler: boolean;
  difficulty: CompletionDifficulty;
  image_url: string | null;
  sort_order: number;
  status: CompletionItemStatus;
  created_at: string;
  updated_at: string;
}

export interface CompletionItemWithCategory extends CompletionItem {
  category: Pick<CompletionCategory, "id" | "slug" | "title" | "icon">;
}

export interface CompletionItemFormData {
  category_id: string;
  title: string;
  description: string;
  spoiler: boolean;
  difficulty: CompletionDifficulty;
  image_url: string;
  sort_order: number;
  status: CompletionItemStatus;
}

export interface CategoryProgress {
  category: CompletionCategory;
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
}

export interface TrackerOverview {
  categories: CategoryProgress[];
  totalItems: number;
  totalCompleted: number;
  overallPercentage: number;
}

export const COMPLETION_DIFFICULTY_LABELS: Record<CompletionDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const TRACKER_STORAGE_KEY = "gta6hub-tracker-progress";

export interface LocalProgressEntry {
  itemId: string;
  completedAt: string;
}
