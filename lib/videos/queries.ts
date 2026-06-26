import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Video, VideoCategory, VideoStatus } from "@/lib/types/video";
import { slugify } from "@/lib/utils/article";

function rowToVideo(row: Record<string, unknown>): Video {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    youtube_id: row.youtube_id as string,
    description: row.description as string,
    source_channel: row.source_channel as string,
    source_url: row.source_url as string,
    published_at: (row.published_at as string | null) ?? null,
    category: row.category as VideoCategory,
    status: row.status as VideoStatus,
    source_item_id: (row.source_item_id as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getPublishedVideos(limit = 50): Promise<Video[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => rowToVideo(row as Record<string, unknown>));
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return null;
  return rowToVideo(data as Record<string, unknown>);
}

export async function getDraftVideosAdmin(limit = 20): Promise<Video[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => rowToVideo(row as Record<string, unknown>));
}

export async function getAllVideosAdmin(): Promise<Video[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => rowToVideo(row as Record<string, unknown>));
}

export async function publishVideoAdmin(id: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = createAdminClient();
  await supabase
    .from("videos")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
}

async function uniqueVideoSlug(title: string): Promise<string> {
  const supabase = createAdminClient();
  const base = slugify(title);
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? base : `${base}-${suffix}`;
    const { data } = await supabase.from("videos").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    suffix++;
  }
}

export async function upsertVideoFromYoutubeSource(input: {
  title: string;
  youtube_id: string;
  description: string;
  source_url: string;
  source_item_id?: string;
  published_at?: string | null;
  category?: VideoCategory;
  autoPublish?: boolean;
}): Promise<Video | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("videos")
    .select("*")
    .eq("youtube_id", input.youtube_id)
    .maybeSingle();

  if (existing) {
    return rowToVideo(existing as Record<string, unknown>);
  }

  const isTrailer = /trailer/i.test(input.title);
  const category = input.category ?? (isTrailer ? "official_trailer" : "official_video");
  const slug = await uniqueVideoSlug(input.title);

  const { data, error } = await supabase
    .from("videos")
    .insert({
      title: input.title,
      slug,
      youtube_id: input.youtube_id,
      description: input.description,
      source_channel: "Rockstar Games",
      source_url: input.source_url,
      published_at: input.published_at ?? null,
      category,
      status: input.autoPublish ? "published" : "draft",
      source_item_id: input.source_item_id ?? null,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return rowToVideo(data as Record<string, unknown>);
}

export async function getVideoBySourceItemId(sourceItemId: string): Promise<Video | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("source_item_id", sourceItemId)
    .maybeSingle();

  if (!data) return null;
  return rowToVideo(data as Record<string, unknown>);
}
