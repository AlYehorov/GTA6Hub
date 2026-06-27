import Link from "next/link";
import { Plus, FileText, Rss, Sparkles, MapPin, Trophy, Calendar, Users, Search, ListTodo, Network, Wand2, BarChart3, LineChart, LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getAllArticlesAdmin } from "@/lib/articles/queries";
import { getDraftStats } from "@/lib/drafts/queries";
import { getSourceItemStats } from "@/lib/sources/queries";
import { getMapPointStats } from "@/lib/map/queries";
import { getTrackerPublicTotals } from "@/lib/tracker/queries";

export default async function AdminDashboardPage() {
  const configured = isSupabaseAdminConfigured();
  const articles = configured ? await getAllArticlesAdmin() : [];
  const published = articles.filter((a) => a.status === "published").length;
  const drafts = articles.filter((a) => a.status === "draft").length;
  const draftStats = configured ? await getDraftStats() : { pending: 0 };
  const sourceStats = configured ? await getSourceItemStats() : { pending: 0 };
  const mapStats = configured ? await getMapPointStats() : { published: 0 };
  const trackerTotals = configured ? await getTrackerPublicTotals() : { totalItems: 0, categoryCount: 0 };

  return (
    <>
      <PageHeader
        title="Admin"
        description="Manage GTA6Hub content — articles, guides and news."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!configured && (
          <p className="mb-8 rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` to enable admin writes.
          </p>
        )}

        <div className="mb-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total articles" value={articles.length} />
          <StatCard label="Published" value={published} />
          <StatCard label="Drafts" value={drafts} />
          <StatCard label="AI drafts pending" value={draftStats.pending} />
          <StatCard label="Sources pending" value={sourceStats.pending} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdminLink
            href="/admin/studio"
            icon={<LayoutDashboard className="size-5" />}
            title="Editorial Studio"
            description="Весь флоу на одной странице — guide, sources, editor, drafts"
          />
          <AdminLink
            href="/admin/articles"
            icon={<FileText className="size-5" />}
            title="Articles"
            description="View and manage all news and guides"
          />
          <AdminLink
            href="/admin/articles/create"
            icon={<Plus className="size-5" />}
            title="Create article"
            description="Write a new news post or guide"
          />
          <AdminLink
            href="/admin/sources"
            icon={<Rss className="size-5" />}
            title="Sources"
            description="Ingest content from external platforms"
          />
          <AdminLink
            href="/admin/entities"
            icon={<Network className="size-5" />}
            title="Knowledge Graph"
            description="Entities, aliases, extraction, and merge suggestions"
          />
          <AdminLink
            href="/admin/workflow"
            icon={<ListTodo className="size-5" />}
            title="Editorial Workflow"
            description="Article workspaces — one improvement per article, checklist inside"
          />
          <AdminLink
            href="/admin/insights"
            icon={<LineChart className="size-5" />}
            title="SEO Insights"
            description="Unified analytics — Search Console, GA4, Clarity, traffic opportunities"
          />
          <AdminLink
            href="/admin/integrations/search-console"
            icon={<BarChart3 className="size-5" />}
            title="Integrations"
            description="Google Search Console, GA4, and Microsoft Clarity setup"
          />
          <AdminLink
            href="/admin/dashboard"
            icon={<Calendar className="size-5" />}
            title="Editorial Dashboard"
            description="Morning briefing, opportunities, SEO gaps, and daily report"
          />
          <AdminLink
            href="/admin/seo"
            icon={<Search className="size-5" />}
            title="SEO Command Center"
            description="Content inventory, improve queue, coverage, and weekly report"
          />
          <AdminLink
            href="/admin/editor"
            icon={<Wand2 className="size-5" />}
            title="Editor-in-Chief"
            description="Morning briefing — scored opportunities, one-click article generation"
          />
          <AdminLink
            href="/admin/drafts"
            icon={<Sparkles className="size-5" />}
            title="AI Drafts"
            description="Review and approve generated drafts"
          />
          <AdminLink
            href="/admin/map"
            icon={<MapPin className="size-5" />}
            title="Map"
            description={`Manage map points (${mapStats.published} published)`}
          />
          <AdminLink
            href="/admin/tracker"
            icon={<Trophy className="size-5" />}
            title="Completion Tracker"
            description={`Manage tracker items (${trackerTotals.totalItems} published)`}
          />
          <AdminLink
            href="/admin/community"
            icon={<Users className="size-5" />}
            title="Community"
            description="Moderate posts, polls, and weekly contests"
          />
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function AdminLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/12 hover:bg-white/[0.04]"
    >
      <span className="rounded-lg bg-white/5 p-2.5 text-white/60 group-hover:text-gta-pink">
        {icon}
      </span>
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>
    </Link>
  );
}
