/**
 * The one module in `src/practice/` that is allowed to touch storage and a
 * clock, so unlike `derive`/`schedule`/`session` its test needs both: jsdom
 * ships no IndexedDB, and `fake-indexeddb/auto` installs one on `globalThis`
 * exactly as `ledger.test.ts` does.
 *
 * `./ledger` is mocked through to its **real** implementation rather than
 * replaced. Every assertion about what was written therefore reads the rows
 * back out of the store — a stubbed append would only prove the hook called a
 * function — while the one test that needs a write to fail can still make it
 * fail, which no amount of real IndexedDB would let us arrange.
 *
 * `Date.now` is mocked to an incrementing counter, in place of the old
 * `GameResult.at` field the hook no longer reads: `record`/`submit` mint `at`
 * from the clock themselves, and two rows written in the same real millisecond
 * would otherwise tie on IndexedDB's `at` index and sort by a random UUID
 * instead of by the order they were answered in.
 */
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { act, renderHook, waitFor, type RenderHookResult } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("./ledger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ledger")>();
  return { ...actual, appendAttempt: vi.fn(actual.appendAttempt) };
});

import { getGame, registerGame } from "@/games2/registry";
import type { AnswerDetail, Question, ResponseMode } from "@/games2/types";
import { allAttempts, appendAttempt } from "./ledger";
import type { PlannedQuestion, SessionPlan } from "./session";
import type { Attempt } from "./types";
import {
  MAX_TAIL_ATTEMPTS_PER_CONCEPT,
  MAX_TAIL_ITEMS,
  useSession,
  type SessionRunner,
} from "./useSession";

/** The three shapes this file's fixtures need, registered once for the module. */
registerGame({
  id: "rule-identifier",
  label: "rule-identifier",
  mode: "recognition",
  cost: 1,
  graded: true,
  questions: () => [],
  render: () => null,
});
registerGame({
  id: "span-tapper",
  label: "span-tapper",
  mode: "discrimination",
  cost: 1,
  graded: true,
  questions: () => [],
  render: () => null,
});
registerGame({
  id: "ghunnah-timer",
  label: "ghunnah-timer",
  mode: "production",
  cost: 2,
  graded: true,
  questions: () => [],
  render: () => null,
});

function shapeFor(gameId: string): { mode: ResponseMode; slots: number } {
  const spec = getGame(gameId);
  if (!spec) throw new Error(`test fixture: no game registered for "${gameId}"`);
  return { mode: spec.mode, slots: spec.cost };
}

/** One planned item, shaped the way `planSession` shapes one. */
function item(
  conceptId: string,
  gameId: string,
  n: number,
  isInterleaved = false,
): PlannedQuestion {
  return {
    conceptId,
    itemKey: `${conceptId}/${gameId}/${n}`,
    gameId,
    payload: {},
    ...shapeFor(gameId),
    isInterleaved,
  };
}

function plan(items: PlannedQuestion[]): SessionPlan {
  return {
    focusConceptId: items[0]?.conceptId ?? null,
    items,
    slots: items.reduce((n, i) => n + i.slots, 0),
  };
}

/** Several exemplars of every named drill for every named concept. */
function poolFor(
  conceptIds: readonly string[],
  gameIds: readonly string[] = ["rule-identifier", "span-tapper"],
  per = 3,
): Question[] {
  const out: Question[] = [];
  for (const conceptId of conceptIds) {
    for (const gameId of gameIds) {
      for (let n = 1; n <= per; n += 1) {
        out.push({ conceptId, itemKey: `${conceptId}/${gameId}/${n}`, gameId, payload: {} });
      }
    }
  }
  return out;
}

type Session = RenderHookResult<SessionRunner, unknown>;

function run(items: PlannedQuestion[], pool: readonly Question[]): Session {
  return renderHook(() => useSession(plan(items), pool, { sessionId: "s-test" }));
}

