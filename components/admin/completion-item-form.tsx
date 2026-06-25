"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createCompletionItem,
  updateCompletionItem,
  updateCompletionItemStatus,
  deleteCompletionItem,
} from "@/lib/actions/completion-items";
import type {
  CompletionCategory,
  CompletionDifficulty,
  CompletionItem,
  CompletionItemFormData,
  CompletionItemStatus,
} from "@/lib/types/completion";
import { COMPLETION_DIFFICULTY_LABELS } from "@/lib/types/completion";

interface CompletionItemFormProps {
  categories: CompletionCategory[];
  item?: CompletionItem;
}

const DIFFICULTIES = Object.keys(COMPLETION_DIFFICULTY_LABELS) as CompletionDifficulty[];
const STATUSES: CompletionItemStatus[] = ["draft", "published"];

const emptyForm = (categories: CompletionCategory[]): CompletionItemFormData => ({
  category_id: categories[0]?.id ?? "",
  title: "",
  description: "",
  spoiler: false,
  difficulty: "medium",
  image_url: "",
  sort_order: 0,
  status: "draft",
});

export function CompletionItemForm({ categories, item }: CompletionItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CompletionItemFormData>(
    item
      ? {
          category_id: item.category_id,
          title: item.title,
          description: item.description,
          spoiler: item.spoiler,
          difficulty: item.difficulty,
          image_url: item.image_url ?? "",
          sort_order: item.sort_order,
          status: item.status,
        }
      : emptyForm(categories)
  );

  function updateField<K extends keyof CompletionItemFormData>(
    key: K,
    value: CompletionItemFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = item
        ? await updateCompletionItem(item.id, form)
        : await createCompletionItem(form);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push(item ? `/admin/tracker/${item.id}` : `/admin/tracker/${result.id}`);
      router.refresh();
    });
  }

  function handlePublish() {
    if (!item) return;
    startTransition(async () => {
      const result = await updateCompletionItemStatus(item.id, "published");
      if (!result.success) {
        setError(result.error ?? "Failed to publish");
        return;
      }
      updateField("status", "published");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!item || !confirm("Delete this tracker item?")) return;
    startTransition(async () => {
      const result = await deleteCompletionItem(item.id);
      if (!result.success) {
        setError(result.error ?? "Failed to delete");
        return;
      }
      router.push("/admin/tracker");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <Field label="Category">
        <select
          required
          value={form.category_id}
          onChange={(e) => updateField("category_id", e.target.value)}
          className={inputClass}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Title">
        <input
          required
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Difficulty">
          <select
            value={form.difficulty}
            onChange={(e) => updateField("difficulty", e.target.value as CompletionDifficulty)}
            className={inputClass}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {COMPLETION_DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Sort order">
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => updateField("sort_order", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Image URL">
        <input
          value={form.image_url}
          onChange={(e) => updateField("image_url", e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.spoiler}
            onChange={(e) => updateField("spoiler", e.target.checked)}
            className="rounded border-white/20"
          />
          Spoiler content
        </label>

        <Field label="Status" className="flex-1 min-w-[140px]">
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value as CompletionItemStatus)}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {item ? "Save changes" : "Create item"}
        </Button>

        {item && form.status !== "published" && (
          <Button type="button" variant="outline" disabled={isPending} onClick={handlePublish}>
            Publish
          </Button>
        )}

        {item && (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </Button>
        )}

        <Link
          href="/admin/tracker"
          className="ml-auto text-sm text-white/50 hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-gta-pink/40 focus:outline-none";
