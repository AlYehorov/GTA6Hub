import { PageHeader } from "@/components/shared/page-header";
import { loadKgAdminData } from "@/lib/knowledge-graph/loader";
import { KgExtractionActions } from "@/components/admin/knowledge-graph/kg-extraction-actions";
import { KG_ENTITY_KINDS, kgEntityHref, KG_KIND_ROUTE_PREFIX } from "@/lib/knowledge-graph/types";
import Link from "next/link";

export default async function EntitiesAdminPage() {
  const data = await loadKgAdminData();

  return (
    <>
      <PageHeader
        title="Knowledge Graph"
        description="First-class entities — connected articles, videos, and map points."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {!data.configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Apply migration 014 and add SUPABASE_SERVICE_ROLE_KEY.
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard title="Total entities" value={String(data.totalEntities)} />
          <StatCard
            title="Article links"
            value={String(data.totalArticleLinks)}
          />
          <StatCard title="Video links" value={String(data.totalVideoLinks)} />
          <StatCard title="Map links" value={String(data.totalMapLinks)} />
        </div>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-xl font-semibold text-white">
            Extraction Pipeline
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Deterministic — aliases, regex, dictionaries. No automatic OpenAI.
          </p>
          <div className="mt-4">
            <KgExtractionActions />
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-xl font-semibold text-white">
            Entities by kind
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {KG_ENTITY_KINDS.map((kind) => (
              <li
                key={kind}
                className="rounded-lg border border-white/[0.06] px-3 py-2 text-sm text-white/70"
              >
                <span className="capitalize">{kind}</span>
                <span className="ml-2 text-white">{data.byKind[kind]}</span>
              </li>
            ))}
          </ul>
        </section>

        <EntityListSection
          title="Duplicate titles"
          empty="No duplicate title groups."
          items={data.duplicates.map((group) => ({
            key: group.normalizedTitle,
            label: group.normalizedTitle,
            detail: group.entities
              .map((e) => `${e.kind}:${e.slug}`)
              .join(" · "),
          }))}
        />

        <EntityListSection
          title="Alias collisions"
          empty="No alias collisions."
          items={data.aliasCollisions.map((row) => ({
            key: row.alias,
            label: `"${row.alias}"`,
            detail: row.entities.map((e) => e.title).join(" · "),
          }))}
        />

        <EntityListSection
          title="Orphan entities"
          empty="All entities have at least one link."
          items={data.orphans.map((entity) => ({
            key: entity.id,
            label: entity.title,
            detail: `${entity.kind} · no article/video/map links`,
          }))}
        />

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-xl font-semibold text-white">
            Merge suggestions
          </h2>
          {data.mergeSuggestions.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">No merge candidates.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.mergeSuggestions.map((suggestion) => (
                <li
                  key={`${suggestion.entityA.id}-${suggestion.entityB.id}`}
                  className="rounded-lg border border-white/[0.06] px-4 py-3 text-sm"
                >
                  <span className="text-white">
                    {suggestion.entityA.title} ↔ {suggestion.entityB.title}
                  </span>
                  <span className="ml-2 text-xs text-white/40">
                    {suggestion.reason} · {Math.round(suggestion.score * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading text-xl font-semibold text-white">
            Recent entities
          </h2>
          {data.recentEntities.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">
              Run extraction to populate the graph.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.recentEntities.map((entity) => (
                <li
                  key={entity.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-4 py-3 text-sm"
                >
                  <span className="text-white">{entity.title}</span>
                  <span className="text-xs text-white/40">
                    {entity.kind} · {entity.aliases.length} aliases
                  </span>
                  {KG_KIND_ROUTE_PREFIX[entity.kind] && (
                      <Link
                        href={kgEntityHref(entity.kind, entity.slug)}
                        className="text-xs text-gta-pink hover:underline"
                      >
                        Public page
                      </Link>
                    )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-xs text-white/30">
          <Link href="/admin/workflow" className="hover:text-white/50">
            Editorial workflow
          </Link>
          {" · "}
          <Link href="/admin/seo" className="hover:text-white/50">
            SEO command center
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

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-wider text-white/40">{title}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function EntityListSection({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ key: string; label: string; detail: string }>;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.key}
              className="rounded-lg border border-white/[0.06] px-4 py-3 text-sm"
            >
              <span className="text-white">{item.label}</span>
              <p className="mt-1 text-xs text-white/40">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
