-- GTA6Hub Sprint 2: articles, categories, tags
-- Run in Supabase SQL Editor or via CLI

-- Enums
create type article_status as enum ('draft', 'published');
create type article_type as enum ('news', 'guide');

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Tags
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Articles
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  hero_image_url text,
  status article_status not null default 'draft',
  type article_type not null,
  reading_time_minutes integer not null default 0,
  category_id uuid references categories(id) on delete set null,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Article ↔ Tags
create table if not exists article_tags (
  article_id uuid not null references articles(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- Indexes
create index if not exists articles_slug_idx on articles(slug);
create index if not exists articles_type_status_idx on articles(type, status);
create index if not exists articles_published_at_idx on articles(published_at desc nulls last);
create index if not exists articles_category_id_idx on articles(category_id);

-- Updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists articles_updated_at on articles;
create trigger articles_updated_at
  before update on articles
  for each row execute function set_updated_at();

-- Row Level Security
alter table categories enable row level security;
alter table tags enable row level security;
alter table articles enable row level security;
alter table article_tags enable row level security;

-- Public read policies
create policy "categories_public_read" on categories for select using (true);
create policy "tags_public_read" on tags for select using (true);
create policy "articles_public_read" on articles for select using (status = 'published');
create policy "article_tags_public_read" on article_tags for select
  using (exists (
    select 1 from articles a
    where a.id = article_tags.article_id and a.status = 'published'
  ));

-- Storage bucket for hero images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images',
  'article-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Public read for article images
create policy "article_images_public_read" on storage.objects
  for select using (bucket_id = 'article-images');

-- Service role bypasses RLS for admin server actions

-- Seed categories
insert into categories (name, slug, description) values
  ('Trailer', 'trailer', 'Trailer breakdowns and analysis'),
  ('Official', 'official', 'Official announcements'),
  ('Analysis', 'analysis', 'Deep dives and analysis'),
  ('Walkthrough', 'walkthrough', 'Mission and story guides'),
  ('Secrets', 'secrets', 'Easter eggs and hidden content')
on conflict (slug) do nothing;

-- Seed tags
insert into tags (name, slug) values
  ('Lucia', 'lucia'),
  ('Jason', 'jason'),
  ('Vice City', 'vice-city'),
  ('Leonida', 'leonida'),
  ('Trailer 2', 'trailer-2'),
  ('Map', 'map'),
  ('Vehicles', 'vehicles')
on conflict (slug) do nothing;
