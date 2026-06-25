export const MAIN_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "News", href: "/news" },
  { label: "Guides", href: "/guides" },
  { label: "Trailers", href: "/trailers" },
  { label: "Characters", href: "/characters" },
  { label: "Vehicles", href: "/vehicles" },
  { label: "Map", href: "/map" },
  { label: "Tracker", href: "/tracker" },
  { label: "Leaderboard", href: "/leaderboard" },
] as const;

export const FEATURED_ITEMS = [
  {
    title: "News",
    description: "Trailers, leaks, and official announcements from Leonida.",
    href: "/news",
    accent: "from-pink-500/20 to-rose-600/5",
  },
  {
    title: "Guides",
    description: "Walkthroughs, tips, and deep dives for every mission.",
    href: "/guides",
    accent: "from-violet-500/20 to-purple-600/5",
  },
  {
    title: "Characters",
    description: "Meet Lucia, Jason, and the cast of Vice City.",
    href: "/characters",
    accent: "from-cyan-500/20 to-teal-600/5",
  },
  {
    title: "Vehicles",
    description: "Cars, bikes, boats, and everything you can drive.",
    href: "/vehicles",
    accent: "from-amber-500/20 to-orange-600/5",
  },
] as const;
