/**
 * The guard on what may be called a concept.
 *
 * ADR-008 keys scheduling on **concepts, not items** — 88 of them, 59 tajweed
 * rules and 29 letters, generated from the library into `@/generated/concepts`.
 * Nothing enforced that until now: a typo wrote a real,
 * permanent row for a concept the scheduler would never surface, and because
 * the ledger is append-only it could not be corrected afterwards. `derive()`
 * would fold it, `schedulesFromLedger` would build a schedule for it, and the
 * learner would simply never see the concept it was supposed to be about.
 *
 * What this can and cannot catch is worth stating, because the limit is real:
 * a rule id is checked against the closed list of 59, so `"ikhfaa"` is caught.
 * A letter is checked **structurally** — a single Arabic letter — because the
 * 29 taught letters are derived per lesson from `content/lessons/*.json` behind
 * `node:fs`, and this module has to run in the browser. So `"ب"` typed as `"پ"`
 * (Persian peh) is caught, and `"ب"` typed as `"ت"` is not. The second is a
 * different valid concept, not a malformed one, and no cheap check separates
 * them.
 */
import { describe, expect, test } from "vitest";
import { TAJWEED_RULES } from "@/content/tajweed";
import { RULE_CONCEPTS } from "@/generated/concepts";
import { isConceptId } from "./concepts";

describe("isConceptId", () => {
  test("TAJWEED_RULES is the render palette, not the concept space", () => {
    expect(TAJWEED_RULES).toHaveLength(18);
    // Five ids are colouring categories only — no library note defines them
    // and no lesson teaches them (see the doc comment on `TAJWEED_RULES`).
    for (const id of ["madd_2", "madd_246", "madd_6", "qalqalah", "silent"]) {
      expect(TAJWEED_RULES).toContain(id);
      expect(isConceptId(id)).toBe(false);
    }
    // Others merely drifted in spelling from the library's real ids —
    // "idghaam_shafawi" here against "idgham_shafawi" in RULE_CONCEPTS —
    // and are just as much not concepts.
    expect(TAJWEED_RULES).toContain("idghaam_shafawi");
    expect(isConceptId("idghaam_shafawi")).toBe(false);
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

describe("isConceptId, against the real curriculum", () => {
  test("accepts every rule the library defines, not just the render palette's 18", () => {
    for (const id of RULE_CONCEPTS) expect(isConceptId(id)).toBe(true);
  });

  test("accepts the rules that had no concept before", () => {
    // `leen` is in the title of the lesson that produced the bug report.
    for (const id of ["leen", "izhar_halqi", "lam_jalalah", "hams"]) {
      expect(isConceptId(id)).toBe(true);
    }
  });

  test("rejects a render-palette id that names no rule", () => {
    // `madd_2` is a span colour. Nothing teaches it, and scheduling it would
    // seed a concept no lesson can ever surface.
    expect(isConceptId("madd_2")).toBe(false);
  });

  test("still rejects the misspelling that caught four fixtures", () => {
    expect(isConceptId("idgham")).toBe(false);
  });
});
