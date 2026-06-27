"use client";

import { useState, useTransition } from "react";
import { saveSearchConsoleProperty } from "@/lib/actions/integrations";

export function SearchConsoleSetupForm({
  initialPropertyUrl,
}: {
  initialPropertyUrl: string;
}) {
  const [propertyUrl, setPropertyUrl] = useState(initialPropertyUrl);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await saveSearchConsoleProperty(propertyUrl);
          setMessage(result.success ? "Saved" : result.error ?? "Failed");
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-white/50">Property URL</span>
        <input
          type="text"
          value={propertyUrl}
          onChange={(e) => setPropertyUrl(e.target.value)}
          className="min-w-[280px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          placeholder="sc-domain:gtavihub.gg"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:border-gta-pink/40 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save property"}
      </button>
      {message && <span className="text-sm text-white/50">{message}</span>}
    </form>
  );
}
