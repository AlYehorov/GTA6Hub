"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  extractSourceEntitiesAction,
  generateContentPlanAction,
} from "@/lib/actions/content-engine";

interface SourceEngineActionsProps {
  sourceId: string;
  hasPlan: boolean;
}

export function SourceEngineActions({
  sourceId,
  hasPlan,
}: SourceEngineActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean }>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => extractSourceEntitiesAction(sourceId))}
      >
        {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
        Extract Entities
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => run(() => generateContentPlanAction(sourceId))}
      >
        {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
        {hasPlan ? "Regenerate Plan" : "Generate Plan"}
      </Button>
    </div>
  );
}
