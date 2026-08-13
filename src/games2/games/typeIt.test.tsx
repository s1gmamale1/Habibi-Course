import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { normaliseTranslit, typeItQuestions, TypeIt, type TypeItPayload } from "./typeIt";
import { lessonSet } from "../studySet";
import type { StudySet } from "../types";

const set: StudySet = {
  id: "t", title: "t", letters: [], forms: [], rules: [],
  words: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
};

describe("normaliseTranslit", () => {
  test("accepts the macron the course uses, and the ASCII a learner types", () => {
    // The drill tests recall of the WORD, not of a diacritic convention.
    for (const typed of ["bāb", "bab", "baab", " BĀB "]) {
      expect(normaliseTranslit(typed)).toBe(normaliseTranslit("bāb"));
    }
  });

  test("does not collapse genuinely different words", () => {
    expect(normaliseTranslit("bayt")).not.toBe(normaliseTranslit("bāb"));
  });

  // Pinning a real collision, not a hypothetical one. The leniency that
  // strips macrons and drops ʿ/ʾ modifier letters is deliberate (a learner on
  // an English keyboard cannot type ā, ḍ or ʿ) — but it means `dafʿ`
  // (payment) and `ḍaʿf` (weakness), both real words in lesson 2-08, fold to
  // the identical `"daf"`. The matcher is not tightened to tell them apart;
  // `typeItQuestions` excludes both instead (see its doc comment).
  test("folds a real emphatic/ayin collision to the same form (dafʿ vs ḍaʿf)", () => {
    expect(normaliseTranslit("dafʿ") === normaliseTranslit("ḍaʿf")).toBe(true);
  });
});

describe("TypeIt", () => {
  test("a matching answer reports correct", async () => {
    const answer = vi.fn();
    render(<TypeIt q={typeItQuestions(set)[0]} api={{ answer, now: () => 1 }} />);
    await userEvent.type(screen.getByRole("textbox"), "bab");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(answer).toHaveBeenCalledWith(true);
  });

  test("a wrong answer reports incorrect and shows the expected spelling", async () => {
    const answer = vi.fn();
    render(<TypeIt q={typeItQuestions(set)[0]} api={{ answer, now: () => 1 }} />);
    await userEvent.type(screen.getByRole("textbox"), "bayt");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status").textContent).toContain("bāb");
  });

  test("an empty answer reports nothing — a blank is not a wrong answer", () => {
    const answer = vi.fn();
    render(<TypeIt q={typeItQuestions(set)[0]} api={{ answer, now: () => 1 }} />);
    expect(screen.getByRole("button", { name: /check/i })).toHaveProperty("disabled", true);
    expect(answer).not.toHaveBeenCalled();
  });
});

describe("typeItQuestions on real content", () => {
  // This is the assertion that would have caught the dafʿ/ḍaʿf collision —
  // the bāb/bayt fixture pair never touches emphatics or the ayin.
  test("no two questions from lessonSet(2-08) share a normalised transliteration", () => {
    const qs = typeItQuestions(lessonSet("2-08"));
    const seen = new Map<string, string>();
    for (const q of qs) {
      const p = q.payload as TypeItPayload;
      const key = normaliseTranslit(p.translit);
      const prior = seen.get(key);
      expect(prior, `"${p.translit}" collides with "${prior}" (both normalise to "${key}")`).toBeUndefined();
      seen.set(key, p.translit);
    }
  });
});
