import { describe, expect, test } from "vitest";
import { CONCEPTS, LETTER_CONCEPTS, RULE_CONCEPTS, RULE_MATERIAL } from "./concepts";

describe("the concept model", () => {
  test("is the library's 59 rules plus 29 letters", () => {
    expect(RULE_CONCEPTS).toHaveLength(59);
    expect(LETTER_CONCEPTS).toHaveLength(29);
    expect(CONCEPTS).toHaveLength(88);
  });

  test("includes what lessons actually teach, which the old 18-id list did not", () => {
    // `leen` is in the title of the lesson that produced the bug report; the
    // sifat are taught across Unit 3 and had no concept at all.
    for (const id of ["leen", "izhar_halqi", "lam_jalalah", "madd_arid_lissukun", "hams", "istila"]) {
      expect(RULE_CONCEPTS).toContain(id);
    }
  });

  test("excludes the five render-palette ids, which no library note defines", () => {
    // madd_2/madd_246/madd_6/qalqalah/silent are span colours in
    // `content/tajweed.ts`, not rules. No lesson teaches them.
    for (const id of ["madd_2", "madd_246", "madd_6", "silent"]) {
      expect(RULE_CONCEPTS).not.toContain(id);
    }
  });

  test("carries the material a question can be built from", () => {
    const ikhfa = RULE_MATERIAL["ikhfa_haqiqi"];
    expect(ikhfa.english).toMatch(/conceal/i);
    expect(ikhfa.letters).toHaveLength(15);
    expect(ikhfa.harakat).toBe(2);
    expect(ikhfa.examples.length).toBeGreaterThan(0);
    for (const ex of ikhfa.examples) {
      expect(ex.ref).toMatch(/^\d+:\d+$/);
      expect(ex.text).toMatch(/\p{Script=Arabic}/u);
    }
  });

  test("all but one rule carries at least one worked example", () => {
    const withExamples = RULE_CONCEPTS.filter((id) => (RULE_MATERIAL[id]?.examples.length ?? 0) > 0);
    expect(withExamples.length).toBeGreaterThanOrEqual(RULE_CONCEPTS.length - 1);
  });

  test("no concept id repeats", () => {
    expect(new Set(CONCEPTS).size).toBe(CONCEPTS.length);
  });
});
