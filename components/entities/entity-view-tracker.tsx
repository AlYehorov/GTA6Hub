"use client";

import { useEffect } from "react";
import { trackEntityView } from "@/lib/analytics/track";
import type { GameEntityKind } from "@/lib/types/game-entity";

export function EntityViewTracker({
  kind,
  slug,
}: {
  kind: GameEntityKind;
  slug: string;
}) {
  useEffect(() => {
    void trackEntityView(kind, slug);
  }, [kind, slug]);

  return null;
}
