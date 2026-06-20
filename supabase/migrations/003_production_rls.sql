-- GTA6Hub Production RLS hardening
-- Run after 001 and 002 migrations.

-- Articles: public can only read published (policy exists in 001 — reassert for clarity)
drop policy if exists "articles_public_read" on articles;
create policy "articles_public_read" on articles
  for select using (status = 'published');

-- Article tags: only for published articles (policy exists in 001)
drop policy if exists "article_tags_public_read" on article_tags;
create policy "article_tags_public_read" on article_tags
  for select using (
    exists (
      select 1 from articles a
      where a.id = article_tags.article_id and a.status = 'published'
    )
  );

-- source_items, ai_drafts, analytics_events: no public policies.
-- RLS enabled + zero policies = deny all for anon/authenticated roles.
-- Service role (server-side admin only) bypasses RLS.

-- Storage: public read for article images only
drop policy if exists "article_images_public_read" on storage.objects;
create policy "article_images_public_read" on storage.objects
  for select using (bucket_id = 'article-images');
