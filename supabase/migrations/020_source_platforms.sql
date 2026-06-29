-- Additional source platforms for community news ingestion

do $$ begin
  alter type source_platform add value 'google_news';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type source_platform add value 'community_youtube';
exception
  when duplicate_object then null;
end $$;
