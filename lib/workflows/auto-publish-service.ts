import { getDraftByIdAdmin } from "@/lib/drafts/queries";
import { aiDraftService } from "@/lib/ai/ai-draft-service";
import { articlePublishingService } from "@/lib/workflows/article-publishing-service";
import { checkArticleDuplicate } from "@/lib/editorial/duplicate-check";
import { meetsDraftConfidenceThreshold } from "@/lib/editorial/confidence";
import { markOpportunityPublishedByDraftId } from "@/lib/opportunity-engine/queries";
import { trackDraftApproved, trackDraftPublished } from "@/lib/analytics/track";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export interface AutoPublishResult {
  published: boolean;
  slug?: string;
  skippedReason?: string;
}

export function isAutoPublishEnabled(): boolean {
  const flag = process.env.AUTO_PUBLISH_NEWS?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  return true;
}

function maxAutoPublishPerRun(): number {
  const raw = process.env.AUTO_PUBLISH_MAX_PER_RUN?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 5;
  return Number.isFinite(n) && n > 0 ? n : 5;
}

export class AutoPublishService {
  private publishedThisRun = 0;

  resetRunCounter(): void {
    this.publishedThisRun = 0;
  }

  async tryAutoPublish(draftId: string): Promise<AutoPublishResult> {
    if (!isAutoPublishEnabled()) {
      return { published: false, skippedReason: "AUTO_PUBLISH_NEWS disabled" };
    }

    if (!isSupabaseAdminConfigured()) {
      return { published: false, skippedReason: "Supabase not configured" };
    }

    if (this.publishedThisRun >= maxAutoPublishPerRun()) {
      return { published: false, skippedReason: "Auto-publish run limit reached" };
    }

    const draft = await getDraftByIdAdmin(draftId);
    if (!draft) {
      return { published: false, skippedReason: "Draft not found" };
    }

    if (draft.status !== "pending") {
      return { published: false, skippedReason: `Draft status is ${draft.status}` };
    }

    if (!meetsDraftConfidenceThreshold(draft)) {
      return { published: false, skippedReason: "Below confidence threshold" };
    }

    const duplicate = await checkArticleDuplicate({
      sourceItemId: draft.source_item_id,
      sourceUrl: draft.source_item.source_url,
      title: draft.title,
    });

    if (duplicate.isDuplicate) {
      return { published: false, skippedReason: duplicate.reason };
    }

    try {
      await aiDraftService.updateStatus(draftId, "approved");
      await trackDraftApproved(draftId, draft.source_item.source);

      const approved = await getDraftByIdAdmin(draftId);
      if (!approved || approved.status !== "approved") {
        return { published: false, skippedReason: "Failed to approve draft" };
      }

      const result = await articlePublishingService.publishDraft(approved, "news", {
        autoPublished: true,
      });

      await markOpportunityPublishedByDraftId(draftId);
      await trackDraftPublished(
        draftId,
        draft.source_item.source,
        result.articleId,
        result.slug
      );

      this.publishedThisRun++;
      return { published: true, slug: result.slug };
    } catch (err) {
      return {
        published: false,
        skippedReason: err instanceof Error ? err.message : "Auto-publish failed",
      };
    }
  }
}

export const autoPublishService = new AutoPublishService();
