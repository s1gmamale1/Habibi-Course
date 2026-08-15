/**
 * The session screen: the three bands, the fixed primary slot, and the two
 * decisions Task 6d forced — **a slot is a question, not a tap**, and a drill
 * mounted here really does land a row in the ledger.
 *
 * `fake-indexeddb/auto` for the same reason `useSession.test.ts` needs it: jsdom
 * ships no IndexedDB, and every end-to-end claim in this file is read back out
 * of the real store rather than asserted against a spy.
 *
 * Fixture games are registered with games2's `registerGame`, not the old
 * registry's — `SessionRunner` resolves `current.gameId` through
 * `@/games2/registry` now, and a `GameApi.answer` carries a verdict and an
 * optional `AnswerDetail`, never a self-reported `ruleId`. Two describe blocks
 * from the previous shape of this file — the "off-plan rule" tests and the
 * `letter-quiz` end-to-end test — asserted a capability (a drill naming a
 * different rule than the one planned, and the old letter-drill registry) that
 * no longer exists on this path; see the module-level report for why they were
 * replaced rather than ported.
 */
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { ArabicItem } from "@/content/schema";
// Side-effect import: registers the real slice games (`match`, `word-bank`,
// `type-it`, `broken-form`) so the end-to-end test at the bottom of this file
// has a real drill to click through, exactly as `@/games2/games` does for
// `PracticeSession`.
import "@/games2/games";
import { getGame, questionsFor, registerGame } from "@/games2/registry";
import { lessonSet } from "@/games2/studySet";
import type { GameApi, Question, ResponseMode } from "@/games2/types";
import { LETTER_GAME_IDS } from "@/components/games/letters";
import type { GameData } from "@/games/derive";
import { allAttempts } from "@/practice/ledger";
import type { PlannedQuestion, SessionPlan } from "@/practice/session";
import { noteFor } from "./FeedbackBar";
import { SessionRunner } from "./SessionRunner";

/* ---------- a drill that emits on demand ------------------------------- */

const STUB = "stub-drill";

/**
 * Registered at module scope, and never cleared — the real slice games above
 * are also module-scope registrations, and this file has no reason to touch
 * the registry between tests. `STUB`'s id does not collide with any of them.
 */
/** Counts mounts, so "is this drill remounted per question" is observable. */
let mounts = 0;

function Stub({ api }: { api: GameApi }) {
  const [mount] = useState(() => ++mounts);
  return (
    <div>
      <span data-testid="mount-count">{mount}</span>
      <button type="button" onClick={() => api.answer(false)}>
        tap wrong
      </button>
      <button type="button" onClick={() => api.answer(true)}>
        tap right
      </button>
      <button type="button" onClick={() => api.answer(null)}>
        tap skip
      </button>
    </div>
  );
}

registerGame({
  id: STUB,
  label: "🧪 Stub",
  mode: "recognition",
  cost: 1,
  graded: true,
  questions: () => [],
  render: (_q, api) => <Stub api={api} />,
});

function shapeFor(gameId: string): { mode: ResponseMode; slots: number } {
  const spec = getGame(gameId);
  if (!spec) throw new Error(`test fixture: no game registered for "${gameId}"`);
  return { mode: spec.mode, slots: spec.cost };
}

/* ---------- plans ------------------------------------------------------- */

const item = (conceptId: string, gameId: string, n: number): PlannedQuestion => ({
  conceptId,
  itemKey: `${conceptId}/${gameId}/${n}`,
  gameId,
  payload: {},
  ...shapeFor(gameId),
  isInterleaved: false,
});

const plan = (items: PlannedQuestion[]): SessionPlan => ({
  focusConceptId: items[0]?.conceptId ?? null,
  items,
  slots: items.reduce((n, i) => n + i.slots, 0),
});

/** Spare exemplars, so a miss always has something to re-queue. */
function poolFor(conceptIds: readonly string[], gameId = STUB, per = 4): Question[] {
  return conceptIds.flatMap((conceptId) =>
    Array.from({ length: per }, (_, n) => ({
      conceptId,
      itemKey: `${conceptId}/${gameId}/spare-${n}`,
      gameId,
      payload: {},
    })),
  );
}

// `RULE` deliberately stays a `TAJWEED_RULES`/`RULE_META` id (the render
// palette `FeedbackBar` still keys its text on — see the doc comment on
// `TAJWEED_RULES`), because most tests below assert on that rendered text.
// It is NOT a `RULE_CONCEPTS` id, so it is not itself a legal `conceptId` for
// `appendAttempt` — the one test that needs a row actually written
// (`"both moves are still written…"`) uses a real concept id instead.
const RULE = "idghaam_ghunnah";

