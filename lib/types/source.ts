export type SourcePlatform =
  | "rockstar_newswire"
  | "rockstar_youtube"
  | "reddit"
  | "x";

export interface SourceItem {
  id: string;
  source: SourcePlatform;
  source_type: string;
  source_url: string;
  external_id: string;
  title: string;
  content: string;
  published_at: string | null;
  processed: boolean;
  created_at: string;
}

export interface SourceItemInput {
  source: SourcePlatform;
  source_type: string;
  source_url: string;
  external_id: string;
  title: string;
  content: string;
  published_at?: string | null;
}

export type SourceItemListItem = SourceItem;

export const SOURCE_PLATFORM_LABELS: Record<SourcePlatform, string> = {
  rockstar_newswire: "Rockstar Newswire",
  rockstar_youtube: "Rockstar YouTube",
  reddit: "Reddit",
  x: "X (Twitter)",
};
