export const COMMUNITY_REPUTATION_REWARDS = {
  like_received: 2,
  contest_win: 50,
  featured_post: 25,
  approved_discovery: 15,
} as const;

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
