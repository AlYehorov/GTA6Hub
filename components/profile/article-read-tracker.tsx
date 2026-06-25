"use client";

import { useEffect, useRef } from "react";
import { recordArticleRead } from "@/lib/actions/saved-content";

interface ArticleReadTrackerProps {
  articleId: string;
}

export function ArticleReadTracker({ articleId }: ArticleReadTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const timer = window.setTimeout(() => {
      void recordArticleRead(articleId);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [articleId]);

  return null;
}
