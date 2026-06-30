import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { isDuplicateTitle } from "@/lib/opportunity-engine/clustering";

export interface DuplicateCheckInput {
  sourceItemId: string;
  sourceUrl: string;
  title: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
}

const RECENT_TITLE_DAYS = 14;

export async function checkArticleDuplicate(
  input: DuplicateCheckInput
): Promise<DuplicateCheckResult> {
  if (!isSupabaseAdminConfigured()) {
    return { isDuplicate: false };
  }

  const supabase = createAdminClient();

  const { data: sameSource } = await supabase
    .from("articles")
    .select("id, title")
    .eq("source_item_id", input.sourceItemId)
    .eq("status", "published")
    .maybeSingle();

  if (sameSource) {
    return {
      isDuplicate: true,
      reason: `Article already published for this source (${sameSource.title})`,
    };
  }

  if (input.sourceUrl.trim()) {
    const { data: sameUrl } = await supabase
      .from("articles")
      .select("id, title")
      .eq("source_url", input.sourceUrl)
      .eq("status", "published")
      .maybeSingle();

    if (sameUrl) {
      return {
        isDuplicate: true,
        reason: `Article already published from this URL (${sameUrl.title})`,
      };
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - RECENT_TITLE_DAYS);

  const { data: recent } = await supabase
    .from("articles")
    .select("title")
    .eq("status", "published")
    .gte("published_at", since.toISOString())
    .order("published_at", { ascending: false })
    .limit(200);

  const titles = (recent ?? []).map((row) => row.title as string);
  if (isDuplicateTitle(input.title, titles)) {
    return {
      isDuplicate: true,
      reason: "Similar title already published in the last 14 days",
    };
  }

  return { isDuplicate: false };
}
