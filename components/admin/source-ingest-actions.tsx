"use client";

import { useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  runFullIngestionWorkflow,
  runPlatformIngestion,
  processPendingSources,
} from "@/lib/actions/sources";
import type { SourcePlatform } from "@/lib/types/source";
import { SOURCE_PLATFORM_LABELS } from "@/lib/types/source";

interface SourceIngestActionsProps {
  pendingCount: number;
  platforms: SourcePlatform[];
}

export function SourceIngestActions({ pendingCount, platforms }: SourceIngestActionsProps) {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.success && result.error) {
        alert(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={isPending}
          onClick={() => run(runFullIngestionWorkflow)}
          className="gap-2 bg-white text-black hover:bg-white/90"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Run full ingestion
        </Button>

        {pendingCount > 0 && (
          <Button
            disabled={isPending}
            variant="outline"
            onClick={() => run(processPendingSources)}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            Process {pendingCount} pending
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <Button
            key={platform}
            disabled={isPending}
            variant="outline"
            size="sm"
            onClick={() => run(() => runPlatformIngestion(platform as SourcePlatform))}
            className="border-white/10 bg-transparent text-xs text-white/60 hover:bg-white/5 hover:text-white"
          >
            {SOURCE_PLATFORM_LABELS[platform as SourcePlatform]}
          </Button>
        ))}
      </div>
    </div>
  );
}
