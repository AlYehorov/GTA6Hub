"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, X, Send, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveDraft, rejectDraft, publishDraft, deleteDraft } from "@/lib/actions/drafts";
import { regenerateFromDraftAction } from "@/lib/actions/editor";
import type { AiDraftStatus } from "@/lib/types/ai-draft";

interface DraftReviewActionsProps {
  draftId: string;
  status: AiDraftStatus;
  canApprove?: boolean;
  publishabilityHint?: string;
}

export function DraftReviewActions({
  draftId,
  status,
  canApprove = true,
  publishabilityHint,
}: DraftReviewActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canRegenerate = status === "pending" || status === "rejected";
  const canDelete = status === "pending" || status === "rejected";

  function run(action: () => Promise<{ success: boolean; error?: string; articleSlug?: string; redirectTo?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        alert(result.error ?? "Action failed");
        return;
      }
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      router.refresh();
    });
  }

  function runDelete() {
    if (!confirm("Delete this draft? You can regenerate it from Editor-in-Chief.")) return;
    run(() => deleteDraft(draftId));
  }

  function runRegenerate() {
    if (!confirm("Generate a new draft? The current version will be replaced.")) return;
    startTransition(async () => {
      const result = await regenerateFromDraftAction(draftId);
      if (!result.success) {
        alert(result.error ?? "Regenerate failed");
        return;
      }
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      router.refresh();
    });
  }

  if (status === "published") {
    return (
      <p className="text-sm text-emerald-400">
        This draft has been published. Edit the live article in{" "}
        <Link href="/admin/articles" className="underline hover:text-emerald-300">
          Articles
        </Link>
        .
      </p>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-white/50">This draft was rejected.</p>
        {canRegenerate && (
          <Button
            disabled={isPending}
            onClick={runRegenerate}
            className="gap-2 bg-gta-pink text-white hover:bg-gta-pink/90"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            Regenerate
          </Button>
        )}
        {canDelete && (
          <Button
            disabled={isPending}
            variant="outline"
            onClick={runDelete}
            className="gap-2 border-white/15 text-white/70 hover:bg-white/5"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {publishabilityHint && (
        <p className="text-xs text-white/45">{publishabilityHint}</p>
      )}
      <div className="flex flex-wrap gap-3">
      {status === "pending" && (
        <>
          <Button
            disabled={isPending || !canApprove}
            title={!canApprove ? publishabilityHint : undefined}
            onClick={() => run(() => approveDraft(draftId))}
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Approve
          </Button>
          <Button
            disabled={isPending}
            variant="outline"
            onClick={() => run(() => rejectDraft(draftId))}
            className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <X className="size-4" />
            Reject
          </Button>
          {canRegenerate && (
            <Button
              disabled={isPending}
              onClick={runRegenerate}
              className="gap-2 bg-gta-pink text-white hover:bg-gta-pink/90"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Regenerate
            </Button>
          )}
          <Button
            disabled={isPending}
            variant="outline"
            onClick={runDelete}
            className="gap-2 border-white/15 text-white/70 hover:bg-white/5"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </>
      )}

      {status === "approved" && (
        <>
          <Button
            disabled={isPending}
            onClick={() => run(() => publishDraft(draftId, "news"))}
            className="gap-2 bg-white text-black hover:bg-white/90"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Publish as News
          </Button>
          <Button
            disabled={isPending}
            variant="outline"
            onClick={() => run(() => publishDraft(draftId, "guide"))}
            className="gap-2 border-white/10 text-white hover:bg-white/5"
          >
            Publish as Guide
          </Button>
          <Button
            disabled={isPending}
            variant="outline"
            onClick={() => run(() => rejectDraft(draftId))}
            className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <X className="size-4" />
            Reject
          </Button>
        </>
      )}
      </div>
    </div>
  );
}
