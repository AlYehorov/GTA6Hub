import type { Tag } from "@/lib/types/article";

interface ArticleTagsProps {
  tags: Tag[];
}

export function ArticleTags({ tags }: ArticleTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="mx-auto max-w-3xl border-t border-white/[0.06] px-4 py-8 sm:px-6 lg:px-8">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/40">
        Tags
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
