"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleCommunityLike } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  initiallyLiked?: boolean;
}

export function LikeButton({ postId, initialCount, initiallyLiked }: LikeButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [liked, setLiked] = useState(Boolean(initiallyLiked));
  const [count, setCount] = useState(initialCount);

  function handleClick() {
    startTransition(async () => {
      const result = await toggleCommunityLike(postId);
      if (!result.success) {
        if (result.error === "login_required") {
          router.push(`/login?next=/community/${postId}`);
        }
        return;
      }
      setLiked((prev) => !prev);
      setCount((prev) => (liked ? Math.max(prev - 1, 0) : prev + 1));
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
        liked
          ? "border-gta-pink/40 bg-gta-pink/10 text-gta-pink"
          : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
      )}
    >
      <Heart className={cn("size-4", liked && "fill-current")} />
      {count}
    </button>
  );
}
