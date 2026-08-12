/**
 * Note the absence of `fake-indexeddb` here, and the first test below. The
 * mapper has to be usable — and testable — without a store, because it is the
 * boundary between what a drill reports and what gets written down, and the
 * session runner needs to reason about an attempt before deciding to keep it.
 */
import { describe, expect, test } from "vitest";

import type { GameResult } from "@/components/games/GameRegistry";
import { attemptFromResult } from "./attempt";

const CTX = {
  conceptId: "idghaam_ghunnah",
  itemKey: "2:1#3",
  sessionId: "session-1",
  isInterleaved: false,
};

function result(over: Partial<GameResult> = {}): GameResult {
  return { gameId: "madd-counter", correct: true, at: 1_700_000_000_000, ...over };
}

describe("mapping a drill result onto a ledger row", () => {
  test("needs no IndexedDB", () => {
    // If this ever fails, the purity claim the other tests rest on is vacuous.
    expect(typeof globalThis.indexedDB).toBe("undefined");
    expect(attemptFromResult(result(), CTX).conceptId).toBe("idghaam_ghunnah");
  });

  test("carries the scheduling key, the exemplar and the session through", () => {
    const a = attemptFromResult(result({ gameId: "letter-sorter", at: 42 }), {
      ...CTX,
      isInterleaved: true,
    });

    expect(a).toMatchObject({
      at: 42,
      conceptId: "idghaam_ghunnah",
      itemKey: "2:1#3",
      gameId: "letter-sorter",
      sessionId: "session-1",
      isInterleaved: true,
    });
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("gives every attempt its own id, so two rows never collide", () => {
    const a = attemptFromResult(result(), CTX);
    const b = attemptFromResult(result(), CTX);
    expect(a.id).not.toBe(b.id);
  });

  test("a held duration keeps the calibration that makes it interpretable", () => {
    const a = attemptFromResult(
      result({
        gameId: "ghunnah-timer",
        correct: true,
        measure: {
          heldMs: 940,
          msPerHarakah: 470,
          targetHarakat: 2,
          measuredHarakat: 2,
        },
      }),
      CTX,
    );

    expect(a.measuredHarakat).toBe(2);
    expect(a.targetHarakat).toBe(2);
    expect(a.msPerHarakah).toBe(470);
  });

  test("a choice among several accepted lengths records NO single target", () => {
    // madd_246 is genuinely transmitted at 2, 4 or 6. Writing `targetHarakat: 6`
    // would record a falsehood the drill exists to refute — and Task 4 grades on
    // the verdict precisely when this field is absent.
    const a = attemptFromResult(
      result({
        correct: true,
        choice: { chosenHarakat: 4, acceptedHarakat: [2, 4, 6] },
      }),
      CTX,
    );

    expect(a.targetHarakat).toBeUndefined();
    expect("targetHarakat" in a).toBe(false);
    expect(a.acceptedHarakat).toEqual([2, 4, 6]);
    expect(a.measuredHarakat).toBe(4);
  });

  test("a choice invents no measurement", () => {
    const a = attemptFromResult(
      result({ choice: { chosenHarakat: 4, acceptedHarakat: [2, 4, 6] } }),
      CTX,
    );
    // `msPerHarakah: 0` would assert a calibration that never happened.
    expect("msPerHarakah" in a).toBe(false);
  });

  test("a choice with exactly one accepted length does get a target", () => {
    const a = attemptFromResult(
      result({
        correct: false,
        choice: { chosenHarakat: 2, acceptedHarakat: [6] },
      }),
      CTX,
    );

    expect(a.targetHarakat).toBe(6);
    expect(a.measuredHarakat).toBe(2); // a 2-for-6 miss, not just "wrong"
  });

  test("an ungraded result stays null and never becomes false", () => {
    const a = attemptFromResult(result({ correct: null }), CTX);
    expect(a.correct).toBeNull();
  });

  test("a plain right/wrong drill writes no measurement fields at all", () => {
    const a = attemptFromResult(result({ gameId: "rule-identifier" }), CTX);
    for (const k of ["measuredHarakat", "targetHarakat", "acceptedHarakat", "msPerHarakah"]) {
      expect(k in a).toBe(false);
    }
  });
});
