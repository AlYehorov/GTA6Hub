const GTA_VI_PATTERNS = [
  /\bGTA\s*VI\b/i,
  /\bGTA\s*6\b/i,
  /\bGrand Theft Auto\s*VI\b/i,
  /\bGrand Theft Auto\s*6\b/i,
  /\bGTAVI\b/i,
];

const GTA6_CONTEXT_PATTERNS = [
  /\bLeonida\b/i,
  /\bVice City\b/i,
  /\bLucia Caminos\b/i,
  /\bLucia\b/i,
  /\bJason Duval\b/i,
];

/** GTA V, GTA 5, GTA Online — excluded from the hub for now. */
const LEGACY_PATTERNS = [
  /\bGTA\s*Online\b/i,
  /\bGTAO\b/i,
  /\bGTA\s*V\b/i,
  /\bGTA\s*5\b/i,
  /\bGTAV\b/i,
  /\bGrand Theft Auto\s+V\b/i,
  /\bGrand Theft Auto\s+5\b/i,
  /\bGTAV\s+tips\b/i,
  /\bPlaying with Perspective in GTAV\b/i,
];

export function isLegacyGtaContent(...parts: (string | null | undefined)[]): boolean {
  const text = parts.filter(Boolean).join(" ");
  return LEGACY_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasGta6Signal(...parts: (string | null | undefined)[]): boolean {
  const text = parts.filter(Boolean).join(" ");
  if (GTA_VI_PATTERNS.some((pattern) => pattern.test(text))) return true;
  return GTA6_CONTEXT_PATTERNS.some((pattern) => pattern.test(text));
}

/** Public articles, videos, and search results — GTA 6 only, no legacy GTA. */
export function isGta6Content(...parts: (string | null | undefined)[]): boolean {
  const text = parts.filter(Boolean).join(" ");
  if (!text.trim()) return false;

  const hasGta6 = hasGta6Signal(text);
  const hasLegacy = isLegacyGtaContent(text);

  if (hasLegacy && !hasGta6) return false;
  return hasGta6;
}

export function isGta6SourceItem(item: {
  source: string;
  title: string;
  content?: string | null;
}): boolean {
  if (hasGta6Signal(item.title)) return true;
  if (isLegacyGtaContent(item.title, item.content)) return false;

  // r/GTA6 and r/GrandTheftAutoVI are GTA VI-focused; broader subs need explicit GTA 6 signal.
  if (item.source === "reddit") {
    return isGta6Content(item.title, item.content);
  }

  return isGta6Content(item.title, item.content);
}

export function isGta6VideoTitle(title: string): boolean {
  return isGta6Content(title);
}

export function isValidYoutubeId(id: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}
