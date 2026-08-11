/**
 * Harakat-safe helpers for tajweed drills.
 *
 * Do NOT use `baseLetters` or `stripDiacritics` from `./arabic` on tajweed
 * content. They strip sukūn, shadda and tanwīn — precisely the marks that decide
 * every tajweed rule. A qalqalah letter qualifies *only when it carries sukūn*;
 * strip the sukūn and a drill silently marks wrong answers correct. That is why
 * tajweed gets its own segmentation here rather than reusing those.
 *
 * Letter sets below are verified against the library vault at `library/02-Rules/`,
 * which is the authority.
 */
import { TAJWEED_RULES, RULE_META, type RuleId } from "@/content/tajweed";

const MARKS = /\p{Mn}/u;

/** Split into base-letter-plus-marks units. Never splits a cluster. */
export function segmentGraphemes(text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    if (out.length > 0 && MARKS.test(ch)) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

export const hasSukun = (seg: string) => seg.includes("ْ") || seg.includes("ۡ");
export const hasShadda = (seg: string) => seg.includes("ّ");
export const baseOf = (seg: string) => [...seg].filter((c) => !MARKS.test(c)).join("");

export const QALQALAH_LETTERS: ReadonlySet<string> = new Set(["ق", "ط", "ب", "ج", "د"]);
export const ISTILA_LETTERS: ReadonlySet<string> = new Set(["خ", "ص", "ض", "غ", "ط", "ق", "ظ"]);
export const THROAT_LETTERS: ReadonlySet<string> = new Set(["ء", "ه", "ع", "ح", "غ", "خ"]);
export const YARMALUN: ReadonlySet<string> = new Set(["ي", "ر", "م", "ل", "و", "ن"]);
export const IKHFA_LETTERS: ReadonlySet<string> = new Set([
  "ص", "ذ", "ث", "ك", "ج", "ش", "ق", "س", "د", "ط", "ز", "ف", "ت", "ض", "ظ",
]);

/** Same-family rules — the pedagogically correct distractors. */
export function siblingRules(rule: RuleId): RuleId[] {
  const family = RULE_META[rule].family;
  const same = TAJWEED_RULES.filter((r) => r !== rule && RULE_META[r].family === family);
  if (same.length >= 3) return same;
  const others = TAJWEED_RULES.filter((r) => r !== rule && !same.includes(r));
  return [...same, ...others].slice(0, Math.max(3, same.length));
}
