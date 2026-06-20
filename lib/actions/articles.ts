"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { calculateReadingTime, slugify } from "@/lib/utils/article";
import type { ArticleFormData, ArticleStatus, ArticleType } from "@/lib/types/article";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function revalidateArticlePaths(type: ArticleType, slug: string) {
  revalidatePath(type === "news" ? "/news" : "/guides");
  revalidatePath(type === "news" ? `/news/${slug}` : `/guides/${slug}`);
  revalidatePath("/admin/articles");
  revalidatePath("/admin");
}

async function syncArticleTags(articleId: string, tagIds: string[]) {
  const supabase = createAdminClient();
  await supabase.from("article_tags").delete().eq("article_id", articleId);

  if (tagIds.length === 0) return;

  await supabase.from("article_tags").insert(
    tagIds.map((tag_id) => ({ article_id: articleId, tag_id }))
  );
}

function buildArticlePayload(data: ArticleFormData, existingPublishedAt?: string | null) {
  const reading_time_minutes = calculateReadingTime(data.content);
  const published_at =
    data.status === "published"
      ? (existingPublishedAt ?? new Date().toISOString())
      : null;

  return {
    title: data.title.trim(),
    slug: data.slug.trim() || slugify(data.title),
    excerpt: data.excerpt.trim() || null,
    content: data.content,
    hero_image_url: data.hero_image_url.trim() || null,
    status: data.status as ArticleStatus,
    type: data.type as ArticleType,
    reading_time_minutes,
    category_id: data.category_id || null,
    seo_title: data.seo_title.trim() || null,
    seo_description: data.seo_description.trim() || null,
    published_at,
  };
}

export async function createArticle(
  data: ArticleFormData
): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  const supabase = createAdminClient();
  const payload = buildArticlePayload(data);

  const { data: article, error } = await supabase
    .from("articles")
    .insert(payload)
    .select("id, slug, type")
    .single();

  if (error || !article) {
    return { success: false, error: error?.message ?? "Failed to create article" };
  }

  await syncArticleTags(article.id, data.tag_ids);
  revalidateArticlePaths(article.type, article.slug);

  return { success: true, id: article.id };
}

export async function updateArticle(
  id: string,
  data: ArticleFormData
): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("articles")
    .select("published_at")
    .eq("id", id)
    .single();

  const payload = buildArticlePayload(data, existing?.published_at);

  const { data: article, error } = await supabase
    .from("articles")
    .update(payload)
    .eq("id", id)
    .select("id, slug, type")
    .single();

  if (error || !article) {
    return { success: false, error: error?.message ?? "Failed to update article" };
  }

  await syncArticleTags(id, data.tag_ids);
  revalidateArticlePaths(article.type, article.slug);

  return { success: true, id: article.id };
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase admin is not configured" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/articles");
  revalidatePath("/news");
  revalidatePath("/guides");

  return { success: true };
}

export async function uploadArticleImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    await requireAdminUser();
  } catch {
    return { error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { error: "Supabase admin is not configured" };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${slugify(file.name.replace(`.${ext}`, ""))}.${ext}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from("article-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("article-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function redirectToArticles() {
  redirect("/admin/articles");
}
