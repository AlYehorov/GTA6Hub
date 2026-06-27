import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { SyncButton } from "@/components/admin/integrations/sync-button";
import { MetricGrid } from "@/components/admin/insights/insight-widgets";
import {
  getClaritySnapshot,
  getIntegrationSettings,
} from "@/lib/integrations/queries";
import {
  getIntegrationsEnv,
  isClarityApiConfigured,
  isClarityConfigured,
} from "@/lib/integrations/config";

export default async function ClarityIntegrationPage() {
  const env = getIntegrationsEnv();
  const settings = await getIntegrationSettings("clarity");
  const snapshot = await getClaritySnapshot();

  const heatmapUrl = snapshot?.heatmapUrl ??
    (env.clarityProjectId
      ? `https://clarity.microsoft.com/projects/view/${env.clarityProjectId}/heatmaps`
      : null);
  const recordingsUrl = snapshot?.recordingsUrl ??
    (env.clarityProjectId
      ? `https://clarity.microsoft.com/projects/view/${env.clarityProjectId}/recordings`
      : null);

  return (
    <>
      <PageHeader
        title="Microsoft Clarity"
        description="Heatmaps, session recordings, and interaction signals."
      />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-lg font-semibold text-white">Setup</h2>
          <div className="mt-4 space-y-3 text-sm text-white/60">
            <p>
              1. Create a Clarity project at{" "}
              <a
                href="https://clarity.microsoft.com"
                className="text-gta-pink hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                clarity.microsoft.com
              </a>
            </p>
            <p>
              2. Set <code className="text-gta-pink">NEXT_PUBLIC_CLARITY_ID</code> — the project ID embeds tracking on public pages.
            </p>
            <p>
              3. Optional: set <code className="text-gta-pink">CLARITY_API_TOKEN</code> for API metrics sync (Project → Settings → API).
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-lg font-semibold text-white">Connection status</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-white/40">Project ID</dt>
              <dd className="text-white">{env.clarityProjectId ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-white/40">API token</dt>
              <dd className="text-white">{isClarityApiConfigured() ? "Configured" : "Not set"}</dd>
            </div>
            <div>
              <dt className="text-white/40">Last sync</dt>
              <dd className="text-white">
                {settings?.last_sync_at
                  ? new Date(settings.last_sync_at).toLocaleString()
                  : "Never"}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-4">
            {heatmapUrl && (
              <a
                href={heatmapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:border-gta-pink/40"
              >
                Open heatmaps →
              </a>
            )}
            {recordingsUrl && (
              <a
                href={recordingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:border-gta-pink/40"
              >
                Open recordings →
              </a>
            )}
          </div>
          {isClarityConfigured() && (
            <div className="mt-6">
              <SyncButton source="clarity" />
            </div>
          )}
        </section>

        {snapshot && isClarityApiConfigured() && (
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="font-heading text-lg font-semibold text-white">Behavior signals (7d)</h2>
            <MetricGrid
              items={[
                { label: "Dead clicks", value: snapshot.deadClicks },
                { label: "Quick backs", value: snapshot.quickBacks },
                { label: "Rage clicks", value: snapshot.rageClicks },
                { label: "Avg scroll depth", value: `${snapshot.averageScrollDepth}%` },
              ]}
            />
          </section>
        )}

        <p className="text-center text-xs text-white/30">
          <Link href="/admin/insights" className="hover:text-white/50">
            SEO Insights
          </Link>
          {" · "}
          <Link href="/admin" className="hover:text-white/50">
            Admin hub
          </Link>
        </p>
      </div>
    </>
  );
}
