"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toggleSaveLocation } from "@/lib/actions/saved-content";
import { cn } from "@/lib/utils";

interface SaveLocationButtonProps {
  mapPointId: string;
  initialSaved?: boolean;
  className?: string;
}

export function SaveLocationButton({
  mapPointId,
  initialSaved = false,
  className,
}: SaveLocationButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await toggleSaveLocation(mapPointId);
    setLoading(false);

    if (result.error === "login_required") {
      router.push(`/login?next=${encodeURIComponent("/map")}`);
      return;
    }

    if (result.success) {
      setSaved(!!result.saved);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
        saved
          ? "border-gta-cyan/40 bg-gta-cyan/10 text-gta-cyan"
          : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
        className
      )}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} />
      {saved ? "Saved" : "Save location"}
    </button>
  );
}