/** Answer whatever is on screen, and hand back what it was. */
function answerCurrent(
  session: Session,
  correct: boolean | null,
  detail?: AnswerDetail,
): PlannedQuestion {
  const shown = session.result.current.current;
  if (!shown) throw new Error("nothing to answer: the session is already complete");
  act(() => session.result.current.submit(shown, correct, detail));
  return shown;
}

/** Answer everything still queued, tail included, with one verdict. */
function answerAll(session: Session, correct: boolean | null): PlannedQuestion[] {
  const shown: PlannedQuestion[] = [];
  // The tail can grow while this loop runs, so the bound is the guard against a
  // hang rather than the loop's real exit condition.
  for (let guard = 0; guard < 200 && !session.result.current.isComplete; guard += 1) {
    shown.push(answerCurrent(session, correct));
  }
  return shown;
}

const rowsWritten = (n: number) =>
  waitFor(async () => expect(await allAttempts()).toHaveLength(n));

let clock = 1_700_000_000_000;

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  vi.mocked(appendAttempt).mockClear();
  clock = 1_700_000_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => (clock += 1_000));
});

afterEach(() => vi.restoreAllMocks());

describe("the wrong-answer tail", () => {
  test("a miss re-queues a DIFFERENT exemplar of the same concept", () => {
    const first = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const session = run([first], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, false);

    expect(session.result.current.tailLength).toBe(1);
    const requeued = session.result.current.current!;
    expect(requeued.conceptId).toBe("idgham_maal_ghunnah");
    // The load-bearing assertion. Replaying the identical question is answered
    // from memory of the correction just read, not from the rule.
    expect(requeued.itemKey).not.toBe(first.itemKey);
  });

  test("the re-queued exemplar was not already shown earlier in the session", () => {
    const shownEarlier = item("idgham_maal_ghunnah", "span-tapper", 1);
    const missed = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const session = run([shownEarlier, missed], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, true);
    answerCurrent(session, false);

    const requeued = session.result.current.current!;
    expect(requeued.itemKey).not.toBe(shownEarlier.itemKey);
    expect(requeued.itemKey).not.toBe(missed.itemKey);
  });

  test("it prefers a different drill shape when the concept has one", () => {
    const missed = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const session = run([missed], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, false);

    // Two untouched `rule-identifier` exemplars are available and deliberately
    // not chosen: a second retrieval in a second shape tests the rule, a second
    // retrieval in the same shape tests the shape.
    expect(session.result.current.current!.gameId).toBe("span-tapper");
  });

  test("the session does not end while the tail is non-empty", () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, false);

    expect(session.result.current.tailLength).toBe(1);
    expect(session.result.current.isComplete).toBe(false);
    expect(session.result.current.current).not.toBeNull();

    answerCurrent(session, true);

    expect(session.result.current.tailLength).toBe(0);
    expect(session.result.current.isComplete).toBe(true);
  });

  test("a correct answer queues nothing", () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, true);

    expect(session.result.current.tailLength).toBe(0);
    expect(session.result.current.isComplete).toBe(true);
  });

  test("the tail is bounded at 6 items", () => {
    const concepts = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];
    const items = concepts.map((c) => item(c, "rule-identifier", 1));
    const session = run(items, poolFor(concepts));

    for (let n = 0; n < concepts.length; n += 1) answerCurrent(session, false);

    expect(MAX_TAIL_ITEMS).toBe(6);
    expect(session.result.current.tailLength).toBe(MAX_TAIL_ITEMS);
    // The two misses the cap refused are not dropped on the floor: a miss that
    // cannot be retried is scheduling information for the next session.
    expect(session.result.current.flagged).toEqual(["c7", "c8"]);
  });

  test("at most 2 tail attempts per concept, however often it is missed", () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    const shown = answerAll(session, false);

    expect(MAX_TAIL_ATTEMPTS_PER_CONCEPT).toBe(2);
    // One planned item plus two tail retries, and then it stops — the pool has
    // six exemplars, so nothing but the cap is holding it back.
    expect(shown).toHaveLength(1 + MAX_TAIL_ATTEMPTS_PER_CONCEPT);
    expect(new Set(shown.map((i) => i.itemKey)).size).toBe(shown.length);
  });

  test("even with one drill shape only, each retry is a fresh exemplar", () => {
    // The shape preference does most of the work in a mixed pool and would hide
    // a tail that forgot what it had already queued. Here there is nothing to
    // alternate with, so only the used-set can keep the retries distinct.
    const session = run(
      [item("idgham_maal_ghunnah", "rule-identifier", 1)],
      poolFor(["idgham_maal_ghunnah"], ["rule-identifier"], 3),
    );

    const shown = answerAll(session, false);

    expect(shown.map((i) => i.gameId)).toEqual(["rule-identifier", "rule-identifier", "rule-identifier"]);
    expect(new Set(shown.map((i) => i.itemKey)).size).toBe(3);
  });

  test("a concept still failing after 2 tail attempts is flagged, and the session ends", () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    answerAll(session, false);

    expect(session.result.current.flagged).toEqual(["idgham_maal_ghunnah"]);
    expect(session.result.current.isComplete).toBe(true);
    // No hearts, no lockout: the cap ends the session, nothing ends the learner.
    expect(session.result.current.tailLength).toBe(0);
  });

  test("a concept repaired in the tail is not flagged", () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, false);
    answerCurrent(session, true);

    expect(session.result.current.flagged).toEqual([]);
    expect(session.result.current.isComplete).toBe(true);
  });

  test("with no unused exemplar left the tail degrades: nothing queued, no repeat, no hang", () => {
    const only = item("idgham_maal_ghunnah", "rule-identifier", 1);
    // The pool holds exactly the one exemplar the plan already used.
    const session = run(
      [only],
      [{ conceptId: only.conceptId, itemKey: only.itemKey, gameId: only.gameId, payload: only.payload }],
    );

    answerCurrent(session, false);

    expect(session.result.current.tailLength).toBe(0);
    expect(session.result.current.current).toBeNull();
    expect(session.result.current.isComplete).toBe(true);
    // Carried forward instead: the concept was missed and could not be retried.
    expect(session.result.current.flagged).toEqual(["idgham_maal_ghunnah"]);
  });

  test("progress counts the tail, so the total grows when a miss adds to it", () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    expect(session.result.current.progress).toEqual({ done: 0, total: 1 });
    answerCurrent(session, false);
    expect(session.result.current.progress).toEqual({ done: 1, total: 2 });
  });
});

