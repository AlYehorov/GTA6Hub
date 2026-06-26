import { getAllSourceItemsAdmin } from "@/lib/sources/queries";
import { detectOutdatedArticles } from "@/lib/editorial/outdated";
import { gapsToMissingSeoPages } from "@/lib/editorial/missing-seo-pages";
import { detectContentGaps } from "@/lib/editorial/content-gaps";
import { rankContentOpportunities } from "@/lib/editorial/opportunities";
import { detectCannibalization } from "@/lib/seo/cannibalization";
import { fetchArticlesForSeoIntelligence } from "@/lib/seo/queries";
import { scoreSeoArticle, getImproveReasons } from "@/lib/seo/scoring";
import type { TaskGeneratorCandidate } from "@/lib/workflow/types";

function articleByTitleFuzzy(
  articles: Awaited<ReturnType<typeof fetchArticlesForSeoIntelligence>>,
  needle: string
) {
  const lower = needle.toLowerCase();
  return articles.find(
    (a) =>
      a.title.toLowerCase().includes(lower) ||
      lower.includes(a.title.toLowerCase().slice(0, 20))
  );
}

export async function generateEditorialTaskCandidates(): Promise<
  TaskGeneratorCandidate[]
> {
  const [sources, articles, gapsRaw, outdated] = await Promise.all([
    getAllSourceItemsAdmin({ limit: 40 }),
    fetchArticlesForSeoIntelligence(),
    detectContentGaps(40),
    detectOutdatedArticles(15),
  ]);

  const gaps = gapsToMissingSeoPages(gapsRaw, 25);
  const published = articles.filter((a) => a.status === "published");
  const scored = published.map(scoreSeoArticle);
  const cannibalization = detectCannibalization(scored, 8);

  const opportunities = rankContentOpportunities({
    sources,
    gaps: gapsRaw,
    existingArticleTitles: published.map((a) => a.title),
    limit: 12,
  });

  const candidates: TaskGeneratorCandidate[] = [];

  for (const source of sources.filter(
    (s) => s.source === "rockstar_newswire" || s.source === "rockstar_youtube"
  ).slice(0, 8)) {
    const existing = articleByTitleFuzzy(articles, source.title);
    candidates.push({
      title: existing ? `Update: ${source.title}` : `Create: ${source.title}`,
      description: existing
        ? `Rockstar published new material — refresh existing coverage with confirmed facts.`
        : `New Rockstar source — write coverage from official material only.`,
      category: existing ? "update" : "create",
      priority: source.source_label === "official" ? "high" : "medium",
      estimated_minutes: existing ? 25 : 45,
      created_from: source.source === "rockstar_youtube" ? "video" : "rockstar",
      related_source: source.id,
      related_article: existing?.id ?? null,
      dedupe_key: `rockstar|${source.id}`,
    });
  }

  for (const source of sources.filter((s) => s.source === "reddit").slice(0, 5)) {
    const existing = articleByTitleFuzzy(articles, source.title);
    candidates.push({
      title: existing
        ? `Update: ${source.title.slice(0, 80)}`
        : `Create: Reddit angle — ${source.title.slice(0, 60)}`,
      description: "Community discussion worth an explainer or roundup.",
      category: existing ? "update" : "create",
      priority: "medium",
      estimated_minutes: 35,
      created_from: "reddit",
      related_source: source.id,
      related_article: existing?.id ?? null,
      dedupe_key: `reddit|${source.id}`,
    });
  }

  for (const page of gaps.slice(0, 10)) {
    const existing = articleByTitleFuzzy(articles, page.title);
    candidates.push({
      title: existing
        ? `Update SEO: ${page.title}`
        : `Create: ${page.title} guide`,
      description: `Missing SEO coverage for ${page.kind} — ${page.reason === "no_entity_page" ? "entity page unpublished" : "no article mentions entity"}.`,
      category: existing ? "update" : "create",
      priority: "medium",
      estimated_minutes: existing ? 20 : 40,
      created_from: "missing_seo",
      related_article: existing?.id ?? null,
      dedupe_key: `missing_seo|${page.kind}|${page.slug}`,
    });
  }

  for (const stale of outdated) {
    candidates.push({
      title: `Update: ${stale.title}`,
      description: `Article is ${stale.daysSinceUpdate} days old. New Rockstar: ${stale.newestRockstarSourceTitle}`,
      category: "update",
      priority: "high",
      estimated_minutes: 30,
      created_from: "outdated",
      related_article: stale.id,
      dedupe_key: `outdated|${stale.id}`,
    });
  }

  for (const opp of opportunities.slice(0, 8)) {
    const existing = opp.sourceItemId
      ? null
      : articleByTitleFuzzy(articles, opp.title);
    candidates.push({
      title: existing ? `Update: ${opp.title}` : `Create: ${opp.title}`,
      description: opp.rationale,
      category: existing ? "update" : "create",
      priority:
        opp.stars >= 4 ? "high" : opp.stars >= 3 ? "medium" : "low",
      estimated_minutes: existing ? 25 : 45,
      created_from: "opportunity",
      related_source: opp.sourceItemId ?? null,
      related_article: existing?.id ?? null,
      dedupe_key: `opportunity|${opp.id}`,
    });
  }

  for (const pair of cannibalization) {
    candidates.push({
      title: `Merge: ${pair.articleATitle} ↔ ${pair.articleBTitle}`,
      description: pair.suggestion,
      category: "merge",
      priority: "high",
      estimated_minutes: 35,
      created_from: "cannibalization",
      related_article: pair.articleAId,
      dedupe_key: `merge|${pair.articleAId}|${pair.articleBId}`,
    });
  }

  for (const article of published) {
    const scored = scoreSeoArticle(article);
    const reasons = getImproveReasons(scored);
    if (reasons.includes("Missing FAQ")) {
      candidates.push({
        title: `Add FAQ to ${article.title}`,
        description: `SEO score ${scored.score}/100 — add FAQ section for rich results.`,
        category: "faq",
        priority: scored.score < 60 ? "high" : "medium",
        estimated_minutes: 15,
        created_from: "seo_improve",
        related_article: article.id,
        dedupe_key: `faq|${article.id}`,
      });
    }
    if (
      reasons.some((r) => r.includes("internal link") || r === "No internal links")
    ) {
      candidates.push({
        title: `Add internal links to ${article.title}`,
        description: `Only ${scored.internalLinkCount} internal link(s) — cross-link related entities and guides.`,
        category: "internal_links",
        priority: "medium",
        estimated_minutes: 12,
        created_from: "seo_improve",
        related_article: article.id,
        dedupe_key: `links|${article.id}`,
      });
    }
  }

  return candidates;
}
