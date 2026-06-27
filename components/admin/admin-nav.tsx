"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  LineChart,
  Rss,
  Search,
  Sparkles,
  Wand2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STUDIO_TABS = [
  { tab: "editor", label: "Studio", icon: LayoutDashboard, paths: ["/admin/studio"] },
  { tab: "sources", label: "Sources", icon: Rss, paths: ["/admin/sources"] },
  { tab: "editor", label: "Editor", icon: Wand2, paths: ["/admin/editor"] },
  { tab: "drafts", label: "Drafts", icon: Sparkles, paths: ["/admin/drafts"] },
  { tab: "seo", label: "SEO", icon: Search, paths: ["/admin/seo", "/admin/workflow", "/admin/dashboard"] },
  {
    tab: "analytics",
    label: "Analytics",
    icon: LineChart,
    paths: ["/admin/insights", "/admin/integrations"],
  },
  { tab: "guide", label: "Guide", icon: BookOpen, paths: [] },
] as const;

const MORE_LINKS = [
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/workflow", label: "Workflow" },
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/entities", label: "Knowledge Graph" },
  { href: "/admin", label: "Admin hub" },
];

export function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  if (pathname === "/admin/login") return null;

  const isStudio = pathname === "/admin/studio";

  function isActive(item: (typeof STUDIO_TABS)[number]) {
    if (item.label === "Studio") {
      return isStudio && (!currentTab || currentTab === "editor");
    }
    if (item.label === "Guide") {
      return isStudio && currentTab === "guide";
    }
    if (isStudio && currentTab === item.tab) return true;
    return item.paths.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
  }

  return (
    <nav className="sticky top-16 z-30 border-b border-white/[0.06] bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {STUDIO_TABS.map((item) => {
          const Icon = item.icon;
          const href =
            item.label === "Studio"
              ? "/admin/studio"
              : `/admin/studio?tab=${item.tab}`;

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item)
                  ? "bg-gta-pink/15 text-gta-pink"
                  : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="group relative ml-1 shrink-0">
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-white/55 hover:bg-white/[0.04] hover:text-white"
          >
            <MoreHorizontal className="size-4" />
            More
          </button>
          <div className="invisible absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-white/10 bg-zinc-950 py-1 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
            {MORE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm text-white/70 hover:bg-white/[0.04] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
