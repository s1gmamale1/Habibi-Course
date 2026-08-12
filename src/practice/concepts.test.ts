/**
 * The guard on what may be called a concept.
 *
 * ADR-008 keys scheduling on **concepts, not items** — 47 of them, 18 tajweed
 * rules and 29 letters. Nothing enforced that until now: a typo wrote a real,
 * permanent row for a concept the scheduler would never surface, and because
 * the ledger is append-only it could not be corrected afterwards. `derive()`
 * would fold it, `schedulesFromLedger` would build a schedule for it, and the
 * learner would simply never see the concept it was supposed to be about.
 *
 * What this can and cannot catch is worth stating, because the limit is real:
 * a rule id is checked against the closed list of 18, so `"ikhfaa"` is caught.
 * A letter is checked **structurally** — a single Arabic letter — because the
 * 29 taught letters are derived per lesson from `content/lessons/*.json` behind
 * `node:fs`, and this module has to run in the browser. So `"ب"` typed as `"پ"`
 * (Persian peh) is caught, and `"ب"` typed as `"ت"` is not. The second is a
 * different valid concept, not a malformed one, and no cheap check separates
 * them.
 */
import { describe, expect, test } from "vitest";
import { TAJWEED_RULES } from "@/content/tajweed";
import { isConceptId } from "./concepts";

describe("isConceptId", () => {
  test("accepts every one of the 18 tajweed rules", () => {
    expect(TAJWEED_RULES).toHaveLength(18);
    for (const rule of TAJWEED_RULES) expect(isConceptId(rule)).toBe(true);
  });

  test("accepts a single Arabic letter, which is how the 29 letter concepts are keyed", () => {
    // Drawn from `letterPool`, where `conceptId` is the letter as written.
    for (const l of ["ب", "ت", "ث", "ج", "ح", "خ", "ع", "ض", "ق", "ك", "ه", "ي"]) {
      expect(isConceptId(l)).toBe(true);
    }
  });

  test("accepts a letter carrying a combining mark as one grapheme", () => {
    // The corpus writes the maddah as combining U+0653 over a plain alif, so a
    // letter concept can be more than one code point while still being one
    // letter. Counting code points instead of graphemes would reject it.
    expect(isConceptId("آ")).toBe(true);
  });

  test("rejects a misspelled rule id — the failure this exists to catch", () => {
    expect(isConceptId("ikhfaa")).toBe(false);
    expect(isConceptId("madd2")).toBe(false);
    expect(isConceptId("qalqala")).toBe(false);
  });

  test("rejects an empty or blank id", () => {
    expect(isConceptId("")).toBe(false);
    expect(isConceptId("   ")).toBe(false);
  });

  test("rejects a non-Arabic single character, so a stray key is not mistaken for a letter", () => {
    for (const c of ["a", "1", "?", "‍"]) expect(isConceptId(c)).toBe(false);
  });

  test("rejects a multi-letter Arabic string — an exemplar is not a concept", () => {
    // `itemKey` values look like this. Passing one here would schedule the
    // sample rather than the thing being learned, which is ADR-008 inverted.
    expect(isConceptId("بت")).toBe(false);
    expect(isConceptId("مِنْ رَبِّهِمْ")).toBe(false);
  });
});
