"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCommunityComment } from "@/lib/actions/community";
import { CommunityMarkdown } from "@/components/community/spoiler-reveal";
import type { CommunityComment } from "@/lib/types/community";

interface CommentThreadProps {
  postId: string;
  comments: CommunityComment[];
}

function CommentItem({
  postId,
  comment,
  canReply,
}: {
  postId: string;
  comment: CommunityComment;
  canReply: boolean;
}) {
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [body, setBody] = useState("");
  const [spoilers, setSpoilers] = useState(false);
  const [pending, startTransition] = useTransition();

  function submitReply() {
    startTransition(async () => {
      const result = await createCommunityComment({
        postId,
        body,
        parentId: comment.id,
        contains_spoilers: spoilers,
      });
      if (result.error === "login_required") {
        router.push(`/login?next=/community/${postId}`);
        return;
      }
      if (result.success) {
        setBody("");
        setReplyOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className={comment.depth > 0 ? "ml-4 border-l border-white/10 pl-4 sm:ml-6" : ""}>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Link href={`/u/${comment.author?.username ?? ""}`} className="text-sm font-medium text-white hover:text-gta-pink">
            @{comment.author?.username}
          </Link>
          <time className="text-xs text-white/35">
            {new Date(comment.created_at).toLocaleDateString()}
          </time>
        </div>
        <CommunityMarkdown content={comment.body} containsSpoilers={comment.contains_spoilers} />
        {canReply && (
          <button
            type="button"
            onClick={() => setReplyOpen((v) => !v)}
            className="mt-3 text-xs text-white/45 hover:text-gta-pink"
          >
            Reply
          </button>
        )}
      </div>

      {replyOpen && (
        <div className="mt-3 space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Write a reply…"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-white/35 focus:border-gta-pink/40 focus:outline-none sm:text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-white/50">
            <input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} />
            Contains spoilers
          </label>
          <button
            type="button"
            disabled={pending || !body.trim()}
            onClick={submitReply}
            className="rounded-lg bg-gta-pink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Post reply
          </button>
        </div>
      )}

      {comment.replies?.map((reply) => (
        <div key={reply.id} className="mt-3">
          <CommentItem postId={postId} comment={reply} canReply={reply.depth < 2} />
        </div>
      ))}
    </div>
  );
}

export function CommentThread({ postId, comments }: CommentThreadProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [spoilers, setSpoilers] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createCommunityComment({
        postId,
        body,
        contains_spoilers: spoilers,
      });
      if (result.error === "login_required") {
        router.push(`/login?next=/community/${postId}`);
        return;
      }
      if (result.success) {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <section id="comments" className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-white">Comments</h2>

      <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Join the discussion… Markdown supported. Use [spoiler]hidden text[/spoiler]"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-white/35 focus:border-gta-pink/40 focus:outline-none sm:text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-white/50">
          <input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} />
          Contains spoilers
        </label>
        <button
          type="button"
          disabled={pending || !body.trim()}
          onClick={submit}
          className="rounded-lg bg-gta-pink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 min-h-11"
        >
          Post comment
        </button>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-white/40">No comments yet. Start the conversation.</p>
      ) : (
        comments.map((comment) => (
          <CommentItem key={comment.id} postId={postId} comment={comment} canReply />
        ))
      )}
    </section>
  );
}
