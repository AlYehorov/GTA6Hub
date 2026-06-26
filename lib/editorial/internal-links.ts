import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { ENTITY_KINDS } from "@/lib/entities/config";
import type { GameEntityKind } from "@/lib/types/game-entity";
import type { InternalLinkSuggestion, ArticleSeoInput } from "@/lib/editorial/types";

export interface LinkTarget {
  label: string;
  href: string;
  keywords: string[];
}

const INTERNAL_LINK_ENTITY_KINDS: GameEntityKind[] = [
  "characters",
  "locations",
  "vehicles",
  "businesses",
  "missions",
  "collectibles",
];

export interface PublishedVideoLinkRow {
  title: string;
  slug: string;
}

export interface PublishedEntityLinkRow {
  kind: GameEntityKind;
  slug: string;
  title: string;
}

export function buildLinkTargetsFromEditorialData(
  entities: PublishedEntityLinkRow[],
  articles: Array<{ title: string; slug: string; type: "news" | "guide" }>,
  videos: PublishedVideoLinkRow[]
): LinkTarget[] {
  const targets: LinkTarget[] = [];

  for (const row of entities) {
    const config = ENTITY_KINDS[row.kind];
    targets.push({
      label: row.title,
      href: `${config.routePrefix}/${row.slug}`,
      keywords: [row.title.toLowerCase(), row.slug.replace(/-/g, " ")],
    });
  }

  for (const row of articles) {
    const prefix = row.type === "guide" ? "/guides" : "/news";
    targets.push({
      label: row.title,
      href: `${prefix}/${row.slug}`,
      keywords: [row.title.toLowerCase(), row.slug.replace(/-/g, " ")],
    });
  }

  for (const row of videos) {
    targets.push({
      label: row.title,
      href: `/videos/${row.slug}`,
      keywords: [row.title.toLowerCase()],
    });
  }

  return targets;
}

function contentHasLink(content: string, href: string): boolean {
  return content.toLowerCase().includes(href.toLowerCase());
}

function titleMentionsKeyword(title: string, keyword: string): boolean {
  const t = title.toLowerCase();
  const k = keyword.toLowerCase();
  if (k.length < 4) return false;
  return t.includes(k);
}

export function suggestInternalLinksFromArticles(
  articles: ArticleSeoInput[],
  targets: LinkTarget[],
  limit = 12
): InternalLinkSuggestion[] {
  const recentArticles = [...articles]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 40);

  const suggestions: InternalLinkSuggestion[] = [];

  for (const article of recentArticles) {
    const suggestedLinks: InternalLinkSuggestion["suggestedLinks"] = [];

    for (const target of targets) {
      if (target.href.includes(article.slug)) continue;
      if (contentHasLink(article.content, target.href)) continue;

      const mentionedInTitle = target.keywords.some((kw) =>
        titleMentionsKeyword(article.title, kw)
      );
      const mentionedInContent = target.keywords.some(
        (kw) => kw.length >= 5 && article.content.toLowerCase().includes(kw)
      );

      if (!mentionedInTitle && !mentionedInContent) continue;

      suggestedLinks.push({
        label: target.label,
        href: target.href,
        reason: mentionedInTitle ? "topic in title" : "mentioned in body",
      });
    }

    if (suggestedLinks.length === 0) continue;

    suggestions.push({
      articleId: article.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      articleType: article.type,
      suggestedLinks: suggestedLinks.slice(0, 6),
    });
  }

  return suggestions
    .sort((a, b) => b.suggestedLinks.length - a.suggestedLinks.length)
    .slice(0, limit);
}

/** Standalone loader — prefer dashboard bundle to avoid duplicate queries. */
export async function suggestInternalLinks(
  limit = 12
): Promise<InternalLinkSuggestion[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();

  const entityFetches = INTERNAL_LINK_ENTITY_KINDS.map(async (kind) => {
    const config = ENTITY_KINDS[kind];
    const { data } = await supabase
      .from(config.table)
      .select("slug, title")
      .eq("status", "published");

    return (data ?? []).map((row) => ({
      kind,
      slug: row.slug as string,
      title: row.title as string,
    }));
  });

  const [{ data: articles }, { data: videos }, ...entityGroups] = await Promise.all([
    supabase
      .from("articles")
      .select(
        "id, title, slug, type, excerpt, content, hero_image_url, seo_title, seo_description, video_id, published_at, updated_at"
      )
      .eq("status", "published"),
    supabase
      .from("videos")
      .select("title, slug")
      .eq("status", "published")
      .limit(30),
    ...entityFetches,
  ]);

  const entities = entityGroups.flat();
  const publishedArticles = (articles ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    type: row.type as "news" | "guide",
    excerpt: (row.excerpt as string | null) ?? null,
    content: row.content as string,
    hero_image_url: (row.hero_image_url as string | null) ?? null,
    seo_title: (row.seo_title as string | null) ?? null,
    seo_description: (row.seo_description as string | null) ?? null,
    video_id: (row.video_id as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    updated_at: row.updated_at as string,
  }));

  const targets = buildLinkTargetsFromEditorialData(
    entities,
    publishedArticles.map((a) => ({ title: a.title, slug: a.slug, type: a.type })),
    (videos ?? []).map((row) => ({
      title: row.title as string,
      slug: row.slug as string,
    }))
  );

  return suggestInternalLinksFromArticles(publishedArticles, targets, limit);
}
