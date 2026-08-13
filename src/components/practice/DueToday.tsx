"use client";
import { useEffect, useMemo, useState } from "react";

import type { Question } from "@/games2/types";
import type { GameData } from "@/games/derive";
import { derive, isWeak, type ConceptState } from "@/practice/derive";
import { allAttempts } from "@/practice/ledger";
import { dueConcepts } from "@/practice/schedule";
import { conceptRoster, schedulesFromLedger } from "@/practice/session";
import type { Attempt } from "@/practice/types";
import { noteFor } from "./FeedbackBar";

/**
 * The entry point: what is due, what needs work, and how consistently the
 * learner has turned up.
 *
 * ```
 * ┌────────────────────────────────────────┐
 * │  للمراجعة اليوم            ١٢ مفهومًا    │
 * │  ┌──────────────────────────────────┐  │
 * │  │        ▶  ابدأ المراجعة           │  │ ← ONE loud action
 * │  └──────────────────────────────────┘  │
 * │  تحتاج مراجعة                           │
 * │   ⚠ إدغام بغنّة                        │ ← diagnosis, NOT a grade
 * │  تدرّبت ١٤ من آخر ٢١ يوماً                │ ← rolling, cannot break
 * │  هذا الأسبوع  ●●○                       │ ← 3 distinct days
 * └────────────────────────────────────────┘
 * ```
 *
 * ## On this screen the wording *is* the implementation
 *
 * Everything below is the same mechanic a points screen would use — a count of
 * due items, a list of weak concepts, a practice counter — and the framing is
 * what decides its sign. Performance-contingent rewards measurably *undermine*
 * intrinsic motivation (d = −0.28 across 128 studies); informational feedback
 * measurably improves it. For a solo learner, whose intrinsic motivation is the
 * entire engine and for whom the largest measured gamification benefit —
 * relatedness, g = 1.776 — is structurally unavailable, this is the most
 * consequential decision in the design. So:
 *
 * - **A weak concept is named, never scored.** "إدغام بغنّة needs review", never
 *   a band, a percentage or a rank. The name comes from the same `noteFor` the
 *   feedback bar uses, so the learner reads one vocabulary across the app.
 * - **No XP, level, badge, coin, league, leaderboard, heart or point** exists
 *   here, and `DueToday.test.tsx` asserts their absence rather than trusting it.
 *   An XP counter is not a defect that surfaces as a failing behaviour later; it
 *   is a decision that inverts the sign of the screen, and by the time anyone
 *   notices it has shipped.
 * - **Checkpoints are not mentioned at all.** They are live oral gates with a
 *   teacher, and the most this screen could ever honestly say is "you look ready
 *   to book one" — never a gate, a score or a reward.
 *
 * ## Why the density display cannot break
 *
 * `تدرّبت ١٤ من آخر ٢١ يوماً` is a **rolling window**, and a rolling window has
 * no loss condition: a day leaves it silently twenty-one days after it entered,
 * and nothing the learner does or fails to do resets it to zero. That is not a
 * softened streak — a streak with a cliff asserts that a missed day undoes the
 * habit, which is not true, and the counter that zeroes is therefore telling the
 * learner something false at the exact moment they are most likely to quit.
 *
 * There is consequently no state in which this screen renders a bare `٠`. Where
 * a count would be zero it says what will appear there instead, which is the
 * honest sentence and also the only one that is not a punishment.
 *
 * ## Distinct days, and nothing denominated in time
 *
 * The weekly target is **three distinct days in a Monday-start week**. Distinct
 * is load-bearing: it is what stops a week being satisfied in one long sitting,
 * which is the practice pattern spaced repetition exists to replace.
 *
 * No metric anywhere is denominated in time. Minutes would corrupt the ḥarakāt
 * drills outright — `GhunnahTimer` grades a held duration against a target and
 * holding *longer* is an error, so any quantity monotonic in duration teaches
 * the opposite of the drill.
 */

/** The rolling window, in days. Twenty-one is three weeks: long enough to survive a bad one. */
export const DENSITY_WINDOW_DAYS = 21;

/** Distinct days per Monday-start week. Distinct, never sessions — see the module comment. */
export const WEEKLY_TARGET_DAYS = 3;

