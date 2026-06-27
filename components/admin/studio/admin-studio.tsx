"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AiDraftListItem } from "@/lib/types/ai-draft";
import type { EditorBriefingData } from "@/lib/opportunity-engine/types";
import type { SourcePlatform } from "@/lib/types/source";
import { StudioGuideTab } from "@/components/admin/studio/tabs/guide-tab";
import { StudioSourcesTab } from "@/components/admin/studio/tabs/sources-tab";
import { StudioEditorTab } from "@/components/admin/studio/tabs/editor-tab";
import { StudioDraftsTab } from "@/components/admin/studio/tabs/drafts-tab";
import { StudioSeoTab } from "@/components/admin/studio/tabs/seo-tab";
import { StudioAnalyticsTab } from "@/components/admin/studio/tabs/analytics-tab";
import { cn } from "@/lib/utils";

export type StudioTab =
  | "guide"
  | "sources"
  | "editor"
  | "drafts"
  | "seo"
  | "analytics";

const TABS: Array<{ id: StudioTab; label: string; short: string }> = [
  { id: "guide", label: "Guide", short: "Guide" },
  { id: "sources", label: "1. Sources", short: "Sources" },
  { id: "editor", label: "2. Editor", short: "Editor" },
  { id: "drafts", label: "3. Drafts", short: "Drafts" },
  { id: "seo", label: "SEO", short: "SEO" },
  { id: "analytics", label: "Analytics", short: "Analytics" },
];

export interface StudioData {
  briefing: EditorBriefingData;
  drafts: AiDraftListItem[];
  draftStats: {
    pending: number;
    approved: number;
    rejected: number;
    published: number;
  };
  sourceStats: { total: number; processed: number; pending: number };
  platforms: SourcePlatform[];
  integrationsConfigured: {
    searchConsole: boolean;
    analytics: boolean;
    clarity: boolean;
  };
}

export function AdminStudio({
  data,
  initialTab,
}: {
  data: StudioData;
  initialTab: StudioTab;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<StudioTab>(initialTab);

  useEffect(() => {
    const fromUrl = searchParams.get("tab") as StudioTab | null;
    if (fromUrl && TABS.some((t) => t.id === fromUrl)) {
      setTab(fromUrl);
    }
  }, [searchParams]);

  const switchTab = useCallback(
    (next: StudioTab) => {
      setTab(next);
      router.replace(`/admin/studio?tab=${next}`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => switchTab(item.id)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              tab === item.id
                ? "bg-gta-pink text-black"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            )}
          >
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.short}</span>
          </button>
        ))}
      </div>

      {tab === "guide" && <StudioGuideTab />}
      {tab === "sources" && (
        <StudioSourcesTab
          stats={data.sourceStats}
          platforms={data.platforms}
          intake={data.briefing.intake}
          configured={data.briefing.configured}
        />
      )}
      {tab === "editor" && <StudioEditorTab briefing={data.briefing} />}
      {tab === "drafts" && (
        <StudioDraftsTab drafts={data.drafts} stats={data.draftStats} />
      )}
      {tab === "seo" && <StudioSeoTab />}
      {tab === "analytics" && (
        <StudioAnalyticsTab configured={data.integrationsConfigured} />
      )}
    </div>
  );
}
