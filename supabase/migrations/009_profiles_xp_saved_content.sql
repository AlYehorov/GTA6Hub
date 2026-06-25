-- Sprint: Profiles, XP, Achievements & Saved Content

-- Extend profiles
alter table profiles
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1;

-- Extend achievements (slug serves as stable key)
alter table achievements
  add column if not exists xp_reward integer not null default 0;

-- Saved articles
create table if not exists saved_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create index if not exists saved_articles_user_idx on saved_articles(user_id);
create index if not exists saved_articles_article_idx on saved_articles(article_id);

-- Saved map locations
create table if not exists saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  map_point_id uuid not null references map_points(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, map_point_id)
);

create index if not exists saved_locations_user_idx on saved_locations(user_id);
create index if not exists saved_locations_point_idx on saved_locations(map_point_id);

-- Article reads (one row per user/article for achievement tracking)
create table if not exists article_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create index if not exists article_reads_user_idx on article_reads(user_id);

-- Activity feed
create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists activity_events_user_idx on activity_events(user_id);
create index if not exists activity_events_created_idx on activity_events(created_at desc);

-- RLS
alter table saved_articles enable row level security;
alter table saved_locations enable row level security;
alter table article_reads enable row level security;
alter table activity_events enable row level security;

create policy "saved_articles_own_select" on saved_articles
  for select using (auth.uid() = user_id);

create policy "saved_articles_own_insert" on saved_articles
  for insert with check (auth.uid() = user_id);

create policy "saved_articles_own_delete" on saved_articles
  for delete using (auth.uid() = user_id);

create policy "saved_locations_own_select" on saved_locations
  for select using (auth.uid() = user_id);

create policy "saved_locations_own_insert" on saved_locations
  for insert with check (auth.uid() = user_id);

create policy "saved_locations_own_delete" on saved_locations
  for delete using (auth.uid() = user_id);

create policy "article_reads_own_select" on article_reads
  for select using (auth.uid() = user_id);

create policy "article_reads_own_insert" on article_reads
  for insert with check (auth.uid() = user_id);

create policy "activity_events_public_read" on activity_events
  for select using (true);

create policy "activity_events_own_insert" on activity_events
  for insert with check (auth.uid() = user_id);
