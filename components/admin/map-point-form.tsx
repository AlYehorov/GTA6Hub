"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMapPoint, updateMapPoint } from "@/lib/actions/map-points";
import { slugify } from "@/lib/utils/article";
import type { MapPoint, MapPointFormData, MapPointStatus, MapPointType } from "@/lib/types/map-point";
import {
  MAP_POINT_STATUS_LABELS,
  MAP_POINT_TYPE_LABELS,
} from "@/lib/types/map-point";

interface MapPointFormProps {
  point?: MapPoint;
}

const ALL_TYPES = Object.keys(MAP_POINT_TYPE_LABELS) as MapPointType[];
const ALL_STATUSES = Object.keys(MAP_POINT_STATUS_LABELS) as MapPointStatus[];

const emptyForm = (): MapPointFormData => ({
  title: "",
  slug: "",
  description: "",
  type: "location",
  district: "",
  lat: 50,
  lng: 50,
  image_url: "",
  spoiler: false,
  verified: false,
  status: "draft",
  source_url: "",
});

function pointToForm(point: MapPoint): MapPointFormData {
  return {
    title: point.title,
    slug: point.slug,
    description: point.description,
    type: point.type,
    district: point.district ?? "",
    lat: point.lat,
    lng: point.lng,
    image_url: point.image_url ?? "",
    spoiler: point.spoiler,
    verified: point.verified,
    status: point.status,
    source_url: point.source_url ?? "",
  };
}

export function MapPointForm({ point }: MapPointFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MapPointFormData>(
    point ? pointToForm(point) : emptyForm()
  );

  function updateField<K extends keyof MapPointFormData>(key: K, value: MapPointFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = point
        ? await updateMapPoint(point.id, form)
        : await createMapPoint(form);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push(point ? `/admin/map/${point.id}` : `/admin/map/${result.id}`);
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

      <Field label="Title">
        <input
          required
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Slug">
        <input
          value={form.slug}
          onChange={(e) => updateField("slug", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Description">
        <textarea
          required
          rows={5}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select
            value={form.type}
            onChange={(e) => updateField("type", e.target.value as MapPointType)}
            className={inputClass}
          >
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {MAP_POINT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="District">
          <input
            value={form.district}
            onChange={(e) => updateField("district", e.target.value)}
            className={inputClass}
            placeholder="Vice City, Leonida Keys..."
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lat (Y, 0–100)">
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.lat}
            onChange={(e) => updateField("lat", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Lng (X, 0–100)">
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.lng}
            onChange={(e) => updateField("lng", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Image URL (optional)">
        <input
          value={form.image_url}
          onChange={(e) => updateField("image_url", e.target.value)}
          className={inputClass}
          placeholder="https://..."
        />
      </Field>

      <Field label="Source URL (optional)">
        <input
          value={form.source_url}
          onChange={(e) => updateField("source_url", e.target.value)}
          className={inputClass}
          placeholder="https://..."
        />
      </Field>

      <Field label="Status">
        <select
          value={form.status}
          onChange={(e) => updateField("status", e.target.value as MapPointStatus)}
          className={inputClass}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {MAP_POINT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.spoiler}
            onChange={(e) => updateField("spoiler", e.target.checked)}
            className="rounded border-white/20"
          />
          Spoiler
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.verified}
            onChange={(e) => updateField("verified", e.target.checked)}
            className="rounded border-white/20"
          />
          Verified
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {point ? "Save changes" : "Create point"}
        </Button>
        <Link
          href="/admin/map"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-sm hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-wider text-white/40">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-gta-pink/40 focus:outline-none focus:ring-1 focus:ring-gta-pink/30";
