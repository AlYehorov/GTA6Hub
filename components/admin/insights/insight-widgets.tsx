import type { ReactNode } from "react";

export function InsightSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function MetricGrid({
  items,
}: {
  items: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-4"
        >
          <p className="text-xs uppercase tracking-wider text-white/40">{item.label}</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-white">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-white/40">{message}</p>;
}
