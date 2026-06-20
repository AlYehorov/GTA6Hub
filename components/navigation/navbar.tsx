"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { NavLinks } from "@/components/navigation/nav-links";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 lg:px-8">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-black/30 shadow-lg shadow-black/30 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 ease-out",
          scrolled
            ? "h-11 px-3.5 sm:h-12 sm:px-5"
            : "h-12 px-4 sm:h-[52px] sm:px-5"
        )}
      >
        <Link
          href="/"
          className={cn(
            "group flex shrink-0 items-center gap-1 font-heading font-black tracking-tight transition-all duration-500",
            scrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl"
          )}
        >
          <span className="text-gta-pink transition-colors group-hover:text-gta-orange">
            GTA
          </span>
          <span className="text-white">6</span>
          <span className="text-white/60">Hub</span>
        </Link>

        <NavLinks className="hidden md:flex" compact={scrolled} />
        <Link
          href="/search"
          aria-label="Search"
          className={cn(
            "hidden rounded-lg text-white/65 transition-colors hover:bg-white/10 hover:text-white md:flex md:items-center md:justify-center",
            scrolled ? "size-8" : "size-9"
          )}
        >
          <Search className={scrolled ? "size-3.5" : "size-4"} />
        </Link>
        <MobileNav />
      </div>
    </header>
  );
}
