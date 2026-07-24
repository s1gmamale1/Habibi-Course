import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ArabicItem } from "@/content/schema";
import { Flashcards, LetterFlashcards, letterCards, wordCards } from "./Flashcards";

afterEach(() => vi.restoreAllMocks());

const cards = [
  { id: "a", front: "ا", back: ["alif"] },
  { id: "b", front: "ب", back: ["ba — b", "lips together"] },
  { id: "c", front: "ت", back: ["ta — t"] },
];

describe("Flashcards", () => {
  test("shows shuffled deck, flips, and clears with Got it", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deck order [1,2,0] → first card ب
    render(<Flashcards cards={cards} />);
    expect(await screen.findByText("ب")).toBeTruthy();
    expect(screen.getByText("3 cards left")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /flip card/i }));
    expect(screen.getByText("ba — b")).toBeTruthy();
    expect(screen.getByText("lips together")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.getByText("2 cards left")).toBeTruthy();
    expect(screen.getByText("ت")).toBeTruthy(); // next card, front side again
    await userEvent.click(screen.getByRole("button", { name: /got it/i }));
    await userEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.getByText(/deck cleared/i)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /restart/i }));
    expect(screen.getByText("3 cards left")).toBeTruthy();
  });
  test("Again recycles the card to the back of the deck", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deck [1,2,0]
    render(<Flashcards cards={cards} />);
    expect(await screen.findByText("ب")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /again/i }));
    expect(screen.getByText("3 cards left")).toBeTruthy(); // not removed
    expect(screen.getByText("ت")).toBeTruthy(); // moved on
  });
});

describe("card builders", () => {
  test("letterCards carry name/translit and the audio cue", () => {
    const items: ArabicItem[] = [
      { arabic: "ب", name: "ba", translit: "b", audio: { type: "teacher-voice", cue: "lips together" } },
    ];
    expect(letterCards(items)).toEqual([{ id: "ب", front: "ب", back: ["ba — b", "lips together"] }]);
  });
  test("wordCards show translit — meaning", () => {
    expect(wordCards([{ arabic: "بَاب", translit: "bāb", meaning: "door" }])).toEqual([
      { id: "بَاب", front: "بَاب", back: ["bāb — door"] },
    ]);
  });
});

describe("LetterFlashcards scope toggle", () => {
  const mk = (arabic: string): ArabicItem => ({ arabic, name: `n${arabic}`, audio: { type: "teacher-voice", cue: "c" } });
  test("defaults to today's letters and can switch to all", async () => {
    render(<LetterFlashcards newLetters={[mk("ت")]} allLetters={[mk("ا"), mk("ب"), mk("ت")]} />);
    expect(await screen.findByText("1 card left")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /all 3 so far/i }));
    expect(await screen.findByText("3 cards left")).toBeTruthy();
  });
  test("switching back to today's letters survives a stale big-deck index", async () => {
    // random=0 → 4-card deck order [1,2,3,0]: top index 1 is out of range
    // for the 1-card "new" deck, which crashed the page before the fix.
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<LetterFlashcards newLetters={[mk("ت")]} allLetters={[mk("ا"), mk("ب"), mk("ت"), mk("ث")]} />);
    expect(await screen.findByText("1 card left")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /all 4 so far/i }));
    expect(await screen.findByText("4 cards left")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /today's letters/i }));
    expect(await screen.findByText("1 card left")).toBeTruthy();
    expect(screen.getByText("ت")).toBeTruthy();
  });
});

describe("Flashcards with a shrinking cards prop", () => {
  test("re-render with fewer cards reshuffles instead of crashing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // 3-card deck [1,2,0] → top index 1
    const { rerender } = render(<Flashcards cards={cards} />);
    expect(await screen.findByText("3 cards left")).toBeTruthy();
    rerender(<Flashcards cards={[cards[0]]} />);
    expect(await screen.findByText("1 card left")).toBeTruthy();
    expect(screen.getByText("ا")).toBeTruthy();
  });
});
