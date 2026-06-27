import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

const SEO_LINKS = [
  {
    href: "/admin/insights",
    title: "SEO Insights",
    description: "GSC, GA4, Clarity — traffic, CTR, opportunities",
  },
  {
    href: "/admin/seo",
    title: "SEO Command Center",
    description: "Internal SEO score, improve queue, weekly report",
  },
  {
    href: "/admin/workflow",
    title: "Editorial Workflow",
    description: "Улучшение уже опубликованных статей",
  },
  {
    href: "/admin/dashboard",
    title: "Editorial Dashboard",
    description: "Утренний брифинг, outdated articles, gaps",
  },
];

export function StudioSeoTab() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-heading text-xl font-semibold text-white">После publish</h2>
        <p className="mt-2 text-sm text-white/55">
          Editor — для <strong className="text-white/80">новых</strong> статей из sources.
          SEO / Insights / Workflow — для <strong className="text-white/80">улучшения</strong>{" "}
          уже живых страниц.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {SEO_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-gta-pink/30 hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-white group-hover:text-gta-pink">{link.title}</p>
              <ExternalLink className="size-4 shrink-0 text-white/30" />
            </div>
            <p className="mt-2 text-sm text-white/45">{link.description}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/admin/articles"
        className="inline-flex items-center gap-2 text-sm text-gta-pink hover:underline"
      >
        Редактировать опубликованные статьи
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
