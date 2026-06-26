-- Newsroom + Video Hub

create type video_category as enum (
  'official_trailer',
  'official_video',
  'trailer_breakdown',
  'community_analysis',
  'news_recap'
);

create type video_status as enum ('draft', 'published');

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  youtube_id text not null unique,
  description text not null default '',
  source_channel text not null default 'Rockstar Games',
  source_url text not null,
  published_at timestamptz,
  category video_category not null default 'official_video',
  status video_status not null default 'draft',
  source_item_id uuid references source_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_status_idx on videos(status);
create index if not exists videos_category_idx on videos(category);
create index if not exists videos_published_idx on videos(published_at desc);
create index if not exists videos_youtube_idx on videos(youtube_id);

alter table articles
  add column if not exists source_label source_label,
  add column if not exists source_url text,
  add column if not exists source_item_id uuid references source_items(id) on delete set null,
  add column if not exists video_id uuid references videos(id) on delete set null,
  add column if not exists ai_confidence numeric(4, 3);

alter table videos enable row level security;

create policy "videos_public_read" on videos
  for select using (status = 'published');

create or replace function update_videos_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger videos_updated_at
  before update on videos
  for each row execute function update_videos_updated_at();
