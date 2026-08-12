/**
 * Like `derive.test.ts` and `schedule.test.ts`, note the absence of
 * `fake-indexeddb`. `session` is the third module that has to run unchanged on a
 * server when ADR-007 lands, so "pure" is asserted here rather than assumed.
 */
import { describe, expect, test, vi } from "vitest";
import { Rating } from "ts-fsrs";

import { allLessons } from "@/content/load";
import { TAJWEED_RULES } from "@/content/tajweed";
import { derive, isWeak } from "./derive";
import { dueConcepts, gradeOf, newSchedule, reviewConcept, type ConceptSchedule } from "./schedule";
import type { Attempt } from "./types";
import {
  SESSION_SLOTS,
  TIMED_GAME_IDS,
  conceptRoster,
  planSession,
  schedulesFromLedger,
  shapeOf,
  type PlannedItem,
  type PoolItem,
  type ResponseMode,
} from "./session";

const NOW = 1_700_009_000_000;
const DAY = 86_400_000;

/** Every drill that carries a `gameId` today — the seven registered tajweed drills. */
const GAME_IDS = [
  "rule-identifier",
  "listen-identify",
  "span-tapper",
  "family-sorter",
  "madd-counter",
  "condition-builder",
  "ghunnah-timer",
] as const;

/**
 * The six letter drills, written out rather than imported from
 * `components/games/letters`. That barrel pulls in five React components and
 * `session.ts` is one of the three modules that has to run on a server with no
 * DOM — importing it here would make this file stop testing that. The ids are
 * pinned against the barrel in `components/games/letters.test.tsx` instead.
 */
const LETTER_GAME_IDS = [
  "letter-flashcards",
  "word-flashcards",
  "letter-quiz",
  "spot-the-letter",
  "form-swap",
  "word-builder",
] as const;

const RANK: Record<ResponseMode, number> = { recognition: 0, discrimination: 1, production: 2 };

let seq = 0;

function mk(over: Partial<Attempt> = {}): Attempt {
  seq += 1;
  return {
    id: `att-${String(seq).padStart(4, "0")}`,
    at: NOW - 30 * DAY + seq * 1_000,
    conceptId: "ikhfa",
    itemKey: `item-${seq}`,
    gameId: "rule-identifier",
    correct: true,
    sessionId: "s1",
    isInterleaved: false,
    ...over,
  };
}

/** Several exemplars of every drill for every concept named — a pool with nothing missing. */
function poolFor(
  conceptIds: readonly string[],
  gameIds: readonly string[] = GAME_IDS,
  per = 3,
): PoolItem[] {
  const out: PoolItem[] = [];
  for (const conceptId of conceptIds) {
    for (const gameId of gameIds) {
      for (let n = 1; n <= per; n += 1) {
        out.push({ conceptId, itemKey: `${conceptId}/${gameId}/${n}`, gameId });
      }
    }
  }
  return out;
}

/** A schedule parked at an explicit due date, exactly as `schedule.test.ts` does it. */
function at(conceptId: string, due: number): ConceptSchedule {
  return { ...newSchedule(conceptId, NOW), due: new Date(due) };
}

function scheduleMap(rows: ConceptSchedule[]): Map<string, ConceptSchedule> {
  return new Map(rows.map((r) => [r.conceptId, r]));
}

const cost = (items: PlannedItem[]) => items.reduce((n, i) => n + i.slots, 0);

describe("the concept roster", () => {
  // The 29 letters are read from the course content here rather than typed out:
  // a hand-copied list is a second source of truth that goes stale the first
  // time a letter is added.
  const letters = [
    ...new Set(
      allLessons().flatMap((l) =>
        l.slides.flatMap((s) => (s.kind === "letter" ? [s.item.arabic] : [])),
      ),
    ),
  ];

  test("the course really does teach 29 letters and 18 rules", () => {
    // The premise of every number below. If the content changes, this fails
    // first and says so, instead of the roster test failing for a reason that
    // looks like a bug in the roster.
    expect(letters).toHaveLength(29);
    expect(TAJWEED_RULES).toHaveLength(18);
  });

  test("all 47 concepts, not only the ones with exemplars in hand", () => {
    const roster = conceptRoster(poolFor(letters));
    expect(roster).toHaveLength(47);
    for (const rule of TAJWEED_RULES) expect(roster).toContain(rule);
    for (const letter of letters) expect(roster).toContain(letter);
  });

  test("the 18 rules are there even when the pool holds nothing at all", () => {
    // The rules are a closed syllabus, so they do not depend on what the caller
    // managed to build a pool for.
    expect(conceptRoster([]).sort()).toEqual([...TAJWEED_RULES].sort());
  });

  test("a concept named twice in the pool is one concept", () => {
    expect(conceptRoster(poolFor(["ب", "ب", "ت"]))).toHaveLength(TAJWEED_RULES.length + 2);
  });

  test("the same pool always gives the same roster, in the same order", () => {
    const pool = poolFor(["ت", "ب"]);
    expect(conceptRoster(pool)).toEqual(conceptRoster([...pool].reverse()));
  });
});

