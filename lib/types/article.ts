export type ArticleStatus = "draft" | "published";
export type ArticleType = "news" | "guide";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  hero_image_url: string | null;
  status: ArticleStatus;
  type: ArticleType;
  reading_time_minutes: number;
  category_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleWithRelations extends Article {
  category: Category | null;
  tags: Tag[];
}

export interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  hero_image_url: string;
  status: ArticleStatus;
  type: ArticleType;
  category_id: string;
  tag_ids: string[];
  seo_title: string;
  seo_description: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  hero_image_url: string | null;
  status: ArticleStatus;
  type: ArticleType;
  reading_time_minutes: number;
  published_at: string | null;
  category: Pick<Category, "name" | "slug"> | null;
}
