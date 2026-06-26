"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scanWorkspaces } from "@/lib/actions/workspace";

export function ScanWorkspacesSection() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleScan() {
    startTransition(async () => {
      await scanWorkspaces();
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white">
            Article Scanner
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Scan published articles, merge signals per article, refresh checklists
            — one workspace per article, no duplicates
          </p>
        </div>
        <Button type="button" disabled={pending} onClick={handleScan}>
          {pending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Radar className="mr-1.5 size-4" />
          )}
          Scan Articles
        </Button>
      </div>
    </section>
  );
}
