import Link from "next/link";
import type { ContentInventoryRow } from "@/lib/seo/types";

function StatusBadge({ status }: { status: ContentInventoryRow["seoStatus"] }) {
  const styles = {
    excellent: "bg-emerald-500/15 text-emerald-400",
    good: "bg-blue-500/15 text-blue-400",
    "needs-work": "bg-amber-500/15 text-amber-400",
    critical: "bg-red-500/15 text-red-400",
  };
  const labels = {
    excellent: "Excellent",
    good: "Good",
    "needs-work": "Needs work",
    critical: "Critical",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function ContentInventorySection({
  inventory,
}: {
  inventory: ContentInventoryRow[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Content Inventory
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Every article — measurable SEO signals (rule-based, no OpenAI)
      </p>

      {inventory.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No articles found.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Category</th>
                <th className="pb-3 pr-4 font-medium">Published</th>
                <th className="pb-3 pr-4 font-medium">Updated</th>
                <th className="pb-3 pr-4 font-medium">Words</th>
                <th className="pb-3 pr-4 font-medium">Images</th>
                <th className="pb-3 pr-4 font-medium">FAQ</th>
                <th className="pb-3 pr-4 font-medium">Links</th>
                <th className="pb-3 pr-4 font-medium">Video</th>
                <th className="pb-3 pr-4 font-medium">Score</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {inventory.map((row) => (
                <tr key={row.articleId} className="text-white/75">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/articles/${row.articleId}`}
                      className="font-medium text-white hover:underline"
                    >
                      {row.title}
                    </Link>
                    <span className="ml-2 text-xs text-white/30">{row.status}</span>
                  </td>
                  <td className="py-3 pr-4">{row.category ?? "—"}</td>
                  <td className="py-3 pr-4 text-xs">
                    {row.publishedAt
                      ? new Date(row.publishedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 text-xs">
                    {new Date(row.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">{row.wordCount}</td>
                  <td className="py-3 pr-4">{row.imageCount}</td>
                  <td className="py-3 pr-4">{row.hasFaq ? "Yes" : "No"}</td>
                  <td className="py-3 pr-4">{row.internalLinkCount}</td>
                  <td className="py-3 pr-4">{row.hasVideo ? "Yes" : "No"}</td>
                  <td className="py-3 pr-4 font-medium text-gta-pink">{row.score}</td>
                  <td className="py-3">
                    <StatusBadge status={row.seoStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