function runSession(items: PlannedQuestion[], pool?: readonly Question[], data?: GameData) {
  return render(
    <SessionRunner
      plan={plan(items)}
      pool={pool ?? poolFor([...new Set(items.map((i) => i.conceptId))])}
      data={data}
      sessionId="s-runner"
    />,
  );
}

const track = () => screen.getByTestId("progress-track");
const band = () => screen.getByTestId("feedback-band");
const continueButton = () => screen.getByRole("button", { name: /متابعة/ });

/* ---------- letter fixture, for the "names the letter" test ------------- */

const mk = (arabic: string, name: string): ArabicItem => ({
  arabic,
  name,
  audio: { type: "teacher-voice", cue: "c" },
});

const LETTERS = [mk("ا", "alif"), mk("ب", "ba"), mk("ت", "ta"), mk("ث", "tha")];

const letterData: GameData = {
  lessonId: "1-03",
  newLetters: [mk("ب", "ba")],
  letterPool: LETTERS,
  formEntries: [],
  wordPool: [],
  formsTaught: false,
};

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ---------- the feedback bar -------------------------------------------- */

describe("the feedback bar", () => {
  test("a wrong answer names the rule and its condition, not just the verdict", async () => {
    runSession([item(RULE, STUB, 1)]);

    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));

    const said = screen.getByRole("status").textContent ?? "";
    // The rule, by name. A learner who cannot name what they broke has been told
    // only that they are wrong.
    expect(said).toMatch(/إدغام/);
    expect(said).toMatch(/Idghām bi-Ghunnah/);
    // And the condition that decides it, worded from the chain the course
    // already teaches in `condition-builder`.
    expect(said).toMatch(/nūn sākin or tanwīn/);
    expect(said).toMatch(/starting the next word/);
    // Never a bare verdict.
    expect(said).not.toMatch(/^\s*(خطأ|✗|✓)\s*$/);
  });

  test("the verdict is a word, never colour alone", async () => {
    runSession([item(RULE, STUB, 1)]);

    await userEvent.click(screen.getByRole("button", { name: "tap right" }));

    expect(screen.getByRole("status").textContent).toMatch(/صحيح/);
  });

  test("a letter concept names the letter, and what the drill asked for", async () => {
    runSession([item("ب", STUB, 1)], poolFor(["ب"]), letterData);

    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));

    const said = screen.getByRole("status").textContent ?? "";
    expect(said).toMatch(/ب/);
    expect(said).toMatch(/ba/);
    // A letter has no condition chain — there is no "when X follows Y" for it —
    // so the second line says what was being asked instead, falling back to the
    // generic phrasing for a gameId `FeedbackBar` has no copy for. It is never
    // blank.
    expect(said).toMatch(/recognise this letter wherever it appears/);
  });

  test("noteFor gives every drill a second line naming what it asked for", () => {
    // The table, directly: a screen-level test can only ever reach one entry of
    // it, and a letter with no second line is the bare-✗ failure in disguise.
    // Unrelated to Task 9 — `noteFor` is keyed by the *old* registry's ids for
    // the drills it already knows about, and this asserts against that table
    // directly rather than through a session.
    for (const gameId of LETTER_GAME_IDS) {
      const note = noteFor("ب", gameId, "ba");
      expect(note.name).toBe("ب · ba");
      expect(note.condition).toMatch(/\S/);
      expect(note.ruleId).toBeUndefined();
    }
    expect(noteFor("ب", "letter-quiz", "ba").condition).toMatch(/pick the letter out of four/);
    expect(noteFor("ب", "word-builder", "ba").condition).toMatch(/spell the word/);
    // A rule instead: named in Arabic and transliteration, with its condition.
    const rule = noteFor("iqlab", "rule-identifier");
    expect(rule.name).toMatch(/إقلاب/);
    expect(rule.condition).toMatch(/followed by ب/);
    expect(rule.ruleId).toBe("iqlab");
  });

  test("the rule name carries a second channel, so colour is never alone", async () => {
    runSession([item(RULE, STUB, 1)]);

    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));

    const named = screen.getByText(/إدغام بغنة/);
    // Colour plus the family's underline style plus the name in words. Fourteen
    // distinct hues is past what categorical colour can carry, `#000EBC` scores
    // 1.71 contrast on this background, and a screen reader announces neither.
    expect(named.style.color).not.toBe("");
    expect(named.style.textDecorationStyle).toBe("double");
  });

  test("the feedback bar reserves its height so nothing above it shifts", async () => {
    const { container } = runSession([item(RULE, STUB, 1)]);

    // The band is in the document before anything is answered, at an explicit
    // height — jsdom's unset default is `auto`, which reserves nothing.
    const before = getComputedStyle(band()).minHeight;
    expect(before).toMatch(/^[\d.]+[a-z%]+$/);
    const drillBefore = container.querySelector('[data-testid="drill-band"]');

    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));

    // …and it is the same element, at the same reserved height, afterwards.
    expect(getComputedStyle(band()).minHeight).toBe(before);
    expect(container.querySelector('[data-testid="drill-band"]')).toBe(drillBefore);
  });

  test("the primary button holds its place, disabled, before anything is answered", async () => {
    runSession([item(RULE, STUB, 1)]);

    const idle = continueButton();
    expect(idle.hasAttribute("disabled")).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "tap right" }));

    // The same button element, now live: the eye does not travel.
    expect(continueButton()).toBe(idle);
    expect(idle.hasAttribute("disabled")).toBe(false);
  });
});

