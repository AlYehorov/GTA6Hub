import type { SourceConnector } from "@/lib/sources/types";
import { getMockItemsForPlatform } from "@/lib/sources/mock-data";
import { RockstarNewswireConnector } from "@/lib/sources/connectors/rockstar-newswire";
import { RockstarYoutubeConnector } from "@/lib/sources/connectors/rockstar-youtube";
import { RedditConnector } from "@/lib/sources/connectors/reddit";
import { GoogleNewsConnector } from "@/lib/sources/connectors/google-news";
import { CommunityYoutubeConnector } from "@/lib/sources/connectors/community-youtube";

export {
  RockstarNewswireConnector,
  RockstarYoutubeConnector,
  RedditConnector,
  GoogleNewsConnector,
  CommunityYoutubeConnector,
};

export class TwitterConnector implements SourceConnector {
  readonly platform = "x" as const;

  async fetchItems() {
    return getMockItemsForPlatform(this.platform);
  }
}

export const productionConnectors: SourceConnector[] = [
  new RockstarNewswireConnector(),
  new RockstarYoutubeConnector(),
  new RedditConnector(),
  new GoogleNewsConnector(),
  new CommunityYoutubeConnector(),
];
