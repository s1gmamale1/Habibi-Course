import type { Attempt } from "./types";

/**
 * The whole of the learner's practice state, folded out of the attempt ledger.
 *
 * Nothing here is stored. `derive(allAttempts(), now)` rebuilds every number in
 * this file from scratch, which is what makes the ledger the only thing that has
 * to be right: a bug in this module is fixed by editing it, not by migrating a
 * corrupted table of counters that drifted from the log years ago.
 *
 * It is **pure** — no store, no clock, no mutation of its input — and that is a
 * requirement rather than a preference. This is the module that has to run
 * unchanged on a server when ADR-007 lands, so `now` is an argument.
 */

/** How much of the old EWMA survives one attempt, and how much the new one contributes. */
const KEEP = 0.7;
const NEW = 0.3;

/**
 * Where a concept starts before any evidence.
 *
 * Not `0`. The EWMA counts *wrongness*, so a zero would mean "no misses on
 * record" — indistinguishable from a perfect history, and a fresh concept would
 * sit above the first band threshold before it had ever been answered. Two wrong
 * answers would still leave it there. The midpoint says what is true instead:
 * nothing is known yet.
 */
const NEUTRAL = 50;

/** Below this the EWMA no longer carries enough misses to call a concept weak. */
const RESOLVED = 20;

/** Clean repetitions that retire a weakness. See `isResolved`. */
const CLEAN_RUN = 3;

/**
 * A signal has to be under this to count as clean. Not `=== 0`: a measured hold
 * lands on an irrational-looking ratio essentially always, and a 1.99-of-2 hold
 * is clean by any reading that matters.
 */
const CLEAN_EPS = 0.05;

/**
 * The fraction of the target a hold may be out by before it is fully wrong.
 *
 * Exported because `schedule.ts` hangs its Good/Hard boundary on this exact
 * number: the drill calls a hold correct within `TOLERANCE`, so putting the
 * grade boundary anywhere else would let the scheduler contradict the verdict
 * the learner was just shown. Two copies of 0.25 would drift apart the first
 * time either was retuned.
 */
export const TOLERANCE = 0.25;

/**
 * Consecutive attempts below the current band's floor before it drops.
 *
 * Deliberately smaller than any promotion run. Earning a band takes repeated
 * evidence; losing one takes repeated evidence too, but less of it — while
 * still being more than one, so a single bad session never takes back a rule
 * the learner has shown they know.
 */
const DEMOTE_RUN = 2;

/**
 * How much review a concept needs — a **diagnosis, not a grade**.
 *
 * These name the state of the *rule*, never the standing of the learner. There
 * is no gold, no rank and nothing to lose: performance-contingent rewards
 * measurably undermine intrinsic motivation, and informational feedback
 * measurably improves it. It is the same mechanic either way; the wording is
 * what decides the sign.
 */
export type Band = "needs-work" | "shaky" | "steady" | "secure";

const BANDS: readonly Band[] = ["needs-work", "shaky", "steady", "secure"];

/** The score a band requires to stay in it. Falling below is what `DEMOTE_RUN` counts. */
const FLOOR: readonly number[] = [0, 40, 70, 85];

/**
 * What it takes to enter the next band up: a score, held for that many
 * consecutive attempts. Indexed by the band being left, so the top band has no
 * entry. Each `score` is the floor of the band being entered, so promotion and
 * demotion meet at the same line and a concept cannot oscillate across it.
 */
const PROMOTE: readonly { score: number; runs: number }[] = [
  { score: 40, runs: 2 },
  { score: 70, runs: 3 },
  { score: 85, runs: 3 },
];

export type ConceptState = {
  conceptId: string;
  /** Graded attempts folded. Ungraded ones are not attempts at anything. */
  attempts: number;
  /** How many of those the drill itself called correct — the raw tally, for reporting. */
  correct: number;
  /** Exponentially weighted *wrongness*, 0-100. Higher is worse. */
  ewma: number;
  cleanStreak: number;
  band: Band;
  promoteStreak: number;
  demoteStreak: number;
  /** From the attempt, never from `now` — this is when the learner was last seen on it. */
  lastSeenAt: number;
};

