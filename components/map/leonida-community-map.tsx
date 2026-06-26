"use client";

const COMMUNITY_MAP_URL = "https://map.stateofleonida.net/?lang=en";

export function LeonidaCommunityMap() {
  return (
    <iframe
      src={COMMUNITY_MAP_URL}
      title="State of Leonida — GTA 6 Community Map"
      className="absolute inset-0 h-full w-full border-0 bg-[#061018]"
      allow="fullscreen"
      loading="eager"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
