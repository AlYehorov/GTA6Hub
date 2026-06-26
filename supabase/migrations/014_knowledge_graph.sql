-- Sprint 6.0: GTA Knowledge Graph Foundation

do $$ begin
  create type kg_entity_kind as enum (
    'character',
    'location',
    'vehicle',
    'weapon',
    'mission',
    'business',
    'animal',
    'brand',
    'song',
    'organization'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type kg_entity_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type kg_link_source as enum ('manual', 'extracted', 'rule', 'sync');
exception
  when duplicate_object then null;
end $$;

create table if not exists kg_entities (
  id uuid primary key default gen_random_uuid(),
  kind kg_entity_kind not null,
  slug text not null,
  title text not null,
  aliases text[] not null default '{}',
  description text not null default '',
  image_url text,
  category text not null default '',
  first_seen_source text,
  first_seen_date timestamptz,
  status kg_entity_status not null default 'draft',
  legacy_game_table text,
  legacy_game_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);

create index if not exists kg_entities_kind_idx on kg_entities(kind);
create index if not exists kg_entities_status_idx on kg_entities(status);
create index if not exists kg_entities_title_idx on kg_entities(lower(title));
create index if not exists kg_entities_legacy_idx on kg_entities(legacy_game_table, legacy_game_id);

create table if not exists article_entities (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  entity_id uuid not null references kg_entities(id) on delete cascade,
  confidence numeric(4, 3) not null default 1.0,
  source kg_link_source not null default 'extracted',
  mention_count integer not null default 1,
  created_at timestamptz not null default now(),
  unique (article_id, entity_id)
);

create index if not exists article_entities_article_idx on article_entities(article_id);
create index if not exists article_entities_entity_idx on article_entities(entity_id);

create table if not exists video_entities (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  entity_id uuid not null references kg_entities(id) on delete cascade,
  confidence numeric(4, 3) not null default 1.0,
  source kg_link_source not null default 'extracted',
  mention_count integer not null default 1,
  created_at timestamptz not null default now(),
  unique (video_id, entity_id)
);

create index if not exists video_entities_video_idx on video_entities(video_id);
create index if not exists video_entities_entity_idx on video_entities(entity_id);

create table if not exists map_entities (
  id uuid primary key default gen_random_uuid(),
  map_point_id uuid not null references map_points(id) on delete cascade,
  entity_id uuid not null references kg_entities(id) on delete cascade,
  confidence numeric(4, 3) not null default 1.0,
  source kg_link_source not null default 'extracted',
  mention_count integer not null default 1,
  created_at timestamptz not null default now(),
  unique (map_point_id, entity_id)
);

create index if not exists map_entities_map_idx on map_entities(map_point_id);
create index if not exists map_entities_entity_idx on map_entities(entity_id);

create or replace function kg_entities_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists kg_entities_updated_at on kg_entities;
create trigger kg_entities_updated_at
  before update on kg_entities
  for each row execute function kg_entities_set_updated_at();

alter table kg_entities enable row level security;
alter table article_entities enable row level security;
alter table video_entities enable row level security;
alter table map_entities enable row level security;

drop policy if exists "kg_entities_public_read" on kg_entities;
create policy "kg_entities_public_read" on kg_entities
  for select using (status = 'published');

drop policy if exists "article_entities_public_read" on article_entities;
create policy "article_entities_public_read" on article_entities
  for select using (
    exists (
      select 1 from articles a
      where a.id = article_entities.article_id and a.status = 'published'
    )
  );

drop policy if exists "video_entities_public_read" on video_entities;
create policy "video_entities_public_read" on video_entities
  for select using (
    exists (
      select 1 from videos v
      where v.id = video_entities.video_id and v.status = 'published'
    )
  );

drop policy if exists "map_entities_public_read" on map_entities;
create policy "map_entities_public_read" on map_entities
  for select using (
    exists (
      select 1 from map_points m
      where m.id = map_entities.map_point_id and m.status = 'published'
    )
  );
