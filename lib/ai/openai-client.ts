/**
 * Shared OpenAI Chat Completions client.
 * All production OpenAI calls go through here (article drafts + daily report).
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
  /** Prefix for HTTP error messages (e.g. "OpenAI request failed") */
  errorPrefix?: string;
  /** Analytics feature label for budget tracking */
  feature?: string;
}

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;
}

function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return apiKey;
}

export interface ChatCompletionResult {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  const result = await createChatCompletionDetailed(options);
  return result.content;
}

export async function createChatCompletionDetailed(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const apiKey = getApiKey();
  const prefix = options.errorPrefix ?? "OpenAI request failed";

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      response_format: options.response_format,
      messages: options.messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${prefix} (${response.status}): ${body.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error("OpenAI returned an empty response");
  }

  const usage = {
    prompt_tokens: payload.usage?.prompt_tokens ?? 0,
    completion_tokens: payload.usage?.completion_tokens ?? 0,
    total_tokens: payload.usage?.total_tokens ?? 0,
  };

  if (options.feature) {
    const { trackOpenAiRequest } = await import("@/lib/analytics/openai-track");
    await trackOpenAiRequest(options.feature);
  }

  return {
    content: content.trim(),
    usage,
  };
}
