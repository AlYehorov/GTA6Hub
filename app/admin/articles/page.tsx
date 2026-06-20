import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getAllArticlesAdmin } from "@/lib/articles/queries";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { formatDate } from "@/lib/utils/format-date";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AdminArticlesPage() {
  const articles = isSupabaseAdminConfigured() ? await getAllArticlesAdmin() : [];

  return (
    <>
      <PageHeader
        title="Articles"
        description="All news posts and guides — drafts and published."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-end">
          <Link
            href="/admin/articles/create"
            className={cn(buttonVariants(), "gap-2 bg-white text-black hover:bg-white/90")}
          >
            <Plus className="size-4" />
            New article
          </Link>
        </div>

        {articles.length === 0 ? (
          <p className="py-12 text-center text-white/40">No articles yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Published</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{article.title}</td>
                    <td className="px-4 py-3 capitalize text-white/50">{article.type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={article.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-white/40 sm:table-cell">
                      {article.published_at
                        ? formatDate(article.published_at)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="text-white/50 hover:text-white"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs capitalize",
        status === "published"
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-white/5 text-white/50"
      )}
    >
      {status}
    </span>
  );
}
