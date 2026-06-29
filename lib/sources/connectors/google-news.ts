import type { SourceConnector } from "@/lib/sources/types";
import type { SourceItemInput } from "@/lib/types/source";
import {
  fetchWithTimeout,
  hashString,
  parseRssItems,
} from "@/lib/sources/fetch-utils";
import { isGta6SourceItem } from "@/lib/gta6/content-filter";

const GOOGLE_NEWS_RSS =
  "https://news.google.com/rss/search?q=GTA+6+OR+%22Grand+Theft+Auto+VI%22+OR+%22GTA+VI%22&hl=en-US&gl=US&ceid=US:en";

export class GoogleNewsConnector implements SourceConnector {
  readonly platform = "google_news" as const;

  async fetchItems(): Promise<SourceItemInput[]> {
    const response = await fetchWithTimeout(GOOGLE_NEWS_RSS);
    if (!response.ok) {
      throw new Error(`Google News RSS failed: HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRssItems(xml);

    return items
      .filter((item) =>
        isGta6SourceItem({
          source: "google_news",
          title: item.title,
          content: item.description,
        })
      )
      .slice(0, 20)
      .map((item) => ({
        source: "google_news",
        source_type: "news_article",
        source_label: "community",
        source_url: item.link,
        external_id: hashString(item.guid || item.link),
        title: item.title,
        content: item.description || item.title,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      }));
  }
}
