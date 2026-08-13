import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { FormEntry } from "@/games/derive";
import { brokenFormQuestions, BrokenForm, type BrokenFormPayload } from "./brokenForm";
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
