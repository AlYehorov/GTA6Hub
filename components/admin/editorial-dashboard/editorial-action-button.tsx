"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateDraftFromSource,
  refreshEditorialDailyReport,
  processPendingSourcesFromDashboard,
} from "@/lib/actions/editorial-dashboard";

interface EditorialActionButtonProps {
  label: string;
  variant?: "default" | "outline" | "ghost";
  className?: string;
  action:
    | { type: "refresh-report" }
    | { type: "process-sources" }
    | { type: "generate-draft"; sourceItemId: string }
    | { type: "navigate"; href: string };
}

export function EditorialActionButton({
  label,
  variant = "outline",
  className,
  action,
}: EditorialActionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (action.type === "navigate") {
        router.push(action.href);
        return;
      }

      if (action.type === "refresh-report") {
        const result = await refreshEditorialDailyReport();
        if (result.success) router.refresh();
        return;
      }

      if (action.type === "process-sources") {
        await processPendingSourcesFromDashboard();
        router.refresh();
        return;
      }

      if (action.type === "generate-draft") {
        const result = await generateDraftFromSource(action.sourceItemId);
        if (result.redirectTo) router.push(result.redirectTo);
        else router.refresh();
      }
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={className}
      disabled={pending}
      onClick={handleClick}
    >
      {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
      {label}
    </Button>
  );
}
