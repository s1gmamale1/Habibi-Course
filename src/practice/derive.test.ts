/**
 * Note the absence of `fake-indexeddb`, and the first two tests below. `derive`
 * is the module that has to run unchanged on a server when ADR-007 lands, so
 * "pure" is a requirement rather than a style: no store, no clock, no mutation
 * of what it was handed. Everything else here rests on that, so it is asserted
 * rather than assumed.
 */
import { describe, expect, test, vi } from "vitest";

import type { Attempt } from "./types";
import { derive, isResolved, isWeak, wrongSignal } from "./derive";

const C = "idgham";
const NOW = 1_700_009_000_000;

let seq = 0;

/** Ids and timestamps ascend with creation order, so `[...wrong(5), ...right(3)]` reads chronologically. */
function mk(over: Partial<Attempt> = {}): Attempt {
  seq += 1;
  return {
    id: `att-${String(seq).padStart(4, "0")}`,
    at: 1_700_000_000_000 + seq * 1_000,
    conceptId: C,
    itemKey: `item-${seq}`,
    gameId: "rule-identifier",
    correct: true,
    sessionId: "s1",
    isInterleaved: false,
    ...over,
  };
}

const wrong = (n: number) => Array.from({ length: n }, () => mk({ correct: false }));
const right = (n: number) => Array.from({ length: n }, () => mk({ correct: true }));

/** A `GhunnahTimer` row: a real hold against a single target, with its calibration. */
function held(measured: number, target = 2): Attempt {
  return mk({
    gameId: "ghunnah-timer",
    // The drill's own 25% verdict, so these rows look exactly like shipped ones.
    correct: Math.abs(measured - target) <= 0.25 * target,
    measuredHarakat: measured,
    targetHarakat: target,
    msPerHarakah: 470,
  });
}

/** A `MaddCounter` row: a selected length against a set, nothing timed. */
function chosen(chosenHarakat: number, accepted: number[], correct: boolean): Attempt {
  const a = mk({
    gameId: "madd-counter",
    correct,
    measuredHarakat: chosenHarakat,
    acceptedHarakat: accepted,
  });
  // One accepted length is a target; several are not. Mirrors `attemptFromResult`.
  if (accepted.length === 1) a.targetHarakat = accepted[0];
  return a;
}

describe("purity", () => {
  test("needs no IndexedDB", () => {
    // If this fails the purity claim the rest of the file rests on is vacuous.
    expect(typeof globalThis.indexedDB).toBe("undefined");
    expect(derive(right(1), NOW).get(C)?.attempts).toBe(1);
  });

  test("reads no clock", () => {
    const attempts = [...wrong(2), ...right(2)];
    const boom = () => {
      throw new Error("derive() read a clock");
    };
    const dateNow = vi.spyOn(Date, "now").mockImplementation(boom);
    const perfNow = vi.spyOn(performance, "now").mockImplementation(boom);
    try {
      expect(derive(attempts, NOW).get(C)!.attempts).toBe(4);
    } finally {
      dateNow.mockRestore();
      perfNow.mockRestore();
    }
  });

  test("does not touch the array it was handed, and repeats itself exactly", () => {
    // Frozen, so an in-place `.sort()` throws rather than quietly reordering a
    // caller's array — the ledger hands out the array it read from the store.
    const attempts = Object.freeze(
      [mk({ at: 3_000, correct: false }), mk({ at: 1_000 }), mk({ at: 2_000 })].map((a) =>
        Object.freeze(a),
      ),
    ) as readonly Attempt[];

    const first = derive(attempts, NOW);
    const second = derive(attempts, NOW);
    expect(second).toEqual(first);
    expect(attempts.map((a) => a.at)).toEqual([3_000, 1_000, 2_000]);
  });

  test("state is as of `now`: an attempt dated later is not folded yet", () => {
    const past = mk({ at: NOW - 1_000, correct: false });
    const future = mk({ at: NOW + 1_000, correct: false });
    expect(derive([past, future], NOW).get(C)!.attempts).toBe(1);
    expect(derive([past, future], NOW + 2_000).get(C)!.attempts).toBe(2);
  });
});

