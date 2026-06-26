"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestSeoAiEditor } from "@/lib/actions/seo-intelligence";
import type { AiEditorResult } from "@/lib/seo/types";

interface SeoAiEditorPanelProps {
  articleId: string;
  articleTitle: string;
}

export function SeoAiEditorPanel({ articleId, articleTitle }: SeoAiEditorPanelProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AiEditorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const response = await requestSeoAiEditor(articleId);
      if (!response.success || !response.data) {
        setError(response.error ?? "Failed");
        setResult(null);
        return;
      }
      setResult(response.data);
    });
  }

  return (
    <div className="rounded-xl border border-gta-pink/20 bg-gta-pink/5 p-4">
      <p className="text-sm font-medium text-white">{articleTitle}</p>
      <p className="mt-1 text-xs text-white/45">
        One OpenAI request on click. Never auto-publishes.
      </p>
      <Button
        type="button"
        size="sm"
        className="mt-3"
        disabled={pending}
        onClick={handleRun}
      >
        {pending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
        Run AI Editor
      </Button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {result && (
        <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-black/40 p-4 text-sm">
          <div>
            <p className="text-xs text-white/40">SEO Title</p>
            <p className="text-white">{result.seo_title}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">SEO Description</p>
            <p className="text-white/80">{result.seo_description}</p>
          </div>
          {result.faq_markdown && (
            <div>
              <p className="text-xs text-white/40">FAQ</p>
              <pre className="mt-1 whitespace-pre-wrap text-xs text-white/70">
                {result.faq_markdown}
              </pre>
            </div>
          )}
          {result.internal_link_suggestions.length > 0 && (
            <div>
              <p className="text-xs text-white/40">Internal links</p>
              <ul className="mt-1 list-inside list-disc text-xs text-gta-pink">
                {result.internal_link_suggestions.map((href) => (
                  <li key={href}>{href}</li>
                ))}
              </ul>
            </div>
          )}
          {result.notes && (
            <p className="text-xs italic text-white/50">{result.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
