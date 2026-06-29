import type { SourceConnector } from "@/lib/sources/types";
import type { SourceItemInput } from "@/lib/types/source";
import { fetchWithTimeout, parseRssItems } from "@/lib/sources/fetch-utils";
import { isGta6SourceItem } from "@/lib/gta6/content-filter";

/** GTASeriesVideos — GTA news and analysis (community, not official Rockstar). */
const DEFAULT_CHANNEL_IDS = ["UC7F7LAUCr9x4v9we-Cp83mw"];

function getChannelIds(): string[] {
  const raw = process.env.COMMUNITY_YOUTUBE_CHANNEL_IDS?.trim();
  if (!raw) return DEFAULT_CHANNEL_IDS;
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export class CommunityYoutubeConnector implements SourceConnector {
  readonly platform = "community_youtube" as const;

  async fetchItems(): Promise<SourceItemInput[]> {
    const channelIds = getChannelIds();
    const results: SourceItemInput[] = [];

    for (const channelId of channelIds) {
      try {
        const items = await this.fetchChannel(channelId);
        results.push(...items);
      } catch (err) {
        console.warn(
          `[CommunityYoutubeConnector] Channel ${channelId} failed:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    const seen = new Set<string>();
    return results.filter((item) => {
      if (seen.has(item.external_id)) return false;
      seen.add(item.external_id);
      return true;
    });
  }

  private async fetchChannel(channelId: string): Promise<SourceItemInput[]> {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`YouTube RSS failed: HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRssItems(xml);

    return items
      .filter((item) =>
        isGta6SourceItem({
          source: "community_youtube",
          title: item.title,
          content: item.description,
        })
      )
      .slice(0, 10)
      .map((item) => {
        const videoIdMatch = item.link.match(
          /(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/
        );
        const videoId = videoIdMatch?.[1] ?? item.guid;

        return {
          source: "community_youtube",
          source_type: "youtube_video",
          source_label: "community",
          source_url: item.link,
          external_id: videoId,
          title: item.title,
          content: item.description || item.title,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        };
      });
  }
}
