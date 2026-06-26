export const WORKSPACE_STATUSES = [
  "needs_improvement",
  "claimed",
  "in_progress",
  "review",
  "completed",
  "archived",
] as const;

export type ArticleWorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export const ACTIVE_WORKSPACE_STATUSES: ArticleWorkspaceStatus[] = [
  "needs_improvement",
  "claimed",
  "in_progress",
  "review",
];

export const HISTORY_WORKSPACE_STATUSES: ArticleWorkspaceStatus[] = [
  "completed",
  "archived",
];

export type ChecklistItemKey =
  | "expand_article"
  | "add_faq"
  | "add_internal_links"
  | "add_youtube_embed"
  | "refresh_screenshots"
  | "improve_meta_description"
  | "add_schema"
  | "add_related_articles"
  | "add_hero_image"
  | "add_external_source"
  | "refresh_content";

export interface WorkspaceChecklistItem {
  id: string;
  key: ChecklistItemKey;
  label: string;
  completed: boolean;
  estimated_minutes: number;
  score_gain: number;
}

export interface ArticleWorkspace {
  id: string;
  article_id: string;
  status: ArticleWorkspaceStatus;
  seo_score: number;
  potential_score: number;
  estimated_minutes: number;
  checklist: WorkspaceChecklistItem[];
  reason: string;
  related_source_ids: string[];
  assigned_to: string | null;
  locked_at: string | null;
  article_content_hash: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface WorkspaceActivity {
  id: string;
  workspace_id: string;
  event_type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ArticleWorkspaceWithContext extends ArticleWorkspace {
  articleTitle: string;
  articleSlug: string;
  articleType: string;
  articleExcerpt: string | null;
  articlePreview: string;
  relatedSources: Array<{ id: string; title: string }>;
  suggestedFaq: string[];
  suggestedInternalLinks: string[];
  suggestedVideos: string[];
}

export interface WorkspaceMetrics {
  articlesNeedingAttention: number;
  averageSeoGain: number | null;
  averageImprovementMinutes: number | null;
  completedImprovementsToday: number;
  openWorkspaces: number;
}

export interface WeeklyWorkspaceStats {
  workspacesCreated: number;
  workspacesCompleted: number;
  averageCompletionMinutes: number | null;
  completionRate: number;
  averageSeoGain: number | null;
}

export interface DailyWorkspaceCapacity {
  articleCount: number;
  estimatedMinutes: number;
}

export interface OpenAiUsageStats {
  requestsToday: number;
  requestsThisMonth: number;
  estimatedMonthlyCostUsd: number;
  budgetCapUsd: number;
  budgetUsedPercent: number;
}

export interface WorkflowHomeData {
  workspaces: ArticleWorkspaceWithContext[];
  activeWorkspaces: ArticleWorkspaceWithContext[];
  history: ArticleWorkspaceWithContext[];
  dailyCapacity: DailyWorkspaceCapacity;
  weeklyStats: WeeklyWorkspaceStats;
  metrics: WorkspaceMetrics;
  openAiUsage: OpenAiUsageStats;
  configured: boolean;
  openAiConfigured: boolean;
}

export interface WorkspaceDetailData {
  workspace: ArticleWorkspaceWithContext;
  activity: WorkspaceActivity[];
  configured: boolean;
  openAiConfigured: boolean;
}
