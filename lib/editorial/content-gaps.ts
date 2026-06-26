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

export async function detectContentGaps(limit = 30): Promise<ContentGap[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("title, content, slug")
    .eq("status", "published");

  const articleText = (articles ?? [])
    .map((a) => `${a.title as string} ${a.content as string} ${a.slug as string}`.toLowerCase())
    .join("\n");

  const gaps: ContentGap[] = [];

  for (const kind of ALL_ENTITY_KINDS) {
    const config = ENTITY_KINDS[kind];
    const { data: entities } = await supabase
      .from(config.table)
      .select("slug, title, status")
      .order("title");

    for (const row of entities ?? []) {
      const slug = row.slug as string;
      const title = row.title as string;
      const status = row.status as string;
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
