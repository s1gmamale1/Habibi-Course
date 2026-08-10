// Text helpers for the practice games — harakat stripping, base-letter
// normalization, and ZWJ contextual shaping (spec §1, §4).

// Tatweel + fathatan..sukun + dagger alif.
const DIACRITICS = /[ـً-ْٰ]/g;

export function stripDiacritics(s: string): string {
  return s.replace(DIACRITICS, "");
}

// The six letters that never connect forward (lesson 1-08).
export const NON_CONNECTORS = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);

// Shaping needs a wider set than the six the lesson names: every hamza-carrier
// inherits its seat's joining behaviour (أ إ آ ٱ are alifs, ؤ is a waw — none
// join forward; ئ is a ya and does join), ة only ever ends a word, and a
// standalone ء joins on neither side. Kept separate from NON_CONNECTORS so the
// exported teaching set stays exactly lesson 1-08's six.
const SHAPING_NON_CONNECTORS = new Set([...NON_CONNECTORS, "أ", "إ", "آ", "ٱ", "ؤ", "ة", "ء"]);
const NEVER_JOINS_BACK = new Set(["ء"]);

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

// The letters as actually written — same length and order as baseLetters, but
// carriers keep their own glyph. Use this anywhere the student SEES a letter
// (builder tiles, spot-the-letter); use baseLetters to decide whether a letter
// has been taught yet. Unit 1.4 teaches hamza, so a أ tile must read أ, not ا.
export function displayLetters(word: string): string[] {
  return [...stripDiacritics(word)];
}

const ZWJ = "\u200D";

// Each letter of a word as its own string, ZWJ-padded so that rendering the
// letters in separate <button>s preserves the joined contextual forms.
// Diacritics are stripped (games read unvoweled, like lessons 1-07–1-09).
// Glyphs are deliberately NOT run through BASE_MAP: the word must render as it
// is actually written, so a hamza-carrier keeps its seat. Callers that need to
// know which taught letter a glyph counts as pair this with baseLetters — both
// return the same length in the same order.
export function contextualGlyphs(word: string): string[] {
  const letters = displayLetters(word);
  return letters.map((ch, i) => {
    const joinsPrev = i > 0 && !SHAPING_NON_CONNECTORS.has(letters[i - 1]) && !NEVER_JOINS_BACK.has(ch);
    const joinsNext = i < letters.length - 1 && !SHAPING_NON_CONNECTORS.has(ch);
    return `${joinsPrev ? ZWJ : ""}${ch}${joinsNext ? ZWJ : ""}`;
  });
}
