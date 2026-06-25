export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
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
  favorite_category: {
    id: string;
    slug: string;
    title: string;
  } | null;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
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
