/**
 * The front door: the one place the practice engine is actually reachable from
 * the app.
 *
 * Every other piece of the engine had a test before this file existed, and the
 * engine still recorded nothing, because `SessionRunner` was rendered nowhere
 * and `DueTodayPanel` was mounted without an `onStart`. Unit tests cannot catch
 * that — each part passed in isolation precisely because nothing wired them
 * together. So the claims here are deliberately about *reachability*: the pool
 * is non-empty, the button starts a real session, and a row lands in the real
 * ledger.
 *
 * `fake-indexeddb/auto` for the reason `SessionRunner.test.tsx` gives: jsdom has
 * no IndexedDB, and the end-to-end claim is read back out of the store rather
 * than asserted against a spy.
 */
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";

import type { ArabicItem } from "@/content/schema";
import type { GameData } from "@/games/derive";
import { LETTER_GAME_IDS } from "@/components/games/letters";
import { TAJWEED_GAME_IDS } from "@/components/games/tajweed";
import { allAttempts } from "@/practice/ledger";
import { PracticeSession, sessionPool } from "./PracticeSession";

const letter = (arabic: string, name: string): ArabicItem => ({
  arabic,
  name,
  audio: { type: "teacher-voice", cue: `${name} — as taught live` },
});

/**
 * A lesson's worth of data, big enough that `letter-quiz` clears its
 * `QUIZ_MIN_LETTERS` gate — below it the drill does not render and the pool
 * would be thinner for a reason that has nothing to do with the wiring.
 */
const DATA: GameData = {
  lessonId: "1-06",
  letterPool: [
    letter("ب", "ba"),
    letter("ت", "ta"),
    letter("ث", "tha"),
    letter("ج", "jim"),
    letter("ح", "ha"),
    letter("خ", "kha"),
  ],
  newLetters: [letter("خ", "kha")],
  wordPool: [],
  formEntries: [],
  formsTaught: false,
};

beforeEach(async () => {
  // A fresh store per test: the ledger is append-only, so rows from an earlier
  // test would be indistinguishable from this one's.
  globalThis.indexedDB = new IDBFactory();
});

describe("sessionPool", () => {
  test("draws exemplars from every registered drill and stamps each with its own gameId", () => {
    const pool = sessionPool([...LETTER_GAME_IDS], DATA);
    expect(pool.length).toBeGreaterThan(0);
    // The `gameId` must be the drill that advertised the exemplar. Getting this
    // wrong is invisible until a session mounts the wrong drill for an item.
    for (const item of pool) {
      expect(LETTER_GAME_IDS).toContain(item.gameId as (typeof LETTER_GAME_IDS)[number]);
      expect(item.conceptId).not.toBe("");
      expect(item.itemKey).not.toBe("");
    }
  });

  test("covers the letters the lesson taught, so a due concept is drawable", () => {
    const concepts = new Set(sessionPool([...LETTER_GAME_IDS], DATA).map((i) => i.conceptId));
    // `planSession` drops a due concept it cannot draw an exemplar for, so a
    // letter missing here is a letter the scheduler can never surface.
    for (const l of DATA.letterPool) expect(concepts).toContain(l.arabic);
  });

  test("an unknown id contributes nothing rather than throwing", () => {
    expect(sessionPool(["no-such-drill"], DATA)).toEqual([]);
  });

  test("without data the letter drills contribute nothing, and say so by returning []", () => {
    expect(sessionPool([...LETTER_GAME_IDS], undefined)).toEqual([]);
  });

  test("tajweed drills bundle their own items, so they draw with no data at all", () => {
    expect(sessionPool([...TAJWEED_GAME_IDS], undefined).length).toBeGreaterThan(0);
  });
});

describe("PracticeSession", () => {
  test("shows the lesson's drills before a session starts", async () => {
    render(<PracticeSession data={DATA} games={[]} />);
    expect(await screen.findByRole("heading", { name: /interactive practice/i })).toBeTruthy();
  });

  test("the start button launches a real session, and leaving returns to the drills", async () => {
    const user = userEvent.setup();
    render(<PracticeSession data={DATA} games={[]} />);

    // `DueToday` reads the ledger before it renders anything at all.
    const start = await screen.findByTestId("start-review");
    await user.click(start);

    // The session screen, not a scroll to the drills below it — which is what
    // this button did while `SessionRunner` had no mount point.
    expect(await screen.findByTestId("session-runner")).toBeTruthy();
    // The lesson's own material is gone: a session the learner can answer from
    // the page below is not a retrieval.
    expect(screen.queryByRole("heading", { name: /interactive practice/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: "إنهاء الجلسة" }));
    expect(await screen.findByRole("heading", { name: /interactive practice/i })).toBeTruthy();
  });

  test("answering inside a session lands a row in the real ledger", async () => {
    const user = userEvent.setup();
    render(<PracticeSession data={DATA} games={[]} />);

    await user.click(await screen.findByTestId("start-review"));
    const drill = await screen.findByTestId("drill-band");

    expect(await allAttempts()).toEqual([]);

    // The first question, whatever drill the plan chose. Answering *anything*
    // inside the drill band is enough — the claim is that the write path is
    // connected, not that a particular drill grades a particular way.
    const answer = within(drill)
      .getAllByRole("button")
      .find((b) => b.getAttribute("aria-disabled") !== "true");
    expect(answer).toBeDefined();
    await user.click(answer!);

    await waitFor(async () => {
      const rows = await allAttempts();
      expect(rows.length).toBeGreaterThan(0);
      // Every row must name a concept the pool actually offered. A row with an
      // empty or invented `conceptId` folds onto a concept the scheduler will
      // never surface — the failure the ledger's honesty rules exist to stop.
      const concepts = new Set(sessionPool([...LETTER_GAME_IDS], DATA).map((i) => i.conceptId));
      for (const r of rows) expect(concepts).toContain(r.conceptId);
    });
  });
});
