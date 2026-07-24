import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ArabicItem } from "@/content/schema";
import { SpotTheLetter } from "./SpotTheLetter";

afterEach(() => vi.restoreAllMocks());

const words = [{ arabic: "شَمْس", translit: "shams", meaning: "sun" }];
const pool: ArabicItem[] = [
  { arabic: "ش", name: "sheen", audio: { type: "teacher-voice", cue: "c" } },
  { arabic: "م", name: "meem", audio: { type: "teacher-voice", cue: "c" } },
  { arabic: "س", name: "seen", audio: { type: "teacher-voice", cue: "c" } },
];

// unique letters [ش,م,س]; random=0 rotates → target = م (index 1 in the word).
describe("SpotTheLetter", () => {
  test("prompts by letter name (no Arabic hint); right tap goes green, wrong tap shakes, glyph is revealed after solving", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<SpotTheLetter words={words} pool={pool} />);

    const prompt = await screen.findByText(/Tap the letter/);
    expect(prompt.textContent).toContain("meem");
    expect(prompt.textContent).not.toContain("م"); // target's Arabic glyph must not leak into the prompt

    await userEvent.click(screen.getByRole("button", { name: "word letter 1" })); // ש — wrong
    expect(screen.getByRole("button", { name: "word letter 1" }).className).toContain("game-shake");
    await userEvent.click(screen.getByRole("button", { name: "word letter 2" })); // م — right
    expect(screen.getByRole("button", { name: "word letter 2" }).className).toContain("game-correct");

    const reveal = screen.getByText(/— meem/);
    expect(reveal.textContent).toContain("م"); // only revealed once the student has found it
    expect(screen.getByText(/✓ Found it! shams — sun/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /next word/i })).toBeTruthy();
  });

  test("shows the transliteration alongside the name when available, still without the Arabic glyph", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const poolWithTranslit: ArabicItem[] = [
      { arabic: "ش", name: "sheen", translit: "sh", audio: { type: "teacher-voice", cue: "c" } },
      { arabic: "م", name: "meem", translit: "m", audio: { type: "teacher-voice", cue: "c" } },
      { arabic: "س", name: "seen", translit: "s", audio: { type: "teacher-voice", cue: "c" } },
    ];
    render(<SpotTheLetter words={words} pool={poolWithTranslit} />);

    const prompt = await screen.findByText(/Tap the letter/);
    expect(prompt.textContent).toContain("meem (m)");
    expect(prompt.textContent).not.toContain("م");
  });
});
