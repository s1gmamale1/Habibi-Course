import type { GameResult } from "@/components/games/GameRegistry";
import type { Attempt } from "./types";

/**
 * The facts a drill does not know about itself.
 *
 * A drill reports a verdict and, sometimes, a number. It has no idea which
 * concept the session was targeting, which exemplar was drawn for it, or
 * whether it was placed as an interleaved review — those are decisions session
 * assembly made before the drill rendered, so they are supplied here.
 */
export type AttemptContext = {
  /** The scheduling key. Session assembly chose the concept, so it is not inferred. */
  conceptId: string;
  itemKey: string;
  sessionId: string;
  isInterleaved: boolean;
  /** Injected only by tests that need a deterministic id. */
  id?: string;
};

/**
 * `GameResult` → `Attempt`. Pure, and deliberately free of any storage import:
 * the session runner has to be able to build and inspect an attempt without an
 * IndexedDB in the room, and this has to be testable the same way.
 *
 * Optional measurement fields are **omitted, not set to `undefined`**. The
 * distinction survives the structured clone into IndexedDB, and downstream code
 * reads absence as "nothing was measured" — so writing the key with an empty
 * value would blur the one signal the type exists to carry.
 */
export function attemptFromResult(result: GameResult, ctx: AttemptContext): Attempt {
  const attempt: Attempt = {
    id: ctx.id ?? crypto.randomUUID(),
    at: result.at,
    conceptId: ctx.conceptId,
    itemKey: ctx.itemKey,
    gameId: result.gameId,
    correct: result.correct,
    sessionId: ctx.sessionId,
    isInterleaved: ctx.isInterleaved,
  };

  if (result.measure) {
    // A held duration: a single target, and the calibration it was measured against.
    attempt.measuredHarakat = result.measure.measuredHarakat;
    attempt.targetHarakat = result.measure.targetHarakat;
    attempt.msPerHarakah = result.measure.msPerHarakah;
  } else if (result.choice) {
    // A selected length: nothing was timed, so no `msPerHarakah` is written.
    attempt.measuredHarakat = result.choice.chosenHarakat;
    attempt.acceptedHarakat = result.choice.acceptedHarakat;
    // One accepted length is a target. Several are not, and picking one of them
    // to store would assert that the other readings are wrong.
    if (result.choice.acceptedHarakat.length === 1) {
      attempt.targetHarakat = result.choice.acceptedHarakat[0];
    }
  }

  return attempt;
}
