"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateArticleAction } from "@/lib/actions/editor";
import type { ContentGapItem } from "@/lib/opportunity-engine/types";

function GapRow({ gap }: { gap: ContentGapItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasDraft = gap.status === "draft_generated" || Boolean(gap.aiDraftId);

  function runGenerate() {
    startTransition(async () => {
      const result = await generateArticleAction(gap.opportunityId);
      if (!result.success) {
        alert(result.error ?? "Generation failed");
        return;
      }
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-black/20 px-3 py-2.5">
      <div className="min-w-0 text-sm text-white/65">
        <Link href={gap.href} className="font-medium text-white hover:text-gta-pink">
          {gap.title}
        </Link>
        <span className="ml-2 text-xs text-white/35">{gap.kind}</span>
      </div>
      <div className="flex shrink-0 gap-2">
        {hasDraft && gap.aiDraftId ? (
          <Link
            href={`/admin/drafts/${gap.aiDraftId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Review Draft
          </Link>
        ) : gap.status !== "workflow_sent" ? (
          <Button type="button" size="sm" disabled={pending} onClick={runGenerate}>
            {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            {pending ? "Generating…" : "Generate Guide"}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function WeeklyGapsSection({ gaps }: { gaps: ContentGapItem[] }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Weekly Content Gap
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Entities and topics without strong article coverage — generate SEO guides directly
      </p>

      {gaps.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">No major gaps detected.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {gaps.map((gap) => (
            <GapRow key={`${gap.kind}-${gap.slug}`} gap={gap} />
          ))}
        </ul>
      )}
    </section>
  );
}
