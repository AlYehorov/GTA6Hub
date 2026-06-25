import type { SourceConnector } from "@/lib/sources/types";
import { getMockItemsForPlatform } from "@/lib/sources/mock-data";
import { RockstarNewswireConnector } from "@/lib/sources/connectors/rockstar-newswire";
import { RockstarYoutubeConnector } from "@/lib/sources/connectors/rockstar-youtube";
import { RedditConnector } from "@/lib/sources/connectors/reddit";

export { RockstarNewswireConnector, RockstarYoutubeConnector, RedditConnector };

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
];
