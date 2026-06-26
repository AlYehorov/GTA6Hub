export function HomeSectionFallback({ className }: { className?: string }) {
  return (
    <div
      className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className ?? ""}`}
      aria-hidden
    >
      <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.04]" />
      <div className="mt-6 h-56 animate-pulse rounded-2xl bg-white/[0.03] sm:h-72" />
    </div>
  );
}
