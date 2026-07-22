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
  test("prompts by letter name; right tap goes green, wrong tap shakes", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<SpotTheLetter words={words} pool={pool} />);
    expect(await screen.findByText(/meem/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "word letter 1" })); // ש — wrong
    expect(screen.getByRole("button", { name: "word letter 1" }).className).toContain("game-shake");
    await userEvent.click(screen.getByRole("button", { name: "word letter 2" })); // م — right
    expect(screen.getByRole("button", { name: "word letter 2" }).className).toContain("game-correct");
    expect(screen.getByText(/✓ Found it! shams — sun/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /next word/i })).toBeTruthy();
  });
});
