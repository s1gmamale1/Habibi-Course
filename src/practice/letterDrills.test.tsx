/**
 * The end-to-end proof for Task 6d: **a letter concept accumulates ledger rows
 * from a real drill, and its FSRS schedule moves off its seed.**
 *
 * This is the whole point of giving the four objective letter drills an
 * `onResult`. Task 6b gave all six a `gameId` and a response mode, but none of
 * them emitted anything, so **29 of the 47 concepts** — 62% of the roster and the
 * entire first half of the course — could never produce a single row. Their
 * schedules would sit on `newSchedule`'s seed forever: permanently due,
 * permanently unknown, however much the learner practised.
 *
 * So this test refuses to assert on a prop. It renders the real components,
 * clicks the real buttons, routes the results through the real `useSession` into
 * the real (fake-backed) IndexedDB ledger, reads the rows back out, and replays
 * them through the real `schedulesFromLedger`. Anything less would prove a
 * callback exists, not that the data flows.
 *
 * jsdom ships no IndexedDB; `fake-indexeddb/auto` installs one, exactly as
 * `ledger.test.ts` and `useSession.test.ts` do.
 */
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { State } from "ts-fsrs";

import type { ArabicItem } from "@/content/schema";
import { FormSwap } from "@/components/games/FormSwap";
import { LetterQuiz } from "@/components/games/LetterQuiz";
import { SpotTheLetter } from "@/components/games/SpotTheLetter";
import { WordBuilder } from "@/components/games/WordBuilder";
import type { GameResult } from "@/components/games/GameRegistry";
import { derive } from "./derive";
import { allAttempts } from "./ledger";
import { newSchedule } from "./schedule";
import { schedulesFromLedger, shapeOf, type PlannedItem, type PoolItem, type SessionPlan } from "./session";
import { useSession } from "./useSession";

/** The concept every row in this file is keyed to — a letter, not a rule. */
const LETTER = "ب";
const NOW = 1_700_000_000_000;

/**
 * Outside the component on purpose. A counter declared in a render body is reset
 * by every re-render, and each answer causes one — so every row would land on the
 * same `at` and `orderedAttempts`'s UUID tiebreak would decide their order.
 */
let clock = NOW;

afterEach(() => vi.restoreAllMocks());
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  clock = NOW;
});

const tick = () => (clock += 1000);

const mk = (arabic: string, name: string): ArabicItem => ({
  arabic,
  name,
  audio: { type: "teacher-voice", cue: "c" },
});
const letterPool = [mk("ا", "alif"), mk("ب", "ba"), mk("ت", "ta"), mk("ث", "tha")];

/** Exemplars of one letter, plentiful enough that the tail always has a draw. */
function poolFor(gameId: string, n: number): PoolItem[] {
  return Array.from({ length: n }, (_, i) => ({
    conceptId: LETTER,
    itemKey: `${LETTER}/${gameId}/${i}`,
    gameId,
  }));
}

function planFrom(pool: readonly PoolItem[]): SessionPlan {
  const items: PlannedItem[] = pool.map((p) => ({ ...p, ...shapeOf(p.gameId), isInterleaved: false }));
  return { focusConceptId: LETTER, items, slots: items.length };
}

/**
 * Mounts a drill with its `onResult` wired to a real session runner, so every
 * click travels the production path: drill → `useSession.submit` →
 * `attemptFromResult` → `appendAttempt` → IndexedDB.
 */
function Harness({
  gameId,
  children,
}: {
  gameId: string;
  children: (onResult: (r: GameResult) => void, now: () => number) => ReactNode;
}) {
  const [pool] = useState(() => poolFor(gameId, 12));
  const [plan] = useState(() => planFrom(pool));
  const runner = useSession(plan, pool, { sessionId: "session-6d" });
  return <>{children(runner.submit, tick)}</>;
}