/**
 * How far a length landed from its target, as a fraction of the target — or
 * `null` when there is no single target to measure against.
 *
 * `Math.abs` is what makes overshooting cost the same as undershooting: a 2.6
 * hold is exactly as wrong as a 1.4 one. Any quantity that improved with
 * duration would invert what the drill teaches.
 *
 * `null` here means only "nothing to measure" — the rule accepts several
 * lengths (madd ʿāriḍ lis-sukūn is transmitted at 2, 4 *or* 6), or the drill
 * measured nothing at all. It is **not** the "no evidence" `null` that
 * `wrongSignal` returns, and callers must not confuse the two: this one falls
 * back to the drill's verdict, that one has no verdict to fall back to.
 *
 * Unsaturated on purpose. `wrongSignal` clamps it to the tolerance because the
 * EWMA needs a bounded 0-1 signal, but `schedule.ts` bands the raw distance out
 * past that clamp — a hold 40% out and one 400% out are the same number once
 * saturated, and they are not the same answer.
 */
export function missRatio(a: Attempt): number | null {
  if (a.measuredHarakat == null || a.targetHarakat == null || !(a.targetHarakat > 0)) return null;
  return Math.abs(a.measuredHarakat - a.targetHarakat) / a.targetHarakat;
}

/**
 * How wrong one attempt was: `0` clean, `1` fully wrong, `null` no evidence.
 *
 * The continuous middle exists because a 1.8-of-2 hold is neither right nor
 * wrong, and collapsing it to a boolean throws away the only thing the timed
 * drills measure.
 *
 * The two guards below are the whole of the "is this evidence at all" question
 * for the practice engine, which is why they live in one function that
 * `schedule.ts` calls before it grades anything.
 */
export function wrongSignal(a: Attempt): number | null {
  if (a.correct === null) return null; // ungraded: no signal at all

  // A hold recorded against a calibration of zero was never scaled, so its
  // count is not a measurement and the verdict beside it was not a grading.
  // `scoreHold()` produces exactly this shape when the learner never calibrated
  // — a `{ counts: 0, correct: false }` that no drill actually observed. It is
  // unreachable from the UI today; if it ever lands in the ledger it is still
  // not evidence, and this is the only place that has to know.
  if (a.msPerHarakah != null && !(a.msPerHarakah > 0)) return null;

  // A single target, and something measured against it.
  const miss = missRatio(a);
  if (miss !== null) return Math.min(1, miss / TOLERANCE);

  // No single target, so there is no distance to measure and the drill's own
  // verdict is the whole of the signal.
  return a.correct ? 0 : 1;
}

/**
 * A concept is out of the weak list once it has been answered cleanly
 * `CLEAN_RUN` times running.
 *
 * The reference implementation cleared it on the first clean answer, and its
 * own notes record the result: a single lucky rep made an active weakness
 * disappear from the queue that existed to target it. One right answer to a
 * rule missed five times is a coin landing the right way up.
 */
export function isResolved(s: ConceptState): boolean {
  return s.cleanStreak >= CLEAN_RUN;
}

/** Still carrying misses, and not yet cleared by a clean run. */
export function isWeak(s: ConceptState): boolean {
  return s.ewma > RESOLVED && !isResolved(s);
}

function fresh(conceptId: string): ConceptState {
  return {
    conceptId,
    attempts: 0,
    correct: 0,
    ewma: NEUTRAL,
    cleanStreak: 0,
    band: "needs-work",
    promoteStreak: 0,
    demoteStreak: 0,
    lastSeenAt: 0,
  };
}

