"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runKgExtraction, syncKgFromGameEntities } from "@/lib/actions/knowledge-graph";

export function KgExtractionActions() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await runKgExtraction();
            router.refresh();
          })
        }
      >
        {pending ? (
          <Loader2 className="mr-1.5 size-4 animate-spin" />
        ) : (
          <Network className="mr-1.5 size-4" />
        )}
        Run Extraction
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await syncKgFromGameEntities();
            router.refresh();
          })
        }
      >
        Sync from game_* tables
      </Button>
    </div>
  );
}