describe("replaying the ledger into schedules", () => {
  test("an empty ledger still schedules every concept, and every one is due", () => {
    // The requirement the whole seeding step exists for. `dueConcepts` can only
    // return a concept that HAS a schedule, so without seeding a learner who has
    // never answered anything gets an empty queue and nothing to practise.
    const roster = conceptRoster(poolFor(["ب", "ت"]));
    const schedules = schedulesFromLedger([], roster, NOW);
    expect(schedules.size).toBe(roster.length);
    expect(dueConcepts(schedules, NOW)).toHaveLength(roster.length);
  });

  test("it folds the graded attempts exactly as reviewing them by hand does", () => {
    const history = [
      mk({ conceptId: "ikhfa", correct: false, at: NOW - 10 * DAY }),
      mk({ conceptId: "ikhfa", correct: true, at: NOW - 9 * DAY }),
      mk({ conceptId: "ikhfa", correct: true, at: NOW - 2 * DAY }),
    ];
    let byHand = newSchedule("ikhfa", NOW);
    for (const a of history) byHand = reviewConcept(byHand, gradeOf(a)!, a.at);

    expect(schedulesFromLedger(history, ["ikhfa"], NOW).get("ikhfa")).toEqual(byHand);
  });

  test("an ungraded attempt is skipped, never coerced to Again", () => {
    // `gradeOf` returns null for it. Folding that as `Again` would schedule a
    // concept sooner on the strength of a failure the learner never had.
    const graded = [
      mk({ conceptId: "ikhfa", correct: false, at: NOW - 5 * DAY }),
      mk({ conceptId: "ikhfa", correct: true, at: NOW - 3 * DAY }),
    ];
    const withNull = [
      graded[0],
      mk({ conceptId: "ikhfa", correct: null, at: NOW - 4 * DAY }),
      graded[1],
    ];
    expect(schedulesFromLedger(withNull, ["ikhfa"], NOW).get("ikhfa")).toEqual(
      schedulesFromLedger(graded, ["ikhfa"], NOW).get("ikhfa"),
    );

    const asAgain = reviewConcept(
      schedulesFromLedger([graded[0]], ["ikhfa"], NOW).get("ikhfa")!,
      Rating.Again,
      NOW - 4 * DAY,
    );
    expect(schedulesFromLedger(withNull, ["ikhfa"], NOW).get("ikhfa")).not.toEqual(asAgain);
  });

  test("a concept nobody has answered keeps the fresh schedule it was seeded with", () => {
    const schedules = schedulesFromLedger(
      [mk({ conceptId: "ikhfa", at: NOW - DAY })],
      ["ikhfa", "qalqalah"],
      NOW,
    );
    expect(schedules.get("qalqalah")).toEqual(newSchedule("qalqalah", NOW));
    expect(schedules.get("ikhfa")).not.toEqual(newSchedule("ikhfa", NOW));
  });

  test("a wrong answer leaves its concept due sooner than a right one", () => {
    const schedules = schedulesFromLedger(
      [
        mk({ conceptId: "ikhfa", correct: false, at: NOW - DAY }),
        mk({ conceptId: "qalqalah", correct: true, at: NOW - DAY }),
      ],
      ["ikhfa", "qalqalah"],
      NOW,
    );
    expect(schedules.get("ikhfa")!.due.getTime()).toBeLessThan(
      schedules.get("qalqalah")!.due.getTime(),
    );
  });

  test("attempts dated after `now` are not folded", () => {
    // Same rule as `derive`: the result is the state at that moment, so a replay
    // against an earlier `now` gives the schedule the learner had then.
    const future = [mk({ conceptId: "ikhfa", correct: false, at: NOW + DAY })];
    expect(schedulesFromLedger(future, ["ikhfa"], NOW).get("ikhfa")).toEqual(
      newSchedule("ikhfa", NOW),
    );
  });

  test("a concept the roster does not name is still scheduled from its attempts", () => {
    // A rule retired from the syllabus, or a letter the pool no longer carries.
    // The attempts happened; dropping them would lose real history.
    const schedules = schedulesFromLedger([mk({ conceptId: "retired" })], ["ikhfa"], NOW);
    expect(schedules.has("retired")).toBe(true);
  });

  test("attempts written in the same millisecond fold in a stable order", () => {
    // `allAttempts()` reads through the `at` index and the primary key is a
    // random UUID, so without a tiebreak the same ledger schedules differently
    // on consecutive page loads.
    const rows = [
      mk({ id: "b", conceptId: "ikhfa", correct: false, at: NOW - DAY }),
      mk({ id: "a", conceptId: "ikhfa", correct: true, at: NOW - DAY }),
    ];
    expect(schedulesFromLedger(rows, ["ikhfa"], NOW)).toEqual(
      schedulesFromLedger([...rows].reverse(), ["ikhfa"], NOW),
    );
  });

  test("it reads no clock and needs no IndexedDB", () => {
    expect(typeof globalThis.indexedDB).toBe("undefined");
    const boom = () => {
      throw new Error("session.ts read a clock");
    };
    const dateNow = vi.spyOn(Date, "now").mockImplementation(boom);
    try {
      expect(schedulesFromLedger([mk()], ["ikhfa"], NOW).size).toBe(1);
    } finally {
      dateNow.mockRestore();
    }
  });

  test("it does not touch the ledger it was handed", () => {
    const rows = [mk({ at: NOW - 2 * DAY }), mk({ at: NOW - 3 * DAY })];
    const snapshot = rows.map((r) => ({ ...r }));
    schedulesFromLedger(rows, ["ikhfa"], NOW);
    expect(rows).toEqual(snapshot);
  });
});

