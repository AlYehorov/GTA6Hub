export type VideoCategory =
  | "official_trailer"
  | "official_video"
  | "trailer_breakdown"
  | "community_analysis"
  | "news_recap";

export type VideoStatus = "draft" | "published";

export interface Video {
  id: string;
  title: string;
  slug: string;
  youtube_id: string;
  description: string;
  source_channel: string;
  source_url: string;
  published_at: string | null;
  category: VideoCategory;
  status: VideoStatus;
  source_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export const VIDEO_CATEGORY_LABELS: Record<VideoCategory, string> = {
  official_trailer: "Official Trailer",
  official_video: "Official Video",
  trailer_breakdown: "Trailer Breakdown",
  community_analysis: "Community Analysis",
  news_recap: "News Recap",
};
