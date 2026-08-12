"use client";
import { useState } from "react";

import { getGames, type GameResult } from "@/components/games/GameRegistry";
// Side-effect imports: the drills register themselves at module scope, and this
// screen resolves them by id. Without these the registry is empty here and every
// question renders the "not shipped" note — the failure mode `tajweed/index.ts`
// records, where seven drills sat dead for weeks with every test still green.
import "@/components/games/letters";
import "@/components/games/tajweed";
import type { RuleId } from "@/content/tajweed";
import type { GameData } from "@/games/derive";
import type { PoolItem, SessionPlan } from "@/practice/session";
import { useSession } from "@/practice/useSession";
import { FeedbackBar, noteFor } from "./FeedbackBar";

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
 * Drills emit **once per graded move** — `LetterQuiz` on every tap,
 * `FamilySorter` on every drop — so a screen that advanced on every result would
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
 * ## Known limit, stated rather than hidden
 *
 * The registry mounts a drill by id and nothing more — `GameRenderProps` has no
 * `itemKey` — so a drill picks its own exemplar and may ask about a *different*
 * rule than the one the session planned. The ledger row is keyed to the planned
 * concept either way (that is `useSession`'s job and it is what the scheduler
 * needs), but the feedback prefers the `ruleId` the drill actually reported, so
 * the learner is never told about a rule they were not asked. Threading the
 * exemplar through the registry is a change to every drill, and belongs in its
 * own task.
 */
export function SessionRunner({
  plan,
  pool,
  data,
  onExit,
  sessionId,
}: {
  plan: SessionPlan;
  pool: readonly PoolItem[];
  /** The lesson's derived pools, for drills whose content is lesson-scoped. */
  data?: GameData;
  /** Leaving is always available and always costs nothing — no lockout. */
  onExit?: () => void;
  sessionId?: string;
}) {
  const runner = useSession(plan, pool, { sessionId });
  /**
   * The rule the drill said it was asking about, when it differs from the
   * planned concept. Held for the question on screen only, and cleared by the
   * one thing that changes the question.
   */
  const [askedRule, setAskedRule] = useState<RuleId | undefined>(undefined);

  const current = runner.current;
  const entry = current ? getGames([current.gameId])[0] : undefined;
  const { done, total } = runner.progress;
  const filled = total === 0 ? 0 : Math.round((done / total) * 100);

  const nameOfLetter = (conceptId: string) =>
    data?.letterPool.find((l) => l.arabic === conceptId)?.name;

  const onResult = (r: GameResult) => {
    // Before recording, because recording is what decides the verdict: this is
    // the rule that belongs to the move about to become the question's answer.
    if (typeof runner.verdict !== "boolean" && r.ruleId) setAskedRule(r.ruleId);
    runner.record(r);
  };

  const onContinue = () => {
    setAskedRule(undefined);
    runner.advance();
  };

  /**
   * The rule the drill said it graded wins over the concept the session
   * planned, and only falls back to it when the drill named none.
   *
   * Backwards from what you would expect, and deliberate. The registry mounts a
   * drill by id and nothing else, so a tajweed drill picks its own exemplar and
   * may ask about a *different* rule than the slot was planned for. The ledger
   * row is keyed to the planned concept either way — that is what the scheduler
   * needs — but the feedback has to describe the question that was actually on
   * screen, or it names a rule the learner was never asked about. A letter
   * concept reports no `ruleId` at all, so it always falls through.
   */
  const note = current
    ? noteFor(askedRule ?? current.conceptId, current.gameId, nameOfLetter(current.conceptId))
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

      {/* ── band 2: the drill, unchanged ─────────────────────────────── */}
      <div
        data-testid="drill-band"
        data-item-key={current?.itemKey}
        data-game-id={current?.gameId}
        // Opaque, unblurred ground for Arabic, and no `overflow: hidden` — a
        // tight clipped box eats the top of a fatḥa and the tail of a kasra.
        className="rounded-2xl border border-white/10 bg-[#121218] p-4 sm:p-5"
      >
        {current ? (
          entry ? (
            // Keyed by the question: per-round state inside a drill is thrown
            // away with it rather than reset in an effect.
            <div key={current.itemKey}>{entry.render({ onResult, data })}</div>
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
