import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { normaliseTranslit, typeItQuestions, TypeIt } from "./typeIt";
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
