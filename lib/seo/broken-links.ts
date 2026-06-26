import { INTERNAL_LINK_PATTERN } from "@/lib/seo/scoring";
import type { BrokenInternalLink, SeoArticleRecord } from "@/lib/seo/types";

export function buildValidInternalPathSet(paths: string[]): Set<string> {
  return new Set(paths.map((p) => p.toLowerCase()));
}

export function detectBrokenInternalLinks(
  articles: SeoArticleRecord[],
  validPaths: Set<string>,
  limit = 30
): BrokenInternalLink[] {
  const broken: BrokenInternalLink[] = [];
  const markdownLinkPattern = /\[([^\]]*)\]\((\/[^)]+)\)/gi;

  for (const article of articles) {
    if (article.status !== "published") continue;

    const hrefs = new Set<string>();

    for (const match of article.content.matchAll(markdownLinkPattern)) {
      hrefs.add((match[2] as string).split("#")[0].split("?")[0].toLowerCase());
    }

    for (const match of article.content.matchAll(INTERNAL_LINK_PATTERN)) {
      hrefs.add(match[0].toLowerCase());
    }

    for (const href of hrefs) {
      if (!href.startsWith("/")) continue;
      if (validPaths.has(href)) continue;

      broken.push({
        articleId: article.id,
        articleTitle: article.title,
        href,
      });
    }
  }

  return broken.slice(0, limit);
}

export function collectValidPaths(input: {
  articlePaths: string[];
  entityPaths: string[];
  videoPaths: string[];
}): Set<string> {
  const staticPaths = [
    "/characters",
    "/vehicles",
    "/locations",
    "/news",
    "/guides",
    "/videos",
    "/map",
    "/tracker",
    "/newsroom",
  ];

  return buildValidInternalPathSet([
    ...staticPaths,
    ...input.articlePaths,
    ...input.entityPaths,
    ...input.videoPaths,
  ]);
}
