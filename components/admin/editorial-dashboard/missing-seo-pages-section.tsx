import Link from "next/link";
import { ENTITY_KINDS } from "@/lib/entities/config";
import type { MissingSeoPage } from "@/lib/editorial/types";
import { EditorialActionButton } from "@/components/admin/editorial-dashboard/editorial-action-button";

export function MissingSeoPagesSection({
  pages,
}: {
  pages: MissingSeoPage[];
}) {
  const grouped = pages.reduce<Record<string, MissingSeoPage[]>>((acc, page) => {
    const label = ENTITY_KINDS[page.kind].label;
    if (!acc[label]) acc[label] = [];
    acc[label].push(page);
    return acc;
  }, {});

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Missing SEO Pages
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Characters, locations, vehicles, businesses, animals, missions, and collectibles
        vs published coverage
      </p>

      {pages.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No missing pages detected.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([kindLabel, items]) => (
            <div key={kindLabel}>
              <h3 className="text-sm font-medium uppercase tracking-wider text-white/50">
                {kindLabel}
              </h3>
              <ul className="mt-2 space-y-2">
                {items.map((page) => (
                  <li
                    key={`${page.kind}-${page.slug}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="text-amber-400/90">Missing</span>{" "}
                      <Link
                        href={page.entityHref}
                        className="font-medium text-white hover:underline"
                      >
                        {page.title}
                      </Link>
                      <span className="ml-2 text-xs text-white/40">
                        {page.reason === "no_entity_page"
                          ? "unpublished entity"
                          : "no article"}
                      </span>
                    </div>
                    <EditorialActionButton
                      label="Generate"
                      action={{
                        type: "navigate",
                        href: `/admin/articles/create?title=${encodeURIComponent(`${page.title} — GTA 6 guide`)}&type=guide`,
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
