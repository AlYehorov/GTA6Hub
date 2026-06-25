"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { postLoginSync } from "@/lib/actions/auth";
import { TRACKER_STORAGE_KEY } from "@/lib/types/completion";
import type { LocalProgressEntry } from "@/lib/types/completion";

function readLocalItemIds(): string[] {
  try {
    const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as LocalProgressEntry[]).map((e) => e.itemId);
  } catch {
    return [];
  }
}

export function AuthCompleteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function complete() {
      const ids = readLocalItemIds();
      await postLoginSync(ids);
      localStorage.removeItem(TRACKER_STORAGE_KEY);
      const next = searchParams.get("next") || "/tracker";
      router.replace(next);
      router.refresh();
    }

    void complete();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-white/50">
      <Loader2 className="size-6 animate-spin text-gta-pink" />
      <p className="text-sm">Syncing your progress...</p>
    </div>
  );
}
