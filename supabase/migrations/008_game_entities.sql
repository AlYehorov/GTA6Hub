-- Sprint 6: Programmatic SEO — Game Knowledge Base Entities

create type game_entity_status as enum ('draft', 'published');

create table if not exists game_locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text,
  category text not null default 'location',
  seo_title text,
  seo_description text,
  status game_entity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_characters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text,
  category text not null default 'character',
  seo_title text,
  seo_description text,
  status game_entity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text,
  category text not null default 'vehicle',
  seo_title text,
  seo_description text,
  status game_entity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_weapons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text,
  category text not null default 'weapon',
  seo_title text,
  seo_description text,
  status game_entity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text,
  category text not null default 'business',
  seo_title text,
  seo_description text,
  status game_entity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_animals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text,
  category text not null default 'animal',
  seo_title text,
  seo_description text,
  status game_entity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_collectibles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text,
  category text not null default 'collectible',
  seo_title text,
  seo_description text,
  status game_entity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_missions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text,
  category text not null default 'mission',
  seo_title text,
  seo_description text,
  status game_entity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indexes
create index if not exists game_locations_status_idx on game_locations(status);
create index if not exists game_characters_status_idx on game_characters(status);
create index if not exists game_vehicles_status_idx on game_vehicles(status);
create index if not exists game_weapons_status_idx on game_weapons(status);
create index if not exists game_businesses_status_idx on game_businesses(status);
create index if not exists game_animals_status_idx on game_animals(status);
create index if not exists game_collectibles_status_idx on game_collectibles(status);
create index if not exists game_missions_status_idx on game_missions(status);

-- RLS
alter table game_locations enable row level security;
alter table game_characters enable row level security;
alter table game_vehicles enable row level security;
alter table game_weapons enable row level security;
alter table game_businesses enable row level security;
alter table game_animals enable row level security;
alter table game_collectibles enable row level security;
alter table game_missions enable row level security;

create policy "game_locations_public_read" on game_locations for select using (status = 'published');
create policy "game_characters_public_read" on game_characters for select using (status = 'published');
create policy "game_vehicles_public_read" on game_vehicles for select using (status = 'published');
create policy "game_weapons_public_read" on game_weapons for select using (status = 'published');
create policy "game_businesses_public_read" on game_businesses for select using (status = 'published');
create policy "game_animals_public_read" on game_animals for select using (status = 'published');
create policy "game_collectibles_public_read" on game_collectibles for select using (status = 'published');
create policy "game_missions_public_read" on game_missions for select using (status = 'published');

-- updated_at triggers
create or replace function update_game_entity_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger game_locations_updated_at before update on game_locations for each row execute function update_game_entity_updated_at();
create trigger game_characters_updated_at before update on game_characters for each row execute function update_game_entity_updated_at();
create trigger game_vehicles_updated_at before update on game_vehicles for each row execute function update_game_entity_updated_at();
create trigger game_weapons_updated_at before update on game_weapons for each row execute function update_game_entity_updated_at();
create trigger game_businesses_updated_at before update on game_businesses for each row execute function update_game_entity_updated_at();
create trigger game_animals_updated_at before update on game_animals for each row execute function update_game_entity_updated_at();
create trigger game_collectibles_updated_at before update on game_collectibles for each row execute function update_game_entity_updated_at();
create trigger game_missions_updated_at before update on game_missions for each row execute function update_game_entity_updated_at();