describe("an ungraded attempt is not evidence", () => {
  test("it changes nothing at all", () => {
    const good = mk({ correct: true });
    const ungraded = mk({ correct: null });
    expect(derive([good, ungraded], NOW).get(C)).toEqual(derive([good], NOW).get(C));
  });

  test("a concept seen only ungraded does not appear", () => {
    // Not "appears with zero attempts" — an entry whose every field is the
    // default would claim the concept has a state, and it has none.
    expect(derive([mk({ correct: null })], NOW).size).toBe(0);
  });

  test("it does not break a clean run", () => {
    const s = derive([...right(2), mk({ correct: null }), ...right(1)], NOW).get(C)!;
    expect(s.cleanStreak).toBe(3);
    expect(s.attempts).toBe(3);
  });

  test("a fabricated verdict from an uncalibrated hold is not a miss", () => {
    // `scoreHold()` (GhunnahTimer.tsx:85) returns `{ counts: 0, correct: false }`
    // when `msPerHarakah` is 0. It is unreachable from the UI today, but it is a
    // claim of failure by a drill that had no scale to grade against, and the
    // `0` beside it is not a measurement. Neither may move a band.
    const fabricated = mk({
      gameId: "ghunnah-timer",
      correct: false,
      measuredHarakat: 0,
      targetHarakat: 2,
      msPerHarakah: 0,
    });
    expect(wrongSignal(fabricated)).toBeNull();
    expect(derive([fabricated], NOW).size).toBe(0);

    // A calibrated hold of nearly nothing is a real miss, and still reads as one.
    const genuine = mk({
      gameId: "ghunnah-timer",
      correct: false,
      measuredHarakat: 0.2,
      targetHarakat: 2,
      msPerHarakah: 470,
    });
    expect(wrongSignal(genuine)).toBe(1);
  });
});

describe("one good rep does not clear a weak concept", () => {
  // The reference project shipped the naive version: one lucky answer made an
  // active weakness vanish from the queue that existed to target it.
  test("five wrong then one right is still weak", () => {
    const s = derive([...wrong(5), ...right(1)], NOW).get(C)!;
    expect(s.ewma).toBeGreaterThan(20);
    expect(s.cleanStreak).toBe(1);
    expect(isResolved(s)).toBe(false);
    expect(isWeak(s)).toBe(true);
    expect(s.band).toBe("needs-work");
  });

  test("three clean reps do clear it", () => {
    const s = derive([...wrong(5), ...right(3)], NOW).get(C)!;
    expect(s.cleanStreak).toBe(3);
    expect(isResolved(s)).toBe(true);
    expect(isWeak(s)).toBe(false);
  });

  test("and a miss puts it straight back", () => {
    const s = derive([...wrong(5), ...right(3), ...wrong(1)], NOW).get(C)!;
    expect(s.cleanStreak).toBe(0);
    expect(isResolved(s)).toBe(false);
  });
});

describe("bands move on consecutive evidence, asymmetrically", () => {
  test("promotion needs a run, not a single good rep", () => {
    expect(derive(right(1), NOW).get(C)!.band).toBe("needs-work");
    expect(derive(right(2), NOW).get(C)!.band).toBe("shaky");
    expect(derive(right(4), NOW).get(C)!.band).toBe("shaky");
    expect(derive(right(5), NOW).get(C)!.band).toBe("steady");
    // Each of these pins a run length: the top band is three consecutive reps
    // past `steady`, not one good score once the EWMA has drifted high enough.
    expect(derive(right(6), NOW).get(C)!.band).toBe("steady");
    expect(derive(right(7), NOW).get(C)!.band).toBe("steady");
    expect(derive(right(8), NOW).get(C)!.band).toBe("secure");
  });

  test("a miss inside the run restarts it", () => {
    // Five clean reps reach `steady`; the same five with a miss in the middle
    // do not, even though six attempts have now been folded.
    const interrupted = [...right(3), ...wrong(1), ...right(2)];
    expect(derive(interrupted, NOW).get(C)!.band).toBe("shaky");
    expect(derive(interrupted, NOW).get(C)!.promoteStreak).toBe(2);
  });

  test("two wrong answers never promote a fresh concept", () => {
    const s = derive(wrong(2), NOW).get(C)!;
    expect(s.band).toBe("needs-work");
    expect(s.promoteStreak).toBe(0);
  });

  test("a band survives one bad rep and falls to two", () => {
    // Asymmetric on purpose: three consecutive good reps earned `secure`, and
    // it takes two consecutive bad ones to lose it. A rule you have shown you
    // know should not be taken away by one bad session.
    const eight = right(8);
    const bad = wrong(2);
    expect(derive(eight, NOW).get(C)!.band).toBe("secure");

    const one = derive([...eight, bad[0]], NOW).get(C)!;
    expect(one.band).toBe("secure");
    expect(one.demoteStreak).toBe(1);

    const two = derive([...eight, ...bad], NOW).get(C)!;
    expect(two.band).toBe("steady");
    expect(two.demoteStreak).toBe(0);
  });

  test("a good rep between two bad ones stops the demotion", () => {
    const eight = right(8);
    const s = derive([...eight, ...wrong(1), ...right(1), ...wrong(1)], NOW).get(C)!;
    expect(s.band).toBe("secure");
  });
});

