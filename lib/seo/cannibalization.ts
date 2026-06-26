import type { SeoScoredArticle, CannibalizationPair } from "@/lib/seo/types";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "for", "to", "of", "is", "are",
  "gta", "vi", "6", "all", "what", "we", "know", "about", "guide", "list",
]);

function tokenize(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const TOPIC_CLUSTERS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /vehicle|car|truck|bike|motorcycle/i, label: "vehicles" },
  { pattern: /character|lucia|jason|protagonist/i, label: "characters" },
  { pattern: /location|vice city|leonida|map/i, label: "locations" },
  { pattern: /trailer|teaser|gameplay/i, label: "trailers" },
  { pattern: /release|date|launch/i, label: "release" },
];

function sharedTopicLabel(titleA: string, titleB: string): string | null {
  for (const { pattern, label } of TOPIC_CLUSTERS) {
    if (pattern.test(titleA) && pattern.test(titleB)) return label;
  }
  return null;
}

export function detectCannibalization(
  articles: SeoScoredArticle[],
  limit = 12
): CannibalizationPair[] {
  const published = articles.filter((a) => a.status === "published");
  const pairs: CannibalizationPair[] = [];

  for (let i = 0; i < published.length; i++) {
    for (let j = i + 1; j < published.length; j++) {
      const a = published[i];
      const b = published[j];
      const tokensA = tokenize(a.title);
      const tokensB = tokenize(b.title);
      const similarity = jaccardSimilarity(tokensA, tokensB);
      const topic = sharedTopicLabel(a.title, b.title);

      const threshold = topic ? 0.25 : 0.45;
      if (similarity < threshold) continue;

      pairs.push({
        articleAId: a.articleId,
        articleATitle: a.title,
        articleBId: b.articleId,
        articleBTitle: b.title,
        similarity: Math.round(similarity * 100),
        suggestion:
          similarity >= 0.5
            ? `Strong overlap — consider merging into one definitive ${topic ?? "guide"}`
            : `Similar ${topic ?? "topic"} coverage — differentiate angles or merge`,
      });
    }
  }

  return pairs.sort((x, y) => y.similarity - x.similarity).slice(0, limit);
}