describe("planning a session", () => {
  /** Four concepts with a full spread of drills — a learner with nothing missing. */
  const CONCEPTS = ["idghaam_ghunnah", "ikhfa", "madd_2", "qalqalah"];
  const POOL = poolFor(CONCEPTS);

  /** Every concept due, most overdue first, so the focus is not a coin toss. */
  const OVERDUE = scheduleMap([
    at("idghaam_ghunnah", NOW - 9 * DAY),
    at("ikhfa", NOW - 5 * DAY),
    at("madd_2", NOW - 3 * DAY),
    at("qalqalah", NOW - DAY),
  ]);

  const plan = planSession(OVERDUE, new Map(), POOL, NOW);

  test("budgets in slots, so at most two timed drills appear", () => {
    // A ḥarakāt hold takes far longer than a multiple choice, so a session
    // budgeted in items would be wildly uneven.
    expect(plan.items.filter((i) => TIMED_GAME_IDS.has(i.gameId)).length).toBeLessThanOrEqual(2);
    expect(cost(plan.items)).toBeLessThanOrEqual(SESSION_SLOTS);
    expect(plan.slots).toBe(cost(plan.items));
    // The literal, once. Everything else here is written against the constant,
    // so widening the constant would widen every assertion with it and a session
    // that had quietly become twice as long would still pass.
    expect(SESSION_SLOTS).toBe(14);
    expect(plan.slots).toBeLessThanOrEqual(14);
  });

  test("a review is skipped rather than charged two slots", () => {
    // An interleaved item is a probe, not the thing being practised. The only
    // drill that costs two slots is a held one, and spending a fifth of the
    // session checking whether another concept survived is not a probe.
    const timedOnly = [
      ...poolFor(["ikhfa"], ["condition-builder", "rule-identifier"], 3),
      ...poolFor(["qalqalah"], ["ghunnah-timer"], 3),
    ];
    const planned = planSession(
      scheduleMap([at("ikhfa", NOW - 5 * DAY), at("qalqalah", NOW - DAY)]),
      new Map(),
      timedOnly,
      NOW,
    );
    expect(planned.items.filter((i) => i.isInterleaved)).toHaveLength(0);
    expect(planned.items.every((i) => i.conceptId === "ikhfa")).toBe(true);
  });

  test("a timed drill costs two slots and everything else costs one", () => {
    for (const item of plan.items) {
      expect(item.slots).toBe(TIMED_GAME_IDS.has(item.gameId) ? 2 : 1);
      expect(item.slots).toBe(shapeOf(item.gameId).slots);
    }
  });

  test("the focus is the most overdue concept, and most of the session is it", () => {
    expect(plan.focusConceptId).toBe("idghaam_ghunnah");
    const focus = plan.items.filter((i) => i.conceptId === plan.focusConceptId);
    expect(cost(focus) / plan.slots).toBeGreaterThanOrEqual(0.6);
  });

  test("two or three other due concepts are interleaved, and they are marked", () => {
    const interleaved = plan.items.filter((i) => i.isInterleaved);
    expect(interleaved.length).toBeGreaterThanOrEqual(2);
    expect(interleaved.length).toBeLessThanOrEqual(3);
    // Review items double as the retention instrument, so Task 6 has to be able
    // to log which ones they were.
    for (const i of interleaved) expect(i.conceptId).not.toBe(plan.focusConceptId);
    expect(new Set(interleaved.map((i) => i.conceptId)).size).toBe(interleaved.length);
    for (const i of plan.items.filter((i) => !i.isInterleaved)) {
      expect(i.conceptId).toBe(plan.focusConceptId);
    }
  });

  test("interleaved items never sit in the first two or last two slots", () => {
    // Duolingo's documented Review Exercise placement rule, not an invention.
    const idx = plan.items.flatMap((it, i) => (it.isInterleaved ? [i] : []));
    expect(idx.length).toBeGreaterThan(0);
    for (const i of idx) {
      expect(i).toBeGreaterThanOrEqual(2);
      expect(i).toBeLessThan(plan.items.length - 2);
    }
  });

  test("the reviews are spread through the body, not run together", () => {
    // Three reviews back to back read as a detour out of the session rather than
    // as interleaving. Adjacent placement is still allowed where the body is too
    // narrow to offer a gap — a review placed late beats a review dropped.
    const idx = plan.items.flatMap((it, i) => (it.isInterleaved ? [i] : []));
    for (let i = 1; i < idx.length; i += 1) expect(idx[i] - idx[i - 1]).toBeGreaterThan(1);
  });

  test("never more than two consecutive items of the same drill shape", () => {
    for (let i = 2; i < plan.items.length; i += 1) {
      const run = plan.items.slice(i - 2, i + 1).map((it) => it.gameId);
      expect(new Set(run).size).toBeGreaterThan(1);
    }
  });

  test("the response mode ramps: recognition before production", () => {
    // The ramp is by response mode, not by content: recognition (multiple
    // choice, listen-identify) → discrimination (family sort, span tap) →
    // production and timing (condition builder, the held drills).
    const ranks = plan.items.map((i) => RANK[i.mode]);
    for (let i = 1; i < ranks.length; i += 1) expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
    expect(ranks[0]).toBe(RANK.recognition);
  });

  test("one deliberately harder item goes last", () => {
    const last = plan.items.at(-1)!;
    expect(last.isInterleaved).toBe(false);
    expect(last.conceptId).toBe(plan.focusConceptId);
    for (const i of plan.items) expect(RANK[last.mode]).toBeGreaterThanOrEqual(RANK[i.mode]);
    expect(last.mode).toBe("production");
  });

  test("no exemplar is shown twice in one session", () => {
    expect(new Set(plan.items.map((i) => i.itemKey)).size).toBe(plan.items.length);
    for (const item of plan.items) {
      expect(POOL.some((p) => p.itemKey === item.itemKey && p.conceptId === item.conceptId)).toBe(
        true,
      );
    }
  });

  test("a learner with a completely empty ledger still gets a full session", () => {
    // The case most likely to be missed: nothing is in the ledger, so nothing
    // has a schedule unless every concept was seeded first.
    const roster = conceptRoster(POOL);
    const schedules = schedulesFromLedger([], roster, NOW);
    const fresh = planSession(schedules, derive([], NOW), POOL, NOW);

    expect(fresh.focusConceptId).toBe("idghaam_ghunnah"); // first by id; all seeded due at `now`
    expect(fresh.slots).toBe(SESSION_SLOTS);
    expect(fresh.items.length).toBeGreaterThanOrEqual(10);
    expect(fresh.items.filter((i) => i.isInterleaved).length).toBeGreaterThanOrEqual(2);
  });

  test("the same inputs give the same plan, every time", () => {
    // The plan is not stored — it is rebuilt from the ledger on every load, so a
    // page refresh must not reshuffle the session the learner is halfway through.
    expect(planSession(OVERDUE, new Map(), POOL, NOW)).toEqual(
      planSession(OVERDUE, new Map(), [...POOL].reverse(), NOW),
    );
  });

  test("a seed chooses different exemplars, and the same seed the same ones", () => {
    const a = planSession(OVERDUE, new Map(), POOL, NOW, { seed: 7 });
    const b = planSession(OVERDUE, new Map(), POOL, NOW, { seed: 7 });
    const c = planSession(OVERDUE, new Map(), POOL, NOW, { seed: 8 });
    expect(a).toEqual(b);
    expect(a.items.map((i) => i.itemKey)).not.toEqual(c.items.map((i) => i.itemKey));
    // A seed may move which exemplar is drawn; it may not move the shape of the
    // session, or the plan would stop being a plan.
    expect(a.items.map((i) => i.gameId)).toEqual(c.items.map((i) => i.gameId));
  });

  test("weakness breaks a tie between concepts due at the same moment", () => {
    // Which is where `derive`'s state earns its place here: on day one every
    // concept is due at the same millisecond, and the id is a poor reason to
    // pick one.
    const tied = scheduleMap([at("ikhfa", NOW), at("qalqalah", NOW)]);
    const weak = derive(
      [
        mk({ conceptId: "qalqalah", correct: false }),
        mk({ conceptId: "qalqalah", correct: false }),
        mk({ conceptId: "qalqalah", correct: false }),
      ],
      NOW,
    );
    expect(planSession(tied, new Map(), POOL, NOW).focusConceptId).toBe("ikhfa"); // by id
    expect(planSession(tied, weak, POOL, NOW).focusConceptId).toBe("qalqalah"); // by weakness
  });

  test("a concept with no exemplars is never planned", () => {
    // It would be a due concept the learner cannot be shown anything for.
    const schedules = scheduleMap([at("hamzat_wasl", NOW - 30 * DAY), at("ikhfa", NOW - DAY)]);
    const planned = planSession(schedules, new Map(), poolFor(["ikhfa"]), NOW);
    expect(planned.focusConceptId).toBe("ikhfa");
    expect(planned.items.every((i) => i.conceptId === "ikhfa")).toBe(true);
  });

  test("nothing due, or nothing to draw, is an empty plan rather than a broken one", () => {
    expect(planSession(new Map(), new Map(), POOL, NOW).items).toEqual([]);
    expect(planSession(OVERDUE, new Map(), [], NOW)).toEqual({
      focusConceptId: null,
      items: [],
      slots: 0,
    });
    expect(planSession(scheduleMap([at("ikhfa", NOW + DAY)]), new Map(), POOL, NOW).items).toEqual(
      [],
    );
  });

  test("a concept with one drill per mode is cut short rather than repeated", () => {
    // The run rule with nothing to hide behind: five exemplars of one drill and
    // a single item at the mode above it. Two of the five may be shown; the rest
    // are dropped, and the session is short instead of being the same question
    // five times.
    const lopsided = [
      ...poolFor(["ikhfa"], ["rule-identifier"], 5),
      ...poolFor(["ikhfa"], ["family-sorter"], 1),
    ];
    const planned = planSession(scheduleMap([at("ikhfa", NOW - DAY)]), new Map(), lopsided, NOW);
    expect(planned.items.filter((i) => i.gameId === "rule-identifier")).toHaveLength(2);
    expect(planned.items.map((i) => i.gameId)).toEqual([
      "rule-identifier",
      "rule-identifier",
      "family-sorter",
    ]);
  });

  test("even the closing item cannot make a run of three", () => {
    // It is pinned last rather than arranged, so it is the one item that can
    // land beside a pair of its own shape after everything else is in place.
    const oneDrill = poolFor(["ikhfa"], ["rule-identifier"], 5);
    const planned = planSession(scheduleMap([at("ikhfa", NOW - DAY)]), new Map(), oneDrill, NOW);
    expect(planned.items.length).toBeGreaterThan(0);
    for (let i = 2; i < planned.items.length; i += 1) {
      expect(new Set(planned.items.slice(i - 2, i + 1).map((it) => it.gameId)).size).toBeGreaterThan(
        1,
      );
    }
  });

  test("a thin pool degrades to a shorter session, not a broken one", () => {
    // One concept, one drill, two exemplars: the run rule and the ramp still
    // hold, and the session is simply short.
    const thin = poolFor(["ikhfa"], ["rule-identifier"], 2);
    const planned = planSession(scheduleMap([at("ikhfa", NOW - DAY)]), new Map(), thin, NOW);
    expect(planned.items.length).toBeGreaterThan(0);
    expect(planned.items.length).toBeLessThanOrEqual(2);
    expect(cost(planned.items)).toBeLessThanOrEqual(SESSION_SLOTS);
    for (let i = 2; i < planned.items.length; i += 1) {
      expect(new Set(planned.items.slice(i - 2, i + 1).map((it) => it.gameId)).size).toBeGreaterThan(
        1,
      );
    }
  });

  test("it reads no clock, needs no IndexedDB, and touches neither input", () => {
    const boom = () => {
      throw new Error("session.ts read a clock");
    };
    const dateNow = vi.spyOn(Date, "now").mockImplementation(boom);
    const random = vi.spyOn(Math, "random").mockImplementation(boom);
    try {
      const pool = [...POOL];
      const schedules = scheduleMap([at("ikhfa", NOW - DAY)]);
      expect(planSession(schedules, new Map(), pool, NOW).items.length).toBeGreaterThan(0);
      expect(pool).toEqual(POOL);
      expect(schedules.get("ikhfa")!.due.getTime()).toBe(NOW - DAY);
    } finally {
      dateNow.mockRestore();
      random.mockRestore();
    }
  });
});

