import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { contextualGlyphs } from "@/games/arabic";
import type { FormEntry } from "@/games/derive";
import { brokenFormQuestions, BrokenForm, type BrokenFormPayload } from "./brokenForm";
import { lessonSet } from "../studySet";
import type { StudySet } from "../types";

const forms: FormEntry[] = [
  {
    item: { arabic: "ت", name: "ta", audio: { type: "teacher-voice", cue: "tip" } },
    forms: { isolated: "ت", initial: "تـ", medial: "ـتـ", final: "ـت" },
  },
];

const set: StudySet = {
  id: "t", title: "t", letters: [], forms, rules: [], concepts: [],
  words: [{ arabic: "بَيْت", translit: "bayt", meaning: "house" }],
};

// Mirrors brokenForm.tsx's own ZWJ-based classification — kept local so the
// test asserts the intended relation rather than importing the very
// classifier it is checking (same pattern as arabic.test.ts's BASE_MAP fold).
const ZWJ = "\u200D";
function formKindOf(glyph: string): "isolated" | "initial" | "medial" | "final" {
  const joinsPrev = glyph.charAt(0) === ZWJ;
  const joinsNext = glyph.charAt(glyph.length - 1) === ZWJ;
  if (joinsPrev && joinsNext) return "medial";
  if (joinsPrev) return "final";
  if (joinsNext) return "initial";
  return "isolated";
}

describe("brokenFormQuestions", () => {
  test("only asks about letters whose forms the course has taught", () => {
    const qs = brokenFormQuestions(set);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) expect(q.conceptId).toBe("ت");
  });

  test("the broken glyph is a differently-joined form of the SAME base letter — not a tatweel-sourced form", () => {
    // A random glyph would be spot-the-garbage. A tatweel-sourced glyph (as
    // lesson JSON authors "ـت") is a visible tell distinguishable from a
    // ZWJ-shaped bystander by rendering style alone, regardless of whether the
    // join is correct — that was fix round 2's bug. The broken glyph must be
    // built from the same base letter, wrapped in a different ZWJ join.
    const q = brokenFormQuestions(set)[0];
    const p = q.payload as BrokenFormPayload;
    const broken = p.glyphs[p.brokenIndex];
    expect(broken).not.toContain("ـ");
    expect(broken.split(ZWJ).join("")).toBe(p.letter);
    expect(broken).not.toBe(contextualGlyphs(p.word)[p.brokenIndex]);
  });

  test("a set with no usable word yields no questions rather than throwing", () => {
    expect(brokenFormQuestions({ ...set, words: [] })).toEqual([]);
  });

  test("itemKey is prefixed with the game id so it cannot collide", () => {
    for (const q of brokenFormQuestions(set)) expect(q.itemKey.startsWith("broken-form/")).toBe(true);
  });
});

describe("brokenFormQuestions — wrong-form variety (regression: fix round 1 bug 1)", () => {
  // Object.entries(entry.forms) iterates in authoring order {isolated,
  // initial, medial, final}. Always taking candidate [0] means "isolated"
  // wins every time a letter isn't itself isolated — every shipped question
  // became spot-the-disconnected-letter, which is trivially visible and not
  // the intended lesson. This must fail against real content if that bug is
  // back, so it reads real lesson data rather than a single-letter fixture.
  test("across real lesson 2-08 content, the broken glyph is not always the isolated form", () => {
    const real = lessonSet("2-08");
    const qs = brokenFormQuestions(real);
    expect(qs.length).toBeGreaterThan(20);

    const kinds = qs.map((q) => {
      const p = q.payload as BrokenFormPayload;
      return formKindOf(p.glyphs[p.brokenIndex]);
    });
    // At least one non-isolated wrong form must appear.
    expect(kinds.some((k) => k !== "isolated")).toBe(true);
    // And it must not be a coincidence — more than one distinct wrong-form
    // kind should show up across the real question set.
    expect(new Set(kinds).size).toBeGreaterThan(1);
  });

  test("the choice is deterministic, not random — same input yields the same output", () => {
    const real = lessonSet("2-08");
    const a = brokenFormQuestions(real).map((q) => (q.payload as BrokenFormPayload).glyphs[(q.payload as BrokenFormPayload).brokenIndex]);
    const b = brokenFormQuestions(real).map((q) => (q.payload as BrokenFormPayload).glyphs[(q.payload as BrokenFormPayload).brokenIndex]);
    expect(a).toEqual(b);
  });
});

