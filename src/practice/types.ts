/**
 * The shapes the practice engine is built on. No logic lives here — everything
 * else in `src/practice/` derives from `Attempt[]` and can be thrown away and
 * recomputed, so this is the only file whose meaning has to be stable.
 */

/**
 * One answer, as it happened. Rows are **appended and never touched again**.
 *
 * That is the load-bearing property of the whole design, not a storage detail.
 * The reference implementation this was researched from used an
 * update-or-create keyed on (concept, item), so answering the same drill twice
 * overwrote the first row — a defect its own documentation flags. For the
 * duration-graded drills it is worse than losing a row: the signal we actually
 * want is the *distribution* of holds over time, and an overwriting row keeps
 * exactly one sample of it, the last.
 *
 * See `ledger.ts`: it exposes an append and a read, and nothing else.
 */
export type Attempt = {
  /** `crypto.randomUUID()`. Per attempt, never per item — retries are new rows. */
  id: string;
  /** Epoch ms, taken from the drill's own result so the ledger stays clockless. */
  at: number;
  /**
   * A tajweed rule id or a letter — the **scheduling** key (ADR-008).
   *
   * Scheduling is keyed on concepts (47) rather than items (1,641): at 14 slots
   * a session, a given item would resurface about every four months, which is
   * far too sparse for FSRS to build stability from. The learning object is the
   * rule; the exemplar is drawn fresh each review.
   */
  conceptId: string;
  /** The exemplar actually shown. Kept for reporting and for a future per-item mode. */
  itemKey: string;
  gameId: string;
  /**
   * `null` = ungraded or skipped. **Never `false` for "no verdict"** — a
   * fabricated `false` is a claim of failure by a drill that did not grade, and
   * it would move a mastery band on evidence that does not exist.
   */
  correct: boolean | null;
  /** What the learner held or chose. Absent when the drill grades nothing numeric. */
  measuredHarakat?: number;
  /**
   * Absent when the rule accepts several lengths — madd ʿāriḍ lis-sukūn is
   * genuinely transmitted at 2, 4 *or* 6. Collapsing that set to one number
   * records a falsehood the drill exists to refute, so it is left out and the
   * grader falls back to `correct`. See `acceptedHarakat`.
   */
  targetHarakat?: number;
  /** The full accepted set, when the drill graded against one. */
  acceptedHarakat?: number[];
  /**
   * The learner's own calibration. A ḥarakah has no fixed duration, so without
   * this `measuredHarakat` cannot be reproduced or re-scored later against a
   * retuned tolerance. Absent for drills that timed nothing — a zero here would
   * be an invented measurement.
   */
  msPerHarakah?: number;
  sessionId: string;
  /** Review items double as the retention instrument, so this has to be recorded. */
  isInterleaved: boolean;
};
