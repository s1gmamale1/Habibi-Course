import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ArabicItem } from "@/content/schema";
import type { FormEntry } from "@/games/derive";
import { LetterQuiz } from "./LetterQuiz";

afterEach(() => vi.restoreAllMocks());

const mk = (arabic: string, name: string): ArabicItem => ({ arabic, name, audio: { type: "teacher-voice", cue: "c" } });
const pool = [mk("ا", "alif"), mk("ب", "ba"), mk("ت", "ta"), mk("ث", "tha")];

// random=0: opts = rotate(pool) = [ب,ت,ث,ا] → answer = ب ("ba");
// choices = rotate(opts) = [ت,ث,ا,ب].
describe("LetterQuiz — letter flavor (formsTaught=false)", () => {
  test("asks by name; wrong pick shakes, right pick locks green and scores", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<LetterQuiz pool={pool} entries={[]} formsTaught={false} />);
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
    render(<LetterQuiz pool={pool} entries={[]} formsTaught={false} />);
    await screen.findByText(/which letter is/i);
    await userEvent.click(screen.getByRole("button", { name: "choice ب" }));
    expect(screen.getByText("First-try score: 1 / 1")).toBeTruthy();
  });

  test("stays on the letter flavor across several rounds when forms aren't taught", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<LetterQuiz pool={pool} entries={[]} formsTaught={false} />);
    for (let i = 0; i < 3; i++) {
      expect(await screen.findByText(/which letter is/i)).toBeTruthy();
      await userEvent.click(screen.getByRole("button", { name: "choice ب" }));
      await userEvent.click(screen.getByRole("button", { name: /next question/i }));
    }
    expect(await screen.findByText(/which letter is/i)).toBeTruthy();
  });
});

describe("LetterQuiz — pick-form flavor", () => {
  const seen: FormEntry = {
    item: mk("س", "seen"),
    forms: { isolated: "س", initial: "سـ", medial: "ـسـ", final: "ـس" },
  };

  // A single 4-form entry can't feed cross-letter (needs ≥4 entries), so the only
  // non-"letter" flavor available is pick-form: available = [letter, pick-form].
  // random=0.5 → flavor index floor(0.5*2)=1 → pick-form; formKey index floor(0.5*4)=2 → "medial".
  test("options are the target letter's own forms; the asked form key scores correct", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<LetterQuiz pool={pool} entries={[seen]} formsTaught={true} />);
    expect(await screen.findByText(/tap the/i)).toBeTruthy();
    expect(screen.getByText("Middle")).toBeTruthy();
    expect(screen.getByText("seen")).toBeTruthy();

    for (const glyph of ["س", "سـ", "ـسـ", "ـس"]) {
      expect(screen.getByRole("button", { name: `choice ${glyph}` })).toBeTruthy();
    }

    await userEvent.click(screen.getByRole("button", { name: "choice ـسـ" }));
    expect(screen.getByRole("button", { name: "choice ـسـ" }).className).toContain("game-correct");
    expect(screen.getByText("First-try score: 1 / 1")).toBeTruthy();
  });
});

describe("LetterQuiz — cross-letter flavor", () => {
  // Single-form entries can't satisfy pick-form's "≥3 forms" requirement, so the only
  // non-"letter" flavor available is cross-letter: available = [letter, cross-letter].
  // random=0.5 → flavor index floor(0.5*2)=1 → cross-letter; "isolated" is the only key ≥4 entries share.
  const crossEntries: FormEntry[] = [
    { item: mk("ا", "alif"), forms: { isolated: "ا" } },
    { item: mk("ب", "ba"), forms: { isolated: "ب" } },
    { item: mk("ت", "ta"), forms: { isolated: "ت" } },
    { item: mk("ث", "tha"), forms: { isolated: "ث" } },
  ];

  test("all options are different letters' glyphs for the same form key", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<LetterQuiz pool={pool} entries={crossEntries} formsTaught={true} />);
    await screen.findByText(/tap the/i);
    const buttons = screen.getAllByRole("button", { name: /^choice /i });
    expect(buttons).toHaveLength(4);
    const glyphs = buttons.map((b) => b.getAttribute("aria-label")).sort();
    expect(glyphs).toEqual(["choice ا", "choice ب", "choice ت", "choice ث"].sort());
  });
});
