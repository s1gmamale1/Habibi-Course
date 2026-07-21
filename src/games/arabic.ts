// Text helpers for the practice games — harakat stripping, base-letter
// normalization, and ZWJ contextual shaping (spec §1, §4).

// Tatweel + fathatan..sukun + dagger alif.
const DIACRITICS = /[ـً-ْٰ]/g;

export function stripDiacritics(s: string): string {
  return s.replace(DIACRITICS, "");
}

// The six letters that never connect forward (lesson 1-08).
export const NON_CONNECTORS = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);

// Hamza-carriers / variants → the base letter taught in the lessons.
const BASE_MAP: Record<string, string> = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ؤ": "و",
  "ئ": "ي",
  "ى": "ي",
};

export function baseLetters(word: string): string[] {
  return [...stripDiacritics(word)].map((c) => BASE_MAP[c] ?? c);
}

const ZWJ = "\u200D";

// Each letter of a word as its own string, ZWJ-padded so that rendering the
// letters in separate <button>s preserves the joined contextual forms.
// Diacritics are stripped (games read unvoweled, like lessons 1-07–1-09).
export function contextualGlyphs(word: string): string[] {
  const letters = [...stripDiacritics(word)];
  return letters.map((ch, i) => {
    const joinsPrev = i > 0 && !NON_CONNECTORS.has(letters[i - 1]);
    const joinsNext = i < letters.length - 1 && !NON_CONNECTORS.has(ch);
    return `${joinsPrev ? ZWJ : ""}${ch}${joinsNext ? ZWJ : ""}`;
  });
}
