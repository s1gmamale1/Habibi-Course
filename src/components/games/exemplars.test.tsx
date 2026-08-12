/**
 * Task 9: **the registry can carry an exemplar, and every drill honours one.**
 *
 * Before this, `GameRenderProps` was `{ onResult?, data? }`. `planSession` chose
 * an `itemKey`, `useSession` wrote that `itemKey` to the ledger, and the drill
 * rendered whatever it picked for itself — so the ledger's `itemKey` was a claim
 * about what was shown that nothing made true, and the wrong-answer tail could
 * legitimately re-ask the identical question.
 *
 * Every assertion here is therefore about **what the drill puts on screen**, not
 * about the props it was handed. A render that accepted `item` and ignored it
 * would pass a prop-shaped test and fail every test in this file.
 *
 * The table is driven by the registry itself — `LETTER_GAME_IDS` and
 * `TAJWEED_GAME_IDS`, all thirteen — so a drill added later is covered the day
 * it registers, and a drill that quietly stops honouring its exemplar is caught
 * without anyone remembering to come back here.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { ArabicItem } from "@/content/schema";
import { TAJWEED_RULES } from "@/content/tajweed";
import type { GameData } from "@/games/derive";
import { getGames, type Exemplar } from "./GameRegistry";
import { LETTER_GAME_IDS } from "./letters";
import { TAJWEED_GAME_IDS } from "./tajweed";

const ALL_IDS = [...LETTER_GAME_IDS, ...TAJWEED_GAME_IDS];

/**
 * The drills that advertise **no** exemplar, with the reason — a declared
 * "cannot", never a silent gap.
 *
 * `word-flashcards`: a vocabulary card names none of the 47 concepts the
 * scheduler tracks. Filing it under one of the word's letters would invent a
 * concept the card never tested, which is the same defect class as a fabricated
 * measurement.
 */
const ADVERTISES_NOTHING: readonly string[] = ["word-flashcards"];

/**
 * The drills that **cannot vary the question** an exemplar names, with the
 * reason. Both are declared in their own files too; this list is what keeps the
 * property asserted for the other eleven.
 *
 * `family-sorter`: its question is the whole board. Every fragment is on screen
 * from the first frame, so the planned one is shown whether or not the drill is
 * told about it — and a sort with one card is not a sort. Reordering the deal to
 * look responsive would be theatre.
 *
 * `ghunnah-timer`: its first screen is the *calibration*, which is identical for
 * every rule because it measures the learner rather than the rule. The rule it
 * honours appears once the three reference holds are in — asserted directly
 * below, with the holds performed.
 */
const CANNOT_VARY_ON_SCREEN: readonly string[] = ["family-sorter", "ghunnah-timer"];

/* ---------- a lesson's worth of letter content --------------------------- */

const mk = (arabic: string, name: string): ArabicItem => ({
  arabic,
  name,
  audio: { type: "teacher-voice", cue: "c" },
});

const LETTERS = ["ب:ba", "ا:alif", "ك:kaf", "ت:ta", "ش:sheen", "م:meem", "س:seen"].map((s) => {
  const [arabic, name] = s.split(":");
  return mk(arabic, name);
});

const forms = (arabic: string, name: string) => ({
  item: mk(arabic, name),
  forms: { isolated: arabic, initial: `${arabic}ـ`, medial: `ـ${arabic}ـ`, final: `ـ${arabic}` },
});

/**
 * Two words share the letter ب on purpose: that is what gives `word-builder` and
 * `spot-the-letter` **two exemplars of one concept**, which is the only shape in
 * which a tail retry can ask the same concept a different question.
 */
const data: GameData = {
  lessonId: "1-09",
  newLetters: [mk("ب", "ba")],
  letterPool: LETTERS,
  formEntries: [forms("ب", "ba"), forms("ت", "ta")],
  wordPool: [
    { arabic: "بَاب", translit: "bab", meaning: "door" },
    { arabic: "كِتَاب", translit: "kitab", meaning: "book" },
    { arabic: "شَمْس", translit: "shams", meaning: "sun" },
  ],
  formsTaught: true,
};

afterEach(() => vi.restoreAllMocks());

/** Every drill that shuffles does so through `Math.random`; pin it. */
function fixRandom() {
  vi.spyOn(Math, "random").mockReturnValue(0);
}

function exemplarsOf(gameId: string): Exemplar[] {
  const entry = getGames([gameId])[0];
  return entry.exemplars?.(data) ?? [];
}

/**
 * What the learner can actually see: the words, **and which part of them is
 * marked**.
 *
 * The mark cannot be left out. Two questions about the same āyah — "how long is
 * this madd" pointing at two different lengths in 1:7 — read as the identical
 * string and are different questions; the span is the question. It is read off
 * the DOM the drills already expose (`data-target` for the neutral ring, the
 * undimmed spans of `TajweedText`), never off a prop.
 */