/**
 * How many weak concepts are named at once.
 *
 * A cap rather than the full list, because a learner having a bad fortnight
 * could otherwise open this screen to forty-seven warnings — a wall that reads
 * as a verdict on them however carefully each line is worded. The remainder is
 * still counted out loud rather than hidden.
 */
const WEAK_SHOWN = 5;

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Arabic-Indic digits, mapped rather than localised.
 *
 * `Intl.NumberFormat("ar-EG")` would do this, and would also make the rendered
 * string depend on which ICU data the runtime was built with — so the same
 * component would render `12` on one Node build and `١٢` on another, and the
 * tests that pin this wording would pass or fail on the environment.
 */
const ar = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/** Midnight local, which is the only midnight a learner has. */
function dayStart(ts: number): Date {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * A day's identity, in **local** time.
 *
 * Local rather than UTC because "today" is a fact about the learner, not about
 * Greenwich: a session at 01:00 in Tashkent is UTC *yesterday*, and a
 * UTC-keyed counter would drop it out of "this week" for no reason they could
 * see.
 */
const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** `n` local days before `from`, via the calendar rather than by subtracting milliseconds — a DST shift is not 24h. */
function shiftDays(from: Date, n: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return d;
}

/** Monday 00:00 of the week containing `now`. */
function weekStart(now: number): Date {
  const d = dayStart(now);
  return shiftDays(d, -((d.getDay() + 6) % 7)); // getDay(): Sunday is 0
}

/**
 * Distinct calendar days between `from` and `now` on which *something was
 * attempted*.
 *
 * **Ungraded attempts count here**, which is a deliberate departure from
 * `derive()` — and the two are consistent rather than in tension. `derive()`
 * refuses to let an ungraded row move a band because it carries no evidence
 * about the *concept*. This counter is not about a concept at all and grades
 * nothing: it counts the learner turning up, and a session of flashcards is
 * turning up. Folding it through `wrongSignal` would tell a learner who
 * practised every day for a fortnight that they had not practised at all.
 */
function distinctDays(attempts: readonly Attempt[], from: number, now: number): number {
  const days = new Set<string>();
  for (const a of attempts) if (a.at >= from && a.at <= now) days.add(dayKey(a.at));
  return days.size;
}

/** Arabic number agreement, because a course that teaches Arabic may not print `١٢ مفهوم`. */
function conceptCount(n: number): string {
  if (n === 1) return "مفهوم واحد";
  if (n === 2) return "مفهومان";
  if (n <= 10) return `${ar(n)} مفاهيم`;
  return `${ar(n)} مفهومًا`;
}

/**
 * Which concepts to put in front of the learner, worst first.
 *
 * `isWeak` and `flagged` are both read off `derive()` and neither threshold is
 * restated here — a second copy of `RESOLVED` would drift from the first the
 * moment either moved. `flagged` is specifically the **durable** flag derived
 * from the ledger, not `useSession`'s live in-session copy, which does not
 * survive the session that minted it.
 *
 * The map is walked rather than the roster, because a concept with only
 * ungraded attempts **has no entry** — and that absence is the correct answer:
 * nothing is known about it, so it is not weak.
 *
 * **`|| s.flagged` selects nothing today, and that is worth saying rather than
 * hiding** — the same disclosure `MAX_TIMED` carries in `session.ts`. A miss
 * drives the EWMA to `0.7·old + 30`, so a flagged concept is always above
 * `RESOLVED` with a broken clean run, which is `isWeak` exactly. It is kept
 * because the two say different things and only coincide numerically: raise
 * `RESOLVED` past 30 and a flagged concept could stop reading as weak while
 * still being a failure the session never repaired. What the flag does change
 * today is the **order** — unfinished business is named ahead of a worse
 * history that has since been answered cleanly, which the sort below does and a
 * test pins.
 */
function weakConcepts(states: ReadonlyMap<string, ConceptState>): ConceptState[] {
  return [...states.values()]
    .filter((s) => isWeak(s) || s.flagged)
    .sort(
      (x, y) =>
        Number(y.flagged) - Number(x.flagged) ||
        y.ewma - x.ewma ||
        (x.conceptId < y.conceptId ? -1 : x.conceptId > y.conceptId ? 1 : 0),
    );
}

export function DueToday({
  attempts,
  roster,
  now,
  data,
  onStart,
  unavailable = false,
}: {
  /** The whole ledger. Everything on this screen is derived from it; nothing is stored. */
  attempts: readonly Attempt[];
  /** Every concept the engine schedules — `conceptRoster(pool)`. */
  roster: readonly string[];
  /** An argument, never a clock, so the same ledger renders the same screen in a test. */
  now: number;
  /** The lesson's derived pools, only so a letter concept can be named as itself. */
  data?: GameData;
  /**
   * The one loud action. Required rather than optional: a primary control that
   * might do nothing is the dead end this screen exists to avoid.
   */
  onStart: () => void;
  /**
   * The ledger could not be read. Distinct from "the ledger is empty", and the
   * distinction is the point — an unreadable store must not be rendered as
   * "you have never practised", which is a claim about the learner made out of
   * a failure of ours.
   */
  unavailable?: boolean;
}) {
  const states = useMemo(() => derive(attempts, now), [attempts, now]);
  const due = useMemo(
    () => dueConcepts(schedulesFromLedger(attempts, roster, now), now).length,
    [attempts, roster, now],
  );

  const weak = useMemo(() => weakConcepts(states), [states]);
  const shown = weak.slice(0, WEAK_SHOWN);

  const windowDays = distinctDays(
    attempts,
    shiftDays(dayStart(now), -(DENSITY_WINDOW_DAYS - 1)).getTime(),
    now,
  );
  const weekDays = distinctDays(attempts, weekStart(now).getTime(), now);

  const nameOf = (conceptId: string) =>
    noteFor(conceptId, "", data?.letterPool.find((l) => l.arabic === conceptId)?.name).name;

  return (
    <section
      data-testid="due-today"
      dir="rtl"
      className="glass mb-8 rounded-2xl p-4 print:hidden sm:p-5"
    >
      {/* ── what is due ──────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-white/90">للمراجعة اليوم · Due today</h2>
        {!unavailable && (
          <p data-testid="due-count" className="text-sm text-white/70">
            {due === 0 ? "لا شيء مستحقّ الآن" : <bdi>{conceptCount(due)}</bdi>}
          </p>
        )}
      </header>

      {/* ── the one loud action ──────────────────────────────────────── */}
      <div className="mt-3">
        <button
          type="button"
          data-testid="start-review"
          onClick={onStart}
          // Never disabled, in any state. Nothing due is free time, not a
          // lockout, and a learner who wants to practise anyway may always
          // practise anyway.
          className="cta-primary w-full rounded-full px-6 py-3 text-base font-semibold"
        >
          <span aria-hidden="true" className="me-2">
            ▶
          </span>
          ابدأ المراجعة
        </button>
        {due === 0 && !unavailable && (
          <p className="mt-2 text-center text-xs text-white/50">راجع متى شئت</p>
        )}
      </div>

      {unavailable ? (
        // The same register as `SessionRunner`'s write failures: quiet, one line,
        // and never a reason to stop. It says what is true — we could not read —
        // and makes no claim about what the learner has done.
        <p data-testid="ledger-unavailable" className="mt-4 text-xs text-white/45">
          السجلّ غير متاح الآن · history unavailable
        </p>
      ) : (
        <>
          {/* ── diagnosis, never a grade ─────────────────────────────── */}
          <div className="mt-5">
            <h3 className="text-sm text-white/60">تحتاج مراجعة · Worth another look</h3>
            {shown.length === 0 ? (
              <p className="mt-1 text-sm text-white/50">
                {attempts.length === 0
                  ? "لم تتدرّب بعد — كل المفاهيم جديدة"
                  : "لا شيء يحتاج مراجعة الآن"}
              </p>
            ) : (
              <>
                <ul data-testid="weak-list" className="mt-1 space-y-1 text-sm text-white/85">
                  {shown.map((s) => (
                    <li key={s.conceptId} className="flex items-baseline gap-2">
                      {/* The mark is decoration; the name is the signal. Colour is
                          never the only channel, and here it is not a channel at all. */}
                      <span aria-hidden="true" className="text-amber-300">
                        ⚠
                      </span>
                      <span className="arabic">{nameOf(s.conceptId)}</span>
                    </li>
                  ))}
                </ul>
                {weak.length > shown.length && (
                  <p className="mt-1 text-xs text-white/45">
                    و<bdi>{ar(weak.length - shown.length)}</bdi> غيرها
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── how consistently, and it cannot break ─────────────────── */}
          <div className="mt-5 space-y-1 text-sm text-white/70">
            <p data-testid="density-line">
              {windowDays === 0 ? (
                // Not `تدرّبت ٠ من آخر ٢١ يوماً`. A zero here is a punishment
                // dressed as a statistic, and it is also the least useful thing
                // this line could say to someone who has not started.
                <>
                  أيام تدرّبك ستظهر هنا خلال <bdi>{ar(DENSITY_WINDOW_DAYS)}</bdi> يوماً
                </>
              ) : (
                <>
                  تدرّبت <bdi>{ar(windowDays)}</bdi> من آخر{" "}
                  <bdi>{ar(DENSITY_WINDOW_DAYS)}</bdi> يوماً
                </>
              )}
            </p>
            <p data-testid="week-line" className="flex items-center gap-2 text-white/60">
              <span>
                هذا الأسبوع ·{" "}
                {weekDays === 0 ? (
                  "ثلاثة أيام مختلفة هي الهدف"
                ) : weekDays >= WEEKLY_TARGET_DAYS ? (
                  <>
                    <bdi>{ar(weekDays)}</bdi> أيام مختلفة
                  </>
                ) : (
                  <>
                    <bdi>{ar(weekDays)}</bdi> من <bdi>{ar(WEEKLY_TARGET_DAYS)}</bdi> أيام مختلفة
                  </>
                )}
              </span>
              {/* Decoration only: the same fact is in words beside it, and the
                  filled and empty glyphs differ in shape rather than in hue. */}
              <span data-testid="week-dots" aria-hidden="true" className="tracking-widest">
                {"●".repeat(Math.min(weekDays, WEEKLY_TARGET_DAYS))}
                {"○".repeat(Math.max(0, WEEKLY_TARGET_DAYS - weekDays))}
              </span>
            </p>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * `DueToday` with the ledger attached.
 *
 * The split is the usual one and it is load-bearing here: `DueToday` takes
 * `attempts` and `now` as arguments and touches no store and no clock, so every
 * string on it is decidable from its inputs. This wrapper is the only part that
 * cannot be, and it does nothing but read.
 *
 * Nothing is written and nothing is cached — the ledger is the single ground
 * truth, and a screen that showed a stored summary of it could be wrong about
 * it.
 */
export function DueTodayPanel({ data, onStart }: { data?: GameData; onStart?: () => void }) {
  const [attempts, setAttempts] = useState<readonly Attempt[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  /** Read once, at mount. A ticking clock would re-derive the whole screen every second for nothing. */
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    allAttempts().then(
      (rows) => live && setAttempts(rows),
      () => {
        if (!live) return;
        setAttempts([]);
        setUnavailable(true);
      },
    );
    return () => {
      live = false;
    };
  }, []);

  const roster = useMemo(
    () =>
      conceptRoster(
        // `conceptRoster` reads `conceptId` and nothing else; the other fields
        // are left blank rather than filled with a plausible drill, because
        // naming one would assert a pairing this screen never made. Building
        // the real questions — every game against every exemplar — is session
        // assembly's job, and this screen does not assemble sessions.
        (data?.letterPool ?? []).map(
          (l): Question => ({ conceptId: l.arabic, itemKey: "", gameId: "", payload: {} }),
        ),
      ),
    [data],
  );

  const scrollToDrills = () =>
    document.getElementById("interactive-practice")?.scrollIntoView({ behavior: "smooth" });

  if (attempts === null) return null;

  return (
    <DueToday
      attempts={attempts}
      roster={roster}
      now={now}
      data={data}
      unavailable={unavailable}
      onStart={onStart ?? scrollToDrills}
    />
  );
}
