"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  defaultValue?: string;
  className?: string;
  compact?: boolean;
}

export function SearchBar({ defaultValue = "", className, compact }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string)?.trim();
    if (!q) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const value = defaultValue || searchParams.get("q") || "";

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-white/35",
          compact ? "left-2.5 size-3.5" : "left-3 size-4"
        )}
      />
      <input
        name="q"
        type="search"
        defaultValue={value}
        placeholder={compact ? "Search..." : "Search news, guides, characters, vehicles..."}
        className={cn(
          "input-mobile w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-gta-pink/40 focus:outline-none focus:ring-1 focus:ring-gta-pink/30",
          compact ? "h-10 pl-8 pr-3" : "h-11 pl-10 pr-4"
        )}
      />
    </form>
  );
}
