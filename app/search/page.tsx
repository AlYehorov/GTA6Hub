import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/search/search-bar";
import { searchAll, SEARCH_TYPE_LABELS } from "@/lib/search/search-service";
import { trackSearch } from "@/lib/analytics/track";

export const metadata: Metadata = {
  title: "Search",
  description: "Search GTA6Hub news, guides, characters, and vehicles.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchAll(query) : [];

  if (query) {
    await trackSearch(query, results.length);
  }

  const grouped = groupResults(results);

  return (
    <>
      <PageHeader
        title="Search"
        description="Find news, guides, characters, and vehicles across GTA6Hub."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <SearchBar defaultValue={query} className="mb-10" />
        </Suspense>

        {!query && (
          <p className="text-center text-white/40">Enter a search term to get started.</p>
        )}

        {query && results.length === 0 && (
          <p className="text-center text-white/40">
            No results for &ldquo;{query}&rdquo;.
          </p>
        )}

        {query && results.length > 0 && (
          <p className="mb-6 text-sm text-white/40">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
        )}

        <div className="space-y-10">
          {Object.entries(grouped).map(([type, items]) =>
            items.length > 0 ? (
              <section key={type}>
                <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-white/40">
                  {SEARCH_TYPE_LABELS[type as keyof typeof SEARCH_TYPE_LABELS]}
                </h2>
                <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06]">
                  {items.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <Link
                        href={item.href}
                        className="block px-4 py-4 transition-colors hover:bg-white/[0.02]"
                      >
                        <p className="font-medium text-white">{item.title}</p>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-white/45">
                            {item.description}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null
          )}
        </div>
      </div>
    </>
  );
}

function groupResults(results: Awaited<ReturnType<typeof searchAll>>) {
  const groups: Record<string, typeof results> = {
    news: [],
    guide: [],
    character: [],
    vehicle: [],
  };

  for (const r of results) {
    groups[r.type].push(r);
  }

  return groups;
}
