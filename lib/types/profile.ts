export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  xp: number;
  level: number;
  favorite_category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithStats extends Profile {
  completion_percentage: number;
  achievements_unlocked: number;
  collectibles_found: number;
  total_items: number;
  completed_items: number;
  categories_completed: number;
  favorite_category: {
    id: string;
    slug: string;
    title: string;
  } | null;
  level_label: string;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  sort_order: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface SavedArticle {
  id: string;
  article_id: string;
  created_at: string;
  title: string;
  slug: string;
  type: string;
  excerpt: string | null;
  hero_image_url: string | null;
}

export interface SavedLocation {
  id: string;
  map_point_id: string;
  created_at: string;
  title: string;
  slug: string;
  type: string;
  district: string | null;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  type: string;
  title: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProfileRegisterData {
  email: string;
  password: string;
  username: string;
}

export interface CommunityStats {
  total_players: number;
  average_completion: number;
  latest_achievements: {
    username: string;
    achievement_title: string;
    unlocked_at: string;
  }[];
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  value: number;
  label: string;
}

export interface LeaderboardData {
  top_completion: LeaderboardEntry[];
  most_achievements: LeaderboardEntry[];
  newest_completions: {
    username: string;
    avatar_url: string | null;
    item_title: string;
    category_title: string;
    completed_at: string;
  }[];
}
