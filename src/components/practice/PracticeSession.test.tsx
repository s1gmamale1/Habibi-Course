/**
 * The front door: the one place the practice engine is actually reachable from
 * the app.
 *
 * Every other piece of the engine had a test before this file existed, and the
 * engine still recorded nothing, because `SessionRunner` was rendered nowhere
 * and `DueTodayPanel` was mounted without an `onStart`. Unit tests cannot catch
 * that — each part passed in isolation precisely because nothing wired them
 * together. So the claims here are deliberately about *reachability*: the
 * question pool is non-empty, the button starts a real session, and a row
 * lands in the real ledger.
 *
 * `sessionPool` and its four tests were deleted here (Task 9): a non-empty pool
 * whose items carry their own game id is now covered by `games2/contract.test.ts`
 * against every registered game, rather than by one hand-built list of ids.
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

import { allLessons } from "@/content/load";
import type { ArabicItem } from "@/content/schema";
import { deriveGameData } from "@/games/derive";
import type { GameData } from "@/games/derive";
import { SLICE_GAME_IDS } from "@/games2/games";
import { lessonConcepts } from "@/games2/lessonConcepts";
import { questionsFor } from "@/games2/registry";
import { setFromGameData } from "@/games2/studySetFromData";
import { allAttempts } from "@/practice/ledger";
import { PracticeSession } from "./PracticeSession";

const letter = (arabic: string, name: string): ArabicItem => ({
  arabic,
  name,
  audio: { type: "teacher-voice", cue: `${name} — as taught live` },
});

/**
 * A lesson's worth of data. `wordPool` feeds the word-shaped games
 * (`word-bank`, `type-it`, `broken-form`); `letterPool` carries the letters
 * `lessonConcepts("1-06")` reports (ه ك ل م ن و ي — read straight off the
 * real generated table) so `match-answer`'s letter → name question has
 * something to ask too.
 *
 * `wordPool`'s words all start with a letter from that same taught set —
 * unlike the games2 rebuild's earlier "match" (deleted in Task 5),
 * `match-answer`'s conceptId space is curriculum-scoped, not word-scoped: a
 * word starting with a letter this lesson does *not* teach (the previous
 * fixture used بَاب/تَمْر/ثَوْب/جَمَل) still gives `word-bank`/`type-it`/
 * `broken-form` a question, but gives `match-answer` none, so cold-start's
 * lowest-codepoint tiebreak can land the whole session's focus on a concept
 * with no recognition-mode game at all — which is exactly what starved
 * "answering inside a session lands a row" of a single-tap-completable
 * question. Keeping `wordPool` inside the taught letters keeps every game's
 * concept roster overlapping, the way a real lesson's own examples do.
 */
const DATA: GameData = {
  lessonId: "1-06",
  letterPool: [
    letter("ه", "ha"),
    letter("ك", "kaaf"),
    letter("ل", "lam"),
    letter("م", "meem"),
    letter("ن", "nun"),
    letter("و", "waw"),
    letter("ي", "ya"),
  ],
  newLetters: [letter("و", "waw")],
  wordPool: [
    { arabic: "كِتَاب", translit: "kitab", meaning: "book" },
    { arabic: "لَحْم", translit: "lahm", meaning: "meat" },
    { arabic: "نُور", translit: "nur", meaning: "light" },
    { arabic: "هَل", translit: "hal", meaning: "is it?" },
  ],
  formEntries: [],
  formsTaught: false,
};

/** The same pool `PracticeSession` builds internally — see that file. */
function expectedConcepts(): Set<string> {
  const set = setFromGameData(DATA, DATA.lessonId, DATA.lessonId, lessonConcepts(DATA.lessonId));
  return new Set(questionsFor([...SLICE_GAME_IDS], set, { gradedOnly: true }).map((q) => q.conceptId));
}

beforeEach(async () => {
  // A fresh store per test: the ledger is append-only, so rows from an earlier
  // test would be indistinguishable from this one's.
  globalThis.indexedDB = new IDBFactory();
});

describe("PracticeSession", () => {
  test("the question pool is non-empty and covers a concept the lesson teaches", () => {
    // Reachability, not `sessionPool`'s old per-drill assertions: `contract.test.ts`
    // already checks every registered game against a real set.
    const concepts = expectedConcepts();
    expect(concepts.size).toBeGreaterThan(0);
    for (const conceptId of concepts) expect(conceptId).toMatch(/\S/);
  });

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
      const concepts = expectedConcepts();
      for (const r of rows) expect(concepts).toContain(r.conceptId);
    });
  });

  test("practising a lesson draws only from that lesson's concepts", async () => {
    const user = userEvent.setup();
    render(<PracticeSession data={deriveGameData(allLessons(), "3-23")} games={[]} />);
    await user.click(await screen.findByTestId("practice-lesson"));
    const band = await screen.findByTestId("drill-band");
    expect(band.getAttribute("data-concept-id")).toBe("iqlab");
  });
});
