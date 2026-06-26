import { EditorialActionButton } from "@/components/admin/editorial-dashboard/editorial-action-button";
import type { DailyReportResult } from "@/lib/editorial/types";

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <h3 key={i} className="mt-4 font-heading text-base font-semibold text-white">
              {line.replace(/\*\*/g, "")}
            </h3>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="my-1 text-sm text-white/75">
              + {line.slice(2)}
            </p>
          );
        }
        if (line.startsWith("*") && line.endsWith("*")) {
          return (
            <p key={i} className="mt-4 text-xs italic text-white/40">
              {line.replace(/\*/g, "")}
            </p>
          );
        }
        if (!line.trim()) return <br key={i} />;
        return (
          <p key={i} className="text-sm text-white/80">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function DailyReportSection({
  report,
  openAiConfigured,
}: {
  report: DailyReportResult;
  openAiConfigured: boolean;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white">
            Daily Report
          </h2>
          <p className="mt-1 text-sm text-white/45">
            One OpenAI request per day (gpt-4o-mini, &lt; $0.50 target). Cached until
            refresh.
            {!openAiConfigured && " Using template fallback — set OPENAI_API_KEY."}
          </p>
        </div>
        <EditorialActionButton
          label="Refresh Report"
          action={{ type: "refresh-report" }}
        />
      </div>

      {report.error && (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {report.error}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/40 p-5">
        <SimpleMarkdown content={report.markdown} />
      </div>

      <p className="mt-3 text-xs text-white/35">
        Generated {new Date(report.generatedAt).toLocaleString()}
        {report.cached ? " · cached" : " · fresh"}
      </p>
    </section>
  );
}
