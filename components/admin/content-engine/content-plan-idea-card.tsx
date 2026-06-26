"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentPlanIdea } from "@/lib/content-engine/types";
import {
  generateDraftFromIdeaAction,
  markIdeaIgnoredAction,
  sendIdeaToWorkflowAction,
} from "@/lib/actions/content-engine";

const STATUS_STYLES: Record<ContentPlanIdea["status"], string> = {
  planned: "bg-white/5 text-white/50",
  draft_generated: "bg-blue-500/10 text-blue-400",
  ignored: "bg-white/5 text-white/30 line-through",
  workflow_sent: "bg-emerald-500/10 text-emerald-400",
};

interface ContentPlanIdeaCardProps {
  idea: ContentPlanIdea;
}

export function ContentPlanIdeaCard({ idea }: ContentPlanIdeaCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function runAction(
    action: () => Promise<{
      success: boolean;
      redirectTo?: string;
      error?: string;
    }>
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.redirectTo) router.push(result.redirectTo);
      else router.refresh();
    });
  }

  return (
    <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs capitalize",
                STATUS_STYLES[idea.status]
              )}
            >
              {idea.status.replace("_", " ")}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/45">
              {idea.priority}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/45">
              {idea.content_type.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="mt-2 font-medium text-white">{idea.title}</h3>
          <p className="mt-1 text-sm text-white/45">{idea.estimated_value}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-xs text-white/50 sm:grid-cols-2">
        <div>
          <dt className="text-white/35">Target keyword</dt>
          <dd className="text-white/70">{idea.target_keyword}</dd>
        </div>
        <div>
          <dt className="text-white/35">Category</dt>
          <dd className="text-white/70">{idea.category}</dd>
        </div>
        <div>
          <dt className="text-white/35">Search intent</dt>
          <dd className="text-white/70">{idea.search_intent}</dd>
        </div>
        <div>
          <dt className="text-white/35">Internal links</dt>
          <dd className="text-white/70">
            {idea.internal_link_targets.slice(0, 3).join(", ") || "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {idea.status !== "ignored" && idea.status !== "workflow_sent" && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                runAction(() => generateDraftFromIdeaAction(idea.id))
              }
            >
              {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              Generate Draft
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending || idea.status === "planned"}
              onClick={() => runAction(() => sendIdeaToWorkflowAction(idea.id))}
            >
              Send to Workflow
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => runAction(() => markIdeaIgnoredAction(idea.id))}
            >
              Mark Ignored
            </Button>
          </>
        )}
        {idea.ai_draft_id && (
          <Link
            href={`/admin/drafts/${idea.ai_draft_id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View Draft
          </Link>
        )}
        {idea.workspace_id && (
          <Link
            href={`/admin/workflow/${idea.workspace_id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View Workspace
          </Link>
        )}
      </div>
    </li>
  );
}
