import type { SourceItem } from "@/lib/types/source";
import type { AiGeneratedArticle } from "@/lib/types/ai-draft";
import {
  isOpenAiConfigured,
} from "@/lib/ai/openai-client";
import {
  buildInputFromSource,
  generateJournalismArticle,
  journalismResultToAiArticle,
} from "@/lib/ai/journalism/generator";
import { trackAiUsageEvent } from "@/lib/content-engine/usage";

export { isOpenAiConfigured };

export async function generateOpenAiDraft(source: SourceItem): Promise<AiGeneratedArticle> {
  const journalismInput = buildInputFromSource(source);
  const { result, usage, rewriteCount } = await generateJournalismArticle(journalismInput);

  if (isOpenAiConfigured() && usage.prompt_tokens > 0) {
    await trackAiUsageEvent({
      action: "article_draft",
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      metadata: {
        source_id: source.id,
        journalism_rewrite_count: rewriteCount,
      },
    });
  }

  return journalismResultToAiArticle(result);
}
