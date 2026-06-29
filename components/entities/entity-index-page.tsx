import Link from "next/link";
import { ENTITY_KINDS } from "@/lib/entities/config";
import type { GameEntity, GameEntityKind } from "@/lib/types/game-entity";

const CATEGORY_ORDER: Record<string, number> = {
  protagonist: 0,
  city: 1,
  islands: 2,
  town: 3,
  region: 4,
  landmark: 5,
  supporting: 10,
  car: 20,
  boat: 21,
  emergency: 22,
  wildlife: 30,
};

function categoryOrder(category: string): number {
  return CATEGORY_ORDER[category.toLowerCase()] ?? 50;
}

function groupEntities(entities: GameEntity[]): Array<{ label: string; items: GameEntity[] }> {
  const byCategory = new Map<string, GameEntity[]>();

  for (const entity of entities) {
    const label = entity.category
      ? entity.category.charAt(0).toUpperCase() + entity.category.slice(1)
      : "Other";
    const bucket = byCategory.get(label) ?? [];
    bucket.push(entity);
    byCategory.set(label, bucket);
  }

  return [...byCategory.entries()]
    .sort(([a], [b]) => categoryOrder(a) - categoryOrder(b))
    .map(([label, items]) => ({
      label,
      items: items.sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

function EntityCard({
  kind,
  entity,
}: {
  kind: GameEntityKind;
  entity: GameEntity;
}) {
  const href = `${ENTITY_KINDS[kind].routePrefix}/${entity.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition hover:border-gta-pink/30 hover:bg-white/[0.04]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.03]">
        {entity.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entity.image_url}
            alt={entity.title}
            className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-gta-pink/10 to-transparent">
            <span className="font-heading text-3xl font-bold text-white/20">
              {entity.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs uppercase tracking-wider text-gta-pink/80">
          {entity.category || ENTITY_KINDS[kind].labelSingular}
        </p>
        <h2 className="mt-1 font-heading text-xl font-semibold text-white group-hover:text-gta-pink">
          {entity.title}
        </h2>
        {entity.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/55">
            {entity.description}
          </p>
        )}
      </div>
    </Link>
  );
}

interface EntityIndexPageProps {
  kind: GameEntityKind;
  entities: GameEntity[];
}

export function EntityIndexPage({ kind, entities }: EntityIndexPageProps) {
  const config = ENTITY_KINDS[kind];
  const groups = groupEntities(entities);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {entities.length === 0 ? (
        <p className="text-muted-foreground">
          {config.labelSingular} profiles coming soon.
        </p>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-5 font-heading text-lg font-semibold text-white/80">
                {group.label}
              </h2>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((entity) => (
                  <li key={entity.slug}>
                    <EntityCard kind={kind} entity={entity} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
