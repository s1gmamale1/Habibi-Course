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
  id: "t", title: "t", letters: [], forms, rules: [],
  words: [{ arabic: "بَيْت", translit: "bayt", meaning: "house" }],
};

describe("brokenFormQuestions", () => {
  test("only asks about letters whose forms the course has taught", () => {
    const qs = brokenFormQuestions(set);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) expect(q.conceptId).toBe("ت");
  });

  test("the broken glyph is a REAL form of the letter, just the wrong one", () => {
    // A random glyph would be a spot-the-garbage game. The teaching point is
    // that ـت and تـ are both real and only one belongs at the end.
    const q = brokenFormQuestions(set)[0];
    const p = q.payload as BrokenFormPayload;
    const all = Object.values(forms[0].forms);
    expect(all).toContain(p.glyphs[p.brokenIndex]);
    expect(p.glyphs[p.brokenIndex]).not.toBe("ـت");
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
    const byLetter = new Map(real.forms.map((f) => [f.item.arabic, f]));
    const qs = brokenFormQuestions(real);
    expect(qs.length).toBeGreaterThan(20);

    const isIsolated = qs.map((q) => {
      const p = q.payload as BrokenFormPayload;
      const entry = byLetter.get(p.letter);
      return entry?.forms.isolated === p.glyphs[p.brokenIndex];
    });
    // At least one non-isolated wrong form must appear.
    expect(isIsolated.some((wasIsolated) => !wasIsolated)).toBe(true);
    // And it must not be a coincidence — more than one distinct wrong-form
    // kind should show up across the real question set.
    const kinds = new Set(
      qs.map((q) => {
        const p = q.payload as BrokenFormPayload;
        const entry = byLetter.get(p.letter);
        return (Object.entries(entry?.forms ?? {}) as [string, string][]).find(
          ([, v]) => v === p.glyphs[p.brokenIndex],
        )?.[0];
      }),
    );
    expect(kinds.size).toBeGreaterThan(1);
  });

  test("the choice is deterministic, not random — same input yields the same output", () => {
    const real = lessonSet("2-08");
    const a = brokenFormQuestions(real).map((q) => (q.payload as BrokenFormPayload).glyphs[(q.payload as BrokenFormPayload).brokenIndex]);
    const b = brokenFormQuestions(real).map((q) => (q.payload as BrokenFormPayload).glyphs[(q.payload as BrokenFormPayload).brokenIndex]);
    expect(a).toEqual(b);
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
    id: "bab", title: "bab", letters: [], forms: babForms, rules: [],
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