function screenText(node: HTMLElement): string {
  const marked = [...node.querySelectorAll("[data-target], [data-rule]:not([data-dimmed])")]
    .map((el) => `${el.getAttribute("data-rule") ?? ""}«${el.textContent}»`)
    .join("");
  return `${node.textContent ?? ""}${marked}`.replace(/\s+/g, " ").trim();
}

function renderWith(gameId: string, item?: Exemplar): string {
  fixRandom();
  const view = render(<div>{getGames([gameId])[0].render({ data, item })}</div>);
  const text = screenText(view.container);
  view.unmount();
  return text;
}

/**
 * The pair to compare: two exemplars **of one concept** where the drill has
 * them, because that is the tail's case. Falling back to the first two of any
 * concept keeps the drills that carry one exemplar per concept in the table
 * rather than silently skipped.
 */
function comparablePair(gameId: string): [Exemplar, Exemplar] | null {
  const all = exemplarsOf(gameId);
  const byConcept = new Map<string, Exemplar[]>();
  for (const e of all) byConcept.set(e.conceptId, [...(byConcept.get(e.conceptId) ?? []), e]);
  for (const list of byConcept.values()) if (list.length >= 2) return [list[0], list[1]];
  return all.length >= 2 ? [all[0], all[1]] : null;
}

/* ---------- the contract every drill keeps ------------------------------- */

describe("the exemplars a drill advertises", () => {
  test.each(ALL_IDS)("%s advertises exemplars with unique keys and a real concept", (gameId) => {
    const all = exemplarsOf(gameId);
    expect(all.length).toBeGreaterThan(ADVERTISES_NOTHING.includes(gameId) ? -1 : 0);
    if (ADVERTISES_NOTHING.includes(gameId)) expect(all).toEqual([]);
    // A duplicate key is two different questions the session cannot tell apart,
    // and `planSession` de-duplicates on `itemKey` — so a collision would make
    // one exemplar unreachable and the other unrepeatable.
    expect(new Set(all.map((e) => e.itemKey)).size).toBe(all.length);
    for (const e of all) {
      // A concept the scheduler actually tracks: one of the 18 rules or one of
      // the letters this lesson has taught. Anything else is a concept invented
      // at the drill — it would enter the roster through `conceptRoster`, be
      // scheduled, and be drilled by nothing.
      const tracked =
        (TAJWEED_RULES as readonly string[]).includes(e.conceptId) ||
        data.letterPool.some((l) => l.arabic === e.conceptId);
      expect({ gameId, conceptId: e.conceptId, tracked }).toEqual({
        gameId,
        conceptId: e.conceptId,
        tracked: true,
      });
      // Drill-scoped, so two drills' exemplars of one letter never collide.
      expect(e.itemKey.startsWith(`${gameId}/`)).toBe(true);
    }
  });

  /**
   * The tail can only re-ask a concept through a *different* exemplar of it. A
   * drill with one exemplar per concept cannot serve the tail at all — which is
   * a fact about the drill, not a defect, but it must be a known fact rather
   * than a surprise, so the drills that can are pinned here.
   */
  test("the drills that can serve a tail retry carry more than one exemplar per concept", () => {
    const multi = ALL_IDS.filter((gameId) => {
      const byConcept = new Map<string, number>();
      for (const e of exemplarsOf(gameId)) {
        byConcept.set(e.conceptId, (byConcept.get(e.conceptId) ?? 0) + 1);
      }
      return [...byConcept.values()].some((n) => n >= 2);
    });
    expect([...multi].sort()).toEqual([
      "listen-identify",
      "rule-identifier",
      "span-tapper",
      "spot-the-letter",
      "word-builder",
    ]);
  });
});

