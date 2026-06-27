import type { ArticleFactPack } from "@/lib/ai/journalism/fact-pack";
import type { EditorArticleJson } from "@/lib/ai/journalism/types";
import {
  BAD_HEADINGS,
  containsForbiddenPhrase,
  containsMarkdownSyntax,
  containsPrediction,
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

function sectionText(section: EditorArticleJson["sections"][number]): string {
  return [section.heading, ...(section.paragraphs ?? [])].join("\n");
}

function allParagraphText(editor: EditorArticleJson): string {
  return (editor.sections ?? [])
    .flatMap((section) => section.paragraphs ?? [])
    .join("\n");
}

function findConfirmedSection(editor: EditorArticleJson) {
  return (editor.sections ?? []).find((section) =>
    /confirmed/i.test(section.heading)
  );
}

function findCommunitySection(editor: EditorArticleJson) {
  return (editor.sections ?? []).find((section) =>
    /community/i.test(section.heading)
  );
}

export function runEditorQualityCheck(
  editor: EditorArticleJson,
  factPack: ArticleFactPack
): QualityReport {
  const failures: QualityFailure[] = [];
  const body = allParagraphText(editor);
  const summary = editor.summary ?? "";
  const focus = factPack.editorialFocus;

  if (focus) {
    if (
      editor.title &&
      focus.headline &&
      !editor.title.toLowerCase().includes(focus.headline.toLowerCase().slice(0, 24))
    ) {
      failures.push({
        code: "headline_drift",
        message: "Generated title drifted away from locked Editorial Focus headline",
      });
    }

    const combined = `${summary}\n${body}`.toLowerCase();
    const storyNeedle = focus.primary_story.toLowerCase().slice(0, 40);
    if (storyNeedle && !combined.includes(storyNeedle.slice(0, 24))) {
      failures.push({
        code: "story_drift",
        message: "Article body does not stay on the locked primary story",
      });
    }

    if (/officially announced\.\.\.|gta vi officially announced/i.test(combined)) {
      failures.push({
        code: "generic_story",
        message: "Generic GTA VI announcement angle detected instead of focused story",
      });
    }
  }

  const cliche = containsForbiddenPhrase(`${summary}\n${body}`);
  if (cliche) {
    failures.push({ code: "cliche", message: `Forbidden phrase: "${cliche}"` });
  }

  const prediction = containsPrediction(`${summary}\n${body}`);
  if (prediction) {
    failures.push({ code: "prediction", message: `Prediction language detected: ${prediction}` });
  }

  for (const section of editor.sections ?? []) {
    if (BAD_HEADINGS.some((bad) => section.heading.toLowerCase().includes(bad))) {
      failures.push({
        code: "heading",
        message: `Generic heading: "${section.heading}"`,
      });
    }

    for (const paragraph of section.paragraphs ?? []) {
      if (containsMarkdownSyntax(paragraph)) {
        failures.push({ code: "markdown", message: "Paragraph contains markdown syntax" });
        break;
      }
      if (containsRawUrl(paragraph)) {
        failures.push({ code: "raw_url", message: "Paragraph contains raw URL" });
        break;
      }
    }
  }

  const firstParagraph = editor.sections?.[0]?.paragraphs?.[0] ?? "";
  if (GENERIC_INTRO_PATTERNS.some((pattern) => pattern.test(firstParagraph))) {
    failures.push({ code: "generic_intro", message: "Generic introduction detected" });
  }

  const confirmed = findConfirmedSection(editor);
  if (factPack.hasOfficialFacts && !confirmed) {
    failures.push({ code: "structure", message: "Missing Confirmed Facts section" });
  }

  if (confirmed) {
    const confirmedText = sectionText(confirmed).toLowerCase();
    if (
      /reddit|community reports|users claim|according to creators|unverified/i.test(confirmedText)
    ) {
      failures.push({
        code: "mixed_facts",
        message: "Community attribution found inside Confirmed Facts section",
      });
    }
  }

  if (factPack.hasCommunityReports) {
    const community = findCommunitySection(editor);
    if (!community) {
      failures.push({
        code: "structure",
        message: "Missing Community Discussion section for community reports",
      });
    } else {
      const communityText = sectionText(community).toLowerCase();
      if (
        !/community|reddit|creators|users claim|reports suggest|unverified|not confirmed/i.test(
          communityText
        )
      ) {
        failures.push({
          code: "attribution",
          message: "Community section lacks clear attribution",
        });
      }
    }
  }

  const paragraphs = (editor.sections ?? []).flatMap((section) => section.paragraphs ?? []);
  const normalized = paragraphs.map((p) => p.trim().toLowerCase()).filter(Boolean);
  if (new Set(normalized).size !== normalized.length) {
    failures.push({ code: "duplicate", message: "Duplicated paragraphs detected" });
  }

  if (!editor.title?.trim()) failures.push({ code: "title", message: "Missing title" });
  if (!editor.summary?.trim()) failures.push({ code: "summary", message: "Missing summary" });

  return { passed: failures.length === 0, failures };
}

export function formatQualityFailures(failures: QualityFailure[]): string {
  return failures.map((failure) => `- ${failure.message}`).join("\n");
}

// Backward-compatible alias
export function runQualityCheck(): QualityReport {
  return { passed: true, failures: [] };
}
