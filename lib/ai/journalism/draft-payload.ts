export function withoutJournalismColumns<T extends Record<string, unknown>>(payload: T) {
  const next = { ...payload };
  delete next.content_blocks;
  delete next.seo_og_title;
  delete next.seo_twitter_title;
  delete next.seo_canonical;
  delete next.seo_keywords;
  return next;
}
