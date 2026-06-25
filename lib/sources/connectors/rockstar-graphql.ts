import { fetchWithTimeout } from "@/lib/sources/fetch-utils";

const GRAPHQL_URL = "https://graph.rockstargames.com/";

export interface RockstarNewswirePost {
  id: number | string;
  title: string;
  url: string;
  created: string;
  excerpt?: string | null;
  primary_tags?: Array<{ name: string }>;
}

interface GraphQLResponse {
  data?: {
    posts?: {
      results?: RockstarNewswirePost[];
    };
  };
  errors?: Array<{ message: string }>;
}

export async function fetchRockstarNewswireList(
  sha256Hash: string,
  tagId: number | null = 666
): Promise<RockstarNewswirePost[]> {
  const params = new URLSearchParams([
    ["operationName", "NewswireList"],
    [
      "variables",
      JSON.stringify({
        page: 1,
        tagId,
        metaUrl: "/newswire",
        locale: "en_us",
      }),
    ],
    [
      "extensions",
      JSON.stringify({
        persistedQuery: { version: 1, sha256Hash },
      }),
    ],
  ]);

  const response = await fetchWithTimeout(`${GRAPHQL_URL}?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Rockstar GraphQL failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse;

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "Rockstar GraphQL error");
  }

  return payload.data?.posts?.results ?? [];
}

export function getRockstarNewswireGraphqlHash(): string | undefined {
  return process.env.ROCKSTAR_NEWSWIRE_GRAPHQL_HASH?.trim() || undefined;
}
