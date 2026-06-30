import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DraftReviewActions } from "@/components/admin/draft-review-actions";
import { getDraftByIdAdmin } from "@/lib/drafts/queries";
import {
  confidencePercent,
  confidenceThresholdPercent,
  meetsDraftConfidenceThreshold,
  publishabilityHint,
} from "@/lib/editorial/confidence";
import { SOURCE_PLATFORM_LABELS } from "@/lib/types/source";
import type { SourcePlatform } from "@/lib/types/source";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDraftDetailPage({ params }: PageProps) {
  const { id } = await params;
  const draft = await getDraftByIdAdmin(id);
  if (!draft) notFound();

  const pct = confidencePercent(draft.confidence);
  const minPct = confidenceThresholdPercent(
    draft.source_item.source_label,
    draft.source_item.source
  );
  const canPublish = meetsDraftConfidenceThreshold(draft);

  return (
    <>
      <PageHeader title="Review Draft" description={draft.title} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <DraftReviewActions
            draftId={draft.id}
            status={draft.status}
            canApprove={canPublish}
            publishabilityHint={publishabilityHint(
              draft.source_item.source_label,
              draft.source_item.source
            )}
          />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <MetaCard label="Source">
            {SOURCE_PLATFORM_LABELS[draft.source_item.source as SourcePlatform]}
          </MetaCard>
          <MetaCard label="Source label">
            <span className="capitalize">{draft.source_item.source_label}</span>
          </MetaCard>
          <MetaCard label="Confidence">
            <span
              className={cn(
                "font-mono",
                canPublish ? "text-emerald-400" : "text-amber-400"
              )}
            >
              {pct}%
            </span>
            <p className="mt-1 text-xs text-white/40">
              Min {minPct}% for {SOURCE_PLATFORM_LABELS[draft.source_item.source as SourcePlatform]}
            </p>
          </MetaCard>
          <MetaCard label="Status">
            <span className="capitalize">{draft.status}</span>
          </MetaCard>
        </div>

        <Section title="Source">
          <a
            href={draft.source_item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gta-pink hover:underline"
          >
            {draft.source_item.title}
            <ExternalLink className="size-3.5" />
          </a>
        </Section>

        <Section title="Title">
          <p className="text-white">{draft.title}</p>
        </Section>

        <Section title="Excerpt">
          <p className="text-white/60">{draft.excerpt ?? "—"}</p>
        </Section>

        <Section title="SEO Title">
          <p className="font-mono text-sm text-white/70">{draft.seo_title ?? "—"}</p>
        </Section>

        <Section title="SEO Description">
          <p className="text-sm text-white/60">{draft.seo_description ?? "—"}</p>
        </Section>

        {draft.category && (
          <Section title="Category">
            <p className="text-white/70">{draft.category}</p>
          </Section>
        )}

        {draft.suggested_tags.length > 0 && (
          <Section title="Suggested Tags">
            <div className="flex flex-wrap gap-2">
              {draft.suggested_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title="Generated Article">
          <div className="article-prose rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80">
              {draft.content}
            </pre>
          </div>
        </Section>

        <p className="mt-8 text-center text-xs text-white/30">
          <Link href="/admin/drafts" className="hover:text-white/50">
            ← Back to drafts
          </Link>
        </p>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/40">
        {title}
      </h2>
      {children}
    </section>
  );
}

function MetaCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-sm text-white">{children}</p>
    </div>
  );
}
