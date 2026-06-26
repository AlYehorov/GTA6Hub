export const FORBIDDEN_PHRASES = [
  "as anticipation builds",
  "as the gaming community eagerly awaits",
  "in today's gaming landscape",
  "here's everything we know",
  "it remains to be seen",
  "we can only speculate",
  "dive into",
  "delve into",
  "it's worth noting",
  "at the end of the day",
  "in conclusion",
  "without further ado",
  "game-changer",
  "look no further",
  "buckle up",
  "the wait is over",
  "fans have been waiting",
  "ever-evolving world",
  "landscape of gaming",
] as const;

export const GENERIC_INTRO_PATTERNS = [
  /^grand theft auto vi continues to/i,
  /^gta 6 continues to/i,
  /^rockstar games has been/i,
  /^the gaming world/i,
  /^when it comes to gta/i,
];

export function containsForbiddenPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

export function containsMarkdownSyntax(text: string): boolean {
  return (
    /(^|\n)\s*#{1,6}\s/.test(text) ||
    /\*\*[^*]+\*\*/.test(text) ||
    /\[[^\]]+\]\([^)]+\)/.test(text) ||
    /(^|\n)---\s*($|\n)/.test(text)
  );
}

export function containsRawUrl(text: string): boolean {
  return /https?:\/\/[^\s)]+/i.test(text);
}
