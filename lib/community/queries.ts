import { unstable_cache } from "next/cache";
import { REVALIDATE_COMMUNITY } from "@/lib/cache/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabase } from "@/lib/supabase/public";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  CommunityAuthor,
  CommunityComment,
  CommunityContest,
  CommunityContestEntry,
  CommunityFeedItem,
  CommunityHighlights,
  CommunityNotification,
  CommunityPoll,
  CommunityPost,
  CommunityProfileStats,
} from "@/lib/types/community";

const POST_SELECT = `
  id, user_id, type, title, body, image_url, contains_spoilers, status, featured, featured_at,
  related_map_point_id, related_article_id, related_tracker_item_id, contest_id,
  like_count, comment_count, created_at, updated_at,
  author:profiles!community_posts_user_id_fkey(id, username, display_name, avatar_url, community_reputation),
  related_map_point:map_points(id, title, slug),
  related_article:articles(id, title, slug, type),
  related_tracker_item:completion_items(id, title, slug)
`;

function mapAuthor(raw: unknown): CommunityAuthor | undefined {
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object") return undefined;
  const data = row as Record<string, unknown>;
  return {
    id: data.id as string,
    username: data.username as string,
    display_name: (data.display_name as string | null) ?? null,
    avatar_url: (data.avatar_url as string | null) ?? null,
    community_reputation: Number(data.community_reputation ?? 0),
  };
}

function mapPost(row: Record<string, unknown>): CommunityPost {
  const relatedArticle = row.related_article as Record<string, unknown> | null;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as CommunityPost["type"],
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    contains_spoilers: Boolean(row.contains_spoilers),
    status: row.status as CommunityPost["status"],
    featured: Boolean(row.featured),
    featured_at: (row.featured_at as string | null) ?? null,
    related_map_point_id: (row.related_map_point_id as string | null) ?? null,
    related_article_id: (row.related_article_id as string | null) ?? null,
    related_tracker_item_id: (row.related_tracker_item_id as string | null) ?? null,
    contest_id: (row.contest_id as string | null) ?? null,
    like_count: Number(row.like_count ?? 0),
    comment_count: Number(row.comment_count ?? 0),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: mapAuthor(row.author),
    related_map_point: row.related_map_point
      ? {
          id: (row.related_map_point as { id: string }).id,
          title: (row.related_map_point as { title: string }).title,
          slug: (row.related_map_point as { slug: string }).slug,
        }
      : null,
    related_article: relatedArticle
      ? {
          id: relatedArticle.id as string,
          title: relatedArticle.title as string,
          slug: relatedArticle.slug as string,
          type: relatedArticle.type as string,
        }
      : null,
    related_tracker_item: row.related_tracker_item
      ? {
          id: (row.related_tracker_item as { id: string }).id,
          title: (row.related_tracker_item as { title: string }).title,
          slug: (row.related_tracker_item as { slug: string }).slug,
        }
      : null,
  };
}

function mapPoll(
  row: Record<string, unknown>,
  options: Record<string, unknown>[],
  userVoteOptionId?: string | null
): CommunityPoll {
  const mappedOptions = options.map((opt) => ({
    id: opt.id as string,
    poll_id: opt.poll_id as string,
    label: opt.label as string,
    sort_order: Number(opt.sort_order ?? 0),
    vote_count: Number(opt.vote_count ?? 0),
  }));
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as CommunityPoll["status"],
    show_results_after_vote: Boolean(row.show_results_after_vote),
    closes_at: (row.closes_at as string | null) ?? null,
    created_at: row.created_at as string,
    options: mappedOptions,
    total_votes: mappedOptions.reduce((sum, o) => sum + o.vote_count, 0),
    user_vote_option_id: userVoteOptionId ?? null,
  };
}

async function attachLikedByMe(posts: CommunityPost[], userId?: string | null) {
  if (!userId || posts.length === 0) return posts;
  const supabase = await createClient();
  const ids = posts.map((p) => p.id);
  const { data } = await supabase
    .from("community_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", ids);
  const liked = new Set((data ?? []).map((r) => r.post_id as string));
  return posts.map((p) => ({ ...p, liked_by_me: liked.has(p.id) }));
}

