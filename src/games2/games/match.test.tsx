import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { matchQuestions, Match, type MatchPayload } from "./match";
import type { StudySet } from "../types";

const set: StudySet = {
  id: "t", title: "t", letters: [], forms: [], rules: [],
  words: [
    { arabic: "بَاب", translit: "bāb", meaning: "door" },
    { arabic: "بَيْت", translit: "bayt", meaning: "house" },
    { arabic: "جَبَل", translit: "jabal", meaning: "mountain" },
    { arabic: "قَلْب", translit: "qalb", meaning: "heart" },
  ],
};

describe("matchQuestions", () => {
  test("one question per word, each with distractor meanings", () => {
    const qs = matchQuestions(set);
    expect(qs).toHaveLength(4);
    const p = qs[0].payload as MatchPayload;
    expect(p.distractors.length).toBeGreaterThan(0);
    expect(p.distractors).not.toContain(p.meaning);
  });

  test("the concept is the word's first letter, which is what the scheduler tracks", () => {
    // ADR-008 keys scheduling on the 47 concepts. A word is not one of them.
    expect(matchQuestions(set)[0].conceptId).toBe("ب");
  });

  test("a set too small for distractors yields nothing rather than a one-option game", () => {
    expect(matchQuestions({ ...set, words: set.words.slice(0, 1) })).toEqual([]);
  });
});

describe("Match", () => {
  test("tapping the right meaning reports correct", async () => {
    const answer = vi.fn();
    const q = matchQuestions(set)[0];
    const p = q.payload as MatchPayload;
    render(<Match q={q} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.meaning }));
    expect(answer).toHaveBeenCalledWith(true);
  });

  test("tapping a wrong meaning reports incorrect and names the right one", async () => {
    const answer = vi.fn();
    const q = matchQuestions(set)[0];
    const p = q.payload as MatchPayload;
    render(<Match q={q} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.distractors[0] }));
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status").textContent).toContain(p.meaning);
  });

  test("the timer is shown but never reaches the verdict", async () => {
    // Constraint: a timer may be SHOWN; it may never be recorded or graded.
    const answer = vi.fn();
    const q = matchQuestions(set)[0];
    const p = q.payload as MatchPayload;
    render(<Match q={q} api={{ answer, now: () => 5_000 }} />);
    expect(screen.getByTestId("match-timer")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: p.meaning }));
    // Exactly two arguments would mean a detail object rode along; there is none.
    expect(answer.mock.calls[0]).toEqual([true]);
  });
});
