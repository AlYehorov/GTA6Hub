import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import type { SourceItem } from "@/lib/types/source";
import type { AiDraft, AiGeneratedArticle } from "@/lib/types/ai-draft";
import { generateMockDraft } from "@/lib/ai/providers/mock-provider";
import {
  generateOpenAiDraft,
  isOpenAiConfigured,
} from "@/lib/ai/providers/openai-provider";
import { meetsConfidenceThreshold } from "@/lib/editorial/confidence";

export class AIDraftService {
  /**
   * Generates an AI draft from source material.
   * Uses OpenAI when OPENAI_API_KEY is set; falls back to mock in local dev.
   * Never auto-publishes.
   */
  async generateFromSource(source: SourceItem): Promise<AiGeneratedArticle> {
    if (isOpenAiConfigured()) {
      try {
        return await generateOpenAiDraft(source);
      } catch (err) {
        console.warn(
          "[AIDraftService] OpenAI failed, falling back to mock:",
          err instanceof Error ? err.message : err
        );
      }
    }

    return await generateMockDraft(source);
  }

  async createDraft(source: SourceItem): Promise<AiDraft | null> {
    if (!isSupabaseAdminConfigured()) return null;

    const generated = await this.generateFromSource(source);
    if (!meetsConfidenceThreshold(generated.confidence)) {
      return null;
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("ai_drafts")
      .insert({
        source_item_id: source.id,
        title: generated.title,
        excerpt: generated.excerpt,
        content: generated.content,
        category: generated.category,
        suggested_tags: generated.tags,
        seo_title: generated.seo_title,
        seo_description: generated.seo_description,
        confidence: generated.confidence,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) throw new Error(`Failed to save AI draft: ${error.message}`);
    return data as AiDraft;
  }

  async updateStatus(
    id: string,
    status: AiDraft["status"],
    publishedArticleId?: string
  ): Promise<void> {
    if (!isSupabaseAdminConfigured()) return;

    const supabase = createAdminClient();
    const payload: Record<string, unknown> = { status };
    if (publishedArticleId) payload.published_article_id = publishedArticleId;

    const { error } = await supabase.from("ai_drafts").update(payload).eq("id", id);
    if (error) throw new Error(`Failed to update draft status: ${error.message}`);
  }
}

export const aiDraftService = new AIDraftService();
