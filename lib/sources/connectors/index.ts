import type { SourceConnector } from "@/lib/sources/types";
import { getMockItemsForPlatform } from "@/lib/sources/mock-data";

export class RockstarNewswireConnector implements SourceConnector {
  readonly platform = "rockstar_newswire" as const;

  async fetchItems() {
    return getMockItemsForPlatform(this.platform);
  }
}

export class RockstarYoutubeConnector implements SourceConnector {
  readonly platform = "rockstar_youtube" as const;

  async fetchItems() {
    return getMockItemsForPlatform(this.platform);
  }
}

export class RedditConnector implements SourceConnector {
  readonly platform = "reddit" as const;

  async fetchItems() {
    return getMockItemsForPlatform(this.platform);
  }
}

export class TwitterConnector implements SourceConnector {
  readonly platform = "x" as const;

  async fetchItems() {
    return getMockItemsForPlatform(this.platform);
  }
}
