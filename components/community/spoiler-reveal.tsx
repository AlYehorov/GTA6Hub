"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface SpoilerRevealProps {
  containsSpoilers: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SpoilerReveal({ containsSpoilers, children, className }: SpoilerRevealProps) {
  const [revealed, setRevealed] = useState(!containsSpoilers);

  if (!containsSpoilers || revealed) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <div className="pointer-events-none select-none blur-md">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-4">
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
        >
          Contains spoilers — tap to reveal
        </button>
      </div>
    </div>
  );
}

const SPOILER_REGEX = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;

function MarkdownBlock({ text }: { text: string }) {
  return (
    <div className="community-prose prose-invert max-w-none text-sm leading-relaxed text-white/75 [&_a]:text-gta-pink [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

export function CommunityMarkdown({
  content,
  containsSpoilers,
}: {
  content: string;
  containsSpoilers?: boolean;
}) {
  const parts: Array<{ type: "text" | "spoiler"; value: string }> = [];
  let lastIndex = 0;
  const regex = new RegExp(SPOILER_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "spoiler", value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return (
      <SpoilerReveal containsSpoilers={Boolean(containsSpoilers)}>
        <MarkdownBlock text={content} />
      </SpoilerReveal>
    );
  }

  return (
    <div className="space-y-3">
      {parts.map((part, index) =>
        part.type === "spoiler" ? (
          <SpoilerReveal key={index} containsSpoilers>
            <MarkdownBlock text={part.value.trim()} />
          </SpoilerReveal>
        ) : (
          <MarkdownBlock key={index} text={part.value} />
        )
      )}
    </div>
  );
}
