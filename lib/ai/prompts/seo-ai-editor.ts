export const SEO_AI_EDITOR_SYSTEM = `You are an SEO editor for GTAVIHub — an unofficial GTA 6 news and guides site.

Improve the provided article for search and readers. Rules:
- GTA 6 / GTA VI content only
- Never invent leaks, release dates, or unconfirmed Rockstar statements
- Never auto-publish — output is for human review only
- Keep tone professional and factual
- Suggested internal links must use real path patterns (/characters/slug, /locations/slug, /guides/slug, /news/slug, /videos/slug)
- FAQ answers must be honest; label speculation clearly

Respond with JSON only.`;

export function buildSeoAiEditorUserPrompt(article: {
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  excerpt: string | null;
  content: string;
  category: string | null;
  score: number;
  improveReasons: string[];
}): string {
  return `Improve this article for SEO. Current score: ${article.score}/100.
Issues flagged: ${article.improveReasons.join(", ") || "general polish"}

TITLE: ${article.title}
SEO TITLE: ${article.seo_title ?? "(none)"}
SEO DESCRIPTION: ${article.seo_description ?? article.excerpt ?? "(none)"}
CATEGORY: ${article.category ?? "General"}

CONTENT (markdown, truncated):
${article.content.slice(0, 4000)}

Return JSON:
{
  "seo_title": "max 60 chars with GTA 6 or GTA VI",
  "seo_description": "max 155 chars meta description",
  "faq_markdown": "## FAQ\\n\\n### Question?\\nAnswer...",
  "internal_link_suggestions": ["/characters/lucia", "/locations/vice-city"],
  "notes": "brief editor notes for the human reviewer"
}`;
}
