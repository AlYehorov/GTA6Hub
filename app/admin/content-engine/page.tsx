import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { ContentEngineQueue } from "@/components/admin/content-engine/content-engine-queue";
import { ContentEngineUsageBar } from "@/components/admin/content-engine/content-engine-usage-bar";
import { loadContentEngineHome } from "@/lib/content-engine/loader";

export default async function ContentEnginePage() {
  const data = await loadContentEngineHome();

  return (
    <>
      <PageHeader
        title="Content Engine"
        description="Two-step AI flow — cheap content plans first, full drafts on demand."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {!data.configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Apply migration{" "}
            <code className="text-gta-pink">015_content_engine.sql</code> and add{" "}
            <code className="text-gta-pink">SUPABASE_SERVICE_ROLE_KEY</code>.
          </p>
        )}

        <ContentEngineUsageBar
          usage={data.usage}
          openAiConfigured={data.openAiConfigured}
        />

        <ContentEngineQueue queue={data.queue} />

        <p className="text-center text-xs text-white/30">
          <Link href="/admin/sources" className="hover:text-white/50">
            Sources
          </Link>
          {" · "}
          <Link href="/admin/entities" className="hover:text-white/50">
            Knowledge Graph
          </Link>
          {" · "}
          <Link href="/admin/drafts" className="hover:text-white/50">
            AI Drafts
          </Link>
          {" · "}
          <Link href="/admin/workflow" className="hover:text-white/50">
            Editorial Workflow
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
