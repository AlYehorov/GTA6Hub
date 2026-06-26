import Link from "next/link";
import type { EditorialTaskWithContext } from "@/lib/workflow/types";

export function TaskDetailSection({
  tasks,
}: {
  tasks: EditorialTaskWithContext[];
}) {
  const featured = tasks
    .filter((t) => t.status !== "published" && t.status !== "archived")
    .slice(0, 3);

  if (featured.length === 0) {
    return (
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-heading text-xl font-semibold text-white">Task Details</h2>
        <p className="mt-6 text-sm text-white/40">Claim a task to see full context.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">Task Details</h2>
      <p className="mt-1 text-sm text-white/45">Summary, sources, SEO context</p>

      <ul className="mt-6 space-y-6">
        {featured.map((task) => (
          <li
            key={task.id}
            className="rounded-xl border border-white/[0.06] bg-black/30 p-4"
          >
            <p className="font-medium text-white">{task.title}</p>
            <p className="mt-2 text-sm text-white/60">{task.description}</p>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {task.relatedSourceTitle && (
                <div>
                  <dt className="text-white/40">Related source</dt>
                  <dd className="text-white/80">{task.relatedSourceTitle}</dd>
                </div>
              )}
              {task.relatedArticleTitle && (
                <div>
                  <dt className="text-white/40">Related article</dt>
                  <dd>
                    <Link
                      href={`/admin/articles/${task.related_article}`}
                      className="text-gta-pink hover:underline"
                    >
                      {task.relatedArticleTitle}
                    </Link>
                  </dd>
                </div>
              )}
              {task.seoScore != null && (
                <div>
                  <dt className="text-white/40">SEO score</dt>
                  <dd className="font-medium text-gta-pink">{task.seoScore}/100</dd>
                </div>
              )}
            </dl>

            {task.suggestedFaq && task.suggestedFaq.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Suggested FAQ
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-white/65">
                  {task.suggestedFaq.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {task.suggestedInternalLinks && task.suggestedInternalLinks.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Suggested internal links
                </p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {task.suggestedInternalLinks.map((href) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/70 hover:border-gta-pink/30"
                      >
                        {href}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
