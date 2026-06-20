-- GTA6Hub Sprint 3: Source Engine + AI Draft System

-- Source platform enum
create type source_platform as enum (
  'rockstar_newswire',
  'rockstar_youtube',
  'reddit',
  'x'
);

-- AI draft review status
create type ai_draft_status as enum (
  'pending',
  'approved',
  'rejected',
  'published'
);

-- External source items (raw ingested content)
create table if not exists source_items (
  id uuid primary key default gen_random_uuid(),
  source source_platform not null,
  source_type text not null,
  source_url text not null,
  external_id text not null,
  title text not null,
  content text not null default '',
  published_at timestamptz,
  processed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

-- AI-generated drafts (human review required — never auto-published)
create table if not exists ai_drafts (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid not null references source_items(id) on delete cascade,
  title text not null,
  excerpt text,
  content text not null default '',
  category text,
  suggested_tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  confidence numeric(3, 2) not null default 0.5,
  status ai_draft_status not null default 'pending',
  published_article_id uuid references articles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Analytics events (structured event log)
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists source_items_processed_idx on source_items(processed);
create index if not exists source_items_source_idx on source_items(source);
create index if not exists source_items_created_at_idx on source_items(created_at desc);
create index if not exists ai_drafts_status_idx on ai_drafts(status);
create index if not exists ai_drafts_created_at_idx on ai_drafts(created_at desc);
create index if not exists ai_drafts_source_item_id_idx on ai_drafts(source_item_id);
create index if not exists analytics_events_name_idx on analytics_events(event_name);
create index if not exists analytics_events_created_at_idx on analytics_events(created_at desc);

-- Full-text search on articles (for /search)
create index if not exists articles_search_idx on articles
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')));

-- Row Level Security
alter table source_items enable row level security;
alter table ai_drafts enable row level security;
alter table analytics_events enable row level security;

-- No public read — admin/service role only for source engine tables
-- (Service role bypasses RLS; anon key has no policies)
