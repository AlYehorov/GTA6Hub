import { GTA6_LAUNCH_GROUND_TRUTH } from "@/lib/editorial/gta6-ground-truth";
import type { ArticleFactPack } from "@/lib/ai/journalism/fact-pack";
import type { EditorArticleJson } from "@/lib/ai/journalism/types";

export interface FactualGuardFailure {
  code: string;
  message: string;
}

export interface FactualGuardReport {
  passed: boolean;
  failures: FactualGuardFailure[];
  /** Caps AI confidence when issues remain — blocks auto-publish at 50% community threshold. */
  confidenceCap: number | null;
}

const NEGATIVE_SALES_SIGNALS =
  /\b(disastrous|underwhelming|disappointing|weak|poor|slow|soft|sluggish|flop(?:ped|ping)?|bombed|tank(?:ed|ing)?|struggling|lackluster|lacklustre)\b/i;

const SALES_TOPIC =
  /\b(pre-?orders?|preorders?|sales|copies sold|units sold|revenue|demand|sell[- ]?through)\b/i;

const HEDGE_SIGNALS =
  /\b(report|reports|claim|claims|alleged|allegedly|rumou?r|unverified|unconfirmed|suggest|suggests|according to|staff (?:at|say|claim)|workers? (?:at|say|claim)|some (?:stores?|retailers?)|community (?:reports?|claims?))\b/i;

const DEFINITIVE_NEGATIVE_HEADLINE =
  /^(?!.*(report|claim|alleged|rumou?r|unverified|suggest|staff say|workers say)).*\b(disastrous|underwhelming|disappointing|weak|poor|slow|soft|flop)\b/i;

const GROUND_TRUTH_CONTEXT =
  /\b(39\s*million|39m|record[- ]breaking|blockbuster|biggest launch|3\s*billion|\$3\s*billion|billion[- ]dollar)\b/i;

function editorFullText(editor: EditorArticleJson): string {
  const sections = (editor.sections ?? [])
    .flatMap((section) => [section.heading, ...(section.paragraphs ?? [])])
    .join("\n");
  return `${editor.title ?? ""}\n${editor.summary ?? ""}\n${sections}`;
}

function discussesNegativeSales(text: string): boolean {
  return SALES_TOPIC.test(text) && NEGATIVE_SALES_SIGNALS.test(text);
}

export function discussesNegativeSalesForReview(text: string): boolean {
  return discussesNegativeSales(text);
}

export function runFactualGuardCheck(
  editor: EditorArticleJson,
  factPack: ArticleFactPack
): FactualGuardReport {
  const failures: FactualGuardFailure[] = [];
  const text = editorFullText(editor);
  const title = editor.title ?? "";

  if (!discussesNegativeSales(text)) {
    return { passed: true, failures: [], confidenceCap: null };
  }

  if (factPack.hasOfficialFacts) {
    const officialCorpus = factPack.officialFacts.map((fact) => fact.text).join("\n").toLowerCase();
    if (NEGATIVE_SALES_SIGNALS.test(officialCorpus)) {
      return { passed: true, failures: [], confidenceCap: null };
    }
  }

  if (DEFINITIVE_NEGATIVE_HEADLINE.test(title.trim())) {
    failures.push({
      code: "definitive_negative_sales_headline",
      message: `Headline states weak sales as fact. Use hedged wording like "Reports Claim..." (${GTA6_LAUNCH_GROUND_TRUTH.preorderUnitsLabel} record launch contradicts this).`,
    });
  }

  if (!HEDGE_SIGNALS.test(`${title}\n${editor.summary ?? ""}`)) {
    failures.push({
      code: "missing_attribution",
      message:
        "Negative sales/pre-order angle must be attributed in the headline or dek (Reports Claim, Alleged, Unverified, etc.).",
    });
  }

  if (!GROUND_TRUTH_CONTEXT.test(text)) {
    failures.push({
      code: "missing_launch_context",
      message: `Article must include verified launch context: ${GTA6_LAUNCH_GROUND_TRUTH.summary}`,
    });
  }

  const confirmedSection = (editor.sections ?? []).find((section) =>
    /confirmed/i.test(section.heading)
  );
  if (confirmedSection) {
    const confirmedText = [confirmedSection.heading, ...(confirmedSection.paragraphs ?? [])].join(
      "\n"
    );
    if (discussesNegativeSales(confirmedText) && !HEDGE_SIGNALS.test(confirmedText)) {
      failures.push({
        code: "negative_sales_in_confirmed",
        message: "Weak sales claims cannot appear in Confirmed Facts without official proof.",
      });
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    confidenceCap: failures.length > 0 ? 0.35 : null,
  };
}

export function passesDraftFactualGuard(input: {
  title: string;
  excerpt: string | null;
  content: string;
  sourceLabel: string;
}): { passed: boolean; reason?: string } {
  if (input.sourceLabel === "official") {
    return { passed: true };
  }

  const text = `${input.title}\n${input.excerpt ?? ""}\n${input.content}`;
  if (!discussesNegativeSales(text)) {
    return { passed: true };
  }

  const failures: FactualGuardFailure[] = [];

  if (DEFINITIVE_NEGATIVE_HEADLINE.test(input.title.trim())) {
    failures.push({
      code: "definitive_negative_sales_headline",
      message: `Headline states weak sales as fact (${GTA6_LAUNCH_GROUND_TRUTH.preorderUnitsLabel} record launch contradicts this).`,
    });
  }

  if (!HEDGE_SIGNALS.test(`${input.title}\n${input.excerpt ?? ""}`)) {
    failures.push({
      code: "missing_attribution",
      message: "Negative sales angle needs hedged headline/dek (Reports Claim, Alleged, Unverified).",
    });
  }

  if (!GROUND_TRUTH_CONTEXT.test(text)) {
    failures.push({
      code: "missing_launch_context",
      message: `Missing verified launch context (${GTA6_LAUNCH_GROUND_TRUTH.preorderUnitsLabel}, ${GTA6_LAUNCH_GROUND_TRUTH.launchRevenueLabel}).`,
    });
  }

  if (failures.length === 0) return { passed: true };
  return {
    passed: false,
    reason: failures.map((failure) => failure.message).join(" "),
  };
}

export function formatFactualGuardFailures(failures: FactualGuardFailure[]): string {
  return failures.map((failure) => `- ${failure.message}`).join("\n");
}