describe("a letter concept's schedule moves off its seed", () => {
  test("LetterQuiz rows reach the ledger and reschedule the letter", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(
      <Harness gameId="letter-quiz">
        {(onResult, now) => (
          <LetterQuiz pool={letterPool} entries={[]} formsTaught={false} onResult={onResult} now={now} />
        )}
      </Harness>,
    );
    await screen.findByText(/which letter is/i);

    // A miss, then the answer — the shape a real round takes.
    await userEvent.click(screen.getByRole("button", { name: "choice ت" }));
    await userEvent.click(screen.getByRole("button", { name: "choice ب" }));

    const rows = await waitFor(async () => {
      const all = await allAttempts();
      expect(all).toHaveLength(2);
      return all;
    });

    // The rows are real, keyed to the letter, and carry both verdicts.
    expect(rows.map((r) => r.conceptId)).toEqual([LETTER, LETTER]);
    expect(rows.map((r) => r.correct)).toEqual([false, true]);
    expect(rows.map((r) => r.gameId)).toEqual(["letter-quiz", "letter-quiz"]);
    // Never a fabricated measurement on a drill that measured nothing.
    for (const r of rows) {
      expect(r.measuredHarakat).toBeUndefined();
      expect(r.targetHarakat).toBeUndefined();
      expect(r.msPerHarakah).toBeUndefined();
    }

    // The letter now has derived state where it had none.
    const state = derive(rows, NOW + 60_000).get(LETTER);
    expect(state?.attempts).toBe(2);
    expect(state?.correct).toBe(1);

    // And the schedule has moved: it is no longer the seed.
    const schedule = schedulesFromLedger(rows, [LETTER], NOW + 60_000).get(LETTER)!;
    const seed = newSchedule(LETTER, NOW + 60_000);
    expect(schedule.state).not.toBe(State.New);
    expect(seed.state).toBe(State.New);
    expect(schedule.reps).toBeGreaterThan(0);
    expect(schedule.due.getTime()).toBeGreaterThan(seed.due.getTime());
  });

  test("all four objective drills feed the same concept's ledger", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const play = async (
      gameId: string,
      node: (o: (r: GameResult) => void, n: () => number) => ReactNode,
      clicks: () => Promise<void>,
    ) => {
      const view = render(<Harness gameId={gameId}>{node}</Harness>);
      await clicks();
      view.unmount();
    };

    await play(
      "spot-the-letter",
      (onResult, now) => (
        <SpotTheLetter
          words={[{ arabic: "شَمْس", translit: "shams", meaning: "sun" }]}
          pool={[mk("ش", "sheen"), mk("م", "meem"), mk("س", "seen")]}
          onResult={onResult}
          now={now}
        />
      ),
      async () => {
        await screen.findByText(/Tap the letter/);
        await userEvent.click(screen.getByRole("button", { name: "word letter 2" }));
      },
    );

    await play(
      "form-swap",
      (onResult, now) => (
        <FormSwap
          entries={[
            {
              item: mk("ب", "ba"),
              forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
            },
          ]}
          onResult={onResult}
          now={now}
        />
      ),
      async () => {
        await userEvent.click(await screen.findByRole("button", { name: "Alone slot" }));
        await userEvent.click(screen.getByRole("button", { name: "End slot" }));
      },
    );

    await play(
      "word-builder",
      (onResult, now) => (
        <WordBuilder words={[{ arabic: "شَمْس", translit: "shams", meaning: "sun" }]} onResult={onResult} now={now} />
      ),
      async () => {
        await screen.findByRole("button", { name: "bank letter م 1" });
        await userEvent.click(screen.getByRole("button", { name: "bank letter ش 3" }));
        await userEvent.click(screen.getByRole("button", { name: "bank letter م 1" }));
        await userEvent.click(screen.getByRole("button", { name: "bank letter س 2" }));
      },
    );

    const rows = await waitFor(async () => {
      const all = await allAttempts();
      expect(all).toHaveLength(3);
      return all;
    });
    expect([...new Set(rows.map((r) => r.gameId))].sort()).toEqual([
      "form-swap",
      "spot-the-letter",
      "word-builder",
    ]);
    expect(rows.every((r) => r.conceptId === LETTER)).toBe(true);
    expect(rows.every((r) => r.correct === true)).toBe(true);

    const schedule = schedulesFromLedger(rows, [LETTER], NOW + 60_000).get(LETTER)!;
    expect(schedule.state).not.toBe(State.New);
    expect(schedule.reps).toBe(3);
  });
});
