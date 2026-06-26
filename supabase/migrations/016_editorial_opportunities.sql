-- Sprint 6.6: Editorial Opportunity Engine

create table if not exists editorial_opportunities (
  id uuid primary key default gen_random_uuid(),
  cluster_key text not null unique,
  title text not null,
  score integer not null default 0,
  status text not null default 'open' check (
    status in ('open', 'draft_generated', 'ignored', 'workflow_sent')
  ),
  ai_draft_id uuid references ai_drafts(id) on delete set null,
  workspace_id uuid references article_workspaces(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editorial_opportunities_status_idx on editorial_opportunities(status);
create index if not exists editorial_opportunities_score_idx on editorial_opportunities(score desc);

create or replace function editorial_opportunities_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists editorial_opportunities_updated_at on editorial_opportunities;
create trigger editorial_opportunities_updated_at
  before update on editorial_opportunities
  for each row execute function editorial_opportunities_set_updated_at();

alter table editorial_opportunities enable row level security;
