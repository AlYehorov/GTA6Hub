-- Link opportunity-engine drafts back to editor briefing

alter table ai_drafts
  add column if not exists opportunity_cluster_key text;

create index if not exists ai_drafts_opportunity_cluster_idx
  on ai_drafts(opportunity_cluster_key)
  where opportunity_cluster_key is not null;
