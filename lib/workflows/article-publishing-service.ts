import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { calculateReadingTime, slugify } from "@/lib/utils/article";
import { getVideoBySourceItemId } from "@/lib/videos/queries";
import { sanitizeArticleContent, sanitizeArticleExcerpt } from "@/lib/editorial/sanitize";
import { meetsDraftConfidenceThreshold, confidenceThresholdPercent } from "@/lib/editorial/confidence";
import { resolveHeroImageForArticle, isHighResolutionHero } from "@/lib/articles/resolve-hero-image";
import type { AiDraftWithSource } from "@/lib/types/ai-draft";
import type { ArticleType } from "@/lib/types/article";
import { SOURCE_PLATFORM_LABELS, type SourceLabel } from "@/lib/types/source";

export interface PublishResult {
  articleId: string;
  slug: string;
  type: ArticleType;
}

export interface PublishDraftOptions {
  /** Cron auto-publish skips the manual approval step. */
  autoPublished?: boolean;
}

/**
 * Publishes an approved AI draft as a live article.
 * Manual admin actions require approved status; cron auto-publish may skip that step.
 */
export class ArticlePublishingService {
  async publishDraft(
    draft: AiDraftWithSource,
    type: ArticleType = "news",
    options?: PublishDraftOptions
  ): Promise<PublishResult> {
    if (!isSupabaseAdminConfigured()) {
      throw new Error("Supabase admin is not configured");
    }

    if (!options?.autoPublished && draft.status !== "approved") {
      throw new Error("Only approved drafts can be published");
    }

    if (draft.status === "published") {
      throw new Error("Draft is already published");
    }

    if (!meetsDraftConfidenceThreshold(draft)) {
      const min = confidenceThresholdPercent(
        draft.source_item.source_label,
        draft.source_item.source
      );
      throw new Error(
        `Draft confidence is below the ${min}% minimum required for ${SOURCE_PLATFORM_LABELS[draft.source_item.source]} sources`
      );
    }

    const supabase = createAdminClient();
    const slug = await this.uniqueSlug(draft.title);
    const categoryId = await this.resolveCategoryId(draft.category);
    const tagIds = await this.resolveTagIds(draft.suggested_tags);
    const now = new Date().toISOString();
    const source = draft.source_item;

    let videoId: string | null = null;
    let heroImageUrl: string | null = null;

    if (source.source_type === "youtube_video") {
      const video = await getVideoBySourceItemId(source.id);
      if (video) {
        videoId = video.id;
        heroImageUrl = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
      } else if (source.external_id) {
        heroImageUrl = `https://img.youtube.com/vi/${source.external_id}/hqdefault.jpg`;
      }
    }

    const { data: article, error } = await supabase
      .from("articles")
      .insert({
        title: draft.title,
        slug,
        excerpt: sanitizeArticleExcerpt(draft.excerpt),
        content: sanitizeArticleContent(draft.content),
        hero_image_url: isHighResolutionHero(heroImageUrl)
          ? heroImageUrl!.trim()
          : resolveHeroImageForArticle(null, slug),
        status: "published",
        type,
        reading_time_minutes: calculateReadingTime(draft.content),
        category_id: categoryId,
        seo_title: draft.seo_title,
        seo_description: draft.seo_description,
        published_at: now,
        source_label: source.source_label as SourceLabel,
        source_url: source.source_url,
        source_item_id: source.id,
        video_id: videoId,
        ai_confidence: draft.confidence,
      })
      .select("id, slug, type")
      .single();

    if (error || !article) {
      throw new Error(error?.message ?? "Failed to publish article");
    }

    if (tagIds.length > 0) {
      await supabase.from("article_tags").insert(
        tagIds.map((tag_id) => ({ article_id: article.id, tag_id }))
      );
    }

    await supabase
      .from("ai_drafts")
      .update({ status: "published", published_article_id: article.id })
      .eq("id", draft.id);

    return {
      articleId: article.id,
      slug: article.slug,
      type: article.type as ArticleType,
    };
  }

  private async uniqueSlug(title: string): Promise<string> {
    const supabase = createAdminClient();
    const slug = slugify(title);
    let suffix = 0;

    while (true) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const { data } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();

      if (!data) return candidate;
      suffix++;
    }
  }

  private async resolveCategoryId(category: string | null): Promise<string | null> {
    if (!category) return null;

    const supabase = createAdminClient();
    const slug = slugify(category);

    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from("categories")
      .insert({ name: category, slug, description: null })
      .select("id")
      .single();

    return created?.id ?? null;
  }

  private async resolveTagIds(tagNames: string[]): Promise<string[]> {
    if (tagNames.length === 0) return [];

    const supabase = createAdminClient();
    const ids: string[] = [];

    for (const name of tagNames) {
      const slug = slugify(name);
      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        ids.push(existing.id);
        continue;
      }

      const { data: created } = await supabase
        .from("tags")
        .insert({ name, slug })
        .select("id")
        .single();

      if (created) ids.push(created.id);
    }

    return ids;
  }
}

export const articlePublishingService = new ArticlePublishingService();
