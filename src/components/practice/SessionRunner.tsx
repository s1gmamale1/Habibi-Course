"use client";
import { getGame } from "@/games2/registry";
import type { Question } from "@/games2/types";
import type { GameData } from "@/games/derive";
import type { SessionPlan } from "@/practice/session";
import { useSession } from "@/practice/useSession";
import { FeedbackBar, noteFor } from "./FeedbackBar";

/**
 * Wall clock, factored out of the component.
 *
 * `Date.now()` called directly inside this component's body trips
 * `react-hooks/purity` even lexically nested inside a callback that only ever
 * runs from a click handler — the rule cannot see the call is deferred, only
 * that it is inside the component. A module-level function sidesteps that, the
 * same fix `SetScreen.tsx` uses for the same reason.
 */
function clockNow(): number {
  return Date.now();
}

/**
 * The screen that runs one `SessionPlan`. Three bands, and the primary button
 * never moves between them.
 *
 * ```
 * ┌──────────────────────────────────────────────┐
 * │  [✕]   ▓▓▓▓▓▓▓▓▓░░░░░░░░░░              │ ← fills RIGHT→LEFT
 * ├──────────────────────────────────────────────┤
 * │  <the drill renders here, unchanged>         │
 * ├──────────────────────────────────────────────┤
 * │  ✓  إدغام بغنّة — النون الساكنة قبل الميم      │ ← THE RULE, not just ✓
 * │                                  [  متابعة  ] │ ← same position as تحقّق
 * └──────────────────────────────────────────────┘
 * ```
 *
 * ## A slot is a question, not a tap
 *
 * A `GameApi` fires `answer` once per graded move — `Match` on every pick,
 * `WordBank` on every drop — so a screen that advanced on every result would
 * spend three of fourteen planned slots on one question answered
 * wrong-wrong-right. Every result is still recorded, because the scheduler wants
 * every move and first-try-only would throw away exactly the misses it learns
 * from; what a result no longer does is move the session on. `useSession.record`
 * writes, `useSession.advance` moves, and only the learner pressing متابعة —
 * after reading the correction — does the second.
 *
 * ## What it will not do
 *
 * - **No sound**, on any event. See `FeedbackBar`.
 * - **No score.** The end of the session names what went unrepaired, as
 *   diagnosis. Not a percentage, not XP, and nothing monotonic in elapsed time.
 * - **No blocking on a write failure.** `writeFailures` becomes a quiet line;
 *   never a dialog, and never a reason to stop answering.
 *
 * ## The question, resolved through the registry
 *
 * `current.gameId` is looked up with `getGame`, and its `GameSpec.render`
 * mounts the question — the same question `planSession` chose, since a
 * `GameSpec` draws entirely from the `Question` it is handed and never
 * substitutes one of its own. A game that has not registered here (the seven
 * tajweed drills, in this slice) falls back to a note rather than a blank
 * band: a lesson naming a drill that has not shipped should not break the
 * session over it.
 */
export function SessionRunner({
  plan,
  pool,
  data,
  onExit,
  sessionId,
}: {
  plan: SessionPlan;
  pool: readonly Question[];
  /** The lesson's derived pools, so a letter concept can be named as itself. */
  data?: GameData;
  /** Leaving is always available and always costs nothing — no lockout. */
  onExit?: () => void;
  sessionId?: string;
}) {
  const runner = useSession(plan, pool, { sessionId });

  const current = runner.current;
  const spec = current ? getGame(current.gameId) : undefined;
  const { done, total } = runner.progress;
  const filled = total === 0 ? 0 : Math.round((done / total) * 100);

  const nameOfLetter = (conceptId: string) =>
    data?.letterPool.find((l) => l.arabic === conceptId)?.name;

  const onContinue = () => runner.advance();

  const note = current
    ? noteFor(current.conceptId, current.gameId, nameOfLetter(current.conceptId))
    : null;

  return (
    <section
      data-testid="session-runner"
      dir="rtl"
      className="mx-auto flex w-full max-w-2xl flex-col gap-4"
    >
      {/* ── band 1: leaving, and how far in ─────────────────────────── */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="إنهاء الجلسة"
          onClick={onExit}
          className="rounded-full border border-white/15 px-3 py-1 text-white/70"
        >
          <span aria-hidden="true">✕</span>
        </button>
        <div
          data-testid="progress-track"
          data-done={done}
          data-total={total}
          role="progressbar"
          aria-label="التقدّم في الجلسة"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
          dir="rtl"
          // The fill is a plain block inside an RTL box, so it starts at the
          // right edge and grows leftwards — no physical offset anywhere. The
          // inline `direction` is also what makes the RTL claim assertable.
          style={{ direction: "rtl" }}
          className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"
        >
          <div
            style={{ width: `${filled}%` }}
            className="h-full rounded-full bg-amber-300/90 transition-[width] duration-300"
          />
        </div>
        {/* Digits inside an RTL line reorder without this. */}
        <span className="text-xs text-white/50">
          <bdi dir="ltr">
            {done} / {total}
          </bdi>
        </span>
      </header>

      {runner.writeFailures > 0 && (
        // Unobtrusive by design: a modal here would stop a learner mid-answer
        // over a row the ledger can lose without corrupting anything.
        <p data-testid="write-failures" className="text-xs text-white/45">
          السجلّ غير مكتمل · history incomplete (<bdi dir="ltr">{runner.writeFailures}</bdi>)
        </p>
      )}

      {/* ── band 2: the drill, resolved through the registry ─────────── */}
      <div
        data-testid="drill-band"
        data-item-key={current?.itemKey}
        data-game-id={current?.gameId}
        data-concept-id={current?.conceptId}
        // Opaque, unblurred ground for Arabic, and no `overflow: hidden` — a
        // tight clipped box eats the top of a fatḥa and the tail of a kasra.
        className="rounded-2xl border border-white/10 bg-[#121218] p-4 sm:p-5"
      >
        {current ? (
          spec ? (
            // Keyed by the question: per-round state inside a drill is thrown
            // away with it rather than reset in an effect.
            <div key={current.itemKey}>
              {spec.render(current, {
                answer: (correct, detail) => runner.record(current, correct, detail),
                now: clockNow,
              })}
            </div>
          ) : (
            <p className="text-white/50">
              هذا التمرين غير متاح بعد · this drill has not shipped yet
            </p>
          )
        ) : (
          <div data-testid="session-complete" className="text-white/80">
            <p className="text-lg font-semibold">انتهت الجلسة · Session complete</p>
            {runner.flagged.length > 0 && (
              <>
                {/* Diagnosis, never a grade: what to look at again, by name. */}
                <p className="mt-3 text-sm text-white/60">تحتاج مراجعة · Worth another look</p>
                <ul className="mt-1 text-sm">
                  {runner.flagged.map((conceptId) => (
                    <li key={conceptId} className="arabic">
                      {noteFor(conceptId, "", nameOfLetter(conceptId)).name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── band 3: the verdict, the rule, and the one button ────────── */}
      <FeedbackBar
        verdict={current ? runner.verdict : undefined}
        note={runner.verdict === undefined ? null : note}
        label={current ? "متابعة" : "تمّ"}
        canContinue={current ? runner.verdict !== undefined : true}
        onContinue={current ? onContinue : () => onExit?.()}
      />
    </section>
  );
}