/**
 * Move the band at most one step, in whichever direction has enough consecutive
 * evidence.
 *
 * The two directions read the evidence differently, on purpose. Promotion
 * trusts the smoothed score alone: a run of attempts good enough to lift it is
 * the evidence. Demotion additionally requires the attempt in hand to have been
 * bad, because the EWMA lags — one miss leaves the score under the floor for
 * two or three attempts no matter how well the learner answers them, so a
 * purely score-based fall would demote on "one bad rep, then a clean one". That
 * is one bad session taking back a rule the learner has shown they know.
 */
function applyBands(s: ConceptState, clean: boolean): void {
  // The bands read as accuracy, the EWMA as wrongness. Same axis, opposite ends.
  const score = 100 - s.ewma;
  let i = BANDS.indexOf(s.band);

  const gate = PROMOTE[i];
  if (gate && score >= gate.score) {
    s.promoteStreak += 1;
    if (s.promoteStreak >= gate.runs) {
      i += 1;
      s.band = BANDS[i];
      s.promoteStreak = 0;
      s.demoteStreak = 0;
    }
  } else {
    s.promoteStreak = 0;
  }

  // Against the band it is in *now*, so a promotion just made cannot also read
  // as a fall. The gate score is the new floor, so the check passes by design.
  if (score < FLOOR[i] && !clean) {
    s.demoteStreak += 1;
    if (s.demoteStreak >= DEMOTE_RUN) {
      i -= 1;
      s.band = BANDS[i];
      s.demoteStreak = 0;
      s.promoteStreak = 0;
    }
  } else {
    s.demoteStreak = 0;
  }
}

/**
 * The ledger as of `now`, in the one order every fold over it must use.
 *
 * Copied before sorting: the caller's array is theirs, and `allAttempts()` hands
 * out the one it read from the store.
 *
 * The `id` tiebreak is load-bearing. `allAttempts()` reads through the `at`
 * index, but the primary key is a random UUID, so two rows written in the same
 * millisecond come back in an order that is arbitrary and not stable between
 * reads. Both folds over the ledger are order-dependent, so without this the
 * same ledger would derive different state on consecutive page loads.
 *
 * Exported because `session.ts` replays the same ledger into FSRS schedules and
 * has to see it in the same order and cut at the same `now`. Two copies of this
 * would be two chances to lose the tiebreak, and the second copy would be the
 * one nobody remembered to fix.
 */
export function orderedAttempts(attempts: readonly Attempt[], now: number): Attempt[] {
  return [...attempts]
    .filter((a) => a.at <= now)
    .sort((x, y) => x.at - y.at || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
}

/**
 * Fold every attempt into one state per concept, as of `now`.
 *
 * Attempts dated after `now` are not folded, which is what makes the second
 * argument mean something: the result is the state at that moment, and the same
 * ledger replayed against an earlier `now` gives the state the learner had then.
 *
 * A concept with no graded attempt gets no entry. An entry whose every field is
 * the default would assert that the concept has a state, and it has none.
 */
export function derive(attempts: readonly Attempt[], now: number): Map<string, ConceptState> {
  const ordered = orderedAttempts(attempts, now);

  const states = new Map<string, ConceptState>();

  for (const a of ordered) {
    const signal = wrongSignal(a);
    // Before any counter is touched, including `lastSeenAt`. An ungraded drill
    // must be indistinguishable from not having been shown: it may not break a
    // streak, move a band, or count as a miss.
    if (signal === null) continue;

    const s = states.get(a.conceptId) ?? fresh(a.conceptId);
    states.set(a.conceptId, s);

    const clean = signal < CLEAN_EPS;
    s.attempts += 1;
    if (a.correct === true) s.correct += 1;
    s.ewma = KEEP * s.ewma + NEW * (100 * signal);
    s.cleanStreak = clean ? s.cleanStreak + 1 : 0;
    s.lastSeenAt = a.at;

    applyBands(s, clean);
  }

  return states;
}
