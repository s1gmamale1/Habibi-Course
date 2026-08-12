import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from "ts-fsrs";

import type { RuleId } from "@/content/tajweed";
import { missRatio, wrongSignal, TOLERANCE } from "./derive";
import type { Attempt } from "./types";

/**
 * When each concept comes back. A thin wrapper over FSRS, and deliberately thin.
 *
 * FSRS is used with its **published default parameters**, which is the entire
 * reason it was chosen: benchmarked across 9,999 Anki collections, *untrained*
 * FSRS beats *trained* half-life regression on every metric. We start with zero
 * data, which is exactly where that gap is widest — so the fitted defaults are
 * the value, and hand-tuning `w` would be throwing away the thing we came for.
 * The one knob is **desired retention** (0.9), and it is a knob because it
 * encodes a preference rather than a fact about memory.
 *
 * Scheduling is keyed on **concepts, not items** (ADR-008). At 14 slots a
 * session it takes 118 sessions to show all 1,641 items once, so a per-item
 * card would be reviewed about every four months and never accumulate the
 * repeated reviews FSRS builds stability from. The learning object is the rule;
 * the exemplar is drawn fresh each review.
 *
 * **Pure**, like `derive.ts` and for the same reason: `now` is an argument,
 * there is no clock, no IO, and no import from `ledger.ts`. This has to run
 * unchanged on a server when ADR-007 lands.
 */

/** The published default, and the only parameter anyone here may move. */
const DEFAULT_RETENTION = 0.9;

/** FSRS keeps difficulty inside this range; a prior may not push it out. */
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;

/**
 * Where a hold has to land to earn each rating, as a fraction of the target.
 *
 * The middle boundary is `TOLERANCE` — the drill's *own* pass line — and that
 * is what makes the grade and the verdict agree by construction: everything
 * `GhunnahTimer` called correct grades Easy or Good, everything it called wrong
 * grades Hard or Again. A scheduler that told the learner "you knew that" about
 * an answer the screen had just marked wrong would be teaching two things at
 * once.
 *
 * `EASY` is a tenth of the target: closer than a learner-calibrated ḥarakah can
 * meaningfully resolve, so it is exact for practical purposes. `HARD` is twice
 * the tolerance — failed, but recognisably aimed at the right length. A 1.2-of-2
 * is a short two; a 0.6-of-2 is not a two at all.
 */
const EASY_WITHIN = 0.1;
const GOOD_WITHIN = TOLERANCE;
const HARD_WITHIN = 2 * TOLERANCE;

/**
 * How stiff a rule starts, before the learner has answered it once.
 *
 * A **prior, not a learned model**: a fixed offset on FSRS's own initial
 * difficulty, applied once at a concept's first review and never again. Nothing
 * here fits parameters from data, and nothing updates these numbers.
 *
 * They are bounded at ±1.5 on a 1-10 scale so the prior can nudge the first few
 * intervals and never dominate the algorithm. The reasoning is pedagogical:
 *
 * - The two "merging" rules that are not about a named letter set at all —
 *   mutajānisayn and mutaqāribayn — need the makhārij to spot, are taught last,
 *   and are the only rules the colour palette gives no distinct colour to.
 * - Munfaṣil and muttaṣil are the classic confusion pair: the same 4 ḥarakāt,
 *   separated only by whether the hamza sits in the same word.
 * - Madd ʿāriḍ genuinely admits 2, 4 *or* 6, so there is no single length to
 *   anchor on.
 * - Ikhfāʾ carries the largest letter set in the system — fifteen to recognise.
 * - Qalqalah is five letters and audibly distinctive; madd ṭabīʿī is the default
 *   case, met in nearly every āyah; ghunnah is a single audible feature.
 *
 * A concept with no entry gets no adjustment. That covers the 29 letters, which
 * are concepts too — absence has to mean zero, not a default nudge.
 */
const DIFFICULTY_PRIOR: Partial<Record<RuleId, number>> = {
  idghaam_mutajanisayn: 1.5,
  idghaam_mutaqaribayn: 1.5,
  madd_246: 1.0,
  madd_munfasil: 1.0,
  madd_muttasil: 1.0,
  ikhfa: 0.5,
  ikhfa_shafawi: 0.5,
  ghunnah: -0.5,
  qalqalah: -1.0,
  madd_2: -1.0,
};

/**
 * One concept's place in the queue: an FSRS card, plus which concept it is.
 *
 * Not persisted. Like everything else outside the ledger it is rebuilt by
 * replaying attempts, so a change to the grading or the prior takes effect on
 * the whole history rather than only on what happens next.
 */
export type ConceptSchedule = Card & { conceptId: string };

