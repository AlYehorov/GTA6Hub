"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import { runSeoAiEditor, generateWeeklySeoReport } from "@/lib/seo/ai-services";
import { buildWeeklyReportInput, loadSeoIntelligenceData } from "@/lib/seo/loader";
import type { AiEditorResult, WeeklySeoReportResult } from "@/lib/seo/types";

export interface SeoActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function requestSeoAiEditor(
  articleId: string
): Promise<SeoActionResult<AiEditorResult>> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const result = await runSeoAiEditor(articleId);
  if (!result.success || !result.result) {
    return { success: false, error: result.error ?? "AI Editor failed" };
  }

  return { success: true, data: result.result };
}

/** Explicit button only — never auto-runs. One OpenAI request per click. */
export async function requestWeeklySeoReport(): Promise<
  SeoActionResult<WeeklySeoReportResult>
> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const intelligence = await loadSeoIntelligenceData();
  const snapshot = buildWeeklyReportInput(intelligence);
  const report = await generateWeeklySeoReport(snapshot);

  revalidatePath("/admin/seo");
  return { success: true, data: report };
}