describe("a drill honours the exemplar it is handed", () => {
  const CAN_VARY = ALL_IDS.filter(
    (id) => !CANNOT_VARY_ON_SCREEN.includes(id) && !ADVERTISES_NOTHING.includes(id),
  );

  test.each(CAN_VARY)("%s shows a different question for a different exemplar", (gameId) => {
    const pair = comparablePair(gameId);
    expect(pair).not.toBeNull();
    const [a, b] = pair!;
    // On screen, not in a prop. This is the assertion a render that ignores
    // `item` fails, and it is the same assertion the tail retry rests on.
    expect(renderWith(gameId, a)).not.toBe(renderWith(gameId, b));
  });

  test.each(CAN_VARY)("%s gives every exemplar of one concept its own question", (gameId) => {
    // Every exemplar of a concept, not merely two of them: a drill that
    // advertises an exemplar it cannot actually pose falls back to another one,
    // and the give-away is two keys of one concept that draw the same screen.
    //
    // Across *different* concepts a repeat is legitimate and common — one word
    // is an exemplar of each of its letters, and `word-builder` draws the same
    // board for all of them, because which letter the row evidences is a fact
    // about the plan rather than about the picture.
    const byConcept = new Map<string, Exemplar[]>();
    for (const e of exemplarsOf(gameId)) {
      byConcept.set(e.conceptId, [...(byConcept.get(e.conceptId) ?? []), e]);
    }
    for (const [conceptId, list] of byConcept) {
      const screens = list.map((e) => renderWith(gameId, e));
      expect({ conceptId, distinct: new Set(screens).size }).toEqual({
        conceptId,
        distinct: screens.length,
      });
    }
  });

  test.each(ALL_IDS)("%s still renders with no item at all — the GamePanel path", (gameId) => {
    // The tab list mounts every drill with no plan behind it. A drill that
    // required an exemplar would render a blank band there.
    expect(renderWith(gameId)).toMatch(/\S/);
  });

  test.each(ALL_IDS)("%s falls back rather than blanking on a key it does not know", (gameId) => {
    // A pool assembled against an older build can name an exemplar this drill no
    // longer has. Refusing to render would cost the learner the slot; falling
    // back to its own choice costs only the guarantee that the tail differs.
    expect(renderWith(gameId, { conceptId: "ب", itemKey: `${gameId}/not-a-real-exemplar` })).toBe(
      renderWith(gameId),
    );
  });
});

/* ---------- the plan governs the slot, not the drill forever ------------- */

/**
 * A session hands a drill one question and moves on when the learner presses
 * متابعة. The drill's own "next" button is a second, independent way forward
 * that exists for the tab list — and past the planned question the drill is its
 * own again.
 *
 * Both directions are defensible and this is the one chosen, so it is pinned
 * rather than left to drift: a drill that forced the planned exemplar on every
 * round would leave "next" doing nothing at all, which reads as broken.
 */
describe("the exemplar is honoured for the question it was planned for", () => {
  test("letter-quiz picks its own letter again once the learner asks for another", async () => {
    fixRandom();
    render(
      <div>
        {getGames(["letter-quiz"])[0].render({
          data,
          item: { conceptId: "ت", itemKey: "letter-quiz/ت" },
        })}
      </div>,
    );
    expect(screen.getByText(/which letter is/i).textContent).toMatch(/ta/);

    await userEvent.click(screen.getByRole("button", { name: "choice ت" }));
    await userEvent.click(screen.getByRole("button", { name: /next question/i }));

    expect(screen.getByText(/which letter is/i).textContent).not.toMatch(/ta/);
  });

  test("spot-the-letter picks its own target again on the next word", async () => {
    fixRandom();
    const item = exemplarsOf("spot-the-letter").find((e) => e.itemKey.endsWith("/بَاب/ب"))!;
    render(<div>{getGames(["spot-the-letter"])[0].render({ data, item })}</div>);
    expect(screen.getByText(/Tap the letter/).textContent).toMatch(/ba/);

    await userEvent.click(screen.getByRole("button", { name: "word letter 1" }));
    await userEvent.click(screen.getByRole("button", { name: /next word/i }));

    expect(screen.getByText(/Tap the letter/).textContent).not.toMatch(/ba\b/);
  });
});

/* ---------- a drill advertises only what it can pose --------------------- */

describe("an advertised exemplar is one the drill can actually pose", () => {
  test("no drill names a letter the lesson has not taught", () => {
    // A word can contain a letter the course has not reached — ضَوْء carries ض,
    // و and ء — and `spot-the-letter` names its target in the prompt, so a
    // letter with no pool entry is a question it cannot ask. Filing an exemplar
    // under it would also put an unteachable concept into the roster.
    const untaught: GameData = {
      ...data,
      letterPool: LETTERS.filter((l) => l.arabic !== "ك"),
      wordPool: [{ arabic: "كِتَاب", translit: "kitab", meaning: "book" }],
    };
    for (const gameId of ALL_IDS) {
      for (const e of getGames([gameId])[0].exemplars?.(untaught) ?? []) {
        const isLetterConcept = !(TAJWEED_RULES as readonly string[]).includes(e.conceptId);
        if (!isLetterConcept) continue;
        expect({ gameId, conceptId: e.conceptId }).toEqual({
          gameId,
          conceptId: untaught.letterPool.find((l) => l.arabic === e.conceptId)?.arabic,
        });
      }
    }
  });

  test("form-swap advertises nothing before the course has taught forms", () => {
    // Its own `render` refuses to show the board until 1-07, so a session that
    // planned it would spend a slot on a note saying the drill is not available.
    const before: GameData = { ...data, formsTaught: false };
    expect(getGames(["form-swap"])[0].exemplars?.(before)).toEqual([]);
  });

  test("every span-tapper fragment has something in it to tap", () => {
    // `allFound` is false forever when a fragment has no qualifying letter, so
    // an āyah with none is a round the learner can never complete.
    for (const e of exemplarsOf("span-tapper")) {
      fixRandom();
      const view = render(<div>{getGames(["span-tapper"])[0].render({ data, item: e })}</div>);
      fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
      expect(screen.getByRole("status").textContent).toMatch(/of [1-9]/);
      view.unmount();
    }
  });
});

