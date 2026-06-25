"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Trophy } from "lucide-react";
import { TrackerProgressBar } from "@/components/tracker/tracker-progress-bar";
import { useTrackerProgress } from "@/lib/tracker/use-tracker-progress";
import type { CompletionItem } from "@/lib/types/completion";

interface TrackerSectionClientProps {
  items: CompletionItem[];
  totalCategories: number;
}

export function TrackerSectionClient({ items, totalCategories }: TrackerSectionClientProps) {
  const { overview, recentCompleted, hydrated } = useTrackerProgress({ items });

  if (!hydrated || items.length === 0) return null;

  return (
    <section className="section-reveal px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
              Track Your Progress
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/40 sm:text-[0.95rem]">
              {totalCategories} categories · {items.length} trackable items across Leonida
            </p>
          </div>
          <Link
            href="/tracker"
            className="inline-flex items-center gap-1.5 text-sm text-gta-pink hover:underline"
          >
            Continue tracking
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-gta-pink/10 p-3 text-gta-pink">
                <Trophy className="size-6" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gta-pink/80">
                  Overall Completion
                </p>
                <p className="mt-1 font-heading text-4xl font-bold text-white">
                  {overview.percentage}%
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {overview.completed} of {overview.total} items completed
                </p>
              </div>
            </div>

            {recentCompleted.length > 0 && (
              <div className="min-w-[200px] flex-1 sm:max-w-xs">
                <p className="mb-2 text-xs uppercase tracking-wider text-white/40">
                  Recently completed
                </p>
                <ul className="space-y-1.5">
                  {recentCompleted.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 text-sm text-white/60"
                    >
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                      <span className="truncate">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <TrackerProgressBar percentage={overview.percentage} className="mt-6" />

          <div className="mt-6">
            <Link
              href="/tracker"
              className="inline-flex items-center justify-center rounded-lg bg-gta-pink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gta-pink/90"
            >
              Open completion tracker
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
