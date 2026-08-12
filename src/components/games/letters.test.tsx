import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { GameData } from "@/games/derive";
import { GamePanel } from "./GamePanel";
import { getGames } from "./GameRegistry";
import { LETTER_GAME_IDS } from "./letters";
import { TAJWEED_GAME_IDS } from "./tajweed";

/**
 * The letter half of the registry, and the lesson `registry.test.ts` records for
 * the tajweed half: **registration in a module nobody imports does nothing**.
 * Seven tajweed drills sat dead for weeks because their own tests imported them
 * directly and nothing else did, so the tests passed while the built app tree-shook
 * them away.
 *
 * That is why the reachability test below imports the *page* rather than the barrel.
 * A test that imports the barrel proves the barrel works; it says nothing about
 * whether anything in the app ever loads it.
 */

const mk = (arabic: string, name: string) => ({
  arabic,
  name,
  audio: { type: "teacher-voice" as const, cue: "c" },
});

/** Enough of everything that all six drills have something to show. */
const FULL: GameData = {
  lessonId: "1-07",
  newLetters: [mk("س", "seen")],
  letterPool: [mk("ا", "alif"), mk("ب", "ba"), mk("ت", "ta"), mk("س", "seen")],
  formEntries: [
    { item: mk("س", "seen"), forms: { isolated: "س", initial: "سـ", medial: "ـسـ", final: "ـس" } },
  ],
  wordPool: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
  formsTaught: true,
};

/** A lesson that has taught nothing yet — every gate closed. */
const EMPTY: GameData = {
  lessonId: "1-01",
  newLetters: [],
  letterPool: [],
  formEntries: [],
  wordPool: [],
  formsTaught: false,
};

describe("the letter drills are registered", () => {
  test("importing the barrel registers all six", () => {
    const found = getGames([...LETTER_GAME_IDS]);
    expect(found.map((g) => g.id).sort()).toEqual([...LETTER_GAME_IDS].sort());
  });

  test("no drill is registered twice, and none collides with a tajweed id", () => {
    // `registerGame` replaces on a repeat id, so a collision would silently
    // swap one drill's render for another's rather than failing anywhere.
    expect(new Set(LETTER_GAME_IDS).size).toBe(LETTER_GAME_IDS.length);
    const overlap = LETTER_GAME_IDS.filter((id) => (TAJWEED_GAME_IDS as readonly string[]).includes(id));
    expect(overlap).toEqual([]);
    const all = [...LETTER_GAME_IDS, ...TAJWEED_GAME_IDS];
    expect(getGames(all)).toHaveLength(13);
  });

  test("every drill has a non-empty label to show in a tab", () => {
    for (const g of getGames([...LETTER_GAME_IDS])) {
      expect(g.label.trim().length, `${g.id} has no label`).toBeGreaterThan(0);
    }
  });
});

describe("the app is what loads them", () => {
  test("the practice page's own import graph fills an empty registry", async () => {
    // A fresh module graph, so the registry starts genuinely empty and the only
    // thing that can fill it is what the page transitively imports. Importing
    // the barrel here instead would prove nothing about the built app.
    vi.resetModules();
    const registry = await import("./GameRegistry");
    expect(registry.getGames([...LETTER_GAME_IDS])).toHaveLength(0);

    await import("@/app/practice/[id]/page");

    expect(registry.getGames([...LETTER_GAME_IDS]).map((g) => g.id).sort()).toEqual(
      [...LETTER_GAME_IDS].sort(),
    );
  });
});

describe("every registered letter drill can actually render", () => {
  test.each([...LETTER_GAME_IDS])("%s draws a playable board from lesson data", (id) => {
    const entry = getGames([id])[0];
    const { container } = render(<>{entry.render({ data: FULL })}</>);
    expect(container.querySelectorAll("button").length, `${id} rendered no controls`).toBeGreaterThan(0);
  });

  test.each([...LETTER_GAME_IDS])("%s degrades to a note when there is no data", (id) => {
    const entry = getGames([id])[0];
    // Not a nicety: `LetterQuiz` picks `shuffled(pool)[0]` and reads its name, so
    // an ungated render against an empty pool throws rather than showing nothing.
    const { container } = render(<>{entry.render({ data: EMPTY })}</>);
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.textContent?.trim().length, `${id} rendered a blank panel`).toBeGreaterThan(0);
  });

  test.each([...LETTER_GAME_IDS])("%s does not throw when handed no data at all", (id) => {
    const entry = getGames([id])[0];
    expect(() => render(<>{entry.render({})}</>)).not.toThrow();
  });

  test("letter-quiz counts letters it can name, not letters it has", () => {
    // `buildLetterQuestion` asks "which letter is <name>?", so an unnamed pool
    // entry is not a question — it is a prompt with a hole in it. Four *named*
    // is the floor, and a pool of four with one unnamed is a pool of three.
    // (The gate this asserts moved out of `GamePanel` so both sides use one
    // definition of it; nothing tested the naming half of it before.)
    const unnamed = { arabic: "ج", audio: { type: "teacher-voice" as const, cue: "c" } };
    const entry = getGames(["letter-quiz"])[0];
    const thin: GameData = { ...FULL, letterPool: [...FULL.letterPool.slice(0, 3), unnamed] };
    const { container } = render(<>{entry.render({ data: thin })}</>);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  test("word-builder rejects a word that is not a puzzle", () => {
    // One distinct letter is a board of identical tiles, where every arrangement
    // is correct and nothing is being built. Too long does not fit a row.
    const entry = getGames(["word-builder"])[0];
    for (const arabic of ["بب", "بابابابا"]) {
      const thin: GameData = { ...FULL, wordPool: [{ arabic, translit: "x", meaning: "x" }] };
      const { container } = render(<>{entry.render({ data: thin })}</>);
      expect(container.querySelectorAll("button"), arabic).toHaveLength(0);
    }
  });

  test("spot-the-letter rejects a word with nothing to choose between", () => {
    // Counted as written, the way the target picker counts: a word that renders
    // as one repeated glyph gives the learner no discrimination to make.
    const entry = getGames(["spot-the-letter"])[0];
    const thin: GameData = { ...FULL, wordPool: [{ arabic: "ببب", translit: "x", meaning: "x" }] };
    const { container } = render(<>{entry.render({ data: thin })}</>);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  test("a lesson that names one by id gets a playable board, not the empty note", async () => {
    // The other half of the contract. A letter drill's pool is the lesson's, so
    // an entry that resolves but is mounted without `data` renders the note and
    // the learner gets a tab with nothing in it — the failure this whole
    // registration would otherwise ship.
    render(<GamePanel data={FULL} games={["word-builder"]} />);

    // **Two tabs, not one.** The literal tab list already shows this drill, so
    // naming it by id appends a second copy. Pinned rather than worked around:
    // it is the concrete cost of the tab list and the registry being two
    // sources of truth, which the separate change to wire one to the other
    // exists to fix. Nothing ships doubled today — every id a published lesson
    // names is a tajweed drill, none of which is in the literal list.
    const tabs = screen.getAllByRole("button", { name: /Build a word/ });
    expect(tabs).toHaveLength(2);

    await userEvent.click(tabs[1]); // the registry-fed one
    expect(screen.queryByText(/No words to build yet/)).toBeNull();
    expect(screen.getByLabelText("slot 1")).toBeTruthy();
  });
});
