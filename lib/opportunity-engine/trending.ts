import type { SourceItem } from "@/lib/types/source";
import { TRENDING_TERMS } from "@/lib/opportunity-engine/topics";
import type { TrendingKeyword } from "@/lib/opportunity-engine/types";

export function computeTrendingKeywords(
  sources: SourceItem[],
  limit = 8
): TrendingKeyword[] {
  const counts = new Map<string, number>();
  const corpus = sources
    .map((s) => `${s.title} ${s.content}`)
    .join(" ")
    .toLowerCase();

  for (const term of TRENDING_TERMS) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = corpus.match(regex);
    if (matches && matches.length > 0) {
      counts.set(
        term
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        matches.length
      );
    }
  }

  return Array.from(counts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
