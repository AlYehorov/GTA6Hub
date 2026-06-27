import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { SyncButton } from "@/components/admin/integrations/sync-button";
import { MetricGrid } from "@/components/admin/insights/insight-widgets";
import { SearchConsoleSetupForm } from "@/components/admin/integrations/search-console-setup-form";
import {
  getGscSnapshot,
  getIntegrationSettings,
} from "@/lib/integrations/queries";
import {
  getIntegrationsEnv,
  isGoogleApiConfigured,
  isSearchConsoleConfigured,
} from "@/lib/integrations/config";

export default async function SearchConsoleIntegrationPage() {
  const env = getIntegrationsEnv();
  const settings = await getIntegrationSettings("search_console");
  const snapshot = await getGscSnapshot();

  const propertyUrl =
    settings?.property_url ?? env.searchConsoleProperty ?? env.siteUrl;

  return (
    <>
      <PageHeader
        title="Google Search Console"
        description="Verify property, sync search performance, and monitor index health."
      />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-lg font-semibold text-white">Setup</h2>
          <div className="mt-4 space-y-3 text-sm text-white/60">
            <p>
              1. Create a Google Cloud service account with Search Console API access.
            </p>
            <p>
              2. Add the service account email as a <strong className="text-white/80">Full</strong> user in Search Console → Settings → Users.
            </p>
            <p>
              3. Set <code className="text-gta-pink">GOOGLE_SERVICE_ACCOUNT_JSON</code> and{" "}
              <code className="text-gta-pink">GOOGLE_SEARCH_CONSOLE_PROPERTY</code> in Vercel env vars.
            </p>
            <p>
              4. Property format: <code className="text-white/70">sc-domain:gtavihub.gg</code> or{" "}
              <code className="text-white/70">https://www.gtavihub.gg/</code>
            </p>
            <p>
              5. Verify site ownership via HTML tag or DNS (see SEO_ANALYTICS_SETUP.md).
            </p>
          </div>
          <div className="mt-6">
            <SearchConsoleSetupForm initialPropertyUrl={propertyUrl} />
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-lg font-semibold text-white">Connection status</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-white/40">Service account</dt>
              <dd className="text-white">{isGoogleApiConfigured() ? "Configured" : "Not set"}</dd>
            </div>
            <div>
              <dt className="text-white/40">Property URL</dt>
              <dd className="text-white break-all">{propertyUrl}</dd>
            </div>
            <div>
              <dt className="text-white/40">Verification</dt>
              <dd className="text-white capitalize">
                {settings?.verification_status ?? "not_configured"}
              </dd>
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
          {isSearchConsoleConfigured() && (
            <div className="mt-6">
              <SyncButton source="gsc" />
            </div>
          )}
        </section>

        {snapshot && (
          <>
            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="font-heading text-lg font-semibold text-white">Search performance (28d)</h2>
              <div className="mt-4">
                <MetricGrid
                  items={[
                    { label: "Impressions", value: snapshot.summary.impressions.toLocaleString() },
                    { label: "Clicks", value: snapshot.summary.clicks.toLocaleString() },
                    { label: "CTR", value: `${(snapshot.summary.ctr * 100).toFixed(1)}%` },
                    {
                      label: "Avg position",
                      value: snapshot.summary.averagePosition.toFixed(1),
                    },
                  ]}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="font-heading text-lg font-semibold text-white">Index & sitemap</h2>
              <MetricGrid
                items={[
                  { label: "Indexed pages (est.)", value: snapshot.summary.indexedPagesEstimate },
                  { label: "Excluded / errors", value: snapshot.summary.excludedPages },
                  { label: "Sitemap status", value: snapshot.summary.sitemapStatus },
                  { label: "Sitemap errors", value: snapshot.summary.sitemapErrors },
                ]}
              />
            </section>

            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="font-heading text-lg font-semibold text-white">Top queries</h2>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {snapshot.topQueries.slice(0, 15).map((q) => (
                  <li key={q.query} className="flex justify-between gap-4">
                    <span>{q.query}</span>
                    <span className="text-white/40">
                      {q.clicks} clicks · pos {q.position.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
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
