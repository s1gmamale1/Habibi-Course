import { useCallback, useRef, useState } from "react";

import type { GameResult } from "@/components/games/GameRegistry";
import { attemptFromResult } from "./attempt";
import { appendAttempt } from "./ledger";
import { shapeOf, type PlannedItem, type PoolItem, type SessionPlan } from "./session";
import type { Attempt } from "./types";

/**
 * Runs one `SessionPlan`: hands out the next question, owns the wrong-answer
 * tail, and appends to the ledger.
 *
 * This is the first module in `src/practice/` that is *not* pure, and it is the
 * only one that may not be. `derive`, `schedule` and `session` take `now` as an
 * argument and touch no storage so they can run unchanged on a server (ADR-007);
 * this one mints ids, writes rows and holds React state, which is exactly the
 * work those three refuse to do. Everything it decides is still recomputable
 * from the rows it writes.
 *
 * ### The tail
 *
 * A missed concept is asked again before the session ends — retrieval,
 * corrective feedback, then a second retrieval a few minutes later, which is
 * about the best-supported micro-loop in the memory literature and costs a
 * queue. Duolingo's whitepaper describes the same mechanic: *"an exercise
 * targeting the same concept is resurfaced at the very end of the lesson."*
 *
 * **A different exemplar of the same concept, never the identical item.**
 * Replaying the question just answered is answered from memory of the
 * correction that was on screen thirty seconds ago; as a retrieval event it is
 * close to worthless. `planSession` already guarantees every planned `itemKey`
 * is unique within a session, so "not yet used" is the whole test.
 *
 * ### What bounds it
 *
 * The cap, and nothing else. **No hearts, no lives, no lockout** — those
 * terminate a session at the moment of highest instructional value, which is
 * why Duolingo abandoned them on learning grounds. At most `MAX_TAIL_ITEMS` in
 * the queue and `MAX_TAIL_ATTEMPTS_PER_CONCEPT` retries for any one concept;
 * past that the session simply ends and the concept is **flagged**, which turns
 * a failure into scheduling information for the next session instead of an
 * infinite loop.
 *
 * ### A slot is a question, not a tap
 *
 * The house rule for emission is **one result per graded move**: `LetterQuiz`
 * emits on every tap, `FamilySorter` on every drop, `RuleIdentifier` on every
 * pick. A hook that advanced on every result would therefore spend three of the
 * fourteen planned slots on one question answered wrong-wrong-right, and a
 * sitting could be over in five questions.
 *
 * Emitting less is not the fix — the scheduler wants every move, and first-try
 * only would discard exactly the misses it learns most from. So **recording and
 * advancing are separate**:
 *
 * - `record` writes a row for whatever is on screen, always.
 * - The **first graded** result decides the question: its verdict, its tail
 *   retry and its flag. Later results are still rows; they do not re-open any of
 *   that, and they do not move the session on.
 * - `advance` moves to the next question, and only a screen can decide when —
 *   the learner has to read the correction first.
 *
 * `submit` is the two composed, which is what every caller wanted before there
 * was a screen and what the hook's own tests still exercise.
 */

/** The whole tail, across every concept. Six is already a long coda to a 14-slot session. */
export const MAX_TAIL_ITEMS = 6;

/**
 * Retries for one concept. A third would be drilling a learner who has just
 * demonstrated twice that the explanation, not the practice, is what is
 * missing — and the flag says so to the next session's interleaved slots.
 */
export const MAX_TAIL_ATTEMPTS_PER_CONCEPT = 2;

