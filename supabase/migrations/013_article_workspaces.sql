-- Milestone 5.1: Article-centric editorial workspaces

do $$ begin
  create type article_workspace_status as enum (
    'needs_improvement',
    'claimed',
    'in_progress',
    'review',
    'completed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists article_workspaces (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  status article_workspace_status not null default 'needs_improvement',
  seo_score integer not null default 0,
  potential_score integer not null default 0,
  estimated_minutes integer not null default 0,
  checklist jsonb not null default '[]'::jsonb,
  reason text not null default '',
  related_source_ids uuid[] not null default '{}',
  assigned_to text,
  locked_at timestamptz,
  article_content_hash text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists article_workspaces_active_article_uidx
  on article_workspaces(article_id)
  where status not in ('completed', 'archived');

create index if not exists article_workspaces_status_idx on article_workspaces(status);
create index if not exists article_workspaces_updated_idx on article_workspaces(updated_at desc);
create index if not exists article_workspaces_article_idx on article_workspaces(article_id);

create table if not exists article_workspace_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references article_workspaces(id) on delete cascade,
  event_type text not null,
  message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists article_workspace_activity_workspace_idx
  on article_workspace_activity(workspace_id, created_at desc);

create or replace function article_workspaces_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists article_workspaces_updated_at on article_workspaces;
create trigger article_workspaces_updated_at
  before update on article_workspaces
  for each row execute function article_workspaces_set_updated_at();

alter table article_workspaces enable row level security;
alter table article_workspace_activity enable row level security;
