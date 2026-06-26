"use client";

import { Search } from "lucide-react";

interface MapSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MapSearch({ value, onChange }: MapSearchProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search locations, districts, secrets..."
        className="input-mobile w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-base text-white placeholder:text-white/35 focus:border-gta-pink/40 focus:outline-none focus:ring-1 focus:ring-gta-pink/30 sm:text-sm"
      />
    </div>
  );
}
