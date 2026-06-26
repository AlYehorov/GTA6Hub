"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestWeeklySeoReport } from "@/lib/actions/seo-intelligence";

function ReportMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-sm text-white/80">
      {content.split("\n").map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="mt-4 font-heading font-semibold text-white">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} className="mt-3 font-medium text-white/90">
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="text-white/75">
              • {line.slice(2)}
            </p>
          );
        }
        if (!line.trim()) return <br key={i} />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

export function WeeklySeoReportPanel() {
  const [pending, startTransition] = useTransition();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const response = await requestWeeklySeoReport();
      if (!response.success || !response.data) {
        setError(response.error ?? "Failed to generate report");
        return;
      }
      setMarkdown(response.data.markdown);
      setGeneratedAt(response.data.generatedAt);
      if (response.data.error) setError(response.data.error);
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white">
            Weekly SEO Report
          </h2>
          <p className="mt-1 text-sm text-white/45">
            One OpenAI request when you click Generate — never runs automatically.
            Budget cap: $5/month across all SEO AI features.
          </p>
        </div>
        <Button type="button" size="sm" disabled={pending} onClick={handleGenerate}>
          {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
          Generate Report
        </Button>
      </div>
      {error && (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </p>
      )}
      {markdown && (
        <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/40 p-5">
          <ReportMarkdown content={markdown} />
          {generatedAt && (
            <p className="mt-4 text-xs text-white/35">
              Generated {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