describe("ordering", () => {
  test("the fold is order-dependent, so the ordering matters at all", () => {
    const wrongFirst = [mk({ at: 1_000, correct: false }), mk({ at: 2_000, correct: true })];
    const rightFirst = [mk({ at: 1_000, correct: true }), mk({ at: 2_000, correct: false })];
    expect(derive(wrongFirst, NOW).get(C)!.ewma).not.toBeCloseTo(
      derive(rightFirst, NOW).get(C)!.ewma,
      6,
    );
  });

  test("a shuffled input gives an identical result", () => {
    // `allAttempts()` reads through the `at` index, but the primary key is a
    // random UUID, so two rows written in the same millisecond come back in an
    // arbitrary order. EWMA is order-dependent, so without a stable tiebreak
    // the derived state would differ run to run on the same data.
    const rows = [
      mk({ id: "z", at: 1_000, correct: false }),
      mk({ id: "y", at: 1_000, correct: true }),
      mk({ id: "x", at: 1_000, correct: false }),
      mk({ id: "w", at: 2_000, correct: true }),
      mk({ id: "v", at: 2_000, correct: false }),
      { ...held(1.6), id: "u", at: 3_000 },
    ];
    const shuffled = [rows[4], rows[0], rows[5], rows[2], rows[3], rows[1]];
    const reversed = [...rows].reverse();

    expect(derive(shuffled, NOW)).toEqual(derive(rows, NOW));
    expect(derive(reversed, NOW)).toEqual(derive(rows, NOW));
  });
});

describe("a held duration is graded on distance, symmetrically", () => {
  test("overshooting is a miss, exactly as much as undershooting", () => {
    expect(wrongSignal(held(2.6))).toBe(wrongSignal(held(1.4)));
    expect(wrongSignal(held(2.3))).toBeCloseTo(wrongSignal(held(1.7))!, 10);
    expect(wrongSignal(held(2.3))).toBeCloseTo(0.6, 10);
  });

  test("a longer hold is never better than an accurate one", () => {
    // The guard on the whole no-speed-metric constraint: any quantity monotonic
    // in duration would make 2.6 score better than 2.0, and the drill teaches
    // the opposite.
    const exact = derive([held(2.0)], NOW).get(C)!;
    const over = derive([held(2.6)], NOW).get(C)!;
    expect(over.ewma).toBeGreaterThan(exact.ewma);
    expect(exact.cleanStreak).toBe(1);
    expect(over.cleanStreak).toBe(0);
  });

  test("a hold inside tolerance is a partial signal, not a verdict", () => {
    // 1.8 of 2 is neither right nor wrong. It is 40% of the way to the tolerance.
    expect(wrongSignal(held(1.8))).toBeCloseTo(0.4, 10);
    expect(held(1.8).correct).toBe(true); // the drill said "correct"…
    expect(derive([held(1.8)], NOW).get(C)!.cleanStreak).toBe(0); // …but it was not clean
  });

  test("the signal saturates rather than running away", () => {
    expect(wrongSignal(held(20))).toBe(1);
    expect(derive([held(20)], NOW).get(C)!.ewma).toBeLessThanOrEqual(100);
  });
});

describe("an accepted-set drill grades on the verdict", () => {
  test("no single target means no continuous branch", () => {
    // madd_246 accepts 2, 4 and 6. Scoring 4 against an invented target would
    // mark a correct answer as 67% wrong — teaching a falsehood the drill exists
    // to refute. `targetHarakat` is absent, so the verdict decides.
    expect(wrongSignal(chosen(4, [2, 4, 6], true))).toBe(0);
    expect(wrongSignal(chosen(3, [2, 4, 6], false))).toBe(1);
    expect(derive([chosen(4, [2, 4, 6], true)], NOW).get(C)!.cleanStreak).toBe(1);
  });

  test("one accepted length is a target, and a near miss reads as one", () => {
    // A 5-for-6 is a different diagnosis from a 2-for-6, and this is where that
    // survives: the first is a partial signal, the second a full miss.
    expect(wrongSignal(chosen(5, [6], false))).toBeCloseTo(1 / 1.5, 10);
    expect(wrongSignal(chosen(2, [6], false))).toBe(1);
  });
});

describe("the counters", () => {
  test("count graded attempts and the drills' own verdicts", () => {
    const s = derive([...wrong(2), ...right(3), mk({ correct: null })], NOW).get(C)!;
    expect(s.attempts).toBe(5);
    expect(s.correct).toBe(3);
  });

  test("lastSeenAt is the newest graded attempt, and never `now`", () => {
    const rows = [...wrong(1), ...right(1)];
    const s = derive([...rows, mk({ correct: null, at: NOW - 1 })], NOW).get(C)!;
    expect(s.lastSeenAt).toBe(rows[1].at);
  });

  test("concepts are kept apart", () => {
    const states = derive(
      [mk({ conceptId: "ikhfa", correct: false }), ...right(2)],
      NOW,
    );
    expect([...states.keys()].sort()).toEqual(["idgham", "ikhfa"]);
    expect(states.get("ikhfa")!.attempts).toBe(1);
    expect(states.get("idgham")!.attempts).toBe(2);
  });

  test("no attempts at all is an empty map, not a map of defaults", () => {
    expect(derive([], NOW).size).toBe(0);
  });
});
