"use client";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { GamePanel } from "@/components/games/GamePanel";
import { getGames } from "@/components/games/GameRegistry";
import { LETTER_GAME_IDS } from "@/components/games/letters";
import type { GameData } from "@/games/derive";
import { derive } from "@/practice/derive";
import { allAttempts } from "@/practice/ledger";
import type { Attempt } from "@/practice/types";
import {
  UNGRADED_GAME_IDS,
  conceptRoster,
  planSession,
  schedulesFromLedger,
  type PoolItem,
  type SessionPlan,
} from "@/practice/session";
import { DueTodayPanel } from "./DueToday";
import { SessionRunner } from "./SessionRunner";

/**
 * Every question a session could ask on this lesson's page.
 *
 * The registry is the only thing that knows what a drill can be asked — see
 * `GameEntry.exemplars` — so this is the one place the pool can come from, and
 * without it `planSession` receives nothing and every due concept is silently
 * undrawable.
 *
 * `gameId` is stamped from the entry that advertised the exemplar rather than
 * carried in it, because `Exemplar` deliberately does not name a drill: the
 * drills are the authority on what exists, and they must not depend on the
 * practice engine to say so.
 *
 * Unknown ids drop out via `getGames`, and a drill with no `exemplars` — or one
 * handed data it cannot use — contributes `[]`. Both are true answers, not
 * failures: a lesson naming a drill that has not shipped should plan around it,
 * not break.
 */
export function sessionPool(ids: readonly string[], data?: GameData): PoolItem[] {
  return getGames([...ids])
    .filter((g) => !UNGRADED_GAME_IDS.has(g.id))
    .flatMap((g) => (g.exemplars?.(data) ?? []).map((e) => ({ ...e, gameId: g.id })));
}

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
  /** Drill ids this lesson asks for, resolved through the registry. */
  games?: string[];
  children?: ReactNode;
}) {
  const [session, setSession] = useState<{ plan: SessionPlan; pool: readonly PoolItem[] } | null>(
    null,
  );

  // Keyed on the joined ids, not the array: the page passes a fresh array every
  // render, and rebuilding every drill's exemplar list on each one is wasted
  // work in a component that re-renders on every answer.
  const gameKey = games.join(",");
  const pool = useMemo(
    () => sessionPool([...LETTER_GAME_IDS, ...gameKey.split(",").filter(Boolean)], data),
    [gameKey, data],
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
    const roster = conceptRoster(pool);
    setSession({
      plan: planSession(
        schedulesFromLedger(attempts, roster, now),
        derive(attempts, now),
        pool,
        now,
      ),
      pool,
    });
  }, [pool]);

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