export async function getCommunityFeed(limit = 30, viewerId?: string | null): Promise<CommunityFeedItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getPublicSupabase();
  const [postsRes, pollsRes] = await Promise.all([
    supabase
      .from("community_posts")
      .select(POST_SELECT)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("community_polls")
      .select("id, title, description, status, show_results_after_vote, closes_at, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const posts = await attachLikedByMe(
    (postsRes.data ?? []).map((row) => mapPost(row as Record<string, unknown>)),
    viewerId
  );

  const pollIds = (pollsRes.data ?? []).map((p) => p.id as string);
  let pollOptions: Record<string, unknown>[] = [];
  if (pollIds.length > 0) {
    const { data: opts } = await supabase
      .from("community_poll_options")
      .select("*")
      .in("poll_id", pollIds)
      .order("sort_order");
    pollOptions = (opts ?? []) as Record<string, unknown>[];
  }

  let userVotes: Record<string, string> = {};
  if (viewerId && pollIds.length > 0) {
    const client = await createClient();
    const { data: votes } = await client
      .from("community_poll_votes")
      .select("poll_id, option_id")
      .eq("user_id", viewerId)
      .in("poll_id", pollIds);
    userVotes = Object.fromEntries(
      (votes ?? []).map((v) => [v.poll_id as string, v.option_id as string])
    );
  }

  const polls = (pollsRes.data ?? []).map((row) =>
    mapPoll(
      row as Record<string, unknown>,
      pollOptions.filter((o) => o.poll_id === row.id),
      userVotes[row.id as string]
    )
  );

  const feed: CommunityFeedItem[] = [
    ...posts.map((post) => ({ kind: "post" as const, created_at: post.created_at, post })),
    ...polls.map((poll) => ({ kind: "poll" as const, created_at: poll.created_at, poll })),
  ];

  return feed.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}

export async function getCommunityPostById(
  id: string,
  viewerId?: string | null
): Promise<CommunityPost | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getPublicSupabase();
  const { data, error } = await supabase
    .from("community_posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const [post] = await attachLikedByMe([mapPost(data as Record<string, unknown>)], viewerId);
  return post ?? null;
}

export async function getCommunityComments(postId: string): Promise<CommunityComment[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getPublicSupabase();
  const { data } = await supabase
    .from("community_comments")
    .select(
      `id, post_id, user_id, parent_id, depth, body, contains_spoilers, created_at,
       author:profiles!community_comments_user_id_fkey(id, username, display_name, avatar_url, community_reputation)`
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const flat = (data ?? []).map((row) => ({
    id: row.id as string,
    post_id: row.post_id as string,
    user_id: row.user_id as string,
    parent_id: (row.parent_id as string | null) ?? null,
    depth: Number(row.depth ?? 0),
    body: row.body as string,
    contains_spoilers: Boolean(row.contains_spoilers),
    created_at: row.created_at as string,
    author: mapAuthor(row.author),
    replies: [] as CommunityComment[],
  }));

  const byId = new Map(flat.map((c) => [c.id, c]));
  const roots: CommunityComment[] = [];

  for (const comment of flat) {
    if (comment.parent_id && byId.has(comment.parent_id)) {
      byId.get(comment.parent_id)!.replies!.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

export async function getActivePoll(
  pollId?: string,
  viewerId?: string | null
): Promise<CommunityPoll | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getPublicSupabase();
  const { data: row } = pollId
    ? await supabase
        .from("community_polls")
        .select("id, title, description, status, show_results_after_vote, closes_at, created_at")
        .eq("id", pollId)
        .maybeSingle()
    : await supabase
        .from("community_polls")
        .select("id, title, description, status, show_results_after_vote, closes_at, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  if (!row) return null;

  const { data: options } = await supabase
    .from("community_poll_options")
    .select("*")
    .eq("poll_id", row.id)
    .order("sort_order");

  let userVote: string | null = null;
  if (viewerId) {
    const client = await createClient();
    const { data: vote } = await client
      .from("community_poll_votes")
      .select("option_id")
      .eq("poll_id", row.id)
      .eq("user_id", viewerId)
      .maybeSingle();
    userVote = (vote?.option_id as string) ?? null;
  }

  return mapPoll(row as Record<string, unknown>, (options ?? []) as Record<string, unknown>[], userVote);
}

export async function getActiveContest(): Promise<CommunityContest | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getPublicSupabase();
  const { data } = await supabase
    .from("community_contests")
    .select("id")
    .in("status", ["voting", "winner_selected"])
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.id) return null;
  return getContestWithEntries(data.id as string);
}

export async function getContestWithEntries(
  contestId: string,
  viewerId?: string | null
): Promise<CommunityContest | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getPublicSupabase();
  const { data: contest } = await supabase
    .from("community_contests")
    .select("*")
    .eq("id", contestId)
    .maybeSingle();

  if (!contest) return null;

  const { data: posts } = await supabase
    .from("community_posts")
    .select(POST_SELECT)
    .eq("contest_id", contestId)
    .eq("status", "approved")
    .eq("type", "screenshot")
    .order("like_count", { ascending: false });

  const mappedPosts = await attachLikedByMe(
    (posts ?? []).map((row) => mapPost(row as Record<string, unknown>)),
    viewerId
  );

  const { data: votes } = await supabase
    .from("community_contest_votes")
    .select("post_id, user_id")
    .eq("contest_id", contestId);

  const voteCounts = new Map<string, number>();
  const myVotePostId =
    viewerId && votes
      ? (votes.find((v) => v.user_id === viewerId)?.post_id as string | undefined)
      : undefined;

  for (const vote of votes ?? []) {
    const pid = vote.post_id as string;
    voteCounts.set(pid, (voteCounts.get(pid) ?? 0) + 1);
  }

  const entries: CommunityContestEntry[] = mappedPosts
    .map((post) => ({
      post,
      vote_count: voteCounts.get(post.id) ?? 0,
      voted_by_me: myVotePostId === post.id,
    }))
    .sort((a, b) => b.vote_count - a.vote_count || b.post.like_count - a.post.like_count);

  let winningPost: CommunityPost | null = null;
  if (contest.winning_post_id) {
    winningPost = await getCommunityPostById(contest.winning_post_id as string, viewerId);
  }

  return {
    id: contest.id as string,
    title: contest.title as string,
    week_start: contest.week_start as string,
    week_end: contest.week_end as string,
    status: contest.status as CommunityContest["status"],
    winning_post_id: (contest.winning_post_id as string | null) ?? null,
    created_at: contest.created_at as string,
    entries,
    winning_post: winningPost,
  };
}

export async function getUserCommunityPosts(
  userId: string,
  limit = 12
): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getPublicSupabase();
  const { data } = await supabase
    .from("community_posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => mapPost(row as Record<string, unknown>));
}

export async function getCommunityProfileStats(userId: string): Promise<CommunityProfileStats> {
  if (!isSupabaseAdminConfigured()) {
    return {
      post_count: 0,
      screenshot_count: 0,
      likes_received: 0,
      contest_wins: 0,
      community_reputation: 0,
    };
  }

  const admin = createAdminClient();
  const [profile, posts] = await Promise.all([
    admin.from("profiles").select("community_reputation").eq("id", userId).maybeSingle(),
    admin
      .from("community_posts")
      .select("id, type, like_count")
      .eq("user_id", userId)
      .eq("status", "approved"),
  ]);

  const approved = posts.data ?? [];
  const postIds = approved.map((p) => p.id as string);
  const likesReceived = approved.reduce((sum, p) => sum + Number(p.like_count ?? 0), 0);

  let contestWins = 0;
  if (postIds.length > 0) {
    const { count } = await admin
      .from("community_contests")
      .select("id", { count: "exact", head: true })
      .in("winning_post_id", postIds);
    contestWins = count ?? 0;
  }

  return {
    post_count: approved.length,
    screenshot_count: approved.filter((p) => p.type === "screenshot").length,
    likes_received: likesReceived,
    contest_wins: contestWins,
    community_reputation: Number(profile.data?.community_reputation ?? 0),
  };
}

export async function getNotifications(
  userId: string,
  limit = 30
): Promise<CommunityNotification[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("community_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as CommunityNotification["type"],
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    link: (row.link as string | null) ?? null,
    read_at: (row.read_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("community_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

const getCachedHighlights = unstable_cache(
  async (): Promise<CommunityHighlights | null> => {
    if (!isSupabaseConfigured()) return null;

    const supabase = getPublicSupabase();
    const [latestShot, mostLiked, pollRes, contestRes] = await Promise.all([
      supabase
        .from("community_posts")
        .select(POST_SELECT)
        .eq("status", "approved")
        .eq("type", "screenshot")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("community_posts")
        .select(POST_SELECT)
        .eq("status", "approved")
        .order("like_count", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("community_polls")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("community_contests")
        .select("id")
        .in("status", ["voting", "winner_selected"])
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const activePoll = pollRes.data?.id
      ? await getActivePoll(pollRes.data.id as string)
      : null;
    const activeContest = contestRes.data?.id
      ? await getContestWithEntries(contestRes.data.id as string)
      : null;

    return {
      latest_screenshot: latestShot.data
        ? mapPost(latestShot.data as Record<string, unknown>)
        : null,
      most_liked_post: mostLiked.data
        ? mapPost(mostLiked.data as Record<string, unknown>)
        : null,
      active_poll: activePoll,
      active_contest: activeContest,
    };
  },
  ["community-highlights"],
  { revalidate: REVALIDATE_COMMUNITY, tags: ["community", "homepage"] }
);

export async function getCommunityHighlights(): Promise<CommunityHighlights | null> {
  return getCachedHighlights();
}

export async function getCommunityPostsAdmin(status?: string): Promise<CommunityPost[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const admin = createAdminClient();
  let query = admin.from("community_posts").select(POST_SELECT).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data } = await query.limit(100);
  return (data ?? []).map((row) => mapPost(row as Record<string, unknown>));
}

export async function getCommunityPollsAdmin(): Promise<CommunityPoll[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const admin = createAdminClient();
  const { data: polls } = await admin
    .from("community_polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (!polls?.length) return [];

  const ids = polls.map((p) => p.id as string);
  const { data: options } = await admin
    .from("community_poll_options")
    .select("*")
    .in("poll_id", ids)
    .order("sort_order");

  return polls.map((row) =>
    mapPoll(
      row as Record<string, unknown>,
      (options ?? []).filter((o) => o.poll_id === row.id) as Record<string, unknown>[]
    )
  );
}

export async function getCommunityContestsAdmin(): Promise<CommunityContest[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("community_contests")
    .select("*")
    .order("week_start", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    week_start: row.week_start as string,
    week_end: row.week_end as string,
    status: row.status as CommunityContest["status"],
    winning_post_id: (row.winning_post_id as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}

export async function getRelationPickers() {
  if (!isSupabaseAdminConfigured()) {
    return { mapPoints: [], articles: [], trackerItems: [] };
  }

  const admin = createAdminClient();
  const [mapPoints, articles, trackerItems] = await Promise.all([
    admin.from("map_points").select("id, title, slug").eq("status", "published").order("title").limit(200),
    admin.from("articles").select("id, title, slug, type").eq("status", "published").order("title").limit(200),
    admin.from("completion_items").select("id, title, slug").eq("status", "published").order("title").limit(200),
  ]);

  return {
    mapPoints: mapPoints.data ?? [],
    articles: articles.data ?? [],
    trackerItems: trackerItems.data ?? [],
  };
}
