-- Milestone 5: Editorial Workflow Engine

do $$ begin
  create type editorial_task_status as enum (
    'opportunity',
    'claimed',
    'drafting',
    'seo_review',
    'fact_check',
    'ready',
    'scheduled',
    'published',
    'needs_update',
    'archived',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type editorial_task_priority as enum (
    'critical',
    'high',
    'medium',
    'low'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists editorial_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'create',
  priority editorial_task_priority not null default 'medium',
  estimated_minutes integer not null default 30,
  status editorial_task_status not null default 'opportunity',
  created_from text not null default 'manual',
  related_source uuid references source_items(id) on delete set null,
  related_article uuid references articles(id) on delete set null,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists editorial_tasks_status_idx on editorial_tasks(status);
create index if not exists editorial_tasks_priority_idx on editorial_tasks(priority);
create index if not exists editorial_tasks_created_at_idx on editorial_tasks(created_at desc);
create index if not exists editorial_tasks_related_article_idx on editorial_tasks(related_article);
create index if not exists editorial_tasks_related_source_idx on editorial_tasks(related_source);
create index if not exists editorial_tasks_active_dedup_idx
  on editorial_tasks(lower(title), created_from)
  where status not in ('published', 'archived', 'cancelled');

create or replace function editorial_tasks_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists editorial_tasks_updated_at on editorial_tasks;
create trigger editorial_tasks_updated_at
  before update on editorial_tasks
  for each row execute function editorial_tasks_set_updated_at();

alter table editorial_tasks enable row level security;
