"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCommunityPost,
  getUserRelationPickers,
  uploadCommunityImage,
} from "@/lib/actions/community";
import { COMMUNITY_POST_TYPE_LABELS } from "@/lib/types/community";
import type { CommunityPostType } from "@/lib/types/community";

const TYPES = Object.keys(COMMUNITY_POST_TYPE_LABELS) as CommunityPostType[];

export function CreatePostForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState<CommunityPostType>("screenshot");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [spoilers, setSpoilers] = useState(false);
  const [mapPointId, setMapPointId] = useState("");
  const [articleId, setArticleId] = useState("");
  const [trackerItemId, setTrackerItemId] = useState("");
  const [contestId, setContestId] = useState("");
  const [pickers, setPickers] = useState<{
    mapPoints: { id: string; title: string }[];
    articles: { id: string; title: string }[];
    trackerItems: { id: string; title: string }[];
    contests: { id: string; title: string }[];
  }>({ mapPoints: [], articles: [], trackerItems: [], contests: [] });

  useEffect(() => {
    void getUserRelationPickers().then(setPickers);
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadCommunityImage(fd);
    setUploading(false);
    if (result.url) setImageUrl(result.url);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCommunityPost({
        type,
        title,
        body,
        image_url: imageUrl || undefined,
        contains_spoilers: spoilers,
        related_map_point_id: mapPointId || undefined,
        related_article_id: articleId || undefined,
        related_tracker_item_id: trackerItemId || undefined,
        contest_id: contestId || undefined,
      });

      if (result.error === "login_required") {
        router.push("/login?next=/community/new");
        return;
      }

      if (result.success && result.id) {
        router.push(`/community/${result.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
      <div>
        <label className="mb-2 block text-sm text-white/60">Post type</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full border px-3 py-2 text-sm min-h-11 ${
                type === t ? "border-gta-pink/40 bg-gta-pink/10 text-gta-pink" : "border-white/10 text-white/50"
              }`}
            >
              {COMMUNITY_POST_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-white/60">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="input-mobile w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-white/60">Body (optional)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-base text-white sm:text-sm"
          placeholder="Share your theory, discovery details, or discussion…"
        />
      </div>

      {(type === "screenshot" || type === "collection") && (
        <div>
          <label className="mb-2 block text-sm text-white/60">Image (PNG, JPEG, WEBP)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
            className="w-full text-sm text-white/60"
          />
          {uploading && <p className="mt-2 text-xs text-white/40">Uploading…</p>}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Preview" className="mt-3 max-h-64 rounded-xl border border-white/10" />
          )}
        </div>
      )}

      {type === "discovery" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <PickerSelect label="Map location" value={mapPointId} onChange={setMapPointId} options={pickers.mapPoints} />
          <PickerSelect label="Related article" value={articleId} onChange={setArticleId} options={pickers.articles} />
          <PickerSelect label="Tracker item" value={trackerItemId} onChange={setTrackerItemId} options={pickers.trackerItems} />
        </div>
      )}

      {type === "screenshot" && pickers.contests.length > 0 && (
        <PickerSelect
          label="Enter weekly contest (optional)"
          value={contestId}
          onChange={setContestId}
          options={pickers.contests.map((c) => ({ id: c.id, title: c.title }))}
        />
      )}

      <label className="flex items-center gap-2 text-sm text-white/60">
        <input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} />
        Contains spoilers
      </label>

      <p className="text-xs text-white/40">
        Posts are reviewed by moderators before appearing in the public feed.
      </p>

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-lg bg-gta-pink px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 min-h-11"
      >
        Submit for review
      </button>
    </form>
  );
}

function PickerSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; title: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/60">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
      >
        <option value="">None</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>
    </div>
  );
}