/* ---------- the concept, not merely the exemplar ------------------------- */

describe("honouring the exemplar means asking about its concept", () => {
  test("letter-quiz asks about the letter the exemplar names", () => {
    for (const arabic of ["ت", "س"]) {
      fixRandom();
      const view = render(
        <div>
          {getGames(["letter-quiz"])[0].render({
            data,
            item: { conceptId: arabic, itemKey: `letter-quiz/${arabic}` },
          })}
        </div>,
      );
      const name = LETTERS.find((l) => l.arabic === arabic)!.name!;
      // The prompt names the letter being asked for, so the concept the row is
      // keyed to is the concept the learner was actually shown.
      expect(screen.getByText(new RegExp(name, "i"))).toBeTruthy();
      view.unmount();
    }
  });

  test("spot-the-letter hunts the letter the exemplar names, not a random one", () => {
    for (const arabic of ["ك", "ت"]) {
      fixRandom();
      const item = exemplarsOf("spot-the-letter").find(
        (e) => e.conceptId === arabic && e.itemKey.includes("كِتَاب"),
      )!;
      expect(item).toBeTruthy();
      const view = render(<div>{getGames(["spot-the-letter"])[0].render({ data, item })}</div>);
      const name = LETTERS.find((l) => l.arabic === arabic)!.name!;
      expect(screen.getByText(new RegExp(`Tap the letter`, "i")).textContent).toMatch(name);
      view.unmount();
    }
  });

  test("ghunnah-timer holds the rule the exemplar names, once it has a pace to hold at", () => {
    for (const [rule, count] of [
      ["ghunnah", 2],
      ["madd_6", 6],
    ] as const) {
      fixRandom();
      const view = render(
        <div>
          {getGames(["ghunnah-timer"])[0].render({
            data,
            item: { conceptId: rule, itemKey: `ghunnah-timer/${rule}` },
          })}
        </div>,
      );
      // Three reference holds: the drill measures the learner before it measures
      // the rule, so nothing rule-specific is on screen until it is calibrated.
      let t = 1000;
      for (let i = 0; i < 3; i += 1) {
        const button = screen.getByTestId("hold-calibrate");
        vi.spyOn(Date, "now").mockReturnValue((t += 0));
        fireEvent.mouseDown(button);
        vi.spyOn(Date, "now").mockReturnValue((t += 400));
        fireEvent.mouseUp(button);
      }

      // Now the rule is the question: its target count, in ḥarakāt.
      expect(screen.getByTestId("hold-ghunnah").textContent).toBe(`Hold for ${count} ḥarakāt`);
      view.unmount();
      vi.restoreAllMocks();
    }
  });

  test("family-sorter shows every fragment it advertises, with or without a plan", () => {
    // Its declared "cannot": the board is the question, so the planned exemplar
    // is on screen either way. That is what makes the row's `itemKey` a true
    // claim about what was shown even though `render` ignores it — and it is
    // also what a "fix" would break, by narrowing the board to the planned card
    // until a sort had nothing to sort.
    const all = exemplarsOf("family-sorter");
    for (const item of [undefined, all[0], all[3]]) {
      fixRandom();
      const view = render(<div>{getGames(["family-sorter"])[0].render({ data, item })}</div>);
      for (const e of all) {
        const id = e.itemKey.slice("family-sorter/".length);
        expect(screen.getByTestId(`fragment-${id}`)).toBeTruthy();
      }
      view.unmount();
    }
  });

  test("word-flashcards honours a key even though it advertises none", () => {
    // It cannot be planned — a word is not one of the 47 concepts — but the
    // plumbing is real, so the day a vocabulary concept exists this deck opens
    // on the card it is told to rather than needing to be revisited.
    const shown = data.wordPool.map((w) => {
      fixRandom();
      const view = render(
        <div>
          {getGames(["word-flashcards"])[0].render({
            data,
            item: { conceptId: w.arabic, itemKey: `word-flashcards/${w.arabic}` },
          })}
        </div>,
      );
      const front = screen.getByLabelText("flip card").textContent ?? "";
      view.unmount();
      return front;
    });
    // Three different words asked for, three different cards face up.
    expect(new Set(shown).size).toBe(data.wordPool.length);
  });
});
