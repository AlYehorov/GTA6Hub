import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isGta6Content } from "@/lib/gta6/content-filter";
import { ENTITY_KINDS, entityHref } from "@/lib/entities/config";
import { getRelatedEntities } from "@/lib/entities/queries";
import type { EntityPageData, GameEntity, GameEntityKind, RelatedLink } from "@/lib/types/game-entity";

async function searchArticlesByKeyword(
  keyword: string,
  type: "news" | "guide",
  limit: number
): Promise<RelatedLink[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const pattern = `%${keyword.replace(/[%_,]/g, " ").trim()}%`;

  const { data } = await supabase
    .from("articles")
    .select("title, slug")
    .eq("status", "published")
    .eq("type", type)
    .or(`title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern}`)
    .limit(limit);

  return (data ?? [])
    .filter((row) => isGta6Content(row.title as string))
    .map((row) => ({
    title: row.title as string,
    href: type === "guide" ? `/guides/${row.slug}` : `/news/${row.slug}`,
    type: type === "guide" ? "Guide" : "News",
  }));
}

async function getFallbackArticles(type: "news" | "guide", limit: number): Promise<RelatedLink[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("title, slug")
    .eq("status", "published")
    .eq("type", type)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? [])
    .filter((row) => isGta6Content(row.title as string))
    .map((row) => ({
    title: row.title as string,
    href: type === "guide" ? `/guides/${row.slug}` : `/news/${row.slug}`,
    type: type === "guide" ? "Guide" : "News",
  }));
}

function trackerLinks(kind: GameEntityKind): RelatedLink[] {
  const config = ENTITY_KINDS[kind];
  const links: RelatedLink[] = [{ title: "Completion Tracker", href: "/tracker", type: "Tracker" }];

  if (config.trackerCategorySlug) {
    links.push({
      title: `${config.label} Tracker`,
      href: `/tracker/${config.trackerCategorySlug}`,
      type: "Tracker",
    });
  }

  links.push(
    { title: "100% Completion", href: "/tracker/100-percent-completion", type: "Tracker" },
    { title: "Collectibles Tracker", href: "/tracker/collectibles", type: "Tracker" }
  );

  return links;
}

const STATIC_LINKS: RelatedLink[] = [
  { title: "Interactive Map", href: "/map", type: "Map" },
  { title: "Leaderboard", href: "/leaderboard", type: "Community" },
  { title: "Latest News", href: "/news", type: "News" },
  { title: "Guides", href: "/guides", type: "Guide" },
];

export async function buildEntityPageData(
  kind: GameEntityKind,
  entity: GameEntity
): Promise<EntityPageData> {
  const keyword = entity.title.split(" ")[0];

  const [articles, guides, relatedEntities] = await Promise.all([
    searchArticlesByKeyword(keyword, "news", 3),
    searchArticlesByKeyword(keyword, "guide", 3),
    getRelatedEntities(kind, entity.slug, 4),
  ]);

  const relatedArticles =
    articles.length > 0 ? articles : await getFallbackArticles("news", 3);
  const relatedGuides =
    guides.length > 0 ? guides : await getFallbackArticles("guide", 3);

  const relatedTracker = trackerLinks(kind);

  const relatedEntitiesLinks: RelatedLink[] = relatedEntities.map(({ kind: k, entity: e }) => ({
    title: e.title,
    href: entityHref(k, e.slug),
    type: ENTITY_KINDS[k].labelSingular,
  }));

  const relatedEntitiesFinal = [
    ...relatedEntitiesLinks,
    ...STATIC_LINKS.filter(
      (l) => !relatedEntitiesLinks.some((r) => r.href === l.href)
    ),
  ].slice(0, 5);

  return {
    entity,
    faqs: [],
    relatedArticles,
    relatedGuides,
    relatedTracker,
    relatedEntities: relatedEntitiesFinal,
  };
}
