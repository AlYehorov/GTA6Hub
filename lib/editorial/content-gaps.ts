import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { ALL_ENTITY_KINDS, ENTITY_KINDS } from "@/lib/entities/config";
import type { GameEntityKind } from "@/lib/types/game-entity";

export interface ContentGap {
  kind: GameEntityKind;
  slug: string;
  title: string;
  reason: "no_entity_page" | "no_article";
  entityHref: string;
}

export interface EntityGapRow {
  slug: string;
  title: string;
  status: string;
}

export interface EntityRowsByKind {
  kind: GameEntityKind;
  entities: EntityGapRow[];
}

export function buildArticleTextCorpus(
  articles: Array<{ title: string; content: string; slug: string }>
): string {
  return articles
    .map((a) => `${a.title} ${a.content} ${a.slug}`.toLowerCase())
    .join("\n");
}

/** Fetch all entity tables in parallel (replaces sequential per-kind queries). */
export async function fetchEntityRowsForGaps(): Promise<EntityRowsByKind[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();

  return Promise.all(
    ALL_ENTITY_KINDS.map(async (kind) => {
      const config = ENTITY_KINDS[kind];
      const { data } = await supabase
        .from(config.table)
        .select("slug, title, status")
        .order("title");

      return {
        kind,
        entities: (data ?? []).map((row) => ({
          slug: row.slug as string,
          title: row.title as string,
          status: row.status as string,
        })),
      };
    })
  );
}

export function computeContentGaps(
  articleText: string,
  entityRows: EntityRowsByKind[],
  limit = 30
): ContentGap[] {
  const gaps: ContentGap[] = [];

  for (const { kind, entities } of entityRows) {
    const config = ENTITY_KINDS[kind];

    for (const row of entities) {
      const { slug, title, status } = row;
      const href = `${config.routePrefix}/${slug}`;

      if (status !== "published") {
        gaps.push({
          kind,
          slug,
          title,
          reason: "no_entity_page",
          entityHref: href,
        });
        continue;
      }

      const needle = slug.replace(/-/g, " ");
      const mentioned =
        articleText.includes(slug) ||
        articleText.includes(title.toLowerCase()) ||
        articleText.includes(needle);

      if (!mentioned) {
        gaps.push({
          kind,
          slug,
          title,
          reason: "no_article",
          entityHref: href,
        });
      }
    }
  }

  return gaps.slice(0, limit);
}

export async function detectContentGaps(limit = 30): Promise<ContentGap[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const [{ data: articles }, entityRows] = await Promise.all([
    supabase
      .from("articles")
      .select("title, content, slug")
      .eq("status", "published"),
    fetchEntityRowsForGaps(),
  ]);

  const articleText = buildArticleTextCorpus(
    (articles ?? []).map((a) => ({
      title: a.title as string,
      content: a.content as string,
      slug: a.slug as string,
    }))
  );

  return computeContentGaps(articleText, entityRows, limit);
}

export const RECOMMENDED_ARTICLE_IDEAS = [
  "GTA 6 Trailer 2 Breakdown",
  "Everything We Know About Lucia",
  "All Confirmed GTA 6 Locations",
  "GTA 6 Vehicles Seen So Far",
  "GTA 6 Map: Confirmed Leonida Locations",
  "Jason and Lucia: Story Theories vs Confirmed Facts",
  "GTA VI Release Window: What Rockstar Has Actually Said",
  "Leonida Keys vs Vice City: Geography Explained",
] as const;
