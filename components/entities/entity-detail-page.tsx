import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RelatedLinksSection } from "@/components/entities/related-links-section";
import { EntityViewTracker } from "@/components/entities/entity-view-tracker";
import { ENTITY_KINDS } from "@/lib/entities/config";
import { buildEntityJsonLd } from "@/lib/entities/structured-data";
import type {
  EntityFaqItem,
  GameEntity,
  GameEntityKind,
  RelatedLink,
} from "@/lib/types/game-entity";

interface EntityDetailPageProps {
  kind: GameEntityKind;
  entity: GameEntity;
  faqs: EntityFaqItem[];
  relatedArticles: RelatedLink[];
  relatedGuides: RelatedLink[];
  relatedTracker: RelatedLink[];
  relatedEntities: RelatedLink[];
}

export function EntityDetailPage({
  kind,
  entity,
  faqs,
  relatedArticles,
  relatedGuides,
  relatedTracker,
  relatedEntities,
}: EntityDetailPageProps) {
  const config = ENTITY_KINDS[kind];
  const jsonLd = buildEntityJsonLd(entity, kind, faqs);

  return (
    <>
      <EntityViewTracker kind={kind} slug={entity.slug} />
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="border-b border-white/10 bg-black pt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <nav className="mb-4 flex items-center gap-1 text-sm text-white/40">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="size-3.5" />
            <Link href={config.routePrefix} className="hover:text-white">
              {config.label}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-white/70">{entity.title}</span>
          </nav>

          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gta-pink">
            GTA VI {config.labelSingular}
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {entity.title}
          </h1>
          {entity.category && (
            <p className="mt-3 text-sm uppercase tracking-wider text-white/40">{entity.category}</p>
          )}
        </div>
      </div>

      {entity.image_url && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-6 aspect-[21/9] overflow-hidden rounded-2xl border border-white/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entity.image_url}
              alt={entity.title}
              className="size-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Overview</h2>
          <p className="max-w-3xl text-lg leading-relaxed text-white/60">{entity.description}</p>
        </section>

        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Known Information</h2>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/40">Category</dt>
                <dd className="mt-1 text-white">{entity.category}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/40">Type</dt>
                <dd className="mt-1 text-white">{config.labelSingular}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-white/40">Summary</dt>
                <dd className="mt-1 text-white/70">{entity.description}</dd>
              </div>
            </dl>
          </div>
        </section>

        <RelatedLinksSection
          title="Related Articles"
          links={relatedArticles}
          sourceEntity={`${kind}/${entity.slug}`}
        />
        <RelatedLinksSection
          title="Related Guides"
          links={relatedGuides}
          sourceEntity={`${kind}/${entity.slug}`}
        />
        <RelatedLinksSection
          title="Related Tracker Categories"
          links={relatedTracker}
          sourceEntity={`${kind}/${entity.slug}`}
        />
        <RelatedLinksSection
          title="Explore More"
          links={relatedEntities}
          sourceEntity={`${kind}/${entity.slug}`}
        />

        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
              >
                <summary className="cursor-pointer list-none font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
