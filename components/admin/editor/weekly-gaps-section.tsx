import Link from "next/link";
import type { ContentGapItem } from "@/lib/opportunity-engine/types";

export function WeeklyGapsSection({ gaps }: { gaps: ContentGapItem[] }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Weekly Content Gap
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Entities and topics without strong article coverage
      </p>

      {gaps.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">No major gaps detected.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {gaps.map((gap) => (
            <li key={`${gap.kind}-${gap.slug}`} className="text-sm text-white/65">
              ·{" "}
              <Link href={gap.href} className="hover:text-gta-pink">
                {gap.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
