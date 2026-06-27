import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import {
  AdminStudio,
  type StudioTab,
} from "@/components/admin/studio/admin-studio";
import { loadEditorBriefing } from "@/lib/opportunity-engine/loader";
import { getAllDraftsAdmin, getDraftStats } from "@/lib/drafts/queries";
import { getSourceItemStats } from "@/lib/sources/queries";
import { getConnectorPlatforms } from "@/lib/sources/registry";
import {
  isClarityConfigured,
  isGa4Configured,
  isSearchConsoleConfigured,
} from "@/lib/integrations/config";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

const VALID_TABS = new Set<StudioTab>([
  "guide",
  "sources",
  "editor",
  "drafts",
  "seo",
  "analytics",
]);

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminStudioPage({ searchParams }: PageProps) {
  const { tab: tabParam } = await searchParams;
  const initialTab: StudioTab =
    tabParam && VALID_TABS.has(tabParam as StudioTab)
      ? (tabParam as StudioTab)
      : "editor";

  const configured = isSupabaseAdminConfigured();

  const [briefing, drafts, rawDraftStats, sourceStats] = configured
    ? await Promise.all([
        loadEditorBriefing(),
        getAllDraftsAdmin(),
        getDraftStats(),
        getSourceItemStats(),
      ])
    : [
        await loadEditorBriefing(),
        [],
        { pending: 0, approved: 0, rejected: 0, published: 0 },
        { total: 0, processed: 0, pending: 0 },
      ];

  const draftStats = {
    pending: rawDraftStats.pending ?? 0,
    approved: rawDraftStats.approved ?? 0,
    rejected: rawDraftStats.rejected ?? 0,
    published: rawDraftStats.published ?? 0,
  };

  const platforms = getConnectorPlatforms();

  return (
    <>
      <PageHeader
        title="Editorial Studio"
        description="Весь флоу на одной странице — sources, editor, drafts, SEO и analytics."
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="text-white/40">Loading…</p>}>
          <AdminStudio
            initialTab={initialTab}
            data={{
              briefing,
              drafts,
              draftStats,
              sourceStats,
              platforms,
              integrationsConfigured: {
                searchConsole: isSearchConsoleConfigured(),
                analytics: isGa4Configured(),
                clarity: isClarityConfigured(),
              },
            }}
          />
        </Suspense>
      </div>
    </>
  );
}
