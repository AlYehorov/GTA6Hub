import type { SourcePlatform } from "@/lib/types/source";

export type AiDraftStatus = "pending" | "approved" | "rejected" | "published";

export interface AiDraft {
  id: string;
  source_item_id: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  suggested_tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  confidence: number;
  status: AiDraftStatus;
  published_article_id: string | null;
  created_at: string;
}

export interface AiDraftListItem {
  id: string;
  title: string;
  source: SourcePlatform;
  confidence: number;
  status: AiDraftStatus;
  created_at: string;
}

export interface AiDraftWithSource extends AiDraft {
  source_item: {
    id: string;
    source: SourcePlatform;
    source_type: string;
    source_url: string;
    title: string;
    published_at: string | null;
  };
}

export interface AiGeneratedArticle {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  confidence: number;
}
