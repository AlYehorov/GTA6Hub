"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateContentPlanAction } from "@/lib/actions/content-engine";

interface ContentEngineQueueActionsProps {
  itemId: string;
  kind: "source" | "video";
  hasPlan: boolean;
}

export function ContentEngineQueueActions({
  itemId,
  kind,
  hasPlan,
}: ContentEngineQueueActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const detailHref =
    kind === "source"
      ? `/admin/content-engine/source/${itemId}`
      : `/admin/content-engine/video/${itemId}`;

  function handleGeneratePlan() {
    if (kind !== "source") {
      router.push(detailHref);
      return;
    }

    startTransition(async () => {
      const result = await generateContentPlanAction(itemId);
      if (result.success) {
        router.push(detailHref);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Link
        href={detailHref}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Open
      </Link>
      {kind === "source" && (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={handleGeneratePlan}
        >
          {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
          {hasPlan ? "Regenerate Plan" : "Generate Plan"}
        </Button>
      )}
    </div>
  );
}
