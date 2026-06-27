-- Sprint 8.0: SEO & Analytics integration storage

create table if not exists integration_settings (
  id text primary key,
  property_url text,
  verification_status text not null default 'pending' check (
    verification_status in ('pending', 'verified', 'failed', 'not_configured')
  ),
  config jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('gsc', 'ga4', 'clarity')),
  snapshot_type text not null,
  period_start date,
  period_end date,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_snapshots_lookup_idx
  on analytics_snapshots(source, snapshot_type, created_at desc);

create table if not exists analytics_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('running', 'success', 'error', 'partial')),
  message text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists analytics_sync_runs_source_idx
  on analytics_sync_runs(source, started_at desc);

create or replace function integration_settings_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists integration_settings_updated_at on integration_settings;
create trigger integration_settings_updated_at
  before update on integration_settings
  for each row execute function integration_settings_set_updated_at();

alter table integration_settings enable row level security;
alter table analytics_snapshots enable row level security;
alter table analytics_sync_runs enable row level security;
