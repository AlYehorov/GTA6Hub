"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/admin";
import {
  generatePackDraft,
  savePackDraftAsAiDraft,
} from "@/lib/content-engine/draft-generator";
import { generateContentPlan } from "@/lib/content-engine/plan-generator";
import {
  createContentPlanWithIdeas,
  getContentPlanBySourceId,
  getContentPlanIdeaById,
  replaceContentPlanIdeas,
  updateContentPlanIdea,
} from "@/lib/content-engine/queries";
import { resolveKgEntitiesForSource } from "@/lib/content-engine/loader";
import {
  markIdeaIgnored,
  sendIdeaToWorkflow,
} from "@/lib/content-engine/workflow-bridge";
import { getSourceItemByIdAdmin } from "@/lib/sources/queries";

const PATHS = [
  "/admin/content-engine",
  "/admin/drafts",
  "/admin/workflow",
];

function revalidateContentEngine(sourceId?: string) {
  for (const path of PATHS) {
    revalidatePath(path);
  }
  if (sourceId) {
    revalidatePath(`/admin/content-engine/source/${sourceId}`);
  }
}

export async function generateContentPlanAction(sourceId: string): Promise<{
  success: boolean;
  planId?: string;
  ideaCount?: number;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const source = await getSourceItemByIdAdmin(sourceId);
    if (!source) return { success: false, error: "Source not found" };

    const { kgEntities, weakHints } = await resolveKgEntitiesForSource(source);
    const ideas = await generateContentPlan({
      source,
      entities: kgEntities,
      weakEntityHints: weakHints,
    });

    if (ideas.length === 0) {
      return { success: false, error: "No ideas generated" };
    }

    const existing = await getContentPlanBySourceId(sourceId);
    let planId: string;

    if (existing) {
      await replaceContentPlanIdeas(existing.id, ideas);
      planId = existing.id;
    } else {
      const plan = await createContentPlanWithIdeas({
        sourceItemId: sourceId,
        ideas,
      });
      if (!plan) return { success: false, error: "Failed to save plan" };
      planId = plan.id;
    }

    revalidateContentEngine(sourceId);
    return { success: true, planId, ideaCount: ideas.length };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Plan generation failed",
    };
  }
}

export async function generateDraftFromIdeaAction(ideaId: string): Promise<{
  success: boolean;
  draftId?: string;
  redirectTo?: string;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const idea = await getContentPlanIdeaById(ideaId);
    if (!idea) return { success: false, error: "Idea not found" };

    const supabase = await import("@/lib/supabase/admin").then((m) =>
      m.createAdminClient()
    );
    const { data: planRow } = await supabase
      .from("content_plans")
      .select("source_item_id")
      .eq("id", idea.content_plan_id)
      .maybeSingle();

    const sourceId = planRow?.source_item_id as string | undefined;
    if (!sourceId) {
      return { success: false, error: "Source-backed plan required" };
    }

    const source = await getSourceItemByIdAdmin(sourceId);
    if (!source) return { success: false, error: "Source not found" };

    const { kgEntities } = await resolveKgEntitiesForSource(source);
    const draft = await generatePackDraft({ source, idea, entities: kgEntities });
    const draftId = await savePackDraftAsAiDraft({ source, idea, draft });
    if (!draftId) return { success: false, error: "Failed to save draft" };

    await updateContentPlanIdea(ideaId, {
      status: "draft_generated",
      ai_draft_id: draftId,
    });

    revalidateContentEngine(sourceId);
    return {
      success: true,
      draftId,
      redirectTo: `/admin/drafts/${draftId}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Draft generation failed",
    };
  }
}

export async function sendIdeaToWorkflowAction(ideaId: string): Promise<{
  success: boolean;
  mode?: "improve" | "create";
  redirectTo?: string;
  message?: string;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const idea = await getContentPlanIdeaById(ideaId);
    if (!idea) return { success: false, error: "Idea not found" };

    const supabase = await import("@/lib/supabase/admin").then((m) =>
      m.createAdminClient()
    );
    const { data: planRow } = await supabase
      .from("content_plans")
      .select("source_item_id")
      .eq("id", idea.content_plan_id)
      .maybeSingle();

    const sourceId = planRow?.source_item_id as string | undefined;
    if (!sourceId) {
      return { success: false, error: "Source-backed plan required" };
    }

    const source = await getSourceItemByIdAdmin(sourceId);
    if (!source) return { success: false, error: "Source not found" };

    const result = await sendIdeaToWorkflow({
      ideaId,
      source,
      draftId: idea.ai_draft_id ?? undefined,
    });

    revalidateContentEngine(sourceId);

    return {
      success: true,
      mode: result.mode,
      message: result.message,
      redirectTo:
        result.mode === "improve" && result.workspaceId
          ? `/admin/workflow/${result.workspaceId}`
          : result.draftId
            ? `/admin/drafts/${result.draftId}`
            : undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Workflow handoff failed",
    };
  }
}

export async function markIdeaIgnoredAction(ideaId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const idea = await getContentPlanIdeaById(ideaId);
    if (!idea) return { success: false, error: "Idea not found" };

    await markIdeaIgnored(ideaId);

    const supabase = await import("@/lib/supabase/admin").then((m) =>
      m.createAdminClient()
    );
    const { data: planRow } = await supabase
      .from("content_plans")
      .select("source_item_id")
      .eq("id", idea.content_plan_id)
      .maybeSingle();

    revalidateContentEngine(planRow?.source_item_id as string | undefined);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to ignore idea",
    };
  }
}

export async function extractSourceEntitiesAction(sourceId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    await requireAdminUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const source = await getSourceItemByIdAdmin(sourceId);
    if (!source) return { success: false, error: "Source not found" };

    const { entities } = await resolveKgEntitiesForSource(source);
    revalidateContentEngine(sourceId);
    return { success: true, count: entities.length };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}
