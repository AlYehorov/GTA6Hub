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
            className="text-white/70 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Open navigation menu"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="border-white/10 bg-black/90 backdrop-blur-2xl"
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
            onNavigate={() => setOpen(false)}
          />
          <Link
            href="/search"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            Search
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
