"use client";

import Link from "next/link";
import { trackRelatedLinkClick } from "@/lib/analytics/track";
import type { RelatedLink } from "@/lib/types/game-entity";

interface RelatedLinksSectionProps {
  title: string;
  links: RelatedLink[];
  sourceEntity: string;
}

export function RelatedLinksSection({ title, links, sourceEntity }: RelatedLinksSectionProps) {
  if (links.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-semibold text-white">{title}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => trackRelatedLinkClick(sourceEntity, link.href, link.type)}
              className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/12 hover:bg-white/[0.04]"
            >
              <p className="font-medium text-white">{link.title}</p>
              <p className="mt-0.5 text-xs text-white/40">{link.type}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
