/**
 * jsdom ships no IndexedDB, so the store has to be provided before the module
 * under test opens one. `fake-indexeddb/auto` installs it on `globalThis`.
 *
 * Each test gets a brand-new `IDBFactory` so one test's rows cannot leak into
 * the next — which matters more here than usual, because the whole point of the
 * module is that rows are never removed.
 */
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, test } from "vitest";

import { appendAttempt, allAttempts } from "./ledger";
import type { Attempt } from "./types";

let clock = 1_700_000_000_000;

/** A minimal valid attempt; `at` advances so ordering is never a coin toss. */
function mk(over: Partial<Attempt> = {}): Attempt {
  return {
    id: crypto.randomUUID(),
    at: (clock += 1000),
    // A real rule id. This fixture said `"idgham"` for months — not one of the
    // 18, and the very typo the append guard below now rejects.
    conceptId: "idghaam_ghunnah",
    itemKey: "2:1#3",
    gameId: "ghunnah-timer",
    correct: true,
    sessionId: "session-1",
    isInterleaved: false,
    ...over,
  };
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("the attempt ledger", () => {
  test("appends and never mutates", async () => {
    await appendAttempt(mk({ correct: false }));
    await appendAttempt(mk({ correct: true })); // same concept, a retry

    const all = await allAttempts();

    expect(all).toHaveLength(2); // two rows, not one updated row
    expect(all.map((a) => a.correct)).toEqual([false, true]);
  });

  test("a retry on the same concept AND the same item still appends", async () => {
    // The reference project keyed on (concept, item) and used update_or_create,
    // so this exact case silently destroyed the first row.
    await appendAttempt(mk({ itemKey: "2:1#3", correct: false }));
    await appendAttempt(mk({ itemKey: "2:1#3", correct: true }));

    const all = await allAttempts();
    expect(all).toHaveLength(2);
  });

  test("an ungraded attempt stores null, not false and not undefined", async () => {
    await appendAttempt(mk({ correct: null }));

    const [row] = await allAttempts();
    // `toBeNull` alone would not catch a round-trip that dropped the key: an
    // absent property reads as `undefined`, and `undefined` is not `null`.
    expect(row.correct).toBeNull();
    expect(row.correct).not.toBeUndefined();
    expect("correct" in row).toBe(true);
  });

  test("a measured attempt round-trips its calibration", async () => {
    await appendAttempt(
      mk({
        gameId: "ghunnah-timer",
        measuredHarakat: 1.8,
        targetHarakat: 2,
        msPerHarakah: 470,
      }),
    );

    const [row] = await allAttempts();
    expect(row.msPerHarakah).toBe(470);
    expect(row.measuredHarakat).toBe(1.8);
    expect(row.targetHarakat).toBe(2);
  });

  test("rows come back oldest first, so a fold sees them in the order they happened", async () => {
    await appendAttempt(mk({ at: 300, itemKey: "third" }));
    await appendAttempt(mk({ at: 100, itemKey: "first" }));
    await appendAttempt(mk({ at: 200, itemKey: "second" }));

    const all = await allAttempts();
    expect(all.map((a) => a.itemKey)).toEqual(["first", "second", "third"]);
  });

  test("survives a fresh connection — nothing is held only in memory", async () => {
    await appendAttempt(mk({ itemKey: "persisted" }));
    // `allAttempts` opens its own connection; if `appendAttempt` had buffered
    // rather than committed, this would come back empty.
    expect((await allAttempts()).map((a) => a.itemKey)).toEqual(["persisted"]);
  });

  test("exposes no way to change or remove an attempt", async () => {
    // Absence is the guarantee. If a later change adds an escape hatch, this
    // fails and forces the conversation.
    const surface = await import("./ledger");
    expect(Object.keys(surface).sort()).toEqual(["allAttempts", "appendAttempt"]);
    for (const name of Object.keys(surface)) {
      expect(name).not.toMatch(/update|delete|remove|clear|reset|drop|put/i);
    }
  });

  /**
   * The write boundary is strict; the read path stays permissive.
   *
   * A row that cannot name a real concept is worse than a lost row: the ledger
   * is append-only, so it can never be corrected, and it will be folded by
   * `derive()` and scheduled by `schedulesFromLedger` forever, for a concept no
   * pool can ever draw an exemplar of. Refusing the write is the only moment
   * this is fixable.
   *
   * `schedulesFromLedger` deliberately still accepts a `conceptId` outside the
   * roster — a rule retired from the syllabus was genuinely answered, and
   * dropping that row would lose history the ledger exists to keep. The two are
   * not in tension: you may no longer *write* a malformed id, and nothing ever
   * discards one already written.
   */
  describe("rejects a conceptId the scheduler could never act on", () => {
    test("a misspelled rule id is refused, and nothing is stored", async () => {
      await expect(appendAttempt(mk({ conceptId: "idgham" }))).rejects.toThrow(/conceptId/i);
      expect(await allAttempts()).toEqual([]);
    });

    test("an empty conceptId is refused", async () => {
      await expect(appendAttempt(mk({ conceptId: "" }))).rejects.toThrow(/conceptId/i);
    });

    test("an exemplar key is refused — a sample is not a concept (ADR-008)", async () => {
      await expect(appendAttempt(mk({ conceptId: "letter-quiz/ب" }))).rejects.toThrow(/conceptId/i);
    });

    test("the 18 rules and a single letter are accepted", async () => {
      await appendAttempt(mk({ conceptId: "qalqalah" }));
      await appendAttempt(mk({ conceptId: "ب" }));
      expect((await allAttempts()).map((a) => a.conceptId)).toEqual(["qalqalah", "ب"]);
    });
  });

  test("indexes conceptId and at, so deriving state never scans blind", async () => {
    await appendAttempt(mk());
    const { openDB } = await import("idb");
    const db = await openDB("habibi-practice");
    const store = db.transaction("attempts").objectStore("attempts");
    expect(store.keyPath).toBe("id");
    expect([...store.indexNames].sort()).toEqual(["at", "conceptId"]);
    db.close();
  });
});