describe("the flag loop", () => {
  /**
   * A concept missed in the last session and never repaired is what `useSession`
   * calls **flagged**, and until now it was minted at the end of a sitting and
   * dropped there. It is read back out of the ledger instead, so the next
   * session's review slots see it — including after a page reload, which a value
   * held in a hook does not survive.
   *
   * Every scenario below turns on one thing only: the two review candidates are
   * due at the same moment and are both weak, so the existing ordering cannot
   * separate them and the flag is the only thing that can.
   */
  const FOCUS = "idghaam_ghunnah";
  const POOL = poolFor([FOCUS, "ikhfa", "madd_2"]);

  const history = (conceptId: string, verdicts: readonly boolean[], sessionId: string) =>
    verdicts.map((correct) => mk({ conceptId, correct, sessionId }));

  /** `ikhfa` ends its session clean; `madd_2` ends on a miss nobody repaired. */
  const LEDGER = [
    ...history("ikhfa", [false, false, false, true], "s1"),
    ...history("madd_2", [false, false, false, false], "s1"),
  ];
  const STATES = derive(LEDGER, NOW);

  const SCHEDULES = scheduleMap([
    at(FOCUS, NOW - 9 * DAY),
    at("ikhfa", NOW - 5 * DAY),
    at("madd_2", NOW - 5 * DAY),
  ]);

  const plan = planSession(SCHEDULES, STATES, POOL, NOW);
  const reviewedIn = (p: typeof plan) =>
    p.items.filter((i) => i.isInterleaved).map((i) => i.conceptId);

  test("the two candidates differ by the flag and by nothing else", () => {
    // The premise. Without it the test below would pass on the ordering that
    // already existed, and prove nothing about the flag.
    expect(SCHEDULES.get("ikhfa")!.due.getTime()).toBe(SCHEDULES.get("madd_2")!.due.getTime());
    expect(isWeak(STATES.get("ikhfa")!)).toBe(true);
    expect(isWeak(STATES.get("madd_2")!)).toBe(true);
    expect(STATES.get("ikhfa")!.flagged).toBe(false);
    expect(STATES.get("madd_2")!.flagged).toBe(true);
    // …and the id tiebreak that decides it today points the other way.
    expect("ikhfa" < "madd_2").toBe(true);
  });

  test("a concept flagged last session leads the interleaved slots", () => {
    expect(reviewedIn(plan)).toEqual(["madd_2", "ikhfa"]);
  });

  test("a flag raises interleave priority — it does not hijack the session", () => {
    // The focus is still the most overdue concept, and the backbone is still
    // entirely it. A flag is a reason to review something, never a reason to
    // spend a whole sitting on it.
    expect(plan.focusConceptId).toBe(FOCUS);
    expect(plan.items.filter((i) => !i.isInterleaved).every((i) => i.conceptId === FOCUS)).toBe(
      true,
    );
  });

  test("even the least overdue concept in the queue cannot take the focus by being flagged", () => {
    const lastInLine = scheduleMap([
      at(FOCUS, NOW - 9 * DAY),
      at("ikhfa", NOW - 5 * DAY),
      at("madd_2", NOW - 2 * DAY),
    ]);
    const planned = planSession(lastInLine, STATES, POOL, NOW);
    expect(planned.focusConceptId).toBe(FOCUS);
    // It still leads the review, ahead of a concept overdue by three more days.
    expect(reviewedIn(planned)).toEqual(["madd_2", "ikhfa"]);
  });

  test("a tie for most overdue is broken by weakness, never by the flag", () => {
    // The boundary `orderDue` must not learn about, and the only case where it
    // could bite: two concepts due at the same millisecond — which is every
    // concept on day one, since they are all seeded together. Both are weak, so
    // the id decides, exactly as it did before there were flags. A flag that
    // reached the focus would let one bad answer at the end of yesterday's
    // session pick today's whole sitting.
    const tied = scheduleMap([at("ikhfa", NOW), at("madd_2", NOW)]);
    expect(STATES.get("madd_2")!.flagged).toBe(true);
    expect(planSession(tied, STATES, POOL, NOW).focusConceptId).toBe("ikhfa");
  });

  test("the review queue is flagged, then answered before, then never seen", () => {
    // Where the flag sits in the whole ordering, in one assertion. The
    // seen-before-unseen preference underneath it is not a detail: interleaving
    // a concept the learner has never met is a first encounter dropped into the
    // middle of someone else's session, not a review.
    const queue = scheduleMap([
      at(FOCUS, NOW - 9 * DAY),
      at("ikhfa", NOW - 5 * DAY), // answered before, ended clean
      at("madd_2", NOW - 5 * DAY), // answered before, ended on a miss
      at("qalqalah", NOW - 5 * DAY), // never answered at all
    ]);
    const planned = planSession(
      queue,
      STATES,
      poolFor([FOCUS, "ikhfa", "madd_2", "qalqalah"]),
      NOW,
    );
    expect(reviewedIn(planned)).toEqual(["madd_2", "ikhfa", "qalqalah"]);
  });

  test("a flagged concept answered correctly stops being prioritised", () => {
    // How the flag is spent: acted on, answered, gone. It is not cleared by a
    // timer or by having been shown — only by a clean answer.
    const repaired = derive(
      [...LEDGER, mk({ conceptId: "madd_2", correct: true, sessionId: "s2" })],
      NOW,
    );
    expect(repaired.get("madd_2")!.flagged).toBe(false);
    expect(isWeak(repaired.get("madd_2")!)).toBe(true); // still weak, just no longer flagged
    expect(reviewedIn(planSession(SCHEDULES, repaired, POOL, NOW))).toEqual(["ikhfa", "madd_2"]);
  });

  test("a flag does not make a concept due", () => {
    // It reorders the review candidates. It is not a second scheduler, and a
    // concept FSRS has not called back yet stays out of the session.
    const notYet = scheduleMap([
      at(FOCUS, NOW - 9 * DAY),
      at("ikhfa", NOW - 5 * DAY),
      at("madd_2", NOW + DAY),
    ]);
    const planned = planSession(notYet, STATES, POOL, NOW);
    expect(planned.items.some((i) => i.conceptId === "madd_2")).toBe(false);
    expect(reviewedIn(planned)).toEqual(["ikhfa"]);
  });

  test("the same inputs give the same plan, flags and all", () => {
    const boom = () => {
      throw new Error("session.ts read a clock");
    };
    const dateNow = vi.spyOn(Date, "now").mockImplementation(boom);
    const random = vi.spyOn(Math, "random").mockImplementation(boom);
    try {
      expect(planSession(SCHEDULES, STATES, POOL, NOW)).toEqual(
        planSession(SCHEDULES, STATES, [...POOL].reverse(), NOW),
      );
    } finally {
      dateNow.mockRestore();
      random.mockRestore();
    }
  });
});

