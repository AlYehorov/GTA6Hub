"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, X, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveDraft, rejectDraft, publishDraft, deleteDraft } from "@/lib/actions/drafts";
import type { AiDraftStatus } from "@/lib/types/ai-draft";

interface DraftReviewActionsProps {
  draftId: string;
  status: AiDraftStatus;
}

export function DraftReviewActions({ draftId, status }: DraftReviewActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
      <div className="flex flex-wrap gap-3">
        <p className="text-sm text-white/40">This draft was rejected.</p>
        <Button
          disabled={isPending}
          variant="outline"
          onClick={runDelete}
          className="gap-2 border-white/10 text-white/60 hover:bg-white/5"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Delete
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {status === "pending" && (
        <>
          <Button
            disabled={isPending}
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
          <Button
            disabled={isPending}
            variant="outline"
            onClick={runDelete}
            className="gap-2 border-white/10 text-white/60 hover:bg-white/5"
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
  );
}
