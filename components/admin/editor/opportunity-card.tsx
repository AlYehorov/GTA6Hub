"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorialOpportunity } from "@/lib/opportunity-engine/types";
import type { EditorialFocusOverrides } from "@/lib/opportunity-engine/editorial-focus";
import { EditorialFocusPanel } from "@/components/admin/editor/editorial-focus-panel";
import {
  generateArticleAction,
  markOpportunityIgnoredAction,
  recreateArticleAction,
} from "@/lib/actions/editor";

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="text-amber-400" aria-label={`${stars} out of 5 stars`}>
      {"★".repeat(stars)}
      <span className="text-white/15">{"★".repeat(5 - stars)}</span>
    </span>
  );
}

export function OpportunityCard({ opportunity }: { opportunity: EditorialOpportunity }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [focusOverrides, setFocusOverrides] = useState<EditorialFocusOverrides>({});
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const focus = opportunity.editorialFocus;
  const hasDraft =
    opportunity.status === "draft_generated" || Boolean(opportunity.aiDraftId);
  const showRecreate =
    Boolean(opportunity.aiDraftId) && opportunity.status !== "workflow_sent";
  const canGenerate = focus?.focus_valid || Boolean(focusOverrides.primary_story?.trim());

  function runGenerate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await generateArticleAction(opportunity.id, focusOverrides);
      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error ?? "Generation failed",
        });
        return;
      }
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      setFeedback({
        type: "success",
        message: "Draft created. Open AI Drafts to review.",
      });
      router.refresh();
    });
  }

  function runRecreate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await recreateArticleAction(opportunity.id, focusOverrides);
      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error ?? "Recreate failed",
        });
        return;
      }
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      setFeedback({
        type: "success",
        message: "New draft generated.",
      });
      router.refresh();
    });
  }

  function runIgnore() {
    startTransition(async () => {
      const result = await markOpportunityIgnoredAction(opportunity.id);
      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error ?? "Could not dismiss",
        });
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="rounded-xl border border-white/[0.06] bg-black/30 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <StarRating stars={opportunity.stars} />
          <p className="mt-1 text-xs text-white/35">
            Stars = editorial priority (SEO/traffic), not AI publish confidence
          </p>
          <h3 className="mt-2 font-heading text-lg font-semibold text-white">
            {opportunity.title}
          </h3>
          <p className="mt-1 text-sm text-white/45">{opportunity.summary}</p>

          {focus && (!hasDraft || showRecreate) && (
            <EditorialFocusPanel focus={focus} onChange={setFocusOverrides} />
          )}

          {feedback && (
            <p
              className={cn(
                "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                feedback.type === "error"
                  ? "border border-red-500/30 bg-red-500/10 text-red-300"
                  : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              )}
            >
              {feedback.type === "error" ? (
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              )}
              {feedback.message}
            </p>
          )}

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-white/35">Traffic</dt>
              <dd className="font-medium text-gta-pink">{opportunity.trafficEstimate}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/35">Confidence</dt>
              <dd className="font-medium text-white">{opportunity.confidence}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/35">Action</dt>
              <dd className="font-medium text-white capitalize">
                {opportunity.action === "improve" ? "Improve Article" : "Create Article"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/35">Writing time</dt>
              <dd className="font-medium text-white">
                ~{opportunity.estimatedWritingMinutes} min
              </dd>
            </div>
          </dl>

          {opportunity.sourceTypes.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-white/35">Sources</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {opportunity.sourceTypes.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/55"
                  >
                    {label}
                  </span>
                ))}
                <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/40">
                  {opportunity.sourceCount} clustered
                </span>
              </div>
            </div>
          )}

          {opportunity.existingArticleTitle && (
            <p className="mt-3 text-xs text-white/40">
              Existing: {opportunity.existingArticleTitle}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {!hasDraft && opportunity.status !== "ignored" && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={pending || !canGenerate}
                onClick={runGenerate}
              >
                {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                {pending ? "Generating…" : "Generate Article"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={runIgnore}
              >
                Dismiss
              </Button>
            </>
          )}
          {hasDraft && opportunity.aiDraftId && (
            <div className="flex min-w-[9.5rem] shrink-0 flex-col gap-2">
              <Link
                href={`/admin/drafts/${opportunity.aiDraftId}`}
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              >
                Review Draft
              </Link>
              {showRecreate && (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={runRecreate}
                  className="gap-1.5 bg-gta-pink text-white hover:bg-gta-pink/90"
                >
                  {pending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="size-3.5" />
                  )}
                  {pending ? "Regenerating…" : "Recreate"}
                </Button>
              )}
            </div>
          )}
          {opportunity.workspaceId && (
            <Link
              href={`/admin/workflow/${opportunity.workspaceId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Workspace
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
