import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { wordBankQuestions, WordBank, type WordBankPayload } from "./wordBank";
import type { StudySet } from "../types";

const set: StudySet = {
  id: "t", title: "t", letters: [], forms: [], rules: [],
  words: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
};

// بَاب (bāb) has a duplicate ب, so it cannot be built "wrong" by swapping the
// two identical tiles — that swap still produces the correct word, correctly.
// The verdict tests below need a word whose letters are all distinct so a
// wrong tile order is actually distinguishable from the right one.
const noDupSet: StudySet = {
  id: "t", title: "t", letters: [], forms: [], rules: [],
  words: [{ arabic: "جَبَل", translit: "jabal", meaning: "mountain" }],
};

/** Click the bank tile currently showing `letter`, wherever it landed after the sort. */
async function placeLetter(letter: string) {
  const tile = screen.getAllByTestId(/^tile-/).find((t) => t.textContent === letter);
  if (!tile) throw new Error(`no bank tile showing "${letter}"`);
  await userEvent.click(tile);
}

describe("wordBankQuestions", () => {
  test("tiles are the word's own letters", () => {
    const p = wordBankQuestions(set)[0].payload as WordBankPayload;
    expect(p.tiles).toHaveLength(3);
    expect([...p.tiles].sort()).toEqual(["ا", "ب", "ب"].sort());
  });

  test("the cue carries transliteration AND meaning", () => {
    const p = wordBankQuestions(set)[0].payload as WordBankPayload;
    expect(p.translit).toBe("bāb");
    expect(p.meaning).toBe("door");
  });
});

describe("WordBank", () => {
  test("one verdict per completed word, never per tile", async () => {
    // A tile placed with the word unfinished is not an answer to anything.
    const answer = vi.fn();
    render(<WordBank q={wordBankQuestions(set)[0]} api={{ answer, now: () => 1 }} />);
    const tiles = screen.getAllByTestId(/^tile-/);
    await userEvent.click(tiles[0]);
    expect(answer).not.toHaveBeenCalled();
    await userEvent.click(screen.getAllByTestId(/^tile-/)[0]);
    await userEvent.click(screen.getAllByTestId(/^tile-/)[0]);
    expect(answer).toHaveBeenCalledTimes(1);
  });

  test("building the word in the correct order reports true", async () => {
    const answer = vi.fn();
    render(<WordBank q={wordBankQuestions(noDupSet)[0]} api={{ answer, now: () => 1 }} />);
    for (const letter of ["ج", "ب", "ل"]) await placeLetter(letter);
    expect(answer).toHaveBeenCalledWith(true);
  });

  test("building the word in the wrong order reports false and names the correct word", async () => {
    const answer = vi.fn();
    render(<WordBank q={wordBankQuestions(noDupSet)[0]} api={{ answer, now: () => 1 }} />);
    // ج and ب swapped — a genuine wrong order, distinguishable because none of
    // this word's letters repeat.
    for (const letter of ["ب", "ج", "ل"]) await placeLetter(letter);
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status").textContent).toContain(noDupSet.words[0].arabic);
  });
});
