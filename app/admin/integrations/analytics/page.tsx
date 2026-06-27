import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { SyncButton } from "@/components/admin/integrations/sync-button";
import { MetricGrid } from "@/components/admin/insights/insight-widgets";
import {
  getGa4Snapshot,
  getIntegrationSettings,
} from "@/lib/integrations/queries";
import {
  getIntegrationsEnv,
  isGa4Configured,
  isGoogleApiConfigured,
} from "@/lib/integrations/config";

export default async function AnalyticsIntegrationPage() {
  const env = getIntegrationsEnv();
  const settings = await getIntegrationSettings("analytics");
  const snapshot = await getGa4Snapshot();

  return (
    <>
      <PageHeader
        title="Google Analytics 4"
        description="Traffic, engagement, sources, and realtime visitors."
      />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-lg font-semibold text-white">Setup</h2>
          <div className="mt-4 space-y-3 text-sm text-white/60">
            <p>
              1. Create a GA4 property and note the numeric <strong className="text-white/80">Property ID</strong> (Admin → Property settings).
            </p>
            <p>
              2. Set <code className="text-gta-pink">NEXT_PUBLIC_GA_MEASUREMENT_ID</code> (e.g. G-XXXXXXXX) for client tracking.
            </p>
            <p>
              3. Set <code className="text-gta-pink">GA4_PROPERTY_ID</code> for the Data API (server-side reports).
            </p>
            <p>
              4. Grant the service account <strong className="text-white/80">Viewer</strong> on the GA4 property.
            </p>
            <p>See SEO_ANALYTICS_SETUP.md for the full checklist.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-lg font-semibold text-white">Connection status</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-white/40">Measurement ID</dt>
              <dd className="text-white">{env.gaMeasurementId ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-white/40">Property ID (API)</dt>
              <dd className="text-white">{env.ga4PropertyId ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-white/40">Service account</dt>
              <dd className="text-white">{isGoogleApiConfigured() ? "Configured" : "Not set"}</dd>
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
          {isGa4Configured() && (
            <div className="mt-6">
              <SyncButton source="ga4" />
            </div>
          )}
        </section>

        {snapshot && (
          <>
            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="font-heading text-lg font-semibold text-white">Overview (28d)</h2>
              <MetricGrid
                items={[
                  { label: "Visitors", value: snapshot.summary.visitors.toLocaleString() },
                  { label: "Sessions", value: snapshot.summary.sessions.toLocaleString() },
                  { label: "Users", value: snapshot.summary.users.toLocaleString() },
                  { label: "Returning", value: snapshot.summary.returningUsers.toLocaleString() },
                  {
                    label: "Engagement (s)",
                    value: Math.round(snapshot.summary.averageEngagementTime),
                  },
                  {
                    label: "Pages / session",
                    value: snapshot.summary.pagesPerSession.toFixed(1),
                  },
                  {
                    label: "Realtime",
                    value: snapshot.summary.realtimeVisitors,
                  },
                ]}
              />
            </section>

            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="font-heading text-lg font-semibold text-white">Top landing pages</h2>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {snapshot.topLandingPages.map((p) => (
                  <li key={p.path} className="flex justify-between gap-4">
                    <span className="truncate">{p.path}</span>
                    <span className="text-white/40">{p.sessions} sessions</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="font-heading text-lg font-semibold text-white">Traffic sources</h2>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {snapshot.trafficSources.map((s) => (
                  <li key={s.source} className="flex justify-between gap-4">
                    <span>{s.source}</span>
                    <span className="text-white/40">{s.sessions} sessions</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h2 className="font-heading text-lg font-semibold text-white">Countries</h2>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  {snapshot.countries.slice(0, 10).map((c) => (
                    <li key={c.country} className="flex justify-between">
                      <span>{c.country}</span>
                      <span className="text-white/40">{c.users}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h2 className="font-heading text-lg font-semibold text-white">Devices</h2>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  {snapshot.devices.map((d) => (
                    <li key={d.device} className="flex justify-between">
                      <span>{d.device}</span>
                      <span className="text-white/40">{d.users}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
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