describe("brokenFormQuestions — no tatweel tell (regression: fix round 2)", () => {
  // Bystanders come from contextualGlyphs — bare letter plus ZWJ padding,
  // never a tatweel. Fix round 1 left the broken glyph sourced from
  // entry.forms, which the lesson JSON authors WITH a literal tatweel
  // (U+0640), e.g. "ـب". That made the broken glyph identifiable by
  // rendering style alone — no joining knowledge required, just look for the
  // dash strokes. Both invariants below must fail against that version.
  test("no glyph anywhere contains a tatweel (U+0640), broken or bystander", () => {
    const real = lessonSet("2-08");
    const qs = brokenFormQuestions(real);
    expect(qs.length).toBeGreaterThan(20);
    for (const q of qs) {
      const p = q.payload as BrokenFormPayload;
      for (const g of p.glyphs) expect(g).not.toContain("ـ");
    }
  });

  test("the broken glyph still differs from the correct one everywhere", () => {
    const real = lessonSet("2-08");
    const qs = brokenFormQuestions(real);
    expect(qs.length).toBeGreaterThan(20);
    for (const q of qs) {
      const p = q.payload as BrokenFormPayload;
      expect(p.glyphs[p.brokenIndex]).not.toBe(contextualGlyphs(p.word)[p.brokenIndex]);
    }
  });
});

describe("brokenFormQuestions — bystander shaping (regression: fix round 1 bugs 2 & 3)", () => {
  // بَاب (bāb, "door"): ب ا ب. Only ب has a taught FormEntry here — ا is one
  // of the six non-connectors, which in real content only ever gets
  // isolated+final authored (never 3+ forms), so it never has a FormEntry
  // either. That reproduces the real-content shape exactly: a bystander with
  // no entry, sitting where naive index math would guess wrong.
  const babForms: FormEntry[] = [
    {
      item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "ball" } },
      forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
    },
  ];
  const babSet: StudySet = {
    id: "bab", title: "bab", letters: [], forms: babForms, rules: [], concepts: [],
    words: [{ arabic: "بَاب", translit: "baab", meaning: "door" }],
  };

  test("every non-broken glyph matches contextualGlyphs exactly, including the ب after the non-connector ا", () => {
    const expected = contextualGlyphs("بَاب");
    const qs = brokenFormQuestions(babSet);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      const p = q.payload as BrokenFormPayload;
      p.glyphs.forEach((g, i) => {
        if (i !== p.brokenIndex) expect(g).toBe(expected[i]);
      });
    }
  });

  test("the final ب (after ا) is graded against its true isolated-shaped position, not a naive final-form guess", () => {
    // Naive index math (last letter = "final") would compare against the
    // FormEntry's "final" glyph. Because ا never joins forward, the true
    // form here is "isolated" — so the question for index 2 must offer
    // initial/medial/final as candidates (anything but isolated), never
    // present isolated itself as the "wrong" answer.
    const qs = brokenFormQuestions(babSet).filter((q) => (q.payload as BrokenFormPayload).brokenIndex === 2);
    expect(qs.length).toBe(1);
    const p = qs[0].payload as BrokenFormPayload;
    expect(p.glyphs[2]).not.toBe(babForms[0].forms.isolated);
  });
});

describe("BrokenForm", () => {
  const q = () => brokenFormQuestions(set)[0];

  test("tapping the broken letter reports correct", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as BrokenFormPayload;
    render(<BrokenForm q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByTestId(`glyph-${p.brokenIndex}`));
    expect(answer).toHaveBeenCalledWith(true);
  });

  test("tapping a sound letter reports incorrect, and names the letter", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as BrokenFormPayload;
    const sound = p.glyphs.findIndex((_, i) => i !== p.brokenIndex);
    render(<BrokenForm q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByTestId(`glyph-${sound}`));
    expect(answer).toHaveBeenCalledWith(false);
    // Every wrong answer names the thing and the violated condition.
    expect(screen.getByRole("status").textContent).toMatch(/ت/);
  });

  test("a second tap after answering reports nothing", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as BrokenFormPayload;
    render(<BrokenForm q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByTestId(`glyph-${p.brokenIndex}`));
    await userEvent.click(screen.getByTestId("glyph-0"));
    expect(answer).toHaveBeenCalledTimes(1);
  });
});
