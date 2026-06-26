import type { JournalismArticleJson, JournalismBlock } from "@/lib/ai/journalism/types";
import {
  containsForbiddenPhrase,
  containsMarkdownSyntax,
  containsRawUrl,
  GENERIC_INTRO_PATTERNS,
} from "@/lib/ai/journalism/cliches";

export interface QualityFailure {
  code: string;
  message: string;
}

export interface QualityReport {
  passed: boolean;
  failures: QualityFailure[];
}

function blockText(block: JournalismBlock): string {
  switch (block.type) {
    case "heading":
      return block.text;
    case "paragraph":
    case "quote":
      return block.text;
    case "list":
      return block.items.join(" ");
    case "entity":
      return block.label;
    case "faq":
      return block.items.map((i) => `${i.question} ${i.answer}`).join(" ");
    case "youtube":
      return block.title;
    case "sources":
      return block.items.map((i) => i.label).join(" ");
    case "image":
      return block.alt;
    default:
      return "";
  }
}

function hasGenericIntro(blocks: JournalismBlock[]): boolean {
  const firstParagraph = blocks.find((b) => b.type === "paragraph");
  if (!firstParagraph || firstParagraph.type !== "paragraph") return false;
  const text = firstParagraph.text.trim();
  return GENERIC_INTRO_PATTERNS.some((re) => re.test(text));
}

function hasDuplicatedParagraphs(blocks: JournalismBlock[]): boolean {
  const paragraphs = blocks
    .filter((b): b is Extract<JournalismBlock, { type: "paragraph" }> => b.type === "paragraph")
    .map((b) => b.text.trim().toLowerCase())
    .filter(Boolean);
  return new Set(paragraphs).size !== paragraphs.length;
}

function hasUnsupportedCertainty(blocks: JournalismBlock[], sourceBadge: string): boolean {
  if (sourceBadge === "Official") return false;

  const confirmedSectionBlocks: JournalismBlock[] = [];
  let inConfirmed = false;
  for (const block of blocks) {
    if (block.type === "heading" && block.level === 2) {
      inConfirmed = block.text.toLowerCase().includes("confirmed facts");
      if (inConfirmed) continue;
      if (confirmedSectionBlocks.length > 0) break;
    }
    if (inConfirmed) confirmedSectionBlocks.push(block);
  }

  return confirmedSectionBlocks.some(
    (b) =>
      b.type === "paragraph" &&
      /will definitely|has confirmed|rockstar announced|officially revealed/i.test(b.text) &&
      !/according to|rockstar newswire|official trailer/i.test(b.text)
  );
}

function hasRequiredSections(blocks: JournalismBlock[]): string[] {
  const headings = blocks
    .filter((b): b is Extract<JournalismBlock, { type: "heading" }> => b.type === "heading" && b.level === 2)
    .map((b) => b.text.toLowerCase());

  const required = ["what happened", "confirmed facts", "why it matters", "what's next"];
  return required.filter((section) => !headings.some((h) => h.includes(section)));
}

export function runQualityCheck(json: JournalismArticleJson): QualityReport {
  const failures: QualityFailure[] = [];
  const blocks = json.blocks ?? [];
  const allText = blocks.map(blockText).join("\n");

  const cliche = containsForbiddenPhrase(allText);
  if (cliche) {
    failures.push({
      code: "cliche",
      message: `Contains forbidden AI phrase: "${cliche}"`,
    });
  }

  for (const block of blocks) {
    const text = blockText(block);
    if (block.type === "paragraph" || block.type === "quote" || block.type === "heading") {
      if (containsMarkdownSyntax(text)) {
        failures.push({
          code: "markdown",
          message: `Block contains markdown syntax: ${text.slice(0, 80)}`,
        });
        break;
      }
    }
    if (
      (block.type === "paragraph" || block.type === "quote") &&
      containsRawUrl(text)
    ) {
      failures.push({
        code: "raw_url",
        message: "Paragraph contains raw URL — use sources block instead",
      });
      break;
    }
  }

  if (hasGenericIntro(blocks)) {
    failures.push({
      code: "generic_intro",
      message: "Opens with generic introduction instead of immediate news lead",
    });
  }

  if (hasDuplicatedParagraphs(blocks)) {
    failures.push({
      code: "duplicate",
      message: "Contains duplicated paragraphs",
    });
  }

  const missing = hasRequiredSections(blocks);
  if (missing.length > 0) {
    failures.push({
      code: "structure",
      message: `Missing required sections: ${missing.join(", ")}`,
    });
  }

  if (hasUnsupportedCertainty(blocks, json.hero?.source_badge ?? "Community")) {
    failures.push({
      code: "fake_certainty",
      message: "Presents unconfirmed claims as facts in Confirmed Facts section",
    });
  }

  if (!json.hero?.headline?.trim()) {
    failures.push({ code: "hero", message: "Missing headline" });
  }

  if (!json.hero?.summary?.trim()) {
    failures.push({ code: "hero", message: "Missing summary" });
  }

  return { passed: failures.length === 0, failures };
}

export function formatQualityFailures(failures: QualityFailure[]): string {
  return failures.map((f) => `- ${f.message}`).join("\n");
}
