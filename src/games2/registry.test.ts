import { beforeEach, describe, expect, test } from "vitest";
import { allGames, clearGames, getGame, questionsFor, registerGame } from "./registry";
import type { GameSpec, StudySet } from "./types";

const SET: StudySet = { id: "t", title: "t", letters: [], words: [], forms: [], rules: [], concepts: [] };

const spec = (id: string, over: Partial<GameSpec> = {}): GameSpec => ({
  id,
  label: id,
  mode: "recognition",
  cost: 1,
  graded: true,
  questions: () => [{ conceptId: "ب", itemKey: `${id}/ب`, gameId: id, payload: {} }],
  render: () => null,
  ...over,
});

beforeEach(() => clearGames());

describe("the registry", () => {
  test("registers and resolves by id", () => {
    registerGame(spec("a"));
    expect(getGame("a")?.id).toBe("a");
    expect(getGame("nope")).toBeUndefined();
  });

  test("questionsFor stamps nothing — the game owns its own questions", () => {
    registerGame(spec("a"));
    expect(questionsFor(["a"], SET)).toEqual([
      { conceptId: "ب", itemKey: "a/ب", gameId: "a", payload: {} },
    ]);
  });

  test("an unknown id contributes nothing rather than throwing", () => {
    expect(questionsFor(["ghost"], SET)).toEqual([]);
  });

  test("an ungraded game yields no questions to a caller that wants graded ones", () => {
    // `graded: false` replaces UNGRADED_GAME_IDS. The decks stay playable on the
    // set screen; they simply cannot be planned into a session.
    registerGame(spec("deck", { graded: false }));
    expect(questionsFor(["deck"], SET, { gradedOnly: true })).toEqual([]);
    expect(questionsFor(["deck"], SET)).toHaveLength(1);
  });

  test("a game emitting a malformed question is dropped loudly, not silently", () => {
    registerGame(spec("bad", { questions: () => [{ conceptId: "nonsense", itemKey: "bad/x", gameId: "bad", payload: {} }] }));
    expect(() => questionsFor(["bad"], SET)).toThrow("bad: emitted");
  });
});
