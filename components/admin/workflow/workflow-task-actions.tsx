"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  claimWorkflowTask,
  completeWorkflowTask,
  markWorkflowTaskReady,
  updateWorkflowTaskStatus,
} from "@/lib/actions/workflow";
import type { EditorialTaskStatus } from "@/lib/workflow/types";

interface WorkflowTaskActionsProps {
  taskId: string;
  status: EditorialTaskStatus;
  relatedArticle?: string | null;
  compact?: boolean;
}

export function WorkflowTaskActions({
  taskId,
  status,
  relatedArticle,
  compact,
}: WorkflowTaskActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean }>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-3"}`}>
      {status === "opportunity" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => claimWorkflowTask(taskId))}
        >
          {pending && <Loader2 className="mr-1 size-3 animate-spin" />}
          Claim
        </Button>
      )}
      {relatedArticle && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            router.push(`/admin/articles/${relatedArticle}?focus=content`)
          }
        >
          Open Draft
        </Button>
      )}
      {!relatedArticle && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/articles/create")}
        >
          Open Draft
        </Button>
      )}
      {["drafting", "seo_review", "claimed", "fact_check"].includes(status) && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => markWorkflowTaskReady(taskId))}
        >
          Mark Ready
        </Button>
      )}
      {status === "ready" && (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => run(() => completeWorkflowTask(taskId))}
        >
          Complete
        </Button>
      )}
      {status === "claimed" && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            run(() => updateWorkflowTaskStatus(taskId, "drafting"))
          }
        >
          Start Drafting
        </Button>
      )}
    </div>
  );
}
