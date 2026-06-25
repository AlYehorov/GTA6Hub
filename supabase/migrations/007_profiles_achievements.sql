-- Sprint 6: User Profiles & Achievements

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  favorite_category_id uuid references completion_categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) >= 3 and char_length(username) <= 24),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

create unique index if not exists profiles_username_lower_idx on profiles (lower(username));

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default 'award',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists profiles_username_idx on profiles(username);
create index if not exists user_achievements_user_idx on user_achievements(user_id);
create index if not exists user_achievements_achievement_idx on user_achievements(achievement_id);
create index if not exists user_achievements_unlocked_idx on user_achievements(unlocked_at desc);

alter table profiles enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;

create policy "profiles_public_read" on profiles
  for select using (true);

create policy "profiles_own_insert" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_own_update" on profiles
  for update using (auth.uid() = id);

create policy "achievements_public_read" on achievements
  for select using (true);

create policy "user_achievements_public_read" on user_achievements
  for select using (true);

create policy "user_achievements_own_insert" on user_achievements
  for insert with check (auth.uid() = user_id);

create or replace function update_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_profiles_updated_at();