/* ---------- the progress track ------------------------------------------ */

describe("the progress track", () => {
  test("is RTL, so it fills right to left", () => {
    runSession([item(RULE, STUB, 1)]);

    expect(getComputedStyle(track()).direction).toBe("rtl");
    expect(track().getAttribute("dir")).toBe("rtl");
  });

  test("counts the tail, so a miss makes the total grow rather than the bar lie", async () => {
    runSession([item(RULE, STUB, 1)]);

    expect(track().dataset.total).toBe("1");
    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));
    expect(track().dataset.total).toBe("2");
  });

  test("the screen's own chrome uses logical properties only", () => {
    const { container } = runSession([item(RULE, STUB, 1)]);

    const drill = container.querySelector('[data-testid="drill-band"]');
    const physical = [...container.querySelectorAll<HTMLElement>("[class]")].filter(
      (el) => !drill?.contains(el) && /(^|\s)-?(ml|mr|pl|pr|left|right|text-left|text-right)-/.test(el.className),
    );
    expect(physical.map((el) => el.className)).toEqual([]);
  });
});

/* ---------- a slot is a question, not a tap ----------------------------- */

describe("a slot is a question, not a tap", () => {
  test("a question answered wrong-then-right consumes one slot, not two", async () => {
    const first = item(RULE, STUB, 1);
    const second = item("ikhfa_haqiqi", STUB, 1);
    runSession([first, second]);

    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));
    await userEvent.click(screen.getByRole("button", { name: "tap right" }));

    // Two graded moves, still the same question: the drill has not been swapped
    // out from under the learner and the slot is not spent.
    expect(screen.getByTestId("drill-band").dataset.itemKey).toBe(first.itemKey);
    expect(track().dataset.done).toBe("0");

    await userEvent.click(continueButton());

    expect(screen.getByTestId("drill-band").dataset.itemKey).toBe(second.itemKey);
    expect(track().dataset.done).toBe("1");
  });

  test("both moves are still written, and both to the question that was on screen", async () => {
    // A real `RULE_CONCEPTS` id, not `RULE`: this test asserts what actually
    // lands in the ledger, and `appendAttempt` now rejects `RULE`'s palette
    // spelling ("idghaam_ghunnah") the same as any other unrecognised id.
    const CONCEPT = "idgham_maal_ghunnah";
    const first = item(CONCEPT, STUB, 1);
    runSession([first, item("ikhfa_haqiqi", STUB, 1)]);

    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));
    await userEvent.click(screen.getByRole("button", { name: "tap right" }));

    const rows = await waitFor(async () => {
      const all = await allAttempts();
      expect(all).toHaveLength(2);
      return all;
    });
    // The scheduler wants every move — reporting first-try only would discard
    // exactly the misses it learns most from.
    expect(rows.map((r) => r.correct)).toEqual([false, true]);
    // And neither row is misfiled against the question the learner has not
    // reached yet.
    expect(rows.map((r) => r.itemKey)).toEqual([first.itemKey, first.itemKey]);
    expect(rows.map((r) => r.conceptId)).toEqual([CONCEPT, CONCEPT]);
  });

  test("the next question is a fresh mount, not the last one reset", async () => {
    runSession([item(RULE, STUB, 1), item("ikhfa_haqiqi", STUB, 1)]);

    const first = screen.getByTestId("mount-count").textContent;
    await userEvent.click(screen.getByRole("button", { name: "tap right" }));
    await userEvent.click(continueButton());

    // A drill holds per-round state — which question it is on, whether it is
    // locked, what has been shaken. Carrying that into the next question is the
    // bug the registered games key their rounds to avoid; this screen owes it
    // the same treatment one level up.
    expect(screen.getByTestId("mount-count").textContent).not.toBe(first);
  });

  test("the verdict is the first graded move's, and a later one does not overwrite it", async () => {
    runSession([item(RULE, STUB, 1)]);

    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));
    await userEvent.click(screen.getByRole("button", { name: "tap right" }));

    // The slot was missed. Repairing it inside the drill is worth a row and a
    // tail retry, not a clean sheet on the question just failed.
    expect(screen.getByRole("status").textContent).toMatch(/إدغام/);
    expect(screen.getByRole("status").textContent).not.toMatch(/صحيح/);
  });

  test("an ungraded move opens the way forward without deciding the question", async () => {
    runSession([item(RULE, STUB, 1)]);

    await userEvent.click(screen.getByRole("button", { name: "tap skip" }));

    // `correct: null` is unmeasured, so there is no verdict to report — but the
    // learner is not trapped on a question the drill could not grade.
    expect(continueButton().hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("status").textContent).not.toMatch(/صحيح|خطأ/);

    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));

    // Still resolvable: an ungraded move did not spend the verdict.
    expect(screen.getByRole("status").textContent).toMatch(/إدغام/);
  });
});

