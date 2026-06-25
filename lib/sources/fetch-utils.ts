import { CANONICAL_SITE_URL } from "@/lib/constants/site";

const DEFAULT_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": `GTA6Hub/1.0 (community news aggregator; +${CANONICAL_SITE_URL})`,
        Accept: "application/json, application/xml, text/xml, */*",
        ...init?.headers,
      },
      next: { revalidate: 0 },
    });
  } finally {
    clearTimeout(timer);
  }
}

export function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRssItems(xml: string): Array<{
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  guid: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string | null;
    guid: string;
  }> = [];

  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const entryBlocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const blocks = [...itemBlocks, ...entryBlocks];

  for (const block of blocks) {
    const title = extractTag(block, "title") ?? "";
    const link =
      extractTag(block, "link") ??
      extractAttr(block, "link", "href") ??
      "";
    const description =
      extractTag(block, "description") ??
      extractTag(block, "summary") ??
      extractTag(block, "content") ??
      "";
    const pubDate =
      extractTag(block, "pubDate") ??
      extractTag(block, "published") ??
      extractTag(block, "updated") ??
      null;
    const guid =
      extractTag(block, "guid") ??
      extractTag(block, "id") ??
      link ??
      title;

    if (!title || !link) continue;

    items.push({
      title: decodeEntities(title),
      link: decodeEntities(link),
      description: stripHtml(decodeEntities(description)),
      pubDate,
      guid,
    });
  }

  return items;
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return null;
  return match[1].trim();
}

function extractAttr(block: string, tag: string, attr: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}
