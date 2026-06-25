"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithEmail } from "@/lib/actions/auth";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { TRACKER_STORAGE_KEY } from "@/lib/types/completion";
import type { LocalProgressEntry } from "@/lib/types/completion";

function readLocalItemIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as LocalProgressEntry[]).map((e) => e.itemId);
  } catch {
    return [];
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? decodeURIComponent(searchParams.get("error")!) : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signInWithEmail(email, password, readLocalItemIds());
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Sign in failed");
      return;
    }

    localStorage.removeItem(TRACKER_STORAGE_KEY);
    const next = searchParams.get("next") || "/tracker";
    router.push(next);
    router.refresh();
  }

  const inputClass =
    "input-mobile w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-gta-pink/40 focus:outline-none focus:ring-1 focus:ring-gta-pink/30";

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-white/50">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-white/50">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full gap-2 bg-gta-pink text-white hover:bg-gta-pink/90"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-2 text-white/40">or</span>
        </div>
      </div>

      <OAuthButtons />

      <p className="text-center text-sm text-white/40">
        No account?{" "}
        <Link href="/register" className="text-gta-pink hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
