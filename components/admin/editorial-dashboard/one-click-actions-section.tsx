import { EditorialActionButton } from "@/components/admin/editorial-dashboard/editorial-action-button";

export function OneClickActionsSection() {
  return (
    <section className="rounded-2xl border border-gta-pink/20 bg-gta-pink/5 p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        One-Click Actions
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Queue work for human review — never auto-publish
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <EditorialActionButton
          label="Process Pending Sources"
          variant="default"
          action={{ type: "process-sources" }}
        />
        <EditorialActionButton
          label="Generate Draft"
          action={{ type: "navigate", href: "/admin/sources" }}
        />
        <EditorialActionButton
          label="Update Draft"
          action={{ type: "navigate", href: "/admin/drafts" }}
        />
        <EditorialActionButton
          label="Improve SEO"
          action={{ type: "navigate", href: "/admin/articles" }}
        />
        <EditorialActionButton
          label="Suggest FAQ"
          action={{ type: "navigate", href: "/admin/articles?focus=faq" }}
        />
        <EditorialActionButton
          label="Suggest Internal Links"
          action={{ type: "navigate", href: "/admin/dashboard#internal-links" }}
        />
      </div>
    </section>
  );
}
