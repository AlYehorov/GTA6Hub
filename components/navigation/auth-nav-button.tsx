"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthNavButton({
  mobile,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
} = {}) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      setUsername(profile?.username ?? null);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return null;

  if (username) {
    return (
      <Link
        href="/profile"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-1.5 rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white",
          mobile ? "min-h-11 px-3 py-3 text-base" : "px-2.5 py-1.5 text-sm"
        )}
      >
        <User className="size-3.5" />
        <span className={mobile ? "inline" : "hidden sm:inline"}>{username}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      onClick={onNavigate}
      className={cn(
        "rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white",
        mobile ? "flex min-h-11 items-center px-3 py-3 text-base" : "px-2.5 py-1.5 text-sm"
      )}
    >
      Sign in
    </Link>
  );
}
