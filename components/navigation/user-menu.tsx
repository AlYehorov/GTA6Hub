"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, LogOut, Map, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      setUsername((profile?.username as string) ?? null);
      setAvatarUrl((profile?.avatar_url as string | null) ?? null);
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) return null;

  if (!username) {
    return (
      <Link
        href="/login"
        className="rounded-lg px-2.5 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white md:px-3"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-white/10"
        aria-label="User menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-gta-pink/20 text-sm font-semibold text-gta-pink">
            {username[0]?.toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-white/10 bg-[#0a0a0a] py-1 shadow-xl">
            <p className="border-b border-white/10 px-4 py-2 text-xs text-white/40">@{username}</p>
            <MenuLink href="/profile" icon={<User className="size-4" />} onClick={() => setOpen(false)}>
              Profile
            </MenuLink>
            <MenuLink
              href="/profile#saved-articles"
              icon={<Bookmark className="size-4" />}
              onClick={() => setOpen(false)}
            >
              Saved Articles
            </MenuLink>
            <MenuLink href="/tracker" icon={<Map className="size-4" />} onClick={() => setOpen(false)}>
              Tracker
            </MenuLink>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.refresh();
              }}
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
