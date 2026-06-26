import type { SourceItem } from "@/lib/types/source";
import type { AiGeneratedArticle } from "@/lib/types/ai-draft";
import {
  buildInputFromSource,
  generateJournalismArticle,
  journalismResultToAiArticle,
} from "@/lib/ai/journalism/generator";

/**
 * Mock AI provider — uses journalism block pipeline without OpenAI.
 */
export async function generateMockDraft(source: SourceItem): Promise<AiGeneratedArticle> {
  const input = buildInputFromSource(source);
  const { result } = await generateJournalismArticle(input);
  return journalismResultToAiArticle(result);
}
