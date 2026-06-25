import type { SourceItemInput } from "@/lib/types/source";
import type { SourceConnector } from "@/lib/sources/types";

const now = new Date().toISOString();

export const MOCK_SOURCE_ITEMS: SourceItemInput[] = [
  {
    source: "rockstar_newswire",
    source_type: "newswire_post",
    source_label: "official",
    source_url: "https://www.rockstargames.com/newswire/article/mock-trailer3-tease",
    external_id: "mock-rsnw-trailer3-tease",
    title: "Grand Theft Auto VI — Trailer 3 Coming This Fall",
    content:
      "Rockstar Games confirms a third GTA VI trailer will debut this fall, showcasing more of Vice City and the Leonida Keys. The announcement highlights expanded gameplay systems and the return of classic Vice City landmarks reimagined for a new generation.",
    published_at: now,
  },
  {
    source: "rockstar_youtube",
    source_type: "youtube_video",
    source_label: "official",
    source_url: "https://www.youtube.com/watch?v=mock-gta6-trailer2",
    external_id: "mock-yt-trailer2",
    title: "Grand Theft Auto VI Trailer 2",
    content:
      "Official second trailer for Grand Theft Auto VI. Features Lucia and Jason in Vice City, Everglades sequences, nightlife districts, and high-speed pursuits across Leonida.",
    published_at: now,
  },
  {
    source: "reddit",
    source_type: "community",
    source_label: "unconfirmed",
    source_url: "https://www.reddit.com/r/GTA6/comments/mock-vice-city-map",
    external_id: "mock-reddit-vice-city-map",
    title: "Fans compile Vice City map from trailer 2 screenshots",
    content:
      "Community analysis thread mapping Vice City districts from trailer 2 frames. Discussion covers Ocean Drive parallels, airport placement, and Everglades boundaries. Top comments note Rockstar's Miami-inspired architecture and highway layout.",
    published_at: now,
  },
  {
    source: "x",
    source_type: "tweet",
    source_label: "official",
    source_url: "https://x.com/RockstarGames/status/mock-gta6-launch-window",
    external_id: "mock-x-launch-window",
    title: "Rockstar Games on X: Fall 2025 launch window reaffirmed",
    content:
      "Rockstar Games post reaffirming GTA VI launch window for Fall 2025 on PlayStation 5 and Xbox Series X|S. Includes short Vice City skyline clip and link to Newswire.",
    published_at: now,
  },
];

export function getMockItemsForPlatform(
  platform: SourceConnector["platform"]
): SourceItemInput[] {
  return MOCK_SOURCE_ITEMS.filter((item) => item.source === platform);
}
