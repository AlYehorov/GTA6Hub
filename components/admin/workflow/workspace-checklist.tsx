"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toggleWorkspaceChecklistItem } from "@/lib/actions/workspace";
import type { WorkspaceChecklistItem } from "@/lib/workspace/types";

export function WorkspaceChecklist({
  workspaceId,
  items,
  readOnly = false,
}: {
  workspaceId: string;
  items: WorkspaceChecklistItem[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(key: string, completed: boolean) {
    if (readOnly || pending) return;
    startTransition(async () => {
      await toggleWorkspaceChecklistItem(workspaceId, key, completed);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-white/40">Checklist is clear — article looks strong.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={readOnly || pending}
            onClick={() => toggle(item.key, !item.completed)}
            className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
              item.completed
                ? "border-green-500/20 bg-green-500/5 text-white/50 line-through"
                : "border-white/[0.06] bg-black/20 text-white hover:border-white/15"
            }`}
          >
            <span
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${
                item.completed
                  ? "border-green-500/50 bg-green-500/20 text-green-400"
                  : "border-white/20"
              }`}
            >
              {item.completed && <Check className="size-3" />}
            </span>
            <span className="flex-1">
              {item.label}
              <span className="ml-2 text-xs text-white/35">
                {item.estimated_minutes}m
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
