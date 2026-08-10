import { describe, it, expect } from "vitest";
import {
  segmentGraphemes, hasSukun, baseOf, QALQALAH_LETTERS, siblingRules,
} from "./tajweed";
import verses111 from "../generated/verses/111.json";

describe("segmentGraphemes", () => {
  it("keeps a letter together with its marks", () => {
    // ب + kasra, س + sukun, م + kasra  → 3 segments, not 6
    expect(segmentGraphemes("بِسْمِ")).toHaveLength(3);
  });
  it("keeps shadda and a vowel on one base", () => {
    expect(segmentGraphemes("رَّ")).toHaveLength(1);
  });
  it("round-trips", () => {
    const t = "بِسْمِ ٱللَّهِ";
    expect(segmentGraphemes(t).join("")).toBe(t);
  });
  it("round-trips real Quranic text", () => {
    const text = (verses111 as Array<{ text: string }>)[0].text;
    expect(segmentGraphemes(text).join("")).toBe(text);
    // no segment is a bare combining mark
    for (const seg of segmentGraphemes(text)) expect(/^\p{Mn}/u.test(seg)).toBe(false);
  });
});

describe("mark detection", () => {
  it("detects sukun", () => {
    expect(hasSukun("سْ")).toBe(true);
    expect(hasSukun("سِ")).toBe(false);
  });
  it("extracts the base letter", () => {
    expect(baseOf("سْ")).toBe("س");
    expect(baseOf("رَّ")).toBe("ر");
  });
});

describe("letter sets", () => {
  it("has exactly the five qalqalah letters", () => {
    expect(QALQALAH_LETTERS.size).toBe(5);
    for (const l of ["ق", "ط", "ب", "ج", "د"]) expect(QALQALAH_LETTERS.has(l)).toBe(true);
  });
});

describe("siblingRules", () => {
  it("returns same-family rules as distractors", () => {
    const s = siblingRules("ikhfa");
    expect(s).toContain("ikhfa_shafawi");
    expect(s).not.toContain("ikhfa");
  });
  it("always yields at least three distractors", () => {
    for (const r of ["ikhfa", "qalqalah", "madd_2", "iqlab"] as const) {
      expect(siblingRules(r).length).toBeGreaterThanOrEqual(3);
    }
  });
});
