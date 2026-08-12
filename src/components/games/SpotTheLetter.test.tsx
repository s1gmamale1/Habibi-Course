import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ArabicItem } from "@/content/schema";
import type { GameResult } from "./GameRegistry";
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

/**
 * **One attempt per tap**, the same answer `LetterQuiz` gives and for the same
 * reason: every tap on a tile is a graded selection with a real verdict, and the
 * misses are the rows the scheduler most needs.
 */
describe("SpotTheLetter — reporting", () => {
  test("emits one result per tap, with the real verdict and the injected clock", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const results: GameResult[] = [];
    let t = 2000;
    render(
      <SpotTheLetter words={words} pool={pool} onResult={(r) => results.push(r)} now={() => (t += 5)} />,
    );
    await screen.findByText(/Tap the letter/);

    await userEvent.click(screen.getByRole("button", { name: "word letter 1" })); // ش — wrong
    await userEvent.click(screen.getByRole("button", { name: "word letter 2" })); // م — right

    expect(results).toEqual([
      { gameId: "spot-the-letter", correct: false, at: 2005 },
      { gameId: "spot-the-letter", correct: true, at: 2010 },
    ]);
  });

  test("reports nothing but the verdict, and taps after the find are not attempts", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const results: GameResult[] = [];
    render(<SpotTheLetter words={words} pool={pool} onResult={(r) => results.push(r)} now={() => 9} />);
    await screen.findByText(/Tap the letter/);

    await userEvent.click(screen.getByRole("button", { name: "word letter 2" })); // found
    await userEvent.click(screen.getByRole("button", { name: "word letter 1" })); // inert
    await userEvent.click(screen.getByRole("button", { name: "word letter 3" })); // inert

    expect(results).toEqual([{ gameId: "spot-the-letter", correct: true, at: 9 }]);
  });

  // Ambient time is what makes a drill untestable, so `at` must come from the
  // prop even when `Date.now` is sitting right there returning something else.
  test("the clock is the injected one, never ambient Date.now()", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.spyOn(Date, "now").mockReturnValue(999_999);
    const results: GameResult[] = [];
    render(<SpotTheLetter words={words} pool={pool} onResult={(r) => results.push(r)} now={() => 42} />);
    await screen.findByText(/Tap the letter/);
    await userEvent.click(screen.getByRole("button", { name: "word letter 2" }));

    expect(results[0].at).toBe(42);
  });
});

// Unit 1.4 vocabulary contains hamza carriers. The target must be picked from
// the letters AS WRITTEN, so أَحَد can never prompt "tap alif" for a word that
// renders only أ, and the bare ء in ضَوْء becomes legitimately targetable now
// that hamza is taught. Reverting to baseLetters must fail these.
describe("SpotTheLetter with hamza carriers", () => {
  const carrierPool: ArabicItem[] = [
    { arabic: "ح", name: "haa", audio: { type: "teacher-voice", cue: "c" } },
    { arabic: "د", name: "dal", audio: { type: "teacher-voice", cue: "c" } },
    { arabic: "ض", name: "daad", audio: { type: "teacher-voice", cue: "c" } },
    { arabic: "و", name: "waw", audio: { type: "teacher-voice", cue: "c" } },
    { arabic: "ء", name: "hamza", audio: { type: "teacher-voice", cue: "c" } },
    { arabic: "ا", name: "alif", audio: { type: "teacher-voice", cue: "c" } },
  ];

  test("never targets a letter the word does not actually render", async () => {
    // أَحَد renders أ, never a bare ا. With alif as the only nameable pool
    // letter there is therefore no legal target at all, and the game must say
    // so rather than ask for a letter with no tile. Folding أ→ا instead would
    // wrongly prompt "Tap the letter alif".
    vi.spyOn(Math, "random").mockReturnValue(0);
    const alifOnly = carrierPool.filter((it) => it.arabic === "ا");
    render(<SpotTheLetter words={[{ arabic: "أَحَد", translit: "aḥad", meaning: "one" }]} pool={alifOnly} />);
    expect(await screen.findByText(/Picking a letter/)).toBeTruthy();
    expect(screen.queryByText(/Tap the letter/)).toBeNull();
  });

  test("the bare hamza in ضَوْء is targetable and its tile registers correct", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const onlyHamza = carrierPool.filter((it) => it.arabic === "ء");
    render(<SpotTheLetter words={[{ arabic: "ضَوْء", translit: "ḍawʾ", meaning: "light" }]} pool={onlyHamza} />);
    const prompt = await screen.findByText(/Tap the letter/);
    expect(prompt.textContent).toContain("hamza");
    await userEvent.click(screen.getByRole("button", { name: "word letter 3" })); // ء
    expect(screen.getByRole("button", { name: "word letter 3" }).className).toContain("game-correct");
  });
});
