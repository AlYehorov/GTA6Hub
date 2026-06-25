"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks } from "@/components/navigation/nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Open navigation menu"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="border-white/10 bg-black/95 pb-safe supports-[backdrop-filter]:bg-black/90 supports-[backdrop-filter]:backdrop-blur-xl"
      >
        <SheetHeader>
          <SheetTitle className="font-heading text-left text-lg tracking-tight">
            <span className="text-gta-pink">GTA</span>
            <span className="text-white">6</span>
            <span className="text-gta-cyan">Hub</span>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-1">
          <NavLinks
            className="flex-col items-stretch gap-1"
            mobile
            onNavigate={() => setOpen(false)}
          />
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center rounded-lg px-3 py-3 text-base font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            Profile
          </Link>
          <Link
            href="/search"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center rounded-lg px-3 py-3 text-base font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            Search
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
