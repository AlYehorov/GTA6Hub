import Link from "next/link";
import type { SourcePlatform } from "@/lib/types/source";
import { SOURCE_PLATFORM_LABELS } from "@/lib/types/source";
import { cn } from "@/lib/utils";

interface SourceFiltersProps {
  currentSource?: SourcePlatform;
  currentProcessed?: boolean;
}

export function SourceFilters({ currentSource, currentProcessed }: SourceFiltersProps) {
  const platforms = Object.keys(SOURCE_PLATFORM_LABELS) as SourcePlatform[];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <FilterLink
        href="/admin/sources"
        active={currentSource === undefined && currentProcessed === undefined}
      >
        All
      </FilterLink>

      {platforms.map((platform) => (
        <FilterLink
          key={platform}
          href={buildHref(platform, currentProcessed)}
          active={currentSource === platform}
        >
          {SOURCE_PLATFORM_LABELS[platform]}
        </FilterLink>
      ))}

      <span className="mx-1 hidden h-6 w-px self-center bg-white/10 sm:inline" />

      <FilterLink
        href={buildHref(currentSource, false)}
        active={currentProcessed === false}
      >
        Unprocessed
      </FilterLink>
      <FilterLink
        href={buildHref(currentSource, true)}
        active={currentProcessed === true}
      >
        Processed
      </FilterLink>
    </div>
  );
}

function buildHref(source?: SourcePlatform, processed?: boolean): string {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (processed !== undefined) params.set("processed", processed ? "true" : "false");
  const qs = params.toString();
  return qs ? `/admin/sources?${qs}` : "/admin/sources";
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-gta-pink/40 bg-gta-pink/10 text-gta-pink"
          : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
      )}
    >
      {children}
    </Link>
  );
}
