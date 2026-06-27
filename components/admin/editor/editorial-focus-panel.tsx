"use client";

import { useState } from "react";
import type {
  EditorialFocus,
  EditorialFocusOverrides,
  FocusArticleType,
} from "@/lib/opportunity-engine/editorial-focus";

const ARTICLE_TYPES: FocusArticleType[] = [
  "news",
  "guide",
  "analysis",
  "comparison",
  "faq",
  "timeline",
  "feature",
  "opinion",
];

interface EditorialFocusPanelProps {
  focus: EditorialFocus;
  onChange: (overrides: EditorialFocusOverrides) => void;
}

export function EditorialFocusPanel({ focus, onChange }: EditorialFocusPanelProps) {
  const [headline, setHeadline] = useState(focus.headline);
  const [primaryStory, setPrimaryStory] = useState(focus.primary_story);
  const [articleType, setArticleType] = useState<FocusArticleType>(focus.article_type);

  function emitPatch(patch: EditorialFocusOverrides) {
    onChange({
      headline,
      primary_story: primaryStory,
      article_type: articleType,
      ...patch,
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
          Editorial Focus
        </p>
        {!focus.focus_valid && (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">
            Needs review
          </span>
        )}
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Meta label="Article Type" value={articleType} />
        <Meta label="SEO Keyword" value={focus.seo_keyword} />
        <Meta label="Confidence" value={focus.confidence} />
        <Meta label="Reading Time" value={`~${focus.reading_time_target} min`} />
      </dl>

      <div className="mt-4 space-y-3">
        <Field label="Headline">
          <input
            value={headline}
            onChange={(event) => {
              setHeadline(event.target.value);
              emitPatch({ headline: event.target.value });
            }}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </Field>

        <Field label="Primary Story">
          <textarea
            value={primaryStory}
            onChange={(event) => {
              setPrimaryStory(event.target.value);
              emitPatch({ primary_story: event.target.value });
            }}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </Field>

        <Field label="Article Type">
          <select
            value={articleType}
            onChange={(event) => {
              const next = event.target.value as FocusArticleType;
              setArticleType(next);
              emitPatch({ article_type: next });
            }}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {ARTICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {focus.secondary_facts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-white/35">Supporting Facts</p>
          <ul className="mt-2 space-y-1 text-sm text-white/60">
            {focus.secondary_facts.slice(0, 4).map((fact) => (
              <li key={fact}>• {fact}</li>
            ))}
          </ul>
        </div>
      )}

      {focus.focus_error && (
        <p className="mt-3 text-xs text-amber-300">{focus.focus_error}</p>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-white/35">{label}</dt>
      <dd className="mt-1 font-medium capitalize text-white">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-white/35">{label}</span>
      {children}
    </label>
  );
}