describe("what the session writes", () => {
  test("every submit appends exactly one attempt row", async () => {
    const items = [item("idgham_maal_ghunnah", "rule-identifier", 1), item("ikhfa_haqiqi", "span-tapper", 1)];
    const session = run(items, poolFor(["idgham_maal_ghunnah", "ikhfa_haqiqi"]));

    answerCurrent(session, true);
    await rowsWritten(1);
    answerCurrent(session, true);
    await rowsWritten(2);

    const rows = await allAttempts();
    expect(rows.map((r) => r.itemKey)).toEqual(items.map((i) => i.itemKey));
    expect(rows.map((r) => r.conceptId)).toEqual(["idgham_maal_ghunnah", "ikhfa_haqiqi"]);
    expect(rows.map((r) => r.correct)).toEqual([true, true]);
  });

  test("a tail attempt is a row of its own, so a miss writes two rows in total", async () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, false);
    answerCurrent(session, true);

    await rowsWritten(2);
    const rows = await allAttempts();
    expect(rows.map((r) => r.correct)).toEqual([false, true]);
    // Append-only: the repair does not overwrite the miss.
    expect(rows[0].itemKey).not.toBe(rows[1].itemKey);
  });

  test("an ungraded submit appends `correct: null` AND queues nothing", async () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, null);

    await rowsWritten(1);
    const [row] = await allAttempts();
    expect(row.correct).toBeNull();
    expect("correct" in row).toBe(true);
    // No verdict is not a failure. Nothing may be re-queued on the strength of
    // a miss the learner never had.
    expect(session.result.current.tailLength).toBe(0);
    expect(session.result.current.flagged).toEqual([]);
    expect(session.result.current.isComplete).toBe(true);
  });

  test("isInterleaved is copied from the planned item, never inferred", async () => {
    const items = [
      item("idgham_maal_ghunnah", "rule-identifier", 1, false),
      item("ikhfa_haqiqi", "span-tapper", 1, true),
    ];
    const session = run(items, poolFor(["idgham_maal_ghunnah", "ikhfa_haqiqi"]));

    answerCurrent(session, true);
    answerCurrent(session, true);

    await rowsWritten(2);
    expect((await allAttempts()).map((r) => r.isInterleaved)).toEqual([false, true]);
  });

  test("a tail retry is never recorded as interleaved", async () => {
    const session = run([item("ikhfa_haqiqi", "span-tapper", 1, true)], poolFor(["ikhfa_haqiqi"]));

    answerCurrent(session, false);
    answerCurrent(session, true);

    await rowsWritten(2);
    const rows = await allAttempts();
    // The interleaved flag is the retention instrument — "did this concept
    // survive being left alone". A retry two minutes after corrective feedback
    // measures repair, not survival, so counting it would inflate the one
    // number it exists to report.
    expect(rows.map((r) => r.isInterleaved)).toEqual([true, false]);
  });

  test("the measurement survives the hook", async () => {
    const shown = item("ghunnah", "ghunnah-timer", 1);
    const session = run([shown], poolFor(["ghunnah"]));

    answerCurrent(session, true, { msPerHarakah: 470, targetHarakat: 2, measuredHarakat: 2 });

    await rowsWritten(1);
    const [row] = await allAttempts();
    expect(row.msPerHarakah).toBe(470);
    expect(row.measuredHarakat).toBe(2);
    expect(row.targetHarakat).toBe(2);
  });

  test("the hook mints one sessionId and every row carries it", async () => {
    const items = [item("idgham_maal_ghunnah", "rule-identifier", 1), item("ikhfa_haqiqi", "span-tapper", 1)];
    const session = renderHook(() => useSession(plan(items), poolFor(["idgham_maal_ghunnah", "ikhfa_haqiqi"])));

    answerCurrent(session, true);
    answerCurrent(session, true);

    await rowsWritten(2);
    const rows = await allAttempts();
    const minted = session.result.current.sessionId;
    expect(minted).toMatch(/\S/);
    expect(rows.map((r) => r.sessionId)).toEqual([minted, minted]);

    // `planSession` is pure and deliberately mints nothing, so this is the only
    // place an id can come from — and a second sitting has to be a second id.
    const other = renderHook(() => useSession(plan(items), poolFor(["idgham_maal_ghunnah"])));
    expect(other.result.current.sessionId).not.toBe(minted);
  });

  test("the id is stable across re-renders", () => {
    const items = [item("idgham_maal_ghunnah", "rule-identifier", 1)];
    const session = renderHook(() => useSession(plan(items), poolFor(["idgham_maal_ghunnah"])));
    const first = session.result.current.sessionId;

    session.rerender();
    answerCurrent(session, true);

    expect(session.result.current.sessionId).toBe(first);
  });

  test("submitting once the session is over writes nothing", async () => {
    const shown = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const session = run([shown], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, true);
    await rowsWritten(1);
    act(() => session.result.current.submit(shown, false));

    // A late result from a question that has already been left behind is not an
    // attempt at anything, so it is not a row — and it must not queue a tail.
    await expect(allAttempts()).resolves.toHaveLength(1);
    expect(session.result.current.tailLength).toBe(0);
  });

  test("a failed append does not lose the session", async () => {
    vi.mocked(appendAttempt).mockRejectedValueOnce(new Error("QuotaExceededError"));
    const items = [item("idgham_maal_ghunnah", "rule-identifier", 1), item("ikhfa_haqiqi", "span-tapper", 1)];
    const session = run(items, poolFor(["idgham_maal_ghunnah", "ikhfa_haqiqi"]));

    answerCurrent(session, true);

    // The learner is not stopped, and the failure is not silent: it is counted
    // on the surface so a screen can say so without blocking anything.
    await waitFor(() => expect(session.result.current.writeFailures).toBe(1));
    expect(session.result.current.current!.conceptId).toBe("ikhfa_haqiqi");

    answerCurrent(session, true);

    // The next row still lands: one rejected write does not poison the rest.
    await rowsWritten(1);
    expect((await allAttempts())[0].conceptId).toBe("ikhfa_haqiqi");
  });

  test("nothing on screen waits on the write", () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    // `submit` is not async and does not return a promise: `answerCurrent`
    // advanced the session inside a synchronous `act`, with no IndexedDB round
    // trip awaited anywhere between the answer and the next question.
    answerCurrent(session, true);

    expect(session.result.current.isComplete).toBe(true);
    expect(session.result.current.progress.done).toBe(1);
  });
});

