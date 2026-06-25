import {
  RockstarNewswireConnector,
  RockstarYoutubeConnector,
  RedditConnector,
  TwitterConnector,
  productionConnectors,
} from "@/lib/sources/connectors";
import type { SourceConnector } from "@/lib/sources/types";
import type { SourcePlatform } from "@/lib/types/source";

const CONNECTORS: Record<SourcePlatform, SourceConnector> = {
  rockstar_newswire: new RockstarNewswireConnector(),
  rockstar_youtube: new RockstarYoutubeConnector(),
  reddit: new RedditConnector(),
  x: new TwitterConnector(),
};

export function getAllConnectors(): SourceConnector[] {
  return Object.values(CONNECTORS);
}

/** Real connectors used by cron and production ingestion (excludes mock X). */
export function getProductionConnectors(): SourceConnector[] {
  return productionConnectors;
}

export function getConnector(platform: SourcePlatform): SourceConnector {
  return CONNECTORS[platform];
}

export function getConnectorPlatforms(): SourcePlatform[] {
  return Object.keys(CONNECTORS) as SourcePlatform[];
}
