import type { SourceConnector } from "@/lib/sources/types";
import type { SourceItemInput } from "@/lib/types/source";
import {
  fetchWithTimeout,
  hashString,
  parseRssItems,
} from "@/lib/sources/fetch-utils";
import {
  fetchRockstarNewswireList,
  getRockstarNewswireGraphqlHash,
} from "@/lib/sources/connectors/rockstar-graphql";
import { isGta6SourceItem } from "@/lib/gta6/content-filter";

const GOOGLE_NEWS_RSS =
  "https://news.google.com/rss/search?q=site:rockstargames.com/newswire+%22Grand+Theft+Auto+VI%22&hl=en-US&gl=US&ceid=US:en";

export class RockstarNewswireConnector implements SourceConnector {
  readonly platform = "rockstar_newswire" as const;

  async fetchItems(): Promise<SourceItemInput[]> {
    const hash = getRockstarNewswireGraphqlHash();
    if (hash) {
      try {
        return await this.fetchFromGraphQL(hash);
      } catch (err) {
        console.warn(
          "[RockstarNewswireConnector] GraphQL failed, falling back to Google News RSS:",
          err instanceof Error ? err.message : err
        );
      }
    }

    return this.fetchFromGoogleNewsRss();
  }

  private async fetchFromGraphQL(hash: string): Promise<SourceItemInput[]> {
    const posts = await fetchRockstarNewswireList(hash, 666);

    return posts
      .filter((post) =>
        isGta6SourceItem({
          source: "rockstar_newswire",
          title: post.title,
          content: [post.excerpt, post.primary_tags?.map((t) => t.name).join(", ")].filter(Boolean).join("\n"),
        })
      )
      .slice(0, 15)
      .map((post) => {
      const url = post.url.startsWith("http")
        ? post.url
        : `https://www.rockstargames.com${post.url}`;
      const tags = post.primary_tags?.map((t) => t.name).join(", ") ?? "";
      const content = [post.excerpt, tags].filter(Boolean).join("\n\n") || post.title;

      return {
        source: "rockstar_newswire",
        source_type: "newswire_post",
        source_label: "official",
        source_url: url,
        external_id: String(post.id),
        title: post.title,
        content,
        published_at: post.created ? new Date(post.created).toISOString() : null,
      };
    });
  }

  private async fetchFromGoogleNewsRss(): Promise<SourceItemInput[]> {
    const response = await fetchWithTimeout(GOOGLE_NEWS_RSS);
    if (!response.ok) {
      throw new Error(`Google News RSS failed: HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRssItems(xml);

    return items
      .filter((item) =>
        isGta6SourceItem({
          source: "rockstar_newswire",
          title: item.title,
          content: item.description,
        })
      )
      .slice(0, 15)
      .map((item) => ({
      source: "rockstar_newswire",
      source_type: "newswire_post",
      source_label: "official",
      source_url: item.link,
      external_id: hashString(item.guid || item.link),
      title: item.title,
      content: item.description || item.title,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
    }));
  }
}