export type SessionRunner = {
  /** The question on screen, or `null` once the plan and the tail are both spent. */
  current: PlannedItem | null;
  /** `total` counts the tail, so it grows on a miss. See `progress` below. */
  progress: { done: number; total: number };
  /** Queued retries not yet shown. While this is non-zero the session cannot end. */
  tailLength: number;
  isComplete: boolean;
  /**
   * Concepts that were missed and could not be retried — the tail was full, the
   * concept had used its retries, or the pool had nothing left to draw. Input
   * for the next session's interleaved slots, never a score.
   *
   * **Nothing has to carry this to the next session.** `derive()` recomputes it
   * from the rows this hook already wrote — a concept whose last graded attempt
   * was a miss — and `planSession` reads it off `ConceptState.flagged`. The two
   * agree on every sitting that runs to the end; the derived one additionally
   * catches one abandoned mid-tail, where this copy dies with the page. So this
   * is the *live* view, for a screen that wants to name what went unfinished
   * while the session is still up, and the derived one is what schedules.
   */
  flagged: readonly string[];
  /** Minted here, once. `planSession` is pure and deliberately mints nothing. */
  sessionId: string;
  /** Rows the ledger rejected. Surfaced rather than swallowed — see `submit`. */
  writeFailures: number;
  /**
   * What the question on screen has been answered with.
   *
   * `undefined` — nothing yet. `null` — answered, but the drill graded nothing,
   * so there is no verdict to report and the question can still be decided.
   * `true`/`false` — decided, by the first graded result. A screen reads this to
   * know whether the way forward is open and what to say about the answer.
   */
  verdict: boolean | null | undefined;
  /**
   * Record one answer **without moving on**. Synchronous: nothing on screen
   * waits on IndexedDB.
   */
  record: (result: GameResult) => void;
  /** Move to the next question. Ignored while nothing has been answered. */
  advance: () => void;
  /** `record` then `advance` — one result, one question. */
  submit: (result: GameResult) => void;
};

export type UseSessionOptions = {
  /** Injected only by tests that need a deterministic id, as `AttemptContext.id` is. */
  sessionId?: string;
};

type SessionState = {
  /** Position in `[...plan.items, ...tail]`. Monotonic: nothing is ever re-shown. */
  index: number;
  tail: PlannedItem[];
  /** Retries spent per concept, keyed by `conceptId`. */
  retries: Map<string, number>;
  flagged: string[];
  /** Every `itemKey` this session has committed to showing, planned or queued. */
  used: Set<string>;
  writeFailures: number;
  /**
   * What the question at `index` has been answered with, or `null` for nothing
   * yet. A verdict of `null` inside it is an *ungraded* answer — recorded, but
   * not a decision, so a later graded result still gets to make one.
   */
  outcome: { verdict: boolean | null } | null;
};

function initialState(plan: SessionPlan): SessionState {
  return {
    index: 0,
    tail: [],
    retries: new Map(),
    flagged: [],
    used: new Set(plan.items.map((i) => i.itemKey)),
    writeFailures: 0,
    outcome: null,
  };
}

/** The question has a verdict: the tail, the flag and the feedback are settled. */
const isDecided = (state: SessionState) =>
  state.outcome !== null && state.outcome.verdict !== null;

/**
 * The exemplar to ask again with: same concept, not yet used, and preferably a
 * different drill shape.
 *
 * The shape preference is the reason this is not simply "the next unused one".
 * A second `rule-identifier` on the same rule re-tests the *format*; asking the
 * same rule through a different drill is what tests the rule. Ties break on
 * `itemKey` so a session is reproducible from its inputs — the same reasoning
 * that made `planSession`'s draw seeded rather than `Math.random()`.
 *
 * `null` means the pool has nothing left. The caller must **not** fall back to
 * the item just missed.
 */
