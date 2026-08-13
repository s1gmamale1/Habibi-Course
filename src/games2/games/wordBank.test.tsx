import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { wordBankQuestions, WordBank, type WordBankPayload } from "./wordBank";
import type { StudySet } from "../types";

const set: StudySet = {
  id: "t", title: "t", letters: [], forms: [], rules: [],
  words: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
};

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
});
