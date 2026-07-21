import { describe, expect, test } from "vitest";
import { baseLetters, contextualGlyphs, NON_CONNECTORS, stripDiacritics } from "./arabic";

const ZWJ = "\u200D";

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
});
