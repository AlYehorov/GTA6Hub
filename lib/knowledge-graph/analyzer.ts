import type {
  KgDuplicateGroup,
  KgEntity,
  KgMergeSuggestion,
} from "@/lib/knowledge-graph/types";

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findDuplicateGroups(entities: KgEntity[]): KgDuplicateGroup[] {
  const groups = new Map<string, KgEntity[]>();

  for (const entity of entities) {
    const key = normalizeTitle(entity.title);
    if (!key) continue;
    const bucket = groups.get(key) ?? [];
    bucket.push(entity);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries())
    .filter(([, list]) => list.length > 1)
    .map(([normalizedTitle, list]) => ({ normalizedTitle, entities: list }));
}

export function findAliasCollisions(
  entities: KgEntity[]
): Array<{ alias: string; entities: KgEntity[] }> {
  const aliasMap = new Map<string, KgEntity[]>();

  for (const entity of entities) {
    const terms = [entity.title, ...entity.aliases];
    for (const term of terms) {
      const key = normalizeTitle(term);
      if (key.length < 3) continue;
      const bucket = aliasMap.get(key) ?? [];
      if (!bucket.some((e) => e.id === entity.id)) bucket.push(entity);
      aliasMap.set(key, bucket);
    }
  }

  return Array.from(aliasMap.entries())
    .filter(([, list]) => list.length > 1)
    .map(([alias, list]) => ({ alias, entities: list }))
    .sort((a, b) => b.entities.length - a.entities.length);
}

export function suggestMerges(entities: KgEntity[]): KgMergeSuggestion[] {
  const suggestions: KgMergeSuggestion[] = [];

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i]!;
      const b = entities[j]!;
      if (a.kind !== b.kind) continue;

      const titleA = normalizeTitle(a.title);
      const titleB = normalizeTitle(b.title);
      let score = 0;
      let reason = "";

      if (titleA === titleB) {
        score = 0.95;
        reason = "Identical normalized title";
      } else if (titleA.includes(titleB) || titleB.includes(titleA)) {
        score = 0.75;
        reason = "Substring title match";
      } else if (a.slug === b.slug) {
        score = 0.9;
        reason = "Same slug";
      } else {
        const aliasOverlap = a.aliases.some((alias) =>
          b.aliases.map(normalizeTitle).includes(normalizeTitle(alias))
        );
        if (aliasOverlap) {
          score = 0.7;
          reason = "Shared alias";
        }
      }

      if (score >= 0.7) {
        suggestions.push({ entityA: a, entityB: b, reason, score });
      }
    }
  }

  return suggestions.sort((a, b) => b.score - a.score);
}
