/**
 * Like `derive.test.ts`, note the absence of `fake-indexeddb`. `schedule` is the
 * other module that has to run unchanged on a server when ADR-007 lands, so
 * "pure" is asserted here rather than assumed — and unlike `derive` it wraps a
 * third-party algorithm, so the purity tests are also what proves `ts-fsrs`
 * itself is not reading a clock behind our back.
 */
import { describe, expect, test, vi } from "vitest";
import { createEmptyCard, fsrs, Rating, State, type Grade } from "ts-fsrs";

import type { Attempt } from "./types";
import { dueConcepts, gradeOf, newSchedule, reviewConcept, type ConceptSchedule } from "./schedule";

const C = "idgham";
const NOW = 1_700_009_000_000;
const DAY = 86_400_000;

let seq = 0;

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

/** A `GhunnahTimer` row: a real hold against a single target, with its calibration. */
function hold(measured: number, target = 2): Attempt {
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

/**
 * What Tasks 5 and 6 will do with these two functions: grade an attempt, and
 * schedule the concept on the result. An ungraded attempt has no grade, so
 * there is nothing to schedule and the state is handed on untouched.
 */
function replay(start: ConceptSchedule, attempts: Attempt[]): ConceptSchedule {
  let s = start;
  for (const a of attempts) {
    const grade = gradeOf(a);
    if (grade === null) continue;
    s = reviewConcept(s, grade, a.at);
  }
  return s;
}

describe("purity", () => {
  test("needs no IndexedDB", () => {
    expect(typeof globalThis.indexedDB).toBe("undefined");
    expect(reviewConcept(newSchedule(C, NOW), Rating.Good, NOW).conceptId).toBe(C);
  });

  test("reads no clock — not here, and not inside ts-fsrs either", () => {
    const boom = () => {
      throw new Error("schedule.ts read a clock");
    };
    const dateNow = vi.spyOn(Date, "now").mockImplementation(boom);
    const perfNow = vi.spyOn(performance, "now").mockImplementation(boom);
    try {
      const fresh = newSchedule(C, NOW);
      const reviewed = reviewConcept(fresh, Rating.Again, NOW);
      expect(dueConcepts([reviewed], NOW + 30 * DAY)).toEqual([C]);
    } finally {
      dateNow.mockRestore();
      perfNow.mockRestore();
    }
  });

  test("the same inputs give the same schedule, every time", () => {
    // The whole engine rests on this: the schedule is not stored, it is replayed
    // out of the ledger on every load, so a second replay of one history has to
    // land in the same place as the first.
    const history = [hold(1.9), hold(0.4), hold(2.0)];
    const start = newSchedule(C, NOW);
    expect(replay(start, history)).toEqual(replay(start, history));
  });

  test("does not touch the schedule it was handed", () => {
    const before = newSchedule(C, NOW);
    const due = before.due.getTime();
    const snapshot = { ...before };
    reviewConcept(before, Rating.Easy, NOW + DAY);
    expect({ ...before }).toEqual(snapshot);
    expect(before.due.getTime()).toBe(due);
  });

  test("uses the published default parameters, not hand-tuned ones", () => {
    // Built here from `fsrs()`'s own defaults. Touch `w`, the learning steps or
    // the maximum interval in schedule.ts and this stops matching — which is the
    // point: untrained FSRS beats trained half-life regression precisely because
    // of those fitted defaults, so overriding them throws away the reason it was
    // chosen. Desired retention is the one knob, and it is at its default here.
    // It is also the guard on interval fuzz: `fsrs()` ships it off, and turning
    // it on in schedule.ts would move `due` away from this reference.
    const reference = fsrs({ request_retention: 0.9 });
    // A letter concept, so no per-rule difficulty prior is in play.
    let mine = newSchedule("ق", NOW);
    let theirs = createEmptyCard(NOW);
    // Long enough to graduate out of the learning steps: fuzz and `w` do not
    // touch the first interval, so a single review would compare nothing.
    for (const grade of [Rating.Good, Rating.Good, Rating.Easy, Rating.Hard, Rating.Good] as Grade[]) {
      const at = mine.due.getTime();
      mine = reviewConcept(mine, grade, at);
      theirs = reference.next(theirs, at, grade).card;
      expect(mine.stability).toBe(theirs.stability);
      expect(mine.difficulty).toBe(theirs.difficulty);
      expect(mine.due.getTime()).toBe(theirs.due.getTime());
    }
  });
});

describe("a held duration maps to a graded answer, not a boolean", () => {
  test("distance from the target picks the rating", () => {
    expect(gradeOf(hold(2.0, 2))).toBe(Rating.Easy);
    expect(gradeOf(hold(1.7, 2))).toBe(Rating.Good);
    expect(gradeOf(hold(1.2, 2))).toBe(Rating.Hard);
    expect(gradeOf(hold(0.6, 2))).toBe(Rating.Again);
  });

  test("the Good/Hard line is the drill's own pass line", () => {
    // `derive.ts` calls a hold correct within 25% of target, and the Good/Hard
    // boundary sits on the same 25%. So the rating never contradicts the verdict
    // the learner was shown: everything the drill passed grades Easy or Good,
    // everything it failed grades Hard or Again. That is not a coincidence to be
    // tidied away later — it is why these thresholds and not others.
    for (const m of [1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.5]) {
      expect(hold(m).correct).toBe(true);
      expect(gradeOf(hold(m))!).toBeGreaterThanOrEqual(Rating.Good);
    }
    for (const m of [0.2, 1.0, 1.4, 2.6, 3.0, 4.0]) {
      expect(hold(m).correct).toBe(false);
      expect(gradeOf(hold(m))!).toBeLessThanOrEqual(Rating.Hard);
    }
  });
});

describe("overshooting is an error, symmetrically", () => {
  test("a long hold is a miss, not a reward", () => {
    // The guard on the whole no-speed-metric constraint. In tajweed the target
    // is a *specific* number of ḥarakāt: holding a madd longer is as wrong as
    // cutting it short, and any grading monotonic in duration corrupts both
    // `GhunnahTimer` and `MaddCounter`.
    expect(gradeOf(hold(3.4, 2))).toBe(Rating.Again);
  });

  test("equal distance either side of the target grades identically", () => {
    for (const d of [0.1, 0.3, 0.5, 0.8, 1.4]) {
      expect(gradeOf(hold(2 + d, 2))).toBe(gradeOf(hold(2 - d, 2)));
    }
  });

  test("a longer hold is never graded better than an accurate one", () => {
    // Ratings are ordered Again(1) < Hard(2) < Good(3) < Easy(4), so a grading
    // that improved with duration would make this sequence ascend.
    const grades = [2.0, 2.2, 2.6, 3.0, 3.4, 6.0].map((m) => gradeOf(hold(m, 2))!);
    for (let i = 1; i < grades.length; i += 1) {
      expect(grades[i]).toBeLessThanOrEqual(grades[i - 1]);
    }
    expect(grades[0]).toBe(Rating.Easy);
    expect(grades.at(-1)).toBe(Rating.Again);
  });
});

describe("an ungraded attempt has no grade", () => {
  test("it is null, and null is not Again", () => {
    // Coercing it would turn "not graded" into "failed" — a claim of failure by
    // a drill that never graded. `derive()` already refuses to do this.
    expect(gradeOf(mk({ correct: null }))).toBeNull();
    expect(gradeOf(mk({ correct: null }))).not.toBe(Rating.Again);
  });

  test("a fabricated verdict from an uncalibrated hold has no grade either", () => {
    // `scoreHold()` returns `{ counts: 0, correct: false }` when `msPerHarakah`
    // is 0. Scored as a continuous miss it reads |0−2| / (2×0.25) → a full miss,
    // which is a failure the learner never had. `wrongSignal` closed this hole in
    // `derive()`; building on it is what keeps it closed here.
    const fabricated = mk({
      gameId: "ghunnah-timer",
      correct: false,
      measuredHarakat: 0,
      targetHarakat: 2,
      msPerHarakah: 0,
    });
    expect(gradeOf(fabricated)).toBeNull();

    // A calibrated hold of nearly nothing is a real miss, and still reads as one.
    expect(gradeOf({ ...fabricated, measuredHarakat: 0.2, msPerHarakah: 470 })).toBe(Rating.Again);
  });

  test("a null grade schedules nothing at all", () => {
    const graded = [hold(1.9), hold(0.5)];
    const ungraded = mk({ correct: null, at: graded[0].at + 1 });
    expect(replay(newSchedule(C, NOW), [graded[0], ungraded, graded[1]])).toEqual(
      replay(newSchedule(C, NOW), graded),
    );
  });
});

describe("an accepted-set drill grades on the verdict", () => {
  test("no single target means no continuous branch", () => {
    // madd_246 accepts 2, 4 and 6 because the rule genuinely permits all three.
    // `targetHarakat` is absent for exactly that reason, so the verdict decides.
    expect(gradeOf(chosen(4, [2, 4, 6], true))).toBe(Rating.Good);
    expect(gradeOf(chosen(3, [2, 4, 6], false))).toBe(Rating.Again);
  });

  test("the accepted set is never collapsed to its first member", () => {
    // Reading `acceptedHarakat[0]` as a target would score a correct 6 as
    // |6−2| / (2×0.25) — a full miss for the right answer, teaching the falsehood
    // the drill exists to refute.
    expect(gradeOf(chosen(6, [2, 4, 6], true))).toBe(Rating.Good);
    expect(gradeOf(chosen(2, [2, 4, 6], true))).toBe(Rating.Good);
  });

  test("a single accepted length is a target, and a near miss reads as one", () => {
    // A 5-for-6 is a different diagnosis from a 2-for-6, and this is where that
    // survives — but neither may grade better than Hard, because the drill said
    // the answer was wrong and no distance measurement overturns that.
    expect(gradeOf(chosen(5, [6], false))).toBe(Rating.Hard);
    expect(gradeOf(chosen(2, [6], false))).toBe(Rating.Again);
    expect(gradeOf(chosen(6, [6], true))).toBe(Rating.Easy);
  });
});

describe("scheduling", () => {
  test("a wrong answer schedules sooner than a right one", () => {
    const fresh = newSchedule(C, NOW);
    const soon = reviewConcept(fresh, Rating.Again, NOW).due;
    const later = reviewConcept(fresh, Rating.Good, NOW).due;
    expect(soon.getTime()).toBeLessThan(later.getTime());
  });

  test("the four ratings order the next review", () => {
    const fresh = newSchedule(C, NOW);
    const due = ([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Grade[]).map((g) =>
      reviewConcept(fresh, g, NOW).due.getTime(),
    );
    for (let i = 1; i < due.length; i += 1) expect(due[i]).toBeGreaterThan(due[i - 1]);
  });

  test("a run of clean answers pushes the concept further out each time", () => {
    let s = newSchedule(C, NOW);
    let previous = 0;
    for (let i = 0; i < 5; i += 1) {
      const before = s.due.getTime();
      s = reviewConcept(s, Rating.Good, s.due.getTime());
      const interval = s.due.getTime() - before;
      expect(interval).toBeGreaterThan(previous);
      previous = interval;
    }
  });

  test("desired retention is the one knob, and it shortens the interval", () => {
    const s = reviewConcept(newSchedule(C, NOW), Rating.Good, NOW);
    const strict = reviewConcept(s, Rating.Good, s.due.getTime(), { desiredRetention: 0.97 });
    const relaxed = reviewConcept(s, Rating.Good, s.due.getTime(), { desiredRetention: 0.8 });
    expect(strict.due.getTime()).toBeLessThan(relaxed.due.getTime());
  });

  test("a fresh schedule is due immediately — nothing has been shown yet", () => {
    expect(newSchedule(C, NOW).due.getTime()).toBe(NOW);
    expect(newSchedule(C, NOW).state).toBe(State.New);
  });
});

describe("a known-hard rule starts stiffer", () => {
  // A prior, not a learned model: a fixed per-rule offset applied once, at the
  // concept's first review. Nothing here fits parameters from data.
  const HARD = "idghaam_mutaqaribayn";
  const EASY = "qalqalah";

  test("the prior moves difficulty at the first review", () => {
    const neutral = reviewConcept(newSchedule("ق", NOW), Rating.Good, NOW);
    const hard = reviewConcept(newSchedule(HARD, NOW), Rating.Good, NOW);
    const easy = reviewConcept(newSchedule(EASY, NOW), Rating.Good, NOW);
    expect(hard.difficulty).toBeGreaterThan(neutral.difficulty);
    expect(easy.difficulty).toBeLessThan(neutral.difficulty);
  });

  test("and so the hard rule comes back sooner — from the third review on", () => {
    // FSRS's first two intervals are the learning steps and the initial
    // stability for the grade, both functions of the grade alone. Difficulty
    // only enters once the card graduates to `Review`, so the prior is
    // *invisible* until the third review. Both halves of that are pinned here,
    // because the first half is what makes the second half meaningful rather
    // than a coincidence of where the assertions were placed.
    const intervals = (id: string, reviews: number) => {
      let s = newSchedule(id, NOW);
      const out: number[] = [];
      for (let i = 0; i < reviews; i += 1) {
        const before = s.due.getTime();
        s = reviewConcept(s, Rating.Good, before);
        out.push(s.due.getTime() - before);
      }
      return out;
    };
    const hard = intervals(HARD, 4);
    const neutral = intervals("ق", 4);
    const easy = intervals(EASY, 4);

    expect(hard.slice(0, 2)).toEqual(neutral.slice(0, 2));
    expect(easy.slice(0, 2)).toEqual(neutral.slice(0, 2));

    for (const i of [2, 3]) {
      expect(hard[i]).toBeLessThan(neutral[i]);
      expect(easy[i]).toBeGreaterThan(neutral[i]);
    }
  });

  test("it applies once, not at every review", () => {
    // Re-applying an offset each time would compound into a hand-tuned model.
    const reviewed = reviewConcept(newSchedule(HARD, NOW), Rating.Good, NOW);
    const again = reviewConcept({ ...reviewed, conceptId: "ق" }, Rating.Good, reviewed.due.getTime());
    const same = reviewConcept(reviewed, Rating.Good, reviewed.due.getTime());
    expect(same.difficulty).toBe(again.difficulty);
  });

  test("a concept with no prior is left exactly where FSRS puts it", () => {
    // 29 letters and any rule not named in the table. Absence must mean zero,
    // not a default nudge.
    const reference = fsrs({ request_retention: 0.9 }).next(createEmptyCard(NOW), NOW, Rating.Hard)
      .card;
    expect(reviewConcept(newSchedule("ق", NOW), Rating.Hard, NOW).difficulty).toBe(
      reference.difficulty,
    );
  });

  test("the prior can never push difficulty out of range", () => {
    // FSRS keeps difficulty in 1..10; a prior that broke the bound would poison
    // every later interval the algorithm computes from it.
    for (const id of ["idghaam_mutaqaribayn", "qalqalah", "madd_246", "madd_2", "ق"]) {
      for (const g of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Grade[]) {
        const d = reviewConcept(newSchedule(id, NOW), g, NOW).difficulty;
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe("dueConcepts", () => {
  /** A schedule parked at an explicit due date, so the assertions read plainly. */
  function at(conceptId: string, due: number): ConceptSchedule {
    return { ...newSchedule(conceptId, NOW), due: new Date(due) };
  }

  test("returns only concepts whose due date has passed", () => {
    const rows = [at("a", NOW - DAY), at("b", NOW + DAY), at("c", NOW - 3 * DAY)];
    expect(dueConcepts(rows, NOW).sort()).toEqual(["a", "c"]);
  });

  test("most overdue first", () => {
    const rows = [at("a", NOW - DAY), at("b", NOW - 9 * DAY), at("c", NOW - 3 * DAY)];
    expect(dueConcepts(rows, NOW)).toEqual(["b", "c", "a"]);
  });

  test("due exactly now is due", () => {
    // A schedule created by `newSchedule` is due at the moment it is created, so
    // a strict `<` would hide every concept the learner has never seen.
    expect(dueConcepts([at("a", NOW)], NOW)).toEqual(["a"]);
  });

  test("identical due dates come back in a stable order", () => {
    const rows = [at("gamma", NOW - DAY), at("alpha", NOW - DAY), at("beta", NOW - DAY)];
    expect(dueConcepts(rows, NOW)).toEqual(["alpha", "beta", "gamma"]);
    expect(dueConcepts([...rows].reverse(), NOW)).toEqual(["alpha", "beta", "gamma"]);
  });

  test("takes the map the rest of the engine passes around", () => {
    const rows = [at("a", NOW - DAY), at("b", NOW + DAY), at("c", NOW - 3 * DAY)];
    const map = new Map(rows.map((r) => [r.conceptId, r]));
    expect(dueConcepts(map, NOW)).toEqual(["c", "a"]);
  });

  test("nothing scheduled is an empty list", () => {
    expect(dueConcepts([], NOW)).toEqual([]);
    expect(dueConcepts(new Map(), NOW)).toEqual([]);
  });

  test("does not touch the collection it was handed", () => {
    const rows = [at("a", NOW - DAY), at("b", NOW - 9 * DAY)];
    dueConcepts(rows, NOW);
    expect(rows.map((r) => r.conceptId)).toEqual(["a", "b"]);
  });
});