function drawRetry(
  conceptId: string,
  missedGameId: string,
  pool: readonly PoolItem[],
  used: ReadonlySet<string>,
): PlannedItem | null {
  const candidates = pool.filter((p) => p.conceptId === conceptId && !used.has(p.itemKey));
  if (candidates.length === 0) return null;

  const chosen = candidates.reduce((best, next) => {
    const bestSameShape = best.gameId === missedGameId ? 1 : 0;
    const nextSameShape = next.gameId === missedGameId ? 1 : 0;
    if (bestSameShape !== nextSameShape) return nextSameShape < bestSameShape ? next : best;
    return next.itemKey < best.itemKey ? next : best;
  });

  return {
    ...chosen,
    ...shapeOf(chosen.gameId),
    /**
     * A tail retry is **never** interleaved, whatever spawned it.
     *
     * `isInterleaved` is the retention instrument: it marks the attempts that
     * measure whether a concept survived being left alone. A retry two minutes
     * after corrective feedback measures repair, not survival, so recording it
     * as a review would inflate the single number the flag exists to report.
     * Planned items carry theirs through untouched — this is the one place a
     * value is chosen rather than copied.
     */
    isInterleaved: false,
  };
}

/** Add a concept to the flag list once, keeping first-flagged order. */
function flag(flagged: readonly string[], conceptId: string): string[] {
  return flagged.includes(conceptId) ? [...flagged] : [...flagged, conceptId];
}

/**
 * One answer applied to the machine. Pure, so the decision to re-queue is
 * separable from the IO the hook does around it.
 *
 * **The index is not touched here.** Recording an answer and leaving the
 * question are two different events — see "a slot is a question, not a tap"
 * above — and `advanced` owns the second.
 *
 * `attempt` is `null` only when there was nothing on screen to answer — a
 * result arriving after the session ended is not an attempt at anything, and
 * must not become a row.
 */
function step(
  state: SessionState,
  plan: SessionPlan,
  pool: readonly PoolItem[],
  result: GameResult,
  sessionId: string,
): { next: SessionState; attempt: Attempt | null } {
  const shown = currentOf(state, plan);
  if (!shown) return { next: state, attempt: null };

  const attempt = attemptFromResult(result, {
    conceptId: shown.conceptId,
    itemKey: shown.itemKey,
    sessionId,
    // Copied, not inferred. Session assembly decided it before the drill
    // rendered, and the drill has no way of knowing.
    isInterleaved: shown.isInterleaved,
  });

  // A second graded move on a question already decided is still a row — the
  // scheduler wants every move — but it re-opens nothing. Otherwise a learner
  // who missed twice before getting it right would spend two of the concept's
  // retries repairing one question.
  if (isDecided(state)) return { next: state, attempt };

  const next: SessionState = { ...state, outcome: { verdict: result.correct } };

  // `correct === null` is ungraded, and ungraded is not a miss. It writes its
  // row and queues nothing: no verdict, no failure, nothing to repair.
  if (result.correct !== false) return { next, attempt };

  const spent = state.retries.get(shown.conceptId) ?? 0;
  const retry =
    state.tail.length < MAX_TAIL_ITEMS && spent < MAX_TAIL_ATTEMPTS_PER_CONCEPT
      ? drawRetry(shown.conceptId, shown.gameId, pool, state.used)
      : null;

  if (!retry) {
    // Every way of failing to queue lands here — cap reached, retries spent, or
    // an exhausted pool — and they all mean the same thing to the next session:
    // this concept was missed and was not repaired.
    next.flagged = flag(state.flagged, shown.conceptId);
    return { next, attempt };
  }

  next.tail = [...state.tail, retry];
  next.retries = new Map(state.retries).set(shown.conceptId, spent + 1);
  next.used = new Set(state.used).add(retry.itemKey);
  return { next, attempt };
}

/**
 * Leave the question behind.
 *
 * **Only an answered one.** Advancing past a question nothing was recorded for
 * would spend a planned slot with no row to show for it, and the ledger is the
 * only place the session's length is recoverable from afterwards. A screen with
 * a skip button has to record the skip — `correct: null` — rather than step over
 * it silently.
 */
function advanced(state: SessionState, plan: SessionPlan): SessionState {
  if (state.outcome === null || !currentOf(state, plan)) return state;
  return { ...state, index: state.index + 1, outcome: null };
}

/** The plan first, then the tail — the retries are the *end* of the lesson. */
function currentOf(state: SessionState, plan: SessionPlan): PlannedItem | null {
  const planned = plan.items[state.index];
  if (planned) return planned;
  return state.tail[state.index - plan.items.length] ?? null;
}

