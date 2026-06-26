"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  claimWorkspace,
  completeWorkspace,
  startWorkspaceImprovement,
} from "@/lib/actions/workspace";
import type { ArticleWorkspaceStatus } from "@/lib/workspace/types";

interface WorkspaceActionsProps {
  workspaceId: string;
  status: ArticleWorkspaceStatus;
  articleId: string;
  assignedTo?: string | null;
  compact?: boolean;
}

export function WorkspaceActions({
  workspaceId,
  status,
  articleId,
  assignedTo,
  compact,
}: WorkspaceActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (result.success) router.refresh();
    });
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-3"}`}>
      {status === "needs_improvement" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => claimWorkspace(workspaceId))}
        >
          {pending && <Loader2 className="mr-1 size-3 animate-spin" />}
          Claim
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          router.push(`/admin/articles/${articleId}?focus=content`)
        }
      >
        Open Article
      </Button>
      {["claimed", "in_progress"].includes(status) && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => startWorkspaceImprovement(workspaceId))}
        >
          Mark In Progress
        </Button>
      )}
      {["claimed", "in_progress", "review"].includes(status) && (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => run(() => completeWorkspace(workspaceId))}
        >
          Complete
        </Button>
      )}
      {assignedTo && (
        <span className="self-center text-xs text-white/40">Locked: {assignedTo}</span>
      )}
    </div>
  );
}
