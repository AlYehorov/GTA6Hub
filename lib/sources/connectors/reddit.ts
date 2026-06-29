import type { SourceConnector } from "@/lib/sources/types";
import type { SourceItemInput } from "@/lib/types/source";
import { fetchWithTimeout, parseRssItems, stripHtml } from "@/lib/sources/fetch-utils";
import { CANONICAL_SITE_URL } from "@/lib/constants/site";
import { isGta6SourceItem, isLegacyGtaContent } from "@/lib/gta6/content-filter";

const SUBREDDITS = ["GTA6", "GrandTheftAutoVI", "GTA", "rockstar"];
const DEFAULT_MIN_SCORE = 50;

interface RedditListingChild {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    score: number;
    created_utc: number;
    link_flair_text?: string | null;
  };
}

interface RedditListing {
  data?: { children?: RedditListingChild[] };
}

interface PullPushPost {
  id: string;
  title: string;
  selftext?: string;
  url?: string;
  permalink?: string;
  score?: number;
  created_utc?: number;
}

function getMinScore(): number {
  const raw = process.env.REDDIT_MIN_SCORE?.trim();
  if (!raw) return DEFAULT_MIN_SCORE;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_MIN_SCORE;
}

function toSourceItem(post: {
  id: string;
  title: string;
  selftext?: string;
  url: string;
  score: number;
  created_utc?: number;
}): SourceItemInput {
  const contentParts = [post.selftext?.trim(), `Reddit score: ${post.score}`].filter(Boolean);

  return {
    source: "reddit",
    source_type: "community",
    source_label: "unconfirmed",
    source_url: post.url,
    external_id: post.id,
    title: post.title,
    content: contentParts.join("\n\n") || post.title,
    published_at: post.created_utc
      ? new Date(post.created_utc * 1000).toISOString()
      : null,
  };
}

function filterRedditItems(
  items: SourceItemInput[],
  subreddit: string
): SourceItemInput[] {
  const focused = subreddit === "GTA6" || subreddit === "GrandTheftAutoVI";

  return items.filter((item) => {
    if (isLegacyGtaContent(item.title, item.content)) return false;
    if (focused) return true;
    return isGta6SourceItem({
      source: "reddit",
      title: item.title,
      content: item.content,
    });
  });
}

export class RedditConnector implements SourceConnector {
  readonly platform = "reddit" as const;

  async fetchItems(): Promise<SourceItemInput[]> {
    const minScore = getMinScore();
    const results: SourceItemInput[] = [];

    for (const subreddit of SUBREDDITS) {
      let subredditItems: SourceItemInput[] = [];

      try {
        const fromJson = await this.fetchFromRedditJson(subreddit, minScore);
        if (fromJson.length > 0) {
          subredditItems = fromJson;
        }
      } catch (err) {
        console.warn(
          `[RedditConnector] r/${subreddit} JSON failed:`,
          err instanceof Error ? err.message : err
        );
      }

      if (subredditItems.length === 0) {
        try {
          const fromPullPush = await this.fetchFromPullPush(subreddit, minScore);
          if (fromPullPush.length > 0) {
            subredditItems = fromPullPush;
          }
        } catch (err) {
          console.warn(
            `[RedditConnector] r/${subreddit} PullPush failed:`,
            err instanceof Error ? err.message : err
          );
        }
      }

      if (subredditItems.length === 0) {
        try {
          subredditItems = await this.fetchFromRss(subreddit, minScore);
        } catch (err) {
          console.warn(
            `[RedditConnector] r/${subreddit} RSS failed:`,
            err instanceof Error ? err.message : err
          );
        }
      }

      results.push(...filterRedditItems(subredditItems, subreddit));
    }

    const seen = new Set<string>();
    return results.filter((item) => {
      if (seen.has(item.external_id)) return false;
      seen.add(item.external_id);
      return true;
    });
  }

  private async fetchFromRedditJson(
    subreddit: string,
    minScore: number
  ): Promise<SourceItemInput[]> {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=25`;
    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": `GTA6Hub/1.0 (community aggregator; +${CANONICAL_SITE_URL})`,
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit JSON failed: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as RedditListing;
    const children = payload.data?.children ?? [];

    return children
      .map((c) => c.data)
      .filter((post) => post.score >= minScore)
      .map((post) =>
        toSourceItem({
          id: post.id,
          title: post.title,
          selftext: post.selftext,
          url: `https://www.reddit.com${post.permalink}`,
          score: post.score,
          created_utc: post.created_utc,
        })
      );
  }

  private async fetchFromPullPush(
    subreddit: string,
    minScore: number
  ): Promise<SourceItemInput[]> {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const url = `https://api.pullpush.io/reddit/search/submission/?subreddit=${subreddit}&sort=desc&sort_type=score&after=${thirtyDaysAgo}&size=25`;
    const response = await fetchWithTimeout(url, undefined, 30_000);

    if (!response.ok) {
      throw new Error(`PullPush API failed: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as { data?: PullPushPost[] };
    const posts = payload.data ?? [];

    return posts
      .filter((post) => (post.score ?? 0) >= minScore)
      .map((post) =>
        toSourceItem({
          id: post.id,
          title: post.title,
          selftext: post.selftext,
          url: post.permalink
            ? `https://www.reddit.com${post.permalink}`
            : (post.url ?? `https://www.reddit.com/r/${subreddit}/`),
          score: post.score ?? 0,
          created_utc: post.created_utc,
        })
      );
  }

  private async fetchFromRss(
    subreddit: string,
    minScore: number
  ): Promise<SourceItemInput[]> {
    const url = `https://www.reddit.com/r/${subreddit}/top/.rss?t=week`;
    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/atom+xml, application/xml, text/xml, */*",
        "User-Agent": `GTA6Hub/1.0 (community aggregator; +${CANONICAL_SITE_URL})`,
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit RSS failed: HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRssItems(xml);

    // Top-week RSS has no scores — treat as high-signal community content.
    void minScore;

    return items.slice(0, 10).map((item) => {
      const idMatch = item.link.match(/comments\/([a-z0-9]+)/i);
      return toSourceItem({
        id: idMatch?.[1] ?? item.guid,
        title: item.title,
        selftext: stripHtml(item.description),
        url: item.link,
        score: 0,
      });
    });
  }
}
