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
