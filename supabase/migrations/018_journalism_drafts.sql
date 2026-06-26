-- Structured article blocks from journalism generator (compiled markdown still in content)
ALTER TABLE ai_drafts
  ADD COLUMN IF NOT EXISTS content_blocks jsonb,
  ADD COLUMN IF NOT EXISTS seo_og_title text,
  ADD COLUMN IF NOT EXISTS seo_twitter_title text,
  ADD COLUMN IF NOT EXISTS seo_canonical text,
  ADD COLUMN IF NOT EXISTS seo_keywords text[];

COMMENT ON COLUMN ai_drafts.content_blocks IS 'Structured journalism blocks (heading, paragraph, entity, sources, etc.)';