describe("planning a session for a letter", () => {
  /**
   * **29 of the 47 concepts are letters**, and until the letter drills carried
   * an id `shapeOf` fell to its default for every one of them: 62% of the roster
   * planned as a flat session of recognition items with no ramp at all.
   *
   * The ramp is the point. It is one of the few structural ideas in this design
   * with causal evidence behind it, so a plan that cannot express it for the
   * majority of the syllabus is not a plan.
   */
  const LETTERS = ["ب", "ت"];
  const planned = planSession(
    scheduleMap([at("ب", NOW - 2 * DAY), at("ت", NOW - DAY)]),
    new Map(),
    poolFor(LETTERS, LETTER_GAME_IDS),
    NOW,
  );

  test("a letter's plan is not all recognition", () => {
    expect(planned.items.length).toBeGreaterThan(0);
    expect(planned.items.some((i) => i.mode !== "recognition")).toBe(true);
  });

  test("it uses the whole ramp, and closes at the top of it", () => {
    expect(new Set(planned.items.map((i) => i.mode))).toEqual(
      new Set<ResponseMode>(["recognition", "discrimination", "production"]),
    );
    expect(planned.items.at(-1)!.mode).toBe("production");
    const ranks = planned.items.map((i) => RANK[i.mode]);
    for (let i = 1; i < ranks.length; i += 1) expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
  });

  test("no letter drill is charged two slots", () => {
    // A held duration is what earns the second slot, and none of these holds
    // anything. Charging one would cost the learner a slot they never spend.
    for (const item of planned.items) expect(item.slots).toBe(1);
    for (const gameId of LETTER_GAME_IDS) expect(TIMED_GAME_IDS.has(gameId)).toBe(false);
  });
});

