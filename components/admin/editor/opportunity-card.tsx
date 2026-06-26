"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorialOpportunity } from "@/lib/opportunity-engine/types";
import {
  generateArticleAction,
  markOpportunityIgnoredAction,
} from "@/lib/actions/editor";

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="text-amber-400" aria-label={`${stars} out of 5 stars`}>
      {"★".repeat(stars)}
      <span className="text-white/15">{"★".repeat(5 - stars)}</span>
    </span>
  );
}

export function OpportunityCard({ opportunity }: { opportunity: EditorialOpportunity }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function runGenerate() {
    startTransition(async () => {
      const result = await generateArticleAction(opportunity.id);
      if (result.redirectTo) router.push(result.redirectTo);
      else router.refresh();
    });
  }

  function runIgnore() {
    startTransition(async () => {
      await markOpportunityIgnoredAction(opportunity.id);
      router.refresh();
    });
  }

  return (
    <li className="rounded-xl border border-white/[0.06] bg-black/30 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <StarRating stars={opportunity.stars} />
          <h3 className="mt-2 font-heading text-lg font-semibold text-white">
            {opportunity.title}
          </h3>
          <p className="mt-1 text-sm text-white/45">{opportunity.summary}</p>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-white/35">Traffic</dt>
              <dd className="font-medium text-gta-pink">{opportunity.trafficEstimate}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/35">Confidence</dt>
              <dd className="font-medium text-white">{opportunity.confidence}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/35">Action</dt>
              <dd className="font-medium text-white capitalize">
                {opportunity.action === "improve" ? "Improve Article" : "Create Article"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/35">Writing time</dt>
              <dd className="font-medium text-white">
                ~{opportunity.estimatedWritingMinutes} min
              </dd>
            </div>
          </dl>

          {opportunity.sourceTypes.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-white/35">Sources</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {opportunity.sourceTypes.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/55"
                  >
                    {label}
                  </span>
                ))}
                <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/40">
                  {opportunity.sourceCount} clustered
                </span>
              </div>
            </div>
          )}

          {opportunity.existingArticleTitle && (
            <p className="mt-3 text-xs text-white/40">
              Existing: {opportunity.existingArticleTitle}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {opportunity.status !== "ignored" && opportunity.status !== "draft_generated" && (
            <>
              <Button type="button" size="sm" disabled={pending} onClick={runGenerate}>
                {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Generate Article
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={runIgnore}
              >
                Dismiss
              </Button>
            </>
          )}
          {opportunity.aiDraftId && (
            <Link
              href={`/admin/drafts/${opportunity.aiDraftId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View Draft
            </Link>
          )}
          {opportunity.workspaceId && (
            <Link
              href={`/admin/workflow/${opportunity.workspaceId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Workspace
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
