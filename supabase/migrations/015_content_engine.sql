-- Sprint 6.5: AI Content Generation Engine

create table if not exists ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  model text not null default 'gpt-4o-mini',
  estimated_input_tokens integer not null default 0,
  estimated_output_tokens integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_created_idx on ai_usage_events(created_at desc);
create index if not exists ai_usage_events_action_idx on ai_usage_events(action);

create table if not exists source_entities (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid not null references source_items(id) on delete cascade,
  entity_id uuid not null references kg_entities(id) on delete cascade,
  confidence numeric(4, 3) not null default 1.0,
  mention_count integer not null default 1,
  source text not null default 'extracted',
  created_at timestamptz not null default now(),
  unique (source_item_id, entity_id)
);

create index if not exists source_entities_source_idx on source_entities(source_item_id);

create table if not exists content_plans (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid references source_items(id) on delete cascade,
  video_id uuid references videos(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'ignored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_item_id is not null and video_id is null)
    or (source_item_id is null and video_id is not null)
  )
);

create index if not exists content_plans_source_idx on content_plans(source_item_id);
create index if not exists content_plans_video_idx on content_plans(video_id);

create table if not exists content_plan_ideas (
  id uuid primary key default gen_random_uuid(),
  content_plan_id uuid not null references content_plans(id) on delete cascade,
  idea_key text not null,
  title text not null,
  content_type text not null,
  target_keyword text not null default '',
  category text not null default '',
  search_intent text not null default 'informational',
  entity_ids uuid[] not null default '{}',
  internal_link_targets text[] not null default '{}',
  estimated_value text not null default '',
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  status text not null default 'planned' check (
    status in ('planned', 'draft_generated', 'ignored', 'workflow_sent')
  ),
  ai_draft_id uuid references ai_drafts(id) on delete set null,
  workspace_id uuid references article_workspaces(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_plan_id, idea_key)
);

create index if not exists content_plan_ideas_plan_idx on content_plan_ideas(content_plan_id);
create index if not exists content_plan_ideas_status_idx on content_plan_ideas(status);

alter table ai_drafts
  add column if not exists content_plan_idea_id uuid references content_plan_ideas(id) on delete set null;

create or replace function content_plans_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists content_plans_updated_at on content_plans;
create trigger content_plans_updated_at
  before update on content_plans
  for each row execute function content_plans_set_updated_at();

drop trigger if exists content_plan_ideas_updated_at on content_plan_ideas;
create trigger content_plan_ideas_updated_at
  before update on content_plan_ideas
  for each row execute function content_plans_set_updated_at();

alter table ai_usage_events enable row level security;
alter table source_entities enable row level security;
alter table content_plans enable row level security;
alter table content_plan_ideas enable row level security;
