import {
  RockstarNewswireConnector,
  RockstarYoutubeConnector,
  RedditConnector,
  TwitterConnector,
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

export function getConnector(platform: SourcePlatform): SourceConnector {
  return CONNECTORS[platform];
}

export function getConnectorPlatforms(): SourcePlatform[] {
  return Object.keys(CONNECTORS) as SourcePlatform[];
}
