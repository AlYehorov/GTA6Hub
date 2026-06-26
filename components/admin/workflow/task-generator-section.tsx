"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateWorkflowTasks } from "@/lib/actions/workflow";
import type { TaskGeneratorCandidate } from "@/lib/workflow/types";

export function TaskGeneratorSection({
  preview,
}: {
  preview: TaskGeneratorCandidate[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      await generateWorkflowTasks();
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white">
            Task Generator
          </h2>
          <p className="mt-1 text-sm text-white/45">
            From Rockstar, Reddit, videos, missing SEO, outdated pages, opportunities
            — no duplicates
          </p>
        </div>
        <Button type="button" disabled={pending} onClick={handleGenerate}>
          {pending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 size-4" />
          )}
          Generate Tasks
        </Button>
      </div>

      {preview.length > 0 && (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {preview.slice(0, 8).map((item) => (
            <li
              key={item.dedupe_key}
              className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-white/60"
            >
              <span className="text-white/80">{item.title}</span>
              <span className="ml-2 text-xs text-white/35">
                {item.priority} · {item.estimated_minutes}m
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