describe("the hook's own bookkeeping", () => {
  test("an empty plan is complete from the start and shows nothing", () => {
    const session = run([], []);

    expect(session.result.current.current).toBeNull();
    expect(session.result.current.isComplete).toBe(true);
    expect(session.result.current.progress).toEqual({ done: 0, total: 0 });
  });

  test("a concept is flagged once, however many times it runs out of retries", () => {
    const items = [item("idgham_maal_ghunnah", "rule-identifier", 1), item("idgham_maal_ghunnah", "span-tapper", 1)];
    // One spare exemplar only: the second miss has nothing left to draw.
    const pool: Question[] = [
      ...items,
      { conceptId: "idgham_maal_ghunnah", itemKey: "idgham_maal_ghunnah/rule-identifier/2", gameId: "rule-identifier", payload: {} },
    ];
    const session = run(items, pool);

    answerAll(session, false);

    expect(session.result.current.flagged).toEqual(["idgham_maal_ghunnah"]);
  });

  test("submit keeps its identity, so passing it to a drill does not re-render it", () => {
    const items = [item("idgham_maal_ghunnah", "rule-identifier", 1), item("idgham_maal_ghunnah", "span-tapper", 1)];
    // A caller that builds its plan and pool inline hands over a new array on
    // every render, which is the normal case and must not churn the callback.
    const session = renderHook(() =>
      useSession(plan(items), poolFor(["idgham_maal_ghunnah"]), { sessionId: "s-test" }),
    );
    const first = session.result.current.submit;

    session.rerender();
    answerCurrent(session, false);

    expect(session.result.current.submit).toBe(first);
  });

  test("the tail preserves the shape of what it draws", () => {
    const session = run(
      [item("ghunnah", "rule-identifier", 1)],
      poolFor(["ghunnah"], ["rule-identifier", "ghunnah-timer"]),
    );

    answerCurrent(session, false);

    const requeued = session.result.current.current!;
    // `slots` and `mode` come from the game's registered shape, not from
    // whatever the missed item happened to be: a two-slot held drill still
    // costs two.
    expect(requeued).toMatchObject(shapeFor(requeued.gameId) satisfies Partial<PlannedQuestion>);
  });

  test("the row is built from the question directly, so a bare answer gets no invented fields", async () => {
    const session = run([item("idgham_maal_ghunnah", "rule-identifier", 1)], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, true);

    await rowsWritten(1);
    const [row] = await allAttempts();
    const optional: (keyof Attempt)[] = [
      "measuredHarakat",
      "targetHarakat",
      "acceptedHarakat",
      "msPerHarakah",
    ];
    // Omitted, not `undefined` — absence is what downstream reads as "nothing
    // was measured", and a present key with an empty value blurs it.
    for (const key of optional) expect(key in row).toBe(false);
    expect(row.id).toMatch(/\S/);
  });
});

