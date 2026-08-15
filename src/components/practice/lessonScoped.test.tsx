/**
 * Task 10, step 1: the end-to-end claim for "Practice this lesson".
 *
 * `PracticeSession.test.tsx` already checks that starting a lesson-practice
 * session on `3-23` opens with the right concept (`iqlab`) on screen. This
 * file goes one step further, all the way through a real sitting: click
 * "Practice this lesson", answer every question the session hands out —
 * whichever of the four registered slice games (`broken-form`, `match-answer`,
 * `fill-blank`, `build-by-form`) it happens to be — until the session reports
 * itself complete, then read the rows straight back out of a real
 * `fake-indexeddb` ledger.
 *
 * Two claims, matching the brief:
 *   1. the session actually reaches more than one game — not two questions in
 *      one mode band mistaken for variety, the same complaint `contract.test.ts`
 *      already gates at the pool level, checked here at the session level instead.
 *   2. every row the sitting writes names a concept `lessonConcepts("3-23")`
 *      actually reports — never an invented id, never a concept from some
 *      other lesson's cumulative pool.
 *
 * `fake-indexeddb/auto` for the same reason every other end-to-end file in
 * this directory needs it: jsdom ships no IndexedDB, and the claim here is
 * read back out of the store rather than asserted against a spy.
 */
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";

import { allLessons } from "@/content/load";
import { deriveGameData } from "@/games/derive";
import { lessonConcepts } from "@/games2/lessonConcepts";
import { allAttempts } from "@/practice/ledger";
import { PracticeSession } from "./PracticeSession";

const LESSON_ID = "3-23";

beforeEach(() => {
  // A fresh store per test: the ledger is append-only, so a row from an
  // earlier test would be indistinguishable from this one's.
  globalThis.indexedDB = new IDBFactory();
});

/**
 * Answers whatever question is currently on screen, however many clicks that
 * takes.
 *
 * Three of the four slice games grade on the first click (`match-answer`,
 * `fill-blank`, `broken-form`) — every option button carries `aria-disabled`
 * once picked, so "the first clickable button" is also "the only click this
 * question needs". `build-by-form` does not: it grades only once every tile
 * has been placed, so the same loop just keeps clicking freshly-rendered tile
 * buttons (each placed tile leaves the bank, so "the first clickable button"
 * is a different button every time) until a verdict lands and متابعة goes
 * live.
 */
async function answerCurrentQuestion(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const continueButton = () => screen.getByRole("button", { name: /متابعة/ });
  while (continueButton().hasAttribute("disabled")) {
    const drill = screen.getByTestId("drill-band");
    const clickable = within(drill)
      .getAllByRole("button")
      .find((b) => b.getAttribute("aria-disabled") !== "true");
    if (!clickable) break;
    await user.click(clickable);
  }
}

describe("a full lesson-practice sitting on 3-23", () => {
  test("reaches at least two distinct games, and every row it writes names a concept 3-23 taught", async () => {
    const user = userEvent.setup();
    const data = deriveGameData(allLessons(), LESSON_ID);
    render(<PracticeSession data={data} games={[]} />);

    await user.click(await screen.findByTestId("practice-lesson"));
    await screen.findByTestId("session-runner");

    const gameIds = new Set<string>();
    // A hard stop, not a real limit: `MAX_TAIL_ITEMS` (6) already bounds a real
    // sitting, so anything past a generous multiple of that is a stuck loop in
    // the test, not a long session.
    for (let guard = 0; guard < 100 && !screen.queryByTestId("session-complete"); guard += 1) {
      const gameId = screen.getByTestId("drill-band").dataset.gameId;
      if (gameId) gameIds.add(gameId);
      await answerCurrentQuestion(user);
      await user.click(screen.getByRole("button", { name: /متابعة/ }));
    }

    expect(await screen.findByTestId("session-complete")).toBeTruthy();
    // The owner's complaint, at the session level: two questions in one mode
    // band is not "at least two distinct games" — `contract.test.ts` already
    // gates the pool for this; this is the same claim about what a real
    // sitting actually shows.
    expect(gameIds.size).toBeGreaterThanOrEqual(2);

    const taught = new Set(lessonConcepts(LESSON_ID));
    expect(taught.size).toBeGreaterThan(0);
    const rows = await allAttempts();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(taught.has(row.conceptId)).toBe(true);
    }
  });
});
