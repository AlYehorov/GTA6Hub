export const EDITORIAL_TASK_STATUSES = [
  "opportunity",
  "claimed",
  "drafting",
  "seo_review",
  "fact_check",
  "ready",
  "scheduled",
  "published",
  "needs_update",
  "archived",
  "cancelled",
] as const;

export type EditorialTaskStatus = (typeof EDITORIAL_TASK_STATUSES)[number];

export const EDITORIAL_TASK_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export type EditorialTaskPriority = (typeof EDITORIAL_TASK_PRIORITIES)[number];

export const KANBAN_STATUSES: EditorialTaskStatus[] = [
  "opportunity",
  "claimed",
  "drafting",
  "seo_review",
  "ready",
  "published",
];

export const ACTIVE_TASK_STATUSES: EditorialTaskStatus[] = [
  "opportunity",
  "claimed",
  "drafting",
  "seo_review",
  "fact_check",
  "ready",
  "scheduled",
  "needs_update",
];

export const HISTORY_STATUSES: EditorialTaskStatus[] = [
  "published",
  "archived",
  "cancelled",
];

export interface EditorialTask {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: EditorialTaskPriority;
  estimated_minutes: number;
  status: EditorialTaskStatus;
  created_from: string;
  related_source: string | null;
  related_article: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface EditorialTaskWithContext extends EditorialTask {
  relatedSourceTitle?: string | null;
  relatedArticleTitle?: string | null;
  relatedArticleSlug?: string | null;
  seoScore?: number | null;
  suggestedFaq?: string[];
  suggestedInternalLinks?: string[];
}

export interface TaskGeneratorCandidate {
  title: string;
  description: string;
  category: string;
  priority: EditorialTaskPriority;
  estimated_minutes: number;
  created_from: string;
  related_source?: string | null;
  related_article?: string | null;
  dedupe_key: string;
}

export interface WorkflowMetrics {
  tasksCompletedToday: number;
  averagePublishMinutes: number | null;
  averageReviewMinutes: number | null;
  openOpportunities: number;
}

export interface WeeklyWorkflowStats {
  tasksCreated: number;
  tasksCompleted: number;
  averageCompletionMinutes: number | null;
  completionRate: number;
}

export interface DailyCapacity {
  taskCount: number;
  estimatedMinutes: number;
}

export interface OpenAiUsageStats {
  requestsToday: number;
  requestsThisMonth: number;
  estimatedMonthlyCostUsd: number;
  budgetCapUsd: number;
  budgetUsedPercent: number;
}

export interface WorkflowPageData {
  tasks: EditorialTaskWithContext[];
  todayByStatus: Record<string, EditorialTaskWithContext[]>;
  kanban: Record<EditorialTaskStatus, EditorialTaskWithContext[]>;
  history: EditorialTaskWithContext[];
  dailyCapacity: DailyCapacity;
  weeklyStats: WeeklyWorkflowStats;
  metrics: WorkflowMetrics;
  openAiUsage: OpenAiUsageStats;
  generatorPreview: TaskGeneratorCandidate[];
  configured: boolean;
  openAiConfigured: boolean;
}
