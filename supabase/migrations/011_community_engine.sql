-- Sprint 7: Community Engine

do $$ begin
  create type community_post_type as enum (
    'screenshot',
    'theory',
    'discussion',
    'discovery',
    'collection'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type community_post_status as enum (
    'pending',
    'approved',
    'rejected'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists community_contests (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Screenshot of the Week',
  week_start date not null,
  week_end date not null,
  status text not null default 'voting' check (status in ('voting', 'closed', 'winner_selected')),
  winning_post_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_contests_status_idx on community_contests(status, week_start desc);

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type community_post_type not null,
  title text not null,
  body text,
  image_url text,
  contains_spoilers boolean not null default false,
  status community_post_status not null default 'pending',
  featured boolean not null default false,
  featured_at timestamptz,
  moderation_note text,
  related_map_point_id uuid references map_points(id) on delete set null,
  related_article_id uuid references articles(id) on delete set null,
  related_tracker_item_id uuid references completion_items(id) on delete set null,
  contest_id uuid references community_contests(id) on delete set null,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table community_contests
  drop constraint if exists community_contests_winning_post_fkey;
alter table community_contests
  add constraint community_contests_winning_post_fkey
  foreign key (winning_post_id) references community_posts(id) on delete set null;

create index if not exists community_posts_status_created_idx
  on community_posts(status, created_at desc);
create index if not exists community_posts_user_idx on community_posts(user_id);
create index if not exists community_posts_featured_idx on community_posts(featured, created_at desc);
create index if not exists community_posts_contest_idx on community_posts(contest_id);

create table if not exists community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists community_likes_post_idx on community_likes(post_id);
create index if not exists community_likes_user_idx on community_likes(user_id);

create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references community_comments(id) on delete cascade,
  depth smallint not null default 0 check (depth >= 0 and depth <= 2),
  body text not null,
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx on community_comments(post_id, created_at);
create index if not exists community_comments_parent_idx on community_comments(parent_id);

create table if not exists community_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'active' check (status in ('draft', 'active', 'closed')),
  show_results_after_vote boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_polls_status_idx on community_polls(status, created_at desc);

create table if not exists community_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references community_polls(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  vote_count integer not null default 0
);

create index if not exists community_poll_options_poll_idx on community_poll_options(poll_id, sort_order);

create table if not exists community_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references community_polls(id) on delete cascade,
  option_id uuid not null references community_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create table if not exists community_contest_votes (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references community_contests(id) on delete cascade,
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (contest_id, user_id)
);

create index if not exists community_contest_votes_contest_idx on community_contest_votes(contest_id);

create table if not exists community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists community_notifications_user_idx
  on community_notifications(user_id, created_at desc);

alter table profiles
  add column if not exists community_reputation integer not null default 0;

-- Counters
create or replace function community_posts_like_count_sync()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update community_posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update community_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists community_likes_count_trigger on community_likes;
create trigger community_likes_count_trigger
  after insert or delete on community_likes
  for each row execute function community_posts_like_count_sync();

create or replace function community_posts_comment_count_sync()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update community_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update community_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists community_comments_count_trigger on community_comments;
create trigger community_comments_count_trigger
  after insert or delete on community_comments
  for each row execute function community_posts_comment_count_sync();

create or replace function community_poll_vote_count_sync()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update community_poll_options set vote_count = vote_count + 1 where id = new.option_id;
    return new;
  elsif tg_op = 'DELETE' then
    update community_poll_options set vote_count = greatest(vote_count - 1, 0) where id = old.option_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists community_poll_votes_count_trigger on community_poll_votes;
create trigger community_poll_votes_count_trigger
  after insert or delete on community_poll_votes
  for each row execute function community_poll_vote_count_sync();

create or replace function update_community_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists community_posts_updated_at on community_posts;
create trigger community_posts_updated_at
  before update on community_posts
  for each row execute function update_community_updated_at();

drop trigger if exists community_comments_updated_at on community_comments;
create trigger community_comments_updated_at
  before update on community_comments
  for each row execute function update_community_updated_at();

-- RLS
alter table community_posts enable row level security;
alter table community_likes enable row level security;
alter table community_comments enable row level security;
alter table community_polls enable row level security;
alter table community_poll_options enable row level security;
alter table community_poll_votes enable row level security;
alter table community_contests enable row level security;
alter table community_contest_votes enable row level security;
alter table community_notifications enable row level security;

drop policy if exists "community_posts_public_read" on community_posts;
create policy "community_posts_public_read" on community_posts
  for select using (status = 'approved' or auth.uid() = user_id);

drop policy if exists "community_posts_own_insert" on community_posts;
create policy "community_posts_own_insert" on community_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "community_posts_own_update_pending" on community_posts;
create policy "community_posts_own_update_pending" on community_posts
  for update using (auth.uid() = user_id and status = 'pending');

drop policy if exists "community_likes_public_read" on community_likes;
create policy "community_likes_public_read" on community_likes for select using (true);
drop policy if exists "community_likes_own_insert" on community_likes;
create policy "community_likes_own_insert" on community_likes for insert with check (auth.uid() = user_id);
drop policy if exists "community_likes_own_delete" on community_likes;
create policy "community_likes_own_delete" on community_likes for delete using (auth.uid() = user_id);

drop policy if exists "community_comments_public_read" on community_comments;
create policy "community_comments_public_read" on community_comments for select using (true);
drop policy if exists "community_comments_own_insert" on community_comments;
create policy "community_comments_own_insert" on community_comments for insert with check (auth.uid() = user_id);

drop policy if exists "community_polls_public_read" on community_polls;
create policy "community_polls_public_read" on community_polls
  for select using (status in ('active', 'closed'));

drop policy if exists "community_poll_options_public_read" on community_poll_options;
create policy "community_poll_options_public_read" on community_poll_options for select using (true);

drop policy if exists "community_poll_votes_own_select" on community_poll_votes;
create policy "community_poll_votes_own_select" on community_poll_votes
  for select using (auth.uid() = user_id);
drop policy if exists "community_poll_votes_own_insert" on community_poll_votes;
create policy "community_poll_votes_own_insert" on community_poll_votes
  for insert with check (auth.uid() = user_id);

drop policy if exists "community_contests_public_read" on community_contests;
create policy "community_contests_public_read" on community_contests for select using (true);

drop policy if exists "community_contest_votes_public_read" on community_contest_votes;
create policy "community_contest_votes_public_read" on community_contest_votes for select using (true);
drop policy if exists "community_contest_votes_own_insert" on community_contest_votes;
create policy "community_contest_votes_own_insert" on community_contest_votes
  for insert with check (auth.uid() = user_id);
drop policy if exists "community_contest_votes_own_update" on community_contest_votes;
create policy "community_contest_votes_own_update" on community_contest_votes
  for update using (auth.uid() = user_id);

drop policy if exists "community_notifications_own_select" on community_notifications;
create policy "community_notifications_own_select" on community_notifications
  for select using (auth.uid() = user_id);
drop policy if exists "community_notifications_own_update" on community_notifications;
create policy "community_notifications_own_update" on community_notifications
  for update using (auth.uid() = user_id);

drop policy if exists "community_poll_votes_own_delete" on community_poll_votes;
create policy "community_poll_votes_own_delete" on community_poll_votes
  for delete using (auth.uid() = user_id);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do nothing;

drop policy if exists "community_images_public_read" on storage.objects;
create policy "community_images_public_read" on storage.objects
  for select using (bucket_id = 'community-images');

drop policy if exists "community_images_auth_upload" on storage.objects;
create policy "community_images_auth_upload" on storage.objects
  for insert with check (
    bucket_id = 'community-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "community_images_own_delete" on storage.objects;
create policy "community_images_own_delete" on storage.objects
  for delete using (
    bucket_id = 'community-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
