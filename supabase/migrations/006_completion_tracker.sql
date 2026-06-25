-- Sprint 5: Completion Tracker

create type completion_difficulty as enum ('easy', 'medium', 'hard');
create type completion_item_status as enum ('draft', 'published');

create table if not exists completion_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  icon text not null default 'circle',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists completion_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references completion_categories(id) on delete cascade,
  title text not null,
  description text not null default '',
  spoiler boolean not null default false,
  difficulty completion_difficulty not null default 'medium',
  image_url text,
  sort_order integer not null default 0,
  status completion_item_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references completion_items(id) on delete cascade,
  completed boolean not null default true,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists completion_items_category_idx on completion_items(category_id);
create index if not exists completion_items_status_idx on completion_items(status);
create index if not exists user_progress_user_idx on user_progress(user_id);
create index if not exists user_progress_item_idx on user_progress(item_id);

alter table completion_categories enable row level security;
alter table completion_items enable row level security;
alter table user_progress enable row level security;

create policy "completion_categories_public_read" on completion_categories
  for select using (true);

create policy "completion_items_public_read" on completion_items
  for select using (status = 'published');

create policy "user_progress_own_select" on user_progress
  for select using (auth.uid() = user_id);

create policy "user_progress_own_insert" on user_progress
  for insert with check (auth.uid() = user_id);

create policy "user_progress_own_update" on user_progress
  for update using (auth.uid() = user_id);

create policy "user_progress_own_delete" on user_progress
  for delete using (auth.uid() = user_id);

create or replace function update_completion_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger completion_items_updated_at
  before update on completion_items
  for each row execute function update_completion_items_updated_at();
