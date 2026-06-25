import type { SourceConnector } from "@/lib/sources/types";
import type { SourceItemInput } from "@/lib/types/source";
import { fetchWithTimeout, parseRssItems } from "@/lib/sources/fetch-utils";

/** Official Rockstar Games YouTube channel */
const ROCKSTAR_YOUTUBE_CHANNEL_ID = "UC6VcWc1rAoWdBCM0JxrRQ3A";
const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${ROCKSTAR_YOUTUBE_CHANNEL_ID}`;

export class RockstarYoutubeConnector implements SourceConnector {
  readonly platform = "rockstar_youtube" as const;

  async fetchItems(): Promise<SourceItemInput[]> {
    const response = await fetchWithTimeout(YOUTUBE_RSS_URL);
    if (!response.ok) {
      throw new Error(`YouTube RSS failed: HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRssItems(xml);

    return items.slice(0, 15).map((item) => {
      const videoIdMatch = item.link.match(/(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      const videoId = videoIdMatch?.[1] ?? item.guid;

      return {
        source: "rockstar_youtube",
        source_type: "youtube_video",
        source_label: "official",
        source_url: item.link,
        external_id: videoId,
        title: item.title,
        content: item.description || item.title,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      };
    });
  }
}
