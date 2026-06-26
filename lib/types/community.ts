export type CommunityPostType =
  | "screenshot"
  | "theory"
  | "discussion"
  | "discovery"
  | "collection";

export type CommunityPostStatus = "pending" | "approved" | "rejected";

export type CommunityPollStatus = "draft" | "active" | "closed";

export type CommunityContestStatus = "voting" | "closed" | "winner_selected";

export type CommunityNotificationType =
  | "post_liked"
  | "comment_reply"
  | "contest_won"
  | "post_approved"
  | "post_featured";

export interface CommunityAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  community_reputation: number;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  type: CommunityPostType;
  title: string;
  body: string | null;
  image_url: string | null;
  contains_spoilers: boolean;
  status: CommunityPostStatus;
  featured: boolean;
  featured_at: string | null;
  related_map_point_id: string | null;
  related_article_id: string | null;
  related_tracker_item_id: string | null;
  contest_id: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author?: CommunityAuthor;
  liked_by_me?: boolean;
  related_map_point?: { id: string; title: string; slug: string } | null;
  related_article?: { id: string; title: string; slug: string; type: string } | null;
  related_tracker_item?: { id: string; title: string; slug: string } | null;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  depth: number;
  body: string;
  contains_spoilers: boolean;
  created_at: string;
  author?: CommunityAuthor;
  replies?: CommunityComment[];
}

export interface CommunityPollOption {
  id: string;
  poll_id: string;
  label: string;
  sort_order: number;
  vote_count: number;
}

export interface CommunityPoll {
  id: string;
  title: string;
  description: string | null;
  status: CommunityPollStatus;
  show_results_after_vote: boolean;
  closes_at: string | null;
  created_at: string;
  options: CommunityPollOption[];
  total_votes: number;
  user_vote_option_id?: string | null;
}

export interface CommunityContest {
  id: string;
  title: string;
  week_start: string;
  week_end: string;
  status: CommunityContestStatus;
  winning_post_id: string | null;
  created_at: string;
  entries?: CommunityContestEntry[];
  winning_post?: CommunityPost | null;
}

export interface CommunityContestEntry {
  post: CommunityPost;
  vote_count: number;
  voted_by_me?: boolean;
}

export interface CommunityNotification {
  id: string;
  user_id: string;
  type: CommunityNotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CommunityFeedItem {
  kind: "post" | "poll";
  created_at: string;
  post?: CommunityPost;
  poll?: CommunityPoll;
}

export interface CommunityProfileStats {
  post_count: number;
  screenshot_count: number;
  likes_received: number;
  contest_wins: number;
  community_reputation: number;
}

export interface CommunityHighlights {
  latest_screenshot: CommunityPost | null;
  most_liked_post: CommunityPost | null;
  active_poll: CommunityPoll | null;
  active_contest: CommunityContest | null;
}

export interface CreateCommunityPostInput {
  type: CommunityPostType;
  title: string;
  body?: string;
  image_url?: string;
  contains_spoilers?: boolean;
  related_map_point_id?: string;
  related_article_id?: string;
  related_tracker_item_id?: string;
  contest_id?: string;
}

export const COMMUNITY_POST_TYPE_LABELS: Record<CommunityPostType, string> = {
  screenshot: "Screenshot",
  theory: "Theory",
  discussion: "Discussion",
  discovery: "Discovery",
  collection: "Collection",
};

export const COMMUNITY_POST_STATUS_LABELS: Record<CommunityPostStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};
