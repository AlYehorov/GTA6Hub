"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function OAuthButtons() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch {
      setError("Google sign-in failed. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={handleGoogle}
        className="w-full gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        Continue with Google
      </Button>
    </div>
  );
}
