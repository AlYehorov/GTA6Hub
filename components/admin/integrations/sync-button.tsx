"use client";

import { useState, useTransition } from "react";
import { syncIntegration } from "@/lib/actions/integrations";

export function SyncButton({
  source,
  label = "Sync now",
}: {
  source: "gsc" | "ga4" | "clarity" | "all";
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await syncIntegration(source);
            if (result.success) {
              setMessage("Sync completed");
            } else {
              setMessage(result.error ?? "Sync failed");
            }
          });
        }}
        className="rounded-lg bg-gta-pink px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {pending ? "Syncing…" : label}
      </button>
      {message && (
        <span className="text-sm text-white/50">{message}</span>
      )}
    </div>
  );
}
