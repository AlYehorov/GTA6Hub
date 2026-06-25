"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "lucide-react";

export function AuthNavButton() {
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
        href={`/profile/${username}`}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <User className="size-3.5" />
        <span className="hidden sm:inline">{username}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-lg px-2.5 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      Sign in
    </Link>
  );
}
