import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ArabicItem } from "@/content/schema";
import { LetterQuiz } from "./LetterQuiz";

afterEach(() => vi.restoreAllMocks());

const mk = (arabic: string, name: string): ArabicItem => ({ arabic, name, audio: { type: "teacher-voice", cue: "c" } });
const pool = [mk("ا", "alif"), mk("ب", "ba"), mk("ت", "ta"), mk("ث", "tha")];

// random=0: opts = rotate(pool) = [ب,ت,ث,ا] → answer = ب ("ba");
// choices = rotate(opts) = [ت,ث,ا,ب].
describe("LetterQuiz", () => {
  test("asks by name; wrong pick shakes, right pick locks green and scores", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<LetterQuiz pool={pool} />);
    expect(await screen.findByText(/which letter is/i)).toBeTruthy();
    expect(screen.getByText(/ba/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "choice ت" }));
    expect(screen.getByRole("button", { name: "choice ت" }).className).toContain("game-shake");
    await userEvent.click(screen.getByRole("button", { name: "choice ب" }));
    expect(screen.getByRole("button", { name: "choice ب" }).className).toContain("game-correct");
    expect(screen.getByText("First-try score: 0 / 1")).toBeTruthy(); // missed first
    expect(screen.getByRole("button", { name: /next question/i })).toBeTruthy();
  });
  test("first-try correct scores 1 / 1", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<LetterQuiz pool={pool} />);
    await screen.findByText(/which letter is/i);
    await userEvent.click(screen.getByRole("button", { name: "choice ب" }));
    expect(screen.getByText("First-try score: 1 / 1")).toBeTruthy();
  });
});
