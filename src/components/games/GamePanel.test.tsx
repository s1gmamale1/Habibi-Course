import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { GameData } from "@/games/derive";
import { attemptFromResult } from "@/practice/attempt";
import { allAttempts, appendAttempt } from "@/practice/ledger";
import { GamePanel } from "./GamePanel";
import { clearGames, registerGame, type GameResult } from "./GameRegistry";

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

describe("registry-declared drills", () => {
  beforeEach(() => clearGames());

  test("shows nothing extra when a lesson declares no games", () => {
    registerGame({ id: "x", label: "🧪 Extra", render: () => <p>extra drill</p> });
    render(<GamePanel data={base} />);
    expect(screen.queryByRole("button", { name: /Extra/ })).toBeNull();
  });

  test("mounts a drill the lesson asks for by id", async () => {
    registerGame({ id: "x", label: "🧪 Extra", render: () => <p>extra drill</p> });
    render(<GamePanel data={base} games={["x"]} />);
    await userEvent.click(screen.getByRole("button", { name: /Extra/ }));
    expect(screen.getByText("extra drill")).toBeTruthy();
  });

  test("ignores an id that has not shipped rather than breaking the page", () => {
    render(<GamePanel data={base} games={["not-a-real-drill"]} />);
    expect(screen.getByRole("button", { name: /letter cards/i })).toBeTruthy();
  });

  test("passes onResult through to the drill", async () => {
    const onResult = vi.fn();
    registerGame({
      id: "x",
      label: "🧪 Extra",
      render: ({ onResult: cb }) => (
        <button type="button" onClick={() => cb?.({ gameId: "x", correct: true, at: 0 })}>
          answer
        </button>
      ),
    });
    render(<GamePanel data={base} games={["x"]} onResult={onResult} />);
    await userEvent.click(screen.getByRole("button", { name: /Extra/ }));
    await userEvent.click(screen.getByRole("button", { name: "answer" }));
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ gameId: "x", correct: true }));
  });
});

/**
 * The panel's **literal** tab list, end to end into the ledger.
 *
 * Task 6d gave the four objective letter drills an `onResult`, and this panel
 * then forwarded it to the registry-mounted tabs only — so in the app the letter
 * drills could report and still did not, and 29 of the 47 concepts would have
 * gone on producing no rows at all. A test that asserted the prop was passed
 * would have proved nothing about that: the prop *was* passed, to the other
 * half of the list. So this renders the real panel, clicks the real buttons on
 * each of the four tabs, and reads the rows back out of the real (fake-backed)
 * IndexedDB store.
 */
describe("the letter drills report through the panel", () => {
  const LETTER = "ب";

  const letters = [
    mk("ا", "alif"),
    mk("ب", "ba"),
    mk("ت", "ta"),
    mk("س", "seen"),
    mk("ش", "sheen"),
    mk("م", "meem"),
  ];

  const data: GameData = {
    lessonId: "1-08",
    newLetters: [mk("ش", "sheen")],
    letterPool: letters,
    formEntries: [
      { item: mk("ب", "ba"), forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" } },
    ],
    wordPool: [{ arabic: "شَمْس", translit: "shams", meaning: "sun" }],
    formsTaught: true,
  };

  /**
   * `onResult` wired straight to the ledger through `attemptFromResult` — the
   * mechanism `useSession` used to call on this path before Task 9 moved that
   * hook onto `Question`s. These four drills still run on the old registry and
   * are not planned by a `SessionPlan` in this slice, so there is no plan to
   * build here; the claim under test is only that a result reaches a correct,
   * ledger-writable row keyed to the concept the panel was told to report.
   */
  let seq = 0;
  function onResult(r: GameResult) {
    seq += 1;
    void appendAttempt(
      attemptFromResult(r, {
        conceptId: LETTER,
        itemKey: `${LETTER}/${r.gameId}/${seq}`,
        sessionId: "s-panel",
        isInterleaved: false,
      }),
    );
  }

  function Harness() {
    return <GamePanel data={data} onResult={onResult} />;
  }

  const tab = (name: RegExp) => userEvent.click(screen.getByRole("button", { name }));

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    vi.spyOn(Math, "random").mockReturnValue(0);
    seq = 0;
  });
  afterEach(() => vi.restoreAllMocks());

  test("all four objective drills land real rows, keyed to the planned concept", async () => {
    render(<Harness />);

    // ❓ Quiz — the prompt names the letter, so the right choice is knowable
    // without depending on how the shuffle landed.
    await tab(/quiz/i);
    const asked = await screen.findByText(/which letter is/i);
    const wanted = letters.find((l) => asked.textContent?.includes(l.name))!;
    await userEvent.click(screen.getByRole("button", { name: `choice ${wanted.arabic}` }));

    // 🔀 Forms — two taps swap two slots, and the swap is graded.
    await tab(/forms/i);
    await userEvent.click(await screen.findByRole("button", { name: "Alone slot" }));
    await userEvent.click(screen.getByRole("button", { name: "End slot" }));

    // 🧩 Build a word — one verdict when the last slot fills.
    await tab(/build a word/i);
    for (const [letter, n] of [["ش", 3], ["م", 1], ["س", 2]] as const) {
      await userEvent.click(await screen.findByRole("button", { name: `bank letter ${letter} ${n}` }));
    }

    // 🔍 Spot the letter — شَمْس is ش م س in order, so the named target's
    // position is known and the tap is a real graded pick.
    await tab(/spot the letter/i);
    const prompt = await screen.findByText(/tap the letter/i);
    const at = ["ش", "م", "س"].findIndex(
      (l) => prompt.textContent?.includes(letters.find((it) => it.arabic === l)!.name),
    );
    await userEvent.click(screen.getByRole("button", { name: `word letter ${at + 1}` }));

    const rows = await waitFor(async () => {
      const all = await allAttempts();
      expect(all).toHaveLength(4);
      return all;
    });
    expect(rows.map((r) => r.gameId)).toEqual([
      "letter-quiz",
      "form-swap",
      "word-builder",
      "spot-the-letter",
    ]);
    // Every row keyed to the concept the session planned — a letter drill has no
    // `ruleId`, which is why `attemptFromResult` takes the concept from context.
    expect(rows.every((r) => r.conceptId === LETTER)).toBe(true);
    expect(rows.every((r) => typeof r.correct === "boolean")).toBe(true);
    expect(rows.every((r) => r.sessionId === "s-panel")).toBe(true);
  });

  test("the flashcard decks stay out of the ledger", async () => {
    render(<Harness />);

    // "✓ Got it" is a claim the learner makes about themselves, not a
    // measurement — and an append-only ledger cannot take an unearned verdict
    // back. Both decks are deliberately unwired.
    await tab(/letter cards/i);
    for (const btn of screen.getAllByRole("button", { name: /got it|again|flip|show/i })) {
      await userEvent.click(btn);
    }

    await expect(allAttempts()).resolves.toHaveLength(0);
  });
});
