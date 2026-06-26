"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthenticatedUserId } from "@/lib/actions/tracker-progress";
import { requireAdminUser } from "@/lib/auth/admin";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/community/constants";
import { createCommunityNotification } from "@/lib/community/notifications";
import { awardCommunityReputation } from "@/lib/community/reputation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { CreateCommunityPostInput } from "@/lib/types/community";

export interface CommunityActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function revalidateCommunity() {
  revalidatePath("/community");
  revalidatePath("/community/contest");
  revalidatePath("/notifications");
  revalidatePath("/profile");
  revalidatePath("/u");
  revalidatePath("/");
  revalidateTag("community");
  revalidateTag("homepage");
}

export async function uploadCommunityImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "login_required" };
  if (!isSupabaseConfigured()) return { error: "Not configured" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be under 5MB" };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return { error: "Only PNG, JPEG, and WEBP images are allowed" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("community-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from("community-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function createCommunityPost(
  input: CreateCommunityPostInput
): Promise<CommunityActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "login_required" };
  if (!isSupabaseConfigured()) return { success: false, error: "Not configured" };

  if (!input.title.trim()) return { success: false, error: "Title is required" };
  if (input.type === "screenshot" && !input.image_url) {
    return { success: false, error: "Screenshot posts require an image" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: userId,
      type: input.type,
      title: input.title.trim(),
      body: input.body?.trim() || null,
      image_url: input.image_url ?? null,
      contains_spoilers: Boolean(input.contains_spoilers),
      related_map_point_id: input.related_map_point_id || null,
      related_article_id: input.related_article_id || null,
      related_tracker_item_id: input.related_tracker_item_id || null,
      contest_id: input.contest_id || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidateCommunity();
  return { success: true, id: data.id as string };
}

export async function toggleCommunityLike(postId: string): Promise<CommunityActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "login_required" };
  if (!isSupabaseConfigured()) return { success: false, error: "Not configured" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("community_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) return { success: false, error: error.message };
    revalidateCommunity();
    return { success: true };
  }

  const { data: post } = await supabase
    .from("community_posts")
    .select("user_id, title")
    .eq("id", postId)
    .maybeSingle();

  const { error } = await supabase.from("community_likes").insert({
    post_id: postId,
    user_id: userId,
  });

  if (error) return { success: false, error: error.message };

  if (post && post.user_id !== userId) {
    await awardCommunityReputation(post.user_id as string, "like_received");
    await createCommunityNotification({
      userId: post.user_id as string,
      type: "post_liked",
      title: "Someone liked your post",
      body: post.title as string,
      link: `/community/${postId}`,
      metadata: { post_id: postId, liker_id: userId },
    });
  }

  revalidateCommunity();
  return { success: true };
}

export async function createCommunityComment(input: {
  postId: string;
  body: string;
  parentId?: string;
  contains_spoilers?: boolean;
}): Promise<CommunityActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "login_required" };
  if (!isSupabaseConfigured()) return { success: false, error: "Not configured" };
  if (!input.body.trim()) return { success: false, error: "Comment cannot be empty" };

  const supabase = await createClient();
  let depth = 0;

  if (input.parentId) {
    const { data: parent } = await supabase
      .from("community_comments")
      .select("depth, user_id, post_id")
      .eq("id", input.parentId)
      .maybeSingle();

    if (!parent || parent.post_id !== input.postId) {
      return { success: false, error: "Invalid parent comment" };
    }

    depth = Number(parent.depth) + 1;
    if (depth > 2) return { success: false, error: "Maximum reply depth reached" };
  }

  const { data, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: input.postId,
      user_id: userId,
      parent_id: input.parentId ?? null,
      depth,
      body: input.body.trim(),
      contains_spoilers: Boolean(input.contains_spoilers),
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  if (input.parentId) {
    const { data: parent } = await supabase
      .from("community_comments")
      .select("user_id")
      .eq("id", input.parentId)
      .maybeSingle();

    if (parent && parent.user_id !== userId) {
      await createCommunityNotification({
        userId: parent.user_id as string,
        type: "comment_reply",
        title: "New reply to your comment",
        link: `/community/${input.postId}`,
        metadata: { post_id: input.postId, comment_id: data.id },
      });
    }
  }

  revalidatePath(`/community/${input.postId}`);
  revalidateCommunity();
  return { success: true, id: data.id as string };
}

export async function voteCommunityPoll(
  pollId: string,
  optionId: string
): Promise<CommunityActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "login_required" };
  if (!isSupabaseConfigured()) return { success: false, error: "Not configured" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_poll_votes")
    .select("id, option_id")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.option_id === optionId) return { success: true };
    const admin = isSupabaseAdminConfigured() ? createAdminClient() : supabase;
    await admin.from("community_poll_votes").delete().eq("id", existing.id);
  }

  const { error } = await supabase.from("community_poll_votes").insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: userId,
  });

  if (error) return { success: false, error: error.message };

  revalidateCommunity();
  return { success: true };
}

