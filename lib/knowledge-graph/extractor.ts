import type { KgEntity, KgEntityKind } from "@/lib/knowledge-graph/types";
import { KG_DICTIONARY, KG_REGEX_PATTERNS } from "@/lib/knowledge-graph/dictionaries";

export interface ExtractionMatch {
  kind: KgEntityKind;
  slug: string;
  title: string;
  category: string;
  confidence: number;
  mention_count: number;
  matched_term: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countTerm(text: string, term: string): number {
  const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
  return (text.match(pattern) ?? []).length;
}

function buildTermsForEntity(entity: KgEntity): string[] {
  const terms = new Set<string>([entity.title, ...entity.aliases]);
  terms.add(entity.slug.replace(/-/g, " "));
  return Array.from(terms).filter((t) => t.trim().length >= 2);
}

export function extractEntitiesFromText(
  text: string,
  knownEntities: KgEntity[] = []
): ExtractionMatch[] {
  const haystack = text.toLowerCase();
  const matches = new Map<string, ExtractionMatch>();

  function addMatch(
    key: string,
    partial: Omit<ExtractionMatch, "mention_count"> & { mention_count?: number }
  ) {
    const count =
      partial.mention_count ??
      countTerm(haystack, partial.matched_term.toLowerCase());
    if (count === 0) return;

    const existing = matches.get(key);
    if (existing) {
      existing.mention_count += count;
      existing.confidence = Math.max(existing.confidence, partial.confidence);
      return;
    }

    matches.set(key, {
      ...partial,
      mention_count: count,
    });
  }

  for (const entry of KG_DICTIONARY) {
    const terms = [entry.title, ...entry.aliases];
    for (const term of terms) {
      const count = countTerm(haystack, term.toLowerCase());
      if (count === 0) continue;
      addMatch(`${entry.kind}|${entry.slug}`, {
        kind: entry.kind,
        slug: entry.slug,
        title: entry.title,
        category: entry.category,
        confidence: entry.title.toLowerCase() === term.toLowerCase() ? 0.95 : 0.85,
        matched_term: term,
        mention_count: count,
      });
    }
  }

  for (const pattern of KG_REGEX_PATTERNS) {
    const found = text.match(pattern.pattern) ?? [];
    if (found.length === 0) continue;
    addMatch(`${pattern.kind}|${pattern.slug}`, {
      kind: pattern.kind,
      slug: pattern.slug,
      title: pattern.title,
      category: pattern.category,
      confidence: 0.9,
      matched_term: pattern.title,
      mention_count: found.length,
    });
  }

  for (const entity of knownEntities) {
    for (const term of buildTermsForEntity(entity)) {
      const count = countTerm(haystack, term.toLowerCase());
      if (count === 0) continue;
      addMatch(`${entity.kind}|${entity.slug}`, {
        kind: entity.kind,
        slug: entity.slug,
        title: entity.title,
        category: entity.category,
        confidence: 0.98,
        matched_term: term,
        mention_count: count,
      });
    }
  }

  return Array.from(matches.values()).sort(
    (a, b) => b.mention_count - a.mention_count || b.confidence - a.confidence
  );
}

export function extractEntitiesFromArticle(input: {
  title: string;
  excerpt: string | null;
  content: string;
}): ExtractionMatch[] {
  const corpus = [input.title, input.excerpt ?? "", input.content].join("\n\n");
  return extractEntitiesFromText(corpus);
}
