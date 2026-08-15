import { describe, expect, test } from "vitest";
import { lessonConcepts } from "./lessonConcepts";
import { isConceptId } from "@/practice/concepts";
import { LESSON_CONCEPTS } from "@/generated/concepts";

describe("lessonConcepts", () => {
  test("a tajweed lesson resolves to the rules it teaches", () => {
    // 3-23 teaches iqlab; its curriculum note declares it.
    expect(lessonConcepts("3-23")).toContain("iqlab");
  });

  test("a letters lesson resolves to the letters it introduces", () => {
    // Unit 1 declares no `teaches:` — its concepts are its letter slides.
    const c = lessonConcepts("1-06");
    expect(c).toContain("ك");
    expect(c).toContain("ل");
    expect(c.some((id) => id.length > 2)).toBe(false); // no rule ids here
  });

  test("a consolidation lesson with no teaches and no new letters is not empty", () => {
    // 3-01 "Makharij Consolidated" declares `teaches: []` and introduces no
    // letter. A lesson that reviews everything practises everything taught so
    // far — an empty set would leave its practice screen blank.
    expect(lessonConcepts("3-01").length).toBeGreaterThan(0);
  });

  test("every concept every lesson returns is schedulable", () => {
    // Sweeps all 74 lessons, not a sample — an invalid id in an unsampled
    // lesson must not be able to hide.
    for (const lid of Object.keys(LESSON_CONCEPTS)) {
      for (const id of lessonConcepts(lid)) expect(isConceptId(id)).toBe(true);
    }
  });

  test("an unknown lesson yields nothing rather than throwing", () => {
    expect(lessonConcepts("9-99")).toEqual([]);
  });

  test("a Kalima lesson resolves to its own rules, not everything", () => {
    // Unit 4 declares no `teaches:`, but its lesson JSON carries `kind:
    // "rule"` slides the generator now reads — 4-01 has 6, not 88.
    const c = lessonConcepts("4-01");
    expect(c.length).toBeLessThan(20);
    // 4-01's own rule slides carry madd_tabii (its lesson JSON's "madd_2"
    // slide, aliased to the canonical id).
    expect(c).toContain("madd_tabii");
  });
});