export async function voteContestEntry(
  contestId: string,
  postId: string
): Promise<CommunityActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "login_required" };
  if (!isSupabaseConfigured()) return { success: false, error: "Not configured" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_contest_votes")
    .select("id, post_id")
    .eq("contest_id", contestId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("community_contest_votes")
      .update({ post_id: postId })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("community_contest_votes").insert({
      contest_id: contestId,
      post_id: postId,
      user_id: userId,
    });
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/community/contest");
  revalidateCommunity();
  return { success: true };
}

export async function markNotificationsRead(notificationIds?: string[]): Promise<CommunityActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "login_required" };
  if (!isSupabaseConfigured()) return { success: false, error: "Not configured" };

  const supabase = await createClient();
  let query = supabase
    .from("community_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (notificationIds?.length) {
    query = query.in("id", notificationIds);
  }

  const { error } = await query;
  if (error) return { success: false, error: error.message };

  revalidatePath("/notifications");
  return { success: true };
}

// Admin actions
export async function moderateCommunityPost(
  postId: string,
  action: "approve" | "reject" | "delete" | "feature",
  note?: string
): Promise<CommunityActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) return { success: false, error: "Admin not configured" };

  const admin = createAdminClient();

  if (action === "delete") {
    const { error } = await admin.from("community_posts").delete().eq("id", postId);
    if (error) return { success: false, error: error.message };
    revalidateCommunity();
    return { success: true };
  }

  const { data: post } = await admin
    .from("community_posts")
    .select("user_id, type, title")
    .eq("id", postId)
    .maybeSingle();

  if (!post) return { success: false, error: "Post not found" };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    moderation_note: note ?? null,
  };

  if (action === "approve") updates.status = "approved";
  if (action === "reject") updates.status = "rejected";
  if (action === "feature") {
    updates.featured = true;
    updates.featured_at = new Date().toISOString();
    updates.status = "approved";
  }

  const { error } = await admin.from("community_posts").update(updates).eq("id", postId);
  if (error) return { success: false, error: error.message };

  if (action === "approve") {
    await createCommunityNotification({
      userId: post.user_id as string,
      type: "post_approved",
      title: "Your post was approved",
      body: post.title as string,
      link: `/community/${postId}`,
    });
    if (post.type === "discovery") {
      await awardCommunityReputation(post.user_id as string, "approved_discovery");
    }
  }

  if (action === "feature") {
    await awardCommunityReputation(post.user_id as string, "featured_post");
    await createCommunityNotification({
      userId: post.user_id as string,
      type: "post_featured",
      title: "Your post was featured",
      body: post.title as string,
      link: `/community/${postId}`,
    });
  }

  revalidateCommunity();
  revalidatePath("/admin/community");
  return { success: true };
}

export async function createCommunityPollAdmin(input: {
  title: string;
  description?: string;
  options: string[];
  status?: "draft" | "active" | "closed";
}): Promise<CommunityActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) return { success: false, error: "Admin not configured" };

  const options = input.options.map((o) => o.trim()).filter(Boolean);
  if (options.length < 2) return { success: false, error: "At least two options required" };

  const admin = createAdminClient();
  const { data: poll, error } = await admin
    .from("community_polls")
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status ?? "active",
      show_results_after_vote: true,
    })
    .select("id")
    .single();

  if (error || !poll) return { success: false, error: error?.message ?? "Failed" };

  await admin.from("community_poll_options").insert(
    options.map((label, index) => ({
      poll_id: poll.id,
      label,
      sort_order: index,
    }))
  );

  revalidateCommunity();
  revalidatePath("/admin/community");
  return { success: true, id: poll.id as string };
}

export async function createCommunityContestAdmin(input: {
  title?: string;
  week_start: string;
  week_end: string;
}): Promise<CommunityActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) return { success: false, error: "Admin not configured" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("community_contests")
    .insert({
      title: input.title?.trim() || "Screenshot of the Week",
      week_start: input.week_start,
      week_end: input.week_end,
      status: "voting",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidateCommunity();
  revalidatePath("/admin/community");
  return { success: true, id: data.id as string };
}

export async function selectContestWinnerAdmin(
  contestId: string,
  postId: string
): Promise<CommunityActionResult> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) return { success: false, error: "Admin not configured" };

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("community_posts")
    .select("user_id, title")
    .eq("id", postId)
    .maybeSingle();

  if (!post) return { success: false, error: "Post not found" };

  const { error } = await admin
    .from("community_contests")
    .update({
      winning_post_id: postId,
      status: "winner_selected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contestId);

  if (error) return { success: false, error: error.message };

  await awardCommunityReputation(post.user_id as string, "contest_win");
  await createCommunityNotification({
    userId: post.user_id as string,
    type: "contest_won",
    title: "You won Screenshot of the Week!",
    body: post.title as string,
    link: "/community/contest",
  });

  revalidateCommunity();
  revalidatePath("/admin/community");
  return { success: true };
}

export async function getUserRelationPickers() {
  const userId = await getAuthenticatedUserId();
  if (!userId || !isSupabaseConfigured()) {
    return { mapPoints: [], articles: [], trackerItems: [], contests: [] };
  }

  const supabase = await createClient();
  const [mapPoints, articles, trackerItems, contests] = await Promise.all([
    supabase.from("map_points").select("id, title, slug").eq("status", "published").order("title").limit(100),
    supabase.from("articles").select("id, title, slug, type").eq("status", "published").order("title").limit(100),
    supabase.from("completion_items").select("id, title, slug").eq("status", "published").order("title").limit(100),
    supabase
      .from("community_contests")
      .select("id, title, week_start, week_end")
      .eq("status", "voting")
      .order("week_start", { ascending: false }),
  ]);

  return {
    mapPoints: mapPoints.data ?? [],
    articles: articles.data ?? [],
    trackerItems: trackerItems.data ?? [],
    contests: contests.data ?? [],
  };
}
