import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import type { GameData } from "@/games/derive";
import { GamePanel } from "./GamePanel";

const mk = (arabic: string, name: string) => ({ arabic, name, audio: { type: "teacher-voice" as const, cue: "c" } });

const base: GameData = {
  lessonId: "1-03",
  newLetters: [mk("س", "seen")],
  letterPool: [mk("ا", "alif"), mk("ب", "ba"), mk("ت", "ta"), mk("س", "seen")],
  formEntries: [{ item: mk("س", "seen"), forms: { isolated: "س", initial: "سـ", medial: "ـسـ", final: "ـس" } }],
  wordPool: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
  formsTaught: false,
};

describe("GamePanel gating", () => {
  test("hides Forms tab before 1-07, shows it after", () => {
    const { rerender } = render(<GamePanel data={base} />);
    expect(screen.queryByRole("button", { name: /forms/i })).toBeNull();
    rerender(<GamePanel data={{ ...base, formsTaught: true }} />);
    expect(screen.getByRole("button", { name: /forms/i })).toBeTruthy();
  });
  test("hides quiz when fewer than 4 named letters", () => {
    render(<GamePanel data={{ ...base, letterPool: base.letterPool.slice(0, 3) }} />);
    expect(screen.queryByRole("button", { name: /quiz/i })).toBeNull();
  });
  test("word games hidden when word pool is empty", () => {
    render(<GamePanel data={{ ...base, wordPool: [] }} />);
    expect(screen.queryByRole("button", { name: /build a word/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /spot the letter/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /word cards/i })).toBeNull();
  });
  test("switching tabs swaps the active game", async () => {
    render(<GamePanel data={base} />);
    expect(await screen.findByText(/cards? left/)).toBeTruthy(); // flashcards default
    await userEvent.click(screen.getByRole("button", { name: /quiz/i }));
    expect(await screen.findByText(/which letter is/i)).toBeTruthy();
  });
  test("renders nothing with no data", () => {
    const { container } = render(
      <GamePanel data={{ ...base, letterPool: [], newLetters: [], formEntries: [], wordPool: [] }} />,
    );
    expect(container.innerHTML).toBe("");
  });
});