/**
 * Recording an answer and leaving the question are two different events.
 *
 * A `GameApi` fires once per *graded move*, so a hook that advanced on every
 * result would spend three planned slots on one question answered
 * wrong-wrong-right. `submit` — the composite the tests above exercise — is
 * unchanged; these are the two halves it is made of.
 */
describe("record and advance", () => {
  test("record writes the row and stays on the question", async () => {
    const first = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const session = run([first, item("ikhfa_haqiqi", "span-tapper", 1)], poolFor(["idgham_maal_ghunnah", "ikhfa_haqiqi"]));

    act(() => session.result.current.record(first, false));

    expect(session.result.current.current!.itemKey).toBe(first.itemKey);
    expect(session.result.current.progress.done).toBe(0);
    await rowsWritten(1);
  });

  test("a second graded move is a row, and nothing else", async () => {
    const first = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const session = run([first], poolFor(["idgham_maal_ghunnah"]));

    act(() => session.result.current.record(first, false));
    const queued = session.result.current.tailLength;
    act(() => session.result.current.record(first, true));

    await rowsWritten(2);
    // The question was decided by the first graded answer. Repairing it inside
    // the drill must not spend a second of the concept's two retries, and must
    // not rewrite the verdict the tail was queued on.
    expect(session.result.current.tailLength).toBe(queued);
    expect(session.result.current.verdict).toBe(false);
    expect(session.result.current.current!.itemKey).toBe(first.itemKey);
  });

  test("verdict reports unanswered, ungraded and decided as three different things", () => {
    const shown = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const session = run([shown], poolFor(["idgham_maal_ghunnah"]));

    expect(session.result.current.verdict).toBeUndefined();
    act(() => session.result.current.record(shown, null));
    // Answered, but the drill graded nothing — so there is no verdict to report
    // and the question can still be decided.
    expect(session.result.current.verdict).toBeNull();
    act(() => session.result.current.record(shown, true));
    expect(session.result.current.verdict).toBe(true);
  });

  test("advance moves on, and clears the answer with the question", () => {
    const first = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const second = item("ikhfa_haqiqi", "span-tapper", 1);
    const session = run([first, second], poolFor(["idgham_maal_ghunnah", "ikhfa_haqiqi"]));

    act(() => session.result.current.record(first, true));
    act(() => session.result.current.advance());

    expect(session.result.current.current!.itemKey).toBe(second.itemKey);
    expect(session.result.current.progress.done).toBe(1);
    expect(session.result.current.verdict).toBeUndefined();
  });

  test("advance does nothing while the question is unanswered", async () => {
    const first = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const session = run([first, item("ikhfa_haqiqi", "span-tapper", 1)], poolFor(["idgham_maal_ghunnah", "ikhfa_haqiqi"]));

    act(() => session.result.current.advance());

    // Stepping over a question would spend a planned slot with no row to show
    // for it, and the ledger is where a session's length is recoverable from.
    expect(session.result.current.current!.itemKey).toBe(first.itemKey);
    expect(session.result.current.progress.done).toBe(0);
    await expect(allAttempts()).resolves.toHaveLength(0);
  });

  test("advance past the end is not a way to run off it", () => {
    const shown = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const session = run([shown], poolFor(["idgham_maal_ghunnah"]));

    answerCurrent(session, true);
    act(() => session.result.current.advance());

    expect(session.result.current.progress.done).toBe(1);
    expect(session.result.current.isComplete).toBe(true);
    expect(session.result.current.current).toBeNull();
  });
});

describe("recording a question that is not the one on screen", () => {
  test("a stale question is dropped: no row, no state change", async () => {
    const first = item("idgham_maal_ghunnah", "rule-identifier", 1);
    const second = item("ikhfa_haqiqi", "span-tapper", 1);
    const session = run([first, second], poolFor(["idgham_maal_ghunnah", "ikhfa_haqiqi"]));

    answerCurrent(session, true);
    act(() => session.result.current.advance());
    // `first` is no longer on screen; a late result naming it must not land.
    act(() => session.result.current.record(first, false));

    await expect(allAttempts()).resolves.toHaveLength(1);
    expect(session.result.current.current!.itemKey).toBe(second.itemKey);
    expect(session.result.current.verdict).toBeUndefined();
  });
});
