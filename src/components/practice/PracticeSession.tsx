"use client";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { GamePanel } from "@/components/games/GamePanel";
import { SLICE_GAME_IDS } from "@/games2/games";
import { questionsFor } from "@/games2/registry";
import { setFromGameData } from "@/games2/studySetFromData";
import type { Question } from "@/games2/types";
import type { GameData } from "@/games/derive";
import { derive } from "@/practice/derive";
import { allAttempts } from "@/practice/ledger";
import { conceptRoster, planSession, schedulesFromLedger, type SessionPlan } from "@/practice/session";
import type { Attempt } from "@/practice/types";
import { DueTodayPanel } from "./DueToday";
import { SessionRunner } from "./SessionRunner";

/**
 * A day index, in the same clock `start` already reads for `now`.
 *
 * `planSession`'s `seed` has to be **stable but not fixed**: fixed (the
 * default, `undefined`) is what produced I1 — `rand` always returns `0`, so
 * `draw` always takes the first exemplar of the least-used shape, and every
 * learner on every lesson got the identical two-word session forever, however
 * large the pool behind it was. Reseeding from `Math.random()` at the other
 * extreme breaks the reason the default is fixed in the first place: the plan
 * is rebuilt from the ledger on every load rather than stored, so an unseeded
 * (or randomly seeded) draw would reshuffle the session out from under a
 * learner who merely refreshed mid-sitting.
 *
 * A day index is both: it is a pure function of `now`, so replanning from an
 * identical `now` still gives an identical plan (the existing "same inputs,
 * same plan" test holds), and it does not change again until the calendar
 * date does — which covers a refresh, and covers every session started the
 * same day — while still moving the exemplar draw from one day to the next.
 */
const DAY_MS = 86_400_000;
const seedFor = (now: number): number => Math.floor(now / DAY_MS);

/**
 * The practice engine's front door, and the only place it is reachable.
 *
 * Everything below it — the ledger, `derive`, the scheduler, session assembly,
 * the wrong-answer tail, `SessionRunner` — was built and tested before this
 * file existed, and recorded nothing, because `SessionRunner` was rendered
 * nowhere and `DueTodayPanel` was mounted without an `onStart`. Each part passed
 * in isolation precisely because nothing connected them.
 *
 * It is a client component because the page is not: `/practice/[id]` is a static
 * export, so the ledger read, the plan, and the session's state all have to
 * happen in the browser. That is also why the plan is built on the click rather
 * than at mount — it is a snapshot of the ledger *at the moment the learner
 * starts*, and building it earlier would plan a session against a ledger that
 * has since moved.
 *
 * The `StudySet` is built here, from the `data: GameData` prop, rather than by
 * importing `@/games2/studySet`'s `lessonSet`: that module imports `allLessons`
 * from `@/content/load` at module scope, which pulls in `node:fs`, and this
 * component is `"use client"`. `setFromGameData` lives in
 * `@/games2/studySetFromData` specifically because it is fs-free — see that
 * file — so this component can call it directly on the `data` the server page
 * already derived, with no import that drags a filesystem module into the
 * browser bundle.
 *
 * The pool the session plans over is every graded question the slice's games
 * can ask of that set (`SLICE_GAME_IDS`), not a lesson-specific list: unlike the
 * old registry's `PoolItem`s, a `Question` names its own concept, so nothing
 * here has to know in advance which concepts a lesson happens to teach.
 *
 * `children` renders between the panel and the drills so the page keeps its
 * original order, and is hidden along with everything else once a session is
 * running: a session is a focused activity, and leaving the lesson's own
 * material on screen beside it invites the learner to answer from the page.
 */
export function PracticeSession({
  data,
  games = [],
  children,
}: {
  data: GameData;
  /** Drill ids this lesson asks for, resolved through the *old* registry for `GamePanel` below. */
  games?: string[];
  children?: ReactNode;
}) {
  const [session, setSession] = useState<{ plan: SessionPlan; pool: readonly Question[] } | null>(
    null,
  );

  // `id` and `title` are the same string: nothing downstream of this set reads
  // `title` for anything a session needs, and `data` carries no lesson title of
  // its own to give it instead.
  const set = useMemo(() => setFromGameData(data, data.lessonId, data.lessonId), [data]);
  const questions = useMemo(
    () => questionsFor([...SLICE_GAME_IDS], set, { gradedOnly: true }),
    [set],
  );

  const start = useCallback(async () => {
    const now = Date.now();
    let attempts: readonly Attempt[] = [];
    try {
      attempts = await allAttempts();
    } catch {
      // A ledger that cannot be read is a learner with no history, not a learner
      // who cannot practise. `DueToday` already says so on screen; refusing to
      // start here would take practice away over a storage fault.
      attempts = [];
    }
    const roster = conceptRoster(questions);
    setSession({
      plan: planSession(
        schedulesFromLedger(attempts, roster, now),
        derive(attempts, now),
        questions,
        now,
        { seed: seedFor(now) },
      ),
      pool: questions,
    });
  }, [questions]);

  if (session) {
    return (
      <SessionRunner
        plan={session.plan}
        pool={session.pool}
        data={data}
        onExit={() => setSession(null)}
      />
    );
  }

  return (
    <>
      {/* What is due, what needs work, and how consistently the learner has
          turned up. It reads the ledger in the browser, so it renders nothing
          during a static export — which is why it sits above content that does
          not depend on it rather than replacing any of it. */}
      <DueTodayPanel data={data} onStart={start} />
      {children}
      {/* `DueToday`'s scroll fallback still points here. It is unreachable from
          this page now that a real `onStart` is passed, and kept because the id
          is what that fallback names for every other caller. */}
      <section id="interactive-practice" className="glass mb-8 rounded-2xl p-4 print:hidden sm:p-5">
        <GamePanel data={data} heading="Interactive practice" games={games} />
      </section>
    </>
  );
}
