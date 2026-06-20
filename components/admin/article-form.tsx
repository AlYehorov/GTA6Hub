"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createArticle,
  updateArticle,
  uploadArticleImage,
} from "@/lib/actions/articles";
import { slugify } from "@/lib/utils/article";
import type {
  ArticleFormData,
  ArticleStatus,
  ArticleType,
  ArticleWithRelations,
  Category,
  Tag,
} from "@/lib/types/article";

interface ArticleFormProps {
  categories: Category[];
  tags: Tag[];
  article?: ArticleWithRelations;
  defaultType?: ArticleType;
}

const emptyForm = (type: ArticleType = "news"): ArticleFormData => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  hero_image_url: "",
  status: "draft",
  type,
  category_id: "",
  tag_ids: [],
  seo_title: "",
  seo_description: "",
});

function articleToForm(article: ArticleWithRelations): ArticleFormData {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? "",
    content: article.content,
    hero_image_url: article.hero_image_url ?? "",
    status: article.status,
    type: article.type,
    category_id: article.category_id ?? "",
    tag_ids: article.tags.map((t) => t.id),
    seo_title: article.seo_title ?? "",
    seo_description: article.seo_description ?? "",
  };
}

export function ArticleForm({
  categories,
  tags,
  article,
  defaultType = "news",
}: ArticleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<ArticleFormData>(
    article ? articleToForm(article) : emptyForm(defaultType)
  );

  function updateField<K extends keyof ArticleFormData>(
    key: K,
    value: ArticleFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);

    const result = await uploadArticleImage(fd);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) updateField("hero_image_url", result.url);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = article
        ? await updateArticle(article.id, form)
        : await createArticle(form);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push("/admin/articles");
      router.refresh();
    });
  }

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-gta-pink/40 focus:outline-none focus:ring-1 focus:ring-gta-pink/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-white/50">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-white/50">Slug</span>
            <input
              required
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-white/50">Excerpt</span>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-white/50">Type</span>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value as ArticleType)}
                className={inputClass}
              >
                <option value="news">News</option>
                <option value="guide">Guide</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-white/50">Status</span>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value as ArticleStatus)}
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-white/50">Category</span>
            <select
              value={form.category_id}
              onChange={(e) => updateField("category_id", e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-white/50">Hero image</span>
            <input
              value={form.hero_image_url}
              onChange={(e) => updateField("hero_image_url", e.target.value)}
              placeholder="URL or upload below"
              className={inputClass}
            />
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/5">
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload to Supabase Storage
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-white/50">SEO title</span>
            <input
              value={form.seo_title}
              onChange={(e) => updateField("seo_title", e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-white/50">SEO description</span>
            <textarea
              rows={2}
              value={form.seo_description}
              onChange={(e) => updateField("seo_description", e.target.value)}
              className={inputClass}
            />
          </label>

          {tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-white/50">Tags</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      form.tag_ids.includes(tag.id)
                        ? "border-gta-pink/50 bg-gta-pink/10 text-gta-pink"
                        : "border-white/10 text-white/50 hover:border-white/20"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wider text-white/50">
          Content (Markdown)
        </span>
        <textarea
          required
          rows={16}
          value={form.content}
          onChange={(e) => updateField("content", e.target.value)}
          className={`${inputClass} font-mono text-[13px]`}
          placeholder="Write your article in Markdown..."
        />
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || uploading}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {article ? "Save changes" : "Create article"}
        </Button>
        <Link
          href="/admin/articles"
          className="text-sm text-white/50 transition-colors hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
