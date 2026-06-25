-- Sprint 4: source reliability labels

create type source_label as enum ('official', 'community', 'rumor', 'unconfirmed');

alter table source_items
  add column if not exists source_label source_label not null default 'unconfirmed';

create index if not exists source_items_source_label_idx on source_items(source_label);
create index if not exists source_items_source_url_idx on source_items(source_url);