export type ReviewOptions = {
  /**
   * The probability of recall we are willing to schedule for. Higher means
   * shorter intervals and more reviews. **This is the only tunable** — see the
   * module comment.
   */
  desiredRetention?: number;
};

export type { Grade } from "ts-fsrs";

/** A concept nobody has answered yet: due immediately, because it has never been shown. */
export function newSchedule(conceptId: string, now: number): ConceptSchedule {
  return { ...createEmptyCard(now), conceptId };
}

/**
 * What rating one attempt deserves — or `null` when it deserves none.
 *
 * `null` is a real answer and callers must handle it. An ungraded attempt has
 * no grade; coercing it to `Again` would turn "not graded" into "failed", which
 * is a claim of failure by a drill that never graded, and `derive()` already
 * refuses to make it.
 *
 * Both of the "is this evidence at all" guards are inherited rather than
 * restated: `wrongSignal` is asked first, and it is the single place that knows
 * an ungraded row carries nothing and that a hold recorded against a
 * calibration of zero was never a measurement. Recomputing the ratio here
 * instead would have reopened that second hole in the scheduler — a fabricated
 * `{ measuredHarakat: 0, targetHarakat: 2, msPerHarakah: 0 }` scores as a full
 * miss, a failure the learner never had.
 */
export function gradeOf(a: Attempt): Grade | null {
  if (wrongSignal(a) === null) return null;

  const miss = missRatio(a);

  // No single target: the rule accepts several lengths, so there is no distance
  // to band and the drill's own verdict is the whole of the grade. Reading
  // `acceptedHarakat[0]` as a target instead would score a correct 6-of-[2,4,6]
  // as a full miss — teaching the falsehood the drill exists to refute.
  if (miss === null) return a.correct ? Rating.Good : Rating.Again;

  const graded =
    miss <= EASY_WITHIN
      ? Rating.Easy
      : miss <= GOOD_WITHIN
        ? Rating.Good
        : miss <= HARD_WITHIN
          ? Rating.Hard
          : Rating.Again;

  // The distance refines *how* wrong an answer was; it never overturns the
  // drill's own "wrong" into "recalled fine". For a held duration this is a
  // no-op — the verdict line and the Good/Hard line are the same 25%. It bites
  // on a selection drill with a single accepted length, where a 5-for-6 is
  // genuinely closer than a 2-for-6 but is still not an answer that worked.
  return a.correct === false && graded > Rating.Hard ? Rating.Hard : graded;
}

const clampDifficulty = (d: number) => Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, d));

/**
 * Fold one graded answer into a concept's schedule, as of `now`.
 *
 * The input is not modified — the caller's schedule is theirs, and replaying a
 * ledger means calling this repeatedly over the same starting state.
 */
export function reviewConcept(
  schedule: ConceptSchedule,
  grade: Grade,
  now: number,
  opts: ReviewOptions = {},
): ConceptSchedule {
  const { conceptId, ...card } = schedule;
  const scheduler = fsrs({ request_retention: opts.desiredRetention ?? DEFAULT_RETENTION });
  const next = scheduler.next(card, now, grade).card;

  // Only on the way out of `New`. FSRS assigns a concept's initial difficulty
  // from the first grade alone, so this is the one moment a prior has anything
  // to say; re-applying it every review would compound a fixed guess into a
  // hand-tuned model. It does not move the *first* interval — that is a function
  // of the grade only — but it moves every interval after it.
  const prior = card.state === State.New ? (DIFFICULTY_PRIOR[conceptId as RuleId] ?? 0) : 0;

  return {
    ...next,
    conceptId,
    difficulty: prior === 0 ? next.difficulty : clampDifficulty(next.difficulty + prior),
  };
}

/**
 * Which concepts are ready for review at `now`, most overdue first.
 *
 * A concept due exactly `now` is due: a schedule created by `newSchedule` is due
 * the moment it exists, and a strict comparison would hide every concept the
 * learner has never met.
 *
 * The `conceptId` tiebreak is not cosmetic. A first session schedules dozens of
 * concepts at the same millisecond, and without it the session a learner is
 * offered would depend on map insertion order — different on a reload, for no
 * reason they could ever see.
 */
export function dueConcepts(
  schedules: ReadonlyMap<string, ConceptSchedule> | readonly ConceptSchedule[],
  now: number,
): string[] {
  return [...schedules.values()]
    .filter((s) => s.due.getTime() <= now)
    .sort(
      (x, y) =>
        x.due.getTime() - y.due.getTime() ||
        (x.conceptId < y.conceptId ? -1 : x.conceptId > y.conceptId ? 1 : 0),
    )
    .map((s) => s.conceptId);
}
