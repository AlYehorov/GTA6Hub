import { SEO_ENTITY_KINDS } from "@/lib/editorial/constants";
import type { SeoEntityKind } from "@/lib/editorial/constants";
import { ENTITY_KINDS } from "@/lib/entities/config";
import type { EntityRowsByKind } from "@/lib/editorial/content-gaps";
import { buildArticleTextCorpus } from "@/lib/editorial/content-gaps";
import type { EntityCoverageStat } from "@/lib/seo/types";

export function computeEntityCoverage(
  entityRows: EntityRowsByKind[],
  articles: Array<{ title: string; content: string; slug: string }>
): EntityCoverageStat[] {
  const articleText = buildArticleTextCorpus(articles);

  return SEO_ENTITY_KINDS.map((kind) => {
    const config = ENTITY_KINDS[kind as SeoEntityKind];
    const row = entityRows.find((r) => r.kind === kind);
    const entities = row?.entities ?? [];
    const published = entities.filter((e) => e.status === "published");
    const total = entities.length;

    let covered = 0;
    for (const entity of published) {
      const slug = entity.slug;
      const title = entity.title.toLowerCase();
      const needle = slug.replace(/-/g, " ");
      const mentioned =
        articleText.includes(slug) ||
        articleText.includes(title) ||
        articleText.includes(needle);
      if (mentioned) covered++;
    }

    const publishedEntities = published.length;
    const percent =
      publishedEntities === 0
        ? 0
        : Math.round((covered / publishedEntities) * 100);

    return {
      kind: kind as SeoEntityKind,
      label: config.label,
      percent,
      publishedEntities,
      coveredEntities: covered,
      totalEntities: total,
    };
  });
}