describe("drill shapes", () => {
  test("every registered tajweed drill has a response mode and a slot cost", () => {
    for (const gameId of GAME_IDS) {
      const shape = shapeOf(gameId);
      expect(RANK[shape.mode]).toBeGreaterThanOrEqual(0);
      expect(shape.slots).toBeGreaterThanOrEqual(1);
    }
  });

  test("only the held drill costs two slots", () => {
    expect(shapeOf("ghunnah-timer")).toEqual({ mode: "production", slots: 2 });
    // `MaddCounter` is not duration-graded — its `held` is a prop and nothing is
    // timed — so it costs one slot however much it looks like its neighbour.
    expect(shapeOf("madd-counter").slots).toBe(1);
    expect([...TIMED_GAME_IDS]).toEqual(["ghunnah-timer"]);
  });

  test("the ramp is by response mode, not by drill family", () => {
    expect(shapeOf("rule-identifier").mode).toBe("recognition");
    expect(shapeOf("listen-identify").mode).toBe("recognition");
    expect(shapeOf("span-tapper").mode).toBe("discrimination");
    expect(shapeOf("family-sorter").mode).toBe("discrimination");
    expect(shapeOf("condition-builder").mode).toBe("production");
  });

  test("the six letter drills have a shape of their own, not the default", () => {
    // Two of these read as recognition, which is also what an *unregistered*
    // drill falls to — so the assertions that can actually fail before the
    // drills are classified are the last three.
    expect(shapeOf("letter-flashcards").mode).toBe("recognition");
    expect(shapeOf("word-flashcards").mode).toBe("recognition");
    expect(shapeOf("letter-quiz").mode).toBe("recognition");
    expect(shapeOf("spot-the-letter").mode).toBe("discrimination");
    expect(shapeOf("form-swap").mode).toBe("discrimination");
    expect(shapeOf("word-builder").mode).toBe("production");
  });
});
