import type { SeoScoredArticle } from "@/lib/seo/types";
import type { ChecklistItemKey, WorkspaceChecklistItem } from "@/lib/workspace/types";

const CHECKLIST_META: Record<
  ChecklistItemKey,
  { label: string; estimated_minutes: number; score_gain: number }
> = {
  expand_article: { label: "Expand article", estimated_minutes: 20, score_gain: 10 },
  add_faq: { label: "Add FAQ", estimated_minutes: 12, score_gain: 10 },
  add_internal_links: { label: "Add internal links", estimated_minutes: 10, score_gain: 15 },
  add_youtube_embed: { label: "Add YouTube embed", estimated_minutes: 8, score_gain: 10 },
  refresh_screenshots: { label: "Refresh screenshots", estimated_minutes: 15, score_gain: 5 },
  improve_meta_description: { label: "Improve meta description", estimated_minutes: 8, score_gain: 10 },
  add_schema: { label: "Add schema", estimated_minutes: 5, score_gain: 0 },
  add_related_articles: { label: "Add related articles", estimated_minutes: 10, score_gain: 5 },
  add_hero_image: { label: "Add hero image", estimated_minutes: 10, score_gain: 10 },
  add_external_source: { label: "Add external source link", estimated_minutes: 5, score_gain: 10 },
  refresh_content: { label: "Refresh outdated content", estimated_minutes: 25, score_gain: 10 },
};

function item(
  key: ChecklistItemKey,
  completed = false
): WorkspaceChecklistItem {
  const meta = CHECKLIST_META[key];
  return {
    id: key,
    key,
    label: meta.label,
    completed,
    estimated_minutes: meta.estimated_minutes,
    score_gain: meta.score_gain,
  };
}

export function buildChecklistForArticle(
  scored: SeoScoredArticle,
  options: { isStale?: boolean } = {}
): WorkspaceChecklistItem[] {
  const { breakdown } = scored;
  const items: WorkspaceChecklistItem[] = [];

  if (breakdown.wordCount < 15) items.push(item("expand_article"));
  if (breakdown.faq < 10) items.push(item("add_faq"));
  if (breakdown.internalLinks < 15) items.push(item("add_internal_links"));
  if (breakdown.video < 10) items.push(item("add_youtube_embed"));
  if (scored.imageCount <= 1) items.push(item("refresh_screenshots"));
  if (breakdown.description < 10) items.push(item("improve_meta_description"));
  if (breakdown.internalLinks < 10) items.push(item("add_related_articles"));
  if (breakdown.heroImage < 10) items.push(item("add_hero_image"));
  if (breakdown.externalSources < 10) items.push(item("add_external_source"));
  if (options.isStale || breakdown.freshness < 8) {
    items.push(item("refresh_content"));
  }

  return items;
}

export function mergeChecklists(
  existing: WorkspaceChecklistItem[],
  fresh: WorkspaceChecklistItem[]
): WorkspaceChecklistItem[] {
  const byKey = new Map(existing.map((entry) => [entry.key, entry]));

  for (const next of fresh) {
    const prev = byKey.get(next.key);
    if (prev) {
      byKey.set(next.key, {
        ...next,
        completed: prev.completed,
      });
    } else {
      byKey.set(next.key, next);
    }
  }

  return Array.from(byKey.values());
}

export function estimateMinutes(checklist: WorkspaceChecklistItem[]): number {
  return checklist
    .filter((entry) => !entry.completed)
    .reduce((sum, entry) => sum + entry.estimated_minutes, 0);
}

export function estimatePotentialScore(
  currentScore: number,
  checklist: WorkspaceChecklistItem[]
): number {
  const gain = checklist
    .filter((entry) => !entry.completed)
    .reduce((sum, entry) => sum + entry.score_gain, 0);
  return Math.min(100, currentScore + gain);
}

export function articleNeedsWorkspace(
  scored: SeoScoredArticle,
  checklist: WorkspaceChecklistItem[],
  options: { isStale?: boolean } = {}
): boolean {
  if (checklist.length > 0) return true;
  if (options.isStale) return true;
  return scored.score < 85;
}

export function hashArticleContent(
  article: { updated_at: string; content: string; title: string }
): string {
  return `${article.updated_at}|${article.title.length}|${article.content.length}`;
}
