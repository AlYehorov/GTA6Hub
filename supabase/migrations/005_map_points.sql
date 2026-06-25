-- Sprint 5: Interactive map points

create type map_point_type as enum (
  'location',
  'business',
  'safehouse',
  'vehicle',
  'weapon',
  'easter_egg',
  'collectible',
  'wildlife',
  'activity',
  'mystery'
);

create type map_point_status as enum ('draft', 'pending', 'published', 'rejected');

create table if not exists map_points (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  type map_point_type not null,
  district text,
  lat numeric(5, 2) not null check (lat >= 0 and lat <= 100),
  lng numeric(5, 2) not null check (lng >= 0 and lng <= 100),
  image_url text,
  spoiler boolean not null default false,
  verified boolean not null default false,
  status map_point_status not null default 'draft',
  source_url text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists map_points_status_idx on map_points(status);
create index if not exists map_points_type_idx on map_points(type);
create index if not exists map_points_district_idx on map_points(district);
create index if not exists map_points_slug_idx on map_points(slug);

alter table map_points enable row level security;

create policy "map_points_public_read" on map_points
  for select using (status = 'published');

create or replace function update_map_points_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger map_points_updated_at
  before update on map_points
  for each row execute function update_map_points_updated_at();
