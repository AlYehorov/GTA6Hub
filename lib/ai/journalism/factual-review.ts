import { createChatCompletionDetailed, isOpenAiConfigured } from "@/lib/ai/openai-client";
import { formatGroundTruthForPrompt, GTA6_LAUNCH_GROUND_TRUTH } from "@/lib/editorial/gta6-ground-truth";
import type { ArticleFactPack } from "@/lib/ai/journalism/fact-pack";
import type { EditorArticleJson } from "@/lib/ai/journalism/types";
import { discussesNegativeSalesForReview } from "@/lib/ai/journalism/factual-guard";

export interface FactualReviewResult {
  passed: boolean;
  issues: string[];
  suggestedConfidence: number;
}

const FACT_CHECK_SYSTEM = `You are a fact-check editor for GTA VI news. Return JSON only.

${formatGroundTruthForPrompt()}

Flag articles that:
1. Present unverified weak-sales/pre-order claims as established fact
2. Omit record launch context when contradicting ${GTA6_LAUNCH_GROUND_TRUTH.preorderUnitsLabel} / ${GTA6_LAUNCH_GROUND_TRUTH.launchRevenueLabel} performance
3. Use sensational headlines (disastrous, flop, underwhelming) without clear attribution

Community rumors may be covered ONLY with hedged language and launch context.`;

export async function runOpenAiFactualReview(
  editor: EditorArticleJson,
  factPack: ArticleFactPack
): Promise<FactualReviewResult | null> {
  if (!isOpenAiConfigured() || factPack.hasOfficialFacts) {
    return null;
  }

  const corpus = [
    editor.title,
    editor.summary,
    ...(editor.sections ?? []).flatMap((section) => [
      section.heading,
      ...(section.paragraphs ?? []),
    ]),
  ]
    .filter(Boolean)
    .join("\n");

  if (!discussesNegativeSalesForReview(corpus)) {
    return { passed: true, issues: [], suggestedConfidence: 0.6 };
  }

  const { content } = await createChatCompletionDetailed({
    messages: [
      { role: "system", content: FACT_CHECK_SYSTEM },
      {
        role: "user",
        content: `Review this draft JSON for factual guard issues:\n${JSON.stringify(editor, null, 2)}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 600,
    response_format: { type: "json_object" },
    feature: "journalism_factual_review",
    errorPrefix: "Factual review failed",
  });

  const parsed = JSON.parse(content) as {
    passed?: boolean;
    issues?: string[];
    suggested_confidence?: number;
  };

  return {
    passed: parsed.passed !== false,
    issues: Array.isArray(parsed.issues) ? parsed.issues.filter(Boolean) : [],
    suggestedConfidence:
      typeof parsed.suggested_confidence === "number"
        ? Math.max(0, Math.min(1, parsed.suggested_confidence))
        : 0.35,
  };
}