export function useSession(
  plan: SessionPlan,
  pool: readonly PoolItem[],
  opts: UseSessionOptions = {},
): SessionRunner {
  const [state, setState] = useState<SessionState>(() => initialState(plan));

  /**
   * `submit` reads the machine from a ref rather than from the render it was
   * created in, so two answers inside one tick cannot both act on the first
   * state and lose one of them. The ref is written at the same moment as the
   * state, never during render.
   */
  const stateRef = useRef(state);
  const commit = useCallback((nextState: SessionState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  /**
   * The plan, the pool and the id are fixed for the life of the hook. A
   * different plan is a different sitting: remount with a `key` rather than
   * swapping the prop, or half the session would be indexed against a plan it
   * never ran.
   *
   * Pinned in state rather than a ref because all three are read while
   * rendering, and a ref read during render is what `react-hooks/refs` forbids
   * — it is invisible to React, so nothing re-renders when it changes. The lazy
   * initialiser also means `randomUUID` is called once rather than on every
   * render with the result thrown away.
   *
   * Pinning the pool costs nothing and buys a `submit` whose identity never
   * changes: callers pass it straight to a drill as `onResult`, and a callback
   * that was rebuilt whenever the caller re-derived its pool array would
   * re-render every drill on every answer.
   */
  const [pinnedPlan] = useState(plan);
  const [pinnedPool] = useState(pool);
  const [sessionId] = useState(() => opts.sessionId ?? crypto.randomUUID());

  const apply = useCallback(
    (result: GameResult, thenAdvance: boolean) => {
      const { next, attempt } = step(
        stateRef.current,
        pinnedPlan,
        pinnedPool,
        result,
        sessionId,
      );
      if (!attempt) return;
      commit(thenAdvance ? advanced(next, pinnedPlan) : next);

      /**
       * Fire and forget, and **a rejected write does not block the session**.
       *
       * The alternative — surfacing the rejection as a blocked question or a
       * halted session — is worse in every branch. A quota error at question
       * three would cost the learner the other eleven answers as well, so a bug
       * that loses one row would instead lose the whole sitting. The ledger is
       * append-only, so a dropped row leaves no partial or inconsistent state
       * behind: it is one missing observation in a history that everything else
       * is *derived* from, which degrades a schedule slightly and corrupts
       * nothing.
       *
       * What it is not is silent. `writeFailures` is on the surface so a screen
       * can say the history is incomplete, without a modal and without stopping
       * anyone mid-answer.
       */
      appendAttempt(attempt).catch(() => {
        commit({ ...stateRef.current, writeFailures: stateRef.current.writeFailures + 1 });
      });
    },
    [commit, pinnedPlan, pinnedPool, sessionId],
  );

  // Three callbacks with stable identities, for the same reason `submit` always
  // had one: they are passed straight to a drill, and a callback rebuilt on
  // every answer would re-render the drill mid-question.
  const record = useCallback((result: GameResult) => apply(result, false), [apply]);
  const submit = useCallback((result: GameResult) => apply(result, true), [apply]);
  const advance = useCallback(
    () => commit(advanced(stateRef.current, pinnedPlan)),
    [commit, pinnedPlan],
  );

  const served = Math.max(0, state.index - pinnedPlan.items.length);
  const total = pinnedPlan.items.length + state.tail.length;

  return {
    current: currentOf(state, pinnedPlan),
    // `total` grows when a miss queues a retry, so the bar recedes rather than
    // lying about how much is left. An honest progress bar is worth more than a
    // monotonic one, and the tail is capped so it cannot recede forever.
    progress: { done: state.index, total },
    tailLength: state.tail.length - served,
    isComplete: state.index >= total,
    flagged: state.flagged,
    sessionId,
    writeFailures: state.writeFailures,
    verdict: state.outcome === null ? undefined : state.outcome.verdict,
    record,
    advance,
    submit,
  };
}