/* ---------- no sound, ever ---------------------------------------------- */

describe("the audio channel belongs to recitation", () => {
  test("no audio element is created and `new Audio` is never called", async () => {
    const AudioSpy = vi.fn();
    vi.stubGlobal("Audio", AudioSpy);
    const { container } = runSession([item(RULE, STUB, 1)]);

    expect(container.querySelector("audio")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));
    await userEvent.click(continueButton());

    expect(container.querySelector("audio")).toBeNull();
    expect(AudioSpy).not.toHaveBeenCalled();
  });
});

/* ---------- the rest of the screen -------------------------------------- */

describe("the screen around the drill", () => {
  test("an unknown drill degrades to a note rather than a blank band", () => {
    // Built by hand rather than through `item()`/`shapeFor` — a plan naming a
    // gameId nothing has registered could not come from `planSession` today
    // (`shapeOfQuestion` refuses it), but a plan built against an older set of
    // registrations and rendered later is exactly this shape, and the screen
    // has to degrade gracefully rather than throw.
    const unknown: PlannedQuestion = {
      conceptId: RULE,
      itemKey: `${RULE}/not-a-real-drill/1`,
      gameId: "not-a-real-drill",
      payload: {},
      mode: "recognition",
      slots: 1,
      isInterleaved: false,
    };
    runSession([unknown]);

    expect(screen.getByTestId("drill-band").textContent).toMatch(/\S/);
    expect(continueButton()).toBeTruthy();
  });

  test("the close button hands control back rather than deciding anything", async () => {
    const onExit = vi.fn();
    render(
      <SessionRunner plan={plan([item(RULE, STUB, 1)])} pool={poolFor([RULE])} onExit={onExit} sessionId="s-exit" />,
    );

    await userEvent.click(screen.getByRole("button", { name: /إنهاء/ }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  test("a finished session names what went unrepaired as a diagnosis, never a score", async () => {
    runSession([item(RULE, STUB, 1)], [item(RULE, STUB, 1)]);

    // The pool holds only the item the plan already used, so the miss cannot be
    // retried and the concept is carried forward flagged.
    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));
    await userEvent.click(continueButton());

    const summary = screen.getByTestId("session-complete");
    expect(summary.textContent).toMatch(/إدغام/);
    expect(summary.textContent).not.toMatch(/XP|نقطة|ذهبي|المركز|score/i);
  });

  test("a rejected write says so, unobtrusively, and never blocks", async () => {
    // A ledger that cannot open is the realistic failure — private browsing,
    // quota, a blocked upgrade — and it must cost the sitting nothing.
    const failing = new IDBFactory();
    vi.spyOn(failing, "open").mockImplementation(() => {
      throw new Error("InvalidStateError");
    });
    globalThis.indexedDB = failing;

    runSession([item(RULE, STUB, 1)]);
    await userEvent.click(screen.getByRole("button", { name: "tap wrong" }));

    await waitFor(() => expect(screen.getByTestId("write-failures").textContent).toMatch(/\S/));
    // Not a dialog, and the question is still answerable.
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(continueButton().hasAttribute("disabled")).toBe(false);
  });
});

/* ---------- the tail asks a different question --------------------------- */

/**
 * Task 9's decisive test, and the one the previous shape of this suite could
 * not express with games2 games.
 *
 * `useSession` has always drawn a *different planned `itemKey`* for a tail
 * retry and its own tests have always asserted that. This drives the point one
 * step further, into what actually renders: a fixture whose question displays
 * its own payload, so "a different `itemKey`" and "a different thing on
 * screen" are checked as the same claim rather than two that could drift apart.
 */
describe("the wrong-answer tail is a second retrieval, not the same card twice", () => {
  const WORD_STUB = "word-stub";

  type WordPayload = { word: string };

  function registerWordStub() {
    registerGame({
      id: WORD_STUB,
      label: "🧪 Word Stub",
      mode: "recognition",
      cost: 1,
      graded: true,
      questions: () => [],
      render: (q, api) => {
        const p = q.payload as WordPayload;
        return (
          <div>
            <p>Tap the letter in {p.word}</p>
            <button type="button" onClick={() => api.answer(false)}>
              miss it
            </button>
            <button type="button" onClick={() => api.answer(true)}>
              get it
            </button>
          </div>
        );
      },
    });
  }

  const wordQuestion = (n: number, word: string): Question => ({
    conceptId: "ب",
    itemKey: `ب/${WORD_STUB}/${n}`,
    gameId: WORD_STUB,
    payload: { word } satisfies WordPayload,
  });

  test("a retry renders a different question on screen, not merely a different row", async () => {
    registerWordStub();
    const first = wordQuestion(1, "بَاب");
    const second = wordQuestion(2, "كِتَاب");
    const planned: PlannedQuestion = { ...first, ...shapeFor(WORD_STUB), isInterleaved: false };

    render(
      <SessionRunner plan={plan([planned])} pool={[first, second]} sessionId="s-tail" />,
    );

    await screen.findByText(/Tap the letter in بَاب/);

    await userEvent.click(screen.getByRole("button", { name: "miss it" }));
    await userEvent.click(continueButton());

    // The tail is up, and it is a different word — the second retrieval the
    // mechanic exists for. Replaying the identical item is answered from memory
    // of the correction that was on screen thirty seconds ago.
    await screen.findByText(/Tap the letter in كِتَاب/);
  });

  test("the ledger's itemKey names the exemplar that was on screen", async () => {
    registerWordStub();
    const first = wordQuestion(1, "بَاب");
    const second = wordQuestion(2, "كِتَاب");
    const planned: PlannedQuestion = { ...first, ...shapeFor(WORD_STUB), isInterleaved: false };

    render(
      <SessionRunner plan={plan([planned])} pool={[first, second]} sessionId="s-tail-rows" />,
    );

    await screen.findByText(/Tap the letter in بَاب/);
    await userEvent.click(screen.getByRole("button", { name: "miss it" }));
    await userEvent.click(continueButton());
    await screen.findByText(/Tap the letter in كِتَاب/);
    await userEvent.click(screen.getByRole("button", { name: "miss it" }));

    const rows = await waitFor(async () => {
      const all = await allAttempts();
      expect(all).toHaveLength(2);
      return all;
    });
    // The claim the ledger makes about what was shown is now true of both rows.
    expect(rows.map((r) => r.itemKey)).toEqual([first.itemKey, second.itemKey]);
  });
});

/* ---------- end to end --------------------------------------------------- */

describe("a real drill, through this screen, into the ledger", () => {
  test("a click on the real Match game lands a real row", async () => {
    const set = lessonSet("2-08");
    const [question] = questionsFor(["match"], set, { gradedOnly: true });
    expect(question).toBeDefined();
    const planned: PlannedQuestion = { ...question, ...shapeFor("match"), isInterleaved: false };

    runSession([planned], [question]);

    const p = question.payload as { arabic: string; meaning: string };
    await screen.findByText(p.arabic);
    const drill = screen.getByTestId("drill-band");
    await userEvent.click(within(drill).getByRole("button", { name: p.meaning }));

    const rows = await waitFor(async () => {
      const all = await allAttempts();
      expect(all).toHaveLength(1);
      return all;
    });
    expect(rows[0].gameId).toBe("match");
    // Keyed to the concept the *session* planned, not to anything the drill knows.
    expect(rows[0].conceptId).toBe(question.conceptId);
    expect(rows[0].itemKey).toBe(question.itemKey);
    expect(rows[0].correct).toBe(true);
    expect(rows[0].sessionId).toBe("s-runner");

    // And the screen reacted: the question is resolved and the way forward open.
    expect(continueButton().hasAttribute("disabled")).toBe(false);
  });
});
