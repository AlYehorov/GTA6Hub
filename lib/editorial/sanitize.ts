const DRAFT_FOOTER_PATTERNS = [
  /\*?\s*draft\s+(generated|for)\s+[^*\n]+human\s+review[^*\n]*\*?/gi,
  /\*?\s*requires\s+human\s+review\s+before\s+publishing\.?\s*\*?/gi,
  /\*?\s*draft\s+for\s+human\s+review\.?\s*\*?/gi,
  /^---\s*\n\*[^*]+\*\s*$/gm,
];

const BASED_ON_PREFIX =
  /^based on\s+(rockstar\s+(newswire|youtube)|reddit|x(?:\s*\(twitter\))?|community)\s*:\s*/i;

export function sanitizeArticleContent(content: string): string {
  let text = content.trim();
  for (const pattern of DRAFT_FOOTER_PATTERNS) {
    text = text.replace(pattern, "");
  }
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function sanitizeArticleExcerpt(excerpt: string | null | undefined): string | null {
  if (!excerpt?.trim()) return null;
  let text = excerpt.trim();
  for (const pattern of DRAFT_FOOTER_PATTERNS) {
    text = text.replace(pattern, "");
  }
  text = text.replace(BASED_ON_PREFIX, "").trim();
  if (!text) return null;
  return text;
}

export function polishPublicExcerpt(
  excerpt: string | null | undefined,
  title: string
): string | null {
  const cleaned = sanitizeArticleExcerpt(excerpt);
  if (!cleaned) return null;
  if (cleaned.length < 24 || cleaned.toLowerCase() === title.toLowerCase()) {
    return null;
  }
  return cleaned;
}
