import type { SourceItem } from "@/lib/types/source";
import type { Video } from "@/lib/types/video";
import {
  isSpamText,
  matchTopicKeys,
  parseViewCount,
  primaryTopicKey,
  topicDefForKey,
} from "@/lib/opportunity-engine/topics";
import type { SourceCluster, SourceClusterMember } from "@/lib/opportunity-engine/types";

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeTitle(a).split(/\s+/).filter((w) => w.length > 3));
  const wordsB = new Set(normalizeTitle(b).split(/\s+/).filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

export function isDuplicateTitle(
  title: string,
  existingTitles: string[]
): boolean {
  const norm = normalizeTitle(title);
  for (const existing of existingTitles) {
    const ex = normalizeTitle(existing);
    if (norm === ex) return true;
    if (titleSimilarity(title, existing) >= 0.75) return true;
  }
  return false;
}

function sourceToMember(source: SourceItem): SourceClusterMember {
  const corpus = `${source.title}\n${source.content}`;
  const topicKeys = matchTopicKeys(corpus);
  const isOfficial =
    source.source_label === "official" &&
    (source.source === "rockstar_newswire" || source.source === "rockstar_youtube");
  const isRumor =
    source.source_label === "rumor" ||
    source.source_label === "unconfirmed" ||
    source.source === "reddit" ||
    source.source === "google_news" ||
    source.source === "community_youtube";
  const daysOld = source.published_at
    ? (Date.now() - new Date(source.published_at).getTime()) / (1000 * 60 * 60 * 24)
    : (Date.now() - new Date(source.created_at).getTime()) / (1000 * 60 * 60 * 24);

  return {
    id: source.id,
    kind: "source",
    platform: source.source,
    sourceLabel: source.source_label,
    title: source.title,
    content: source.content,
    url: source.source_url,
    publishedAt: source.published_at,
    isOfficial,
    isRumor: isRumor && daysOld > 30,
    isSpam: isSpamText(corpus) || source.title.length < 8,
    isDuplicate: false,
    redditMentionScore:
      source.source === "reddit"
        ? Math.min(100, Math.round(source.content.length / 40))
        : 0,
    youtubeViewEstimate:
      source.source === "rockstar_youtube" || source.source === "community_youtube"
        ? parseViewCountSafe(corpus)
        : 0,
    topicKeys,
  };
}

function videoToMember(video: Video): SourceClusterMember {
  const corpus = `${video.title}\n${video.description}`;
  const topicKeys = matchTopicKeys(corpus);
  const isOfficial =
    video.category === "official_trailer" || video.category === "official_video";

  return {
    id: video.id,
    kind: "video",
    platform: "youtube",
    sourceLabel: isOfficial ? "official" : "community",
    title: video.title,
    content: video.description,
    url: video.source_url,
    publishedAt: video.published_at,
    isOfficial,
    isRumor: false,
    isSpam: isSpamText(corpus),
    isDuplicate: false,
    redditMentionScore: 0,
    youtubeViewEstimate: parseViewCountSafe(corpus),
    topicKeys,
  };
}

function parseViewCountSafe(text: string): number {
  const parsed = parseViewCount(text);
  if (parsed > 0) return parsed;
  if (/trailer|rockstar|official/i.test(text)) return 75_000;
  return 0;
}

export function buildSourceClusters(input: {
  sources: SourceItem[];
  videos: Video[];
  existingArticleTitles: string[];
}): SourceCluster[] {
  const members: SourceClusterMember[] = [];

  for (const source of input.sources) {
    const member = sourceToMember(source);
    member.isDuplicate = isDuplicateTitle(
      member.title,
      input.existingArticleTitles
    );
    if (member.isSpam) continue;
    members.push(member);
  }

  for (const video of input.videos) {
    const member = videoToMember(video);
    member.isDuplicate = isDuplicateTitle(
      member.title,
      input.existingArticleTitles
    );
    if (member.isSpam) continue;
    members.push(member);
  }

  const byKey = new Map<string, SourceClusterMember[]>();

  for (const member of members) {
    const primary = primaryTopicKey(member.topicKeys);
    const clusterKey = primary ?? `misc-${normalizeTitle(member.title).slice(0, 40)}`;
    const bucket = byKey.get(clusterKey) ?? [];
    bucket.push(member);
    byKey.set(clusterKey, bucket);
  }

  const clusters: SourceCluster[] = [];

  for (const [clusterKey, clusterMembers] of byKey.entries()) {
    const topicDef = topicDefForKey(clusterKey);
    const allTopicKeys = Array.from(
      new Set(clusterMembers.flatMap((m) => m.topicKeys))
    );

    let title = topicDef?.title;
    if (!title) {
      const official = clusterMembers.find((m) => m.isOfficial);
      title = official?.title ?? clusterMembers[0]?.title ?? "GTA 6 Update";
      if (clusterMembers.length > 1 && !title.toLowerCase().includes("gta")) {
        title = `GTA 6: ${title}`;
      }
    }

    clusters.push({
      clusterKey,
      title,
      topicKeys: allTopicKeys,
      members: clusterMembers,
    });
  }

  return clusters.sort((a, b) => b.members.length - a.members.length);
}

export function clusterSourceTypes(
  members: SourceClusterMember[]
): Array<"Rockstar" | "YouTube" | "Reddit" | "Newswire" | "Community"> {
  const types = new Set<"Rockstar" | "YouTube" | "Reddit" | "Newswire" | "Community">();

  for (const member of members) {
    if (member.platform === "rockstar_newswire") types.add("Newswire");
    if (member.platform === "rockstar_youtube" || member.platform === "community_youtube" || member.kind === "video") {
      types.add("YouTube");
    }
    if (member.platform === "rockstar_newswire" || member.platform === "rockstar_youtube") {
      types.add("Rockstar");
    }
    if (member.platform === "reddit") types.add("Reddit");
    if (member.platform === "google_news") types.add("Community");
    if (member.sourceLabel === "community" && member.platform !== "reddit") {
      types.add("Community");
    }
  }

  return Array.from(types);
}
