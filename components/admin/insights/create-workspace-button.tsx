"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createWorkspaceFromInsight } from "@/lib/actions/insights";

export function CreateWorkspaceButton({
  articleId,
  insightType,
  reason,
  label = "Create workspace",
}: {
  articleId: string;
  insightType: "low_ctr" | "low_position" | "traffic_drop" | "expand_guide";
  reason: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  if (workspaceId) {
    return (
      <Link
        href={`/admin/workflow/${workspaceId}`}
        className="rounded-lg border border-gta-pink/40 px-3 py-1.5 text-xs text-gta-pink hover:bg-gta-pink/10"
      >
        Open workspace
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await createWorkspaceFromInsight({
            articleId,
            insightType,
            reason,
          });
          if (result.workspaceId) setWorkspaceId(result.workspaceId);
        });
      }}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:border-gta-pink/40 disabled:opacity-50"
    >
      {pending ? "Creating…" : label}
    </button>
  );
}
