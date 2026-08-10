import { describe, expect, test } from "vitest";
import { baseLetters, contextualGlyphs, displayLetters, NON_CONNECTORS, stripDiacritics } from "./arabic";

const ZWJ = "\u200D";
// Mirrors arabic.ts's BASE_MAP \u2014 kept local so the test asserts the intended
// relation rather than importing the very table it is checking.
const FOLD: Record<string, string> = { "\u0623": "\u0627", "\u0625": "\u0627", "\u0622": "\u0627", "\u0671": "\u0627", "\u0624": "\u0648", "\u0626": "\u064A", "\u0649": "\u064A" };
const BASE_MAP_FOLD = (c: string) => FOLD[c] ?? c;

describe("stripDiacritics", () => {
  test("removes harakat and tatweel", () => {
    expect(stripDiacritics("شَمْس")).toBe("شمس");
    expect(stripDiacritics("خُبْز")).toBe("خبز");
    expect(stripDiacritics("بـ")).toBe("ب"); // tatweel stripped
  });
  test("leaves bare letters unchanged", () => {
    expect(stripDiacritics("باب")).toBe("باب");
  });
});

describe("baseLetters", () => {
  test("splits a voweled word into base letters", () => {
    expect(baseLetters("شَمْس")).toEqual(["ش", "م", "س"]);
  });
  test("maps hamza-carriers and variants to taught base letters", () => {
    expect(baseLetters("أَب")).toEqual(["ا", "ب"]);
    expect(baseLetters("مُؤْمِن")).toEqual(["م", "و", "م", "ن"]);
  });
  test("strips Quranic annotation marks so index alignment survives", () => {
    // عَيْنٌۭ (88:12) carries U+06ED; ضَرِيعٍۢ (88:6) carries U+06E2.
    expect(baseLetters("عَيْنٌۭ")).toEqual(["ع", "ي", "ن"]);
    expect(baseLetters("ضَرِيعٍۢ")).toEqual(["ض", "ر", "ي", "ع"]);
    expect(displayLetters("عَيْنٌۭ")).toHaveLength(3);
  });
  test("strips sukun and shadda", () => {
    expect(baseLetters("حَقّ")).toEqual(["ح", "ق"]);
    expect(baseLetters("بَحْر")).toEqual(["ب", "ح", "ر"]);
  });
});

describe("displayLetters", () => {
  test("keeps hamza-carriers as written, unlike baseLetters", () => {
    expect(displayLetters("أَب")).toEqual(["أ", "ب"]);
    expect(displayLetters("مُؤْمِن")).toEqual(["م", "ؤ", "م", "ن"]);
  });
  test("stays index-aligned with baseLetters, element by element", () => {
    // Length alone can't fail once baseLetters delegates — assert the actual
    // per-index relation, over every carrier form that appears in content.
    for (const w of ["أَحَد", "ضَوْء", "لُغَة", "شَمْس", "إِيمَان", "ٱلْحَمْدُ", "آمَنَ", "مُؤْمِن", "بِئْر", "ضُحَى"]) {
      const disp = displayLetters(w);
      const base = baseLetters(w);
      expect(disp).toHaveLength(base.length);
      disp.forEach((c, i) => expect(BASE_MAP_FOLD(c)).toBe(base[i]));
    }
  });
});

describe("contextualGlyphs", () => {
  test("wraps joining letters in ZWJ so isolated spans keep shape", () => {
    // شمس: ش joins forward, م joins both sides, س joins backward only
    expect(contextualGlyphs("شَمْس")).toEqual([`ش${ZWJ}`, `${ZWJ}م${ZWJ}`, `${ZWJ}س`]);
  });
  test("never joins after a non-connector", () => {
    // باب: ب joins forward, ا never connects forward, so final ب stays isolated
    expect(contextualGlyphs("باب")).toEqual([`ب${ZWJ}`, `${ZWJ}ا`, "ب"]);
  });
  test("exposes the six non-connectors", () => {
    expect([...NON_CONNECTORS].sort()).toEqual(["ا", "د", "ذ", "ر", "ز", "و"].sort());
  });
  test("hamza-carriers inherit their seat's joining behaviour", () => {
    // أ is an alif: joins back, never forward. Unit 1.4 words rely on this.
    expect(contextualGlyphs("سَأَل")).toEqual([`س${ZWJ}`, `${ZWJ}أ`, `ل`]);
    // ...and back-joining still depends on the letter before it: ر is itself a
    // non-connector, so every glyph of رَأْس stands alone.
    expect(contextualGlyphs("رَأْس")).toEqual([`ر`, `أ`, `س`]);
    // ؤ is a waw — also no forward join.
    expect(contextualGlyphs("سُؤَال")).toEqual([`س${ZWJ}`, `${ZWJ}ؤ`, `ا`, `ل`]);
    // ئ is a ya and DOES join forward.
    expect(contextualGlyphs("بِئْر")).toEqual([`ب${ZWJ}`, `${ZWJ}ئ${ZWJ}`, `${ZWJ}ر`]);
  });
  test("ta marbuta never joins forward and standalone hamza joins neither side", () => {
    expect(contextualGlyphs("لُغَة")).toEqual([`ل${ZWJ}`, `${ZWJ}غ${ZWJ}`, `${ZWJ}ة`]);
    expect(contextualGlyphs("ضَوْء")).toEqual([`ض${ZWJ}`, `${ZWJ}و`, `ء`]);
    // ي must stay FINAL, not medial: the bare ء after it accepts no join.
    expect(contextualGlyphs("شَيْء")).toEqual([`ش${ZWJ}`, `${ZWJ}ي`, `ء`]);
  });
});
