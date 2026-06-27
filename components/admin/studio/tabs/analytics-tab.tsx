import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SyncButton } from "@/components/admin/integrations/sync-button";

export function StudioAnalyticsTab({
  configured,
}: {
  configured: {
    searchConsole: boolean;
    analytics: boolean;
    clarity: boolean;
  };
}) {
  const anyConfigured =
    configured.searchConsole || configured.analytics || configured.clarity;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-heading text-xl font-semibold text-white">Analytics & Search Console</h2>
        <p className="mt-2 text-sm text-white/55">
          После настройки env vars (завтра) — sync и смотри traffic в Insights.
          Инструкция: <code className="text-gta-pink">SEO_ANALYTICS_SETUP.md</code> в репо.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Status label="Search Console" ok={configured.searchConsole} />
          <Status label="GA4" ok={configured.analytics} />
          <Status label="Clarity" ok={configured.clarity} />
        </div>
        {anyConfigured && (
          <div className="mt-6">
            <SyncButton source="all" label="Sync all integrations" />
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <SetupLink
          href="/admin/integrations/search-console"
          title="Search Console"
          step="GSC property + service account"
        />
        <SetupLink
          href="/admin/integrations/analytics"
          title="Google Analytics 4"
          step="G-XXXX + GA4 property ID"
        />
        <SetupLink
          href="/admin/integrations/clarity"
          title="Microsoft Clarity"
          step="Project ID + optional API token"
        />
      </div>

      <Link
        href="/admin/insights"
        className="inline-flex items-center gap-2 text-sm text-gta-pink hover:underline"
      >
        SEO Insights dashboard
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function Status({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={ok ? "text-emerald-400" : "text-white/40"}>
      {ok ? "●" : "○"} {label}
    </span>
  );
}

function SetupLink({
  href,
  title,
  step,
}: {
  href: string;
  title: string;
  step: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-gta-pink/30"
    >
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-white/45">{step}</p>
    </Link>
  );
}
