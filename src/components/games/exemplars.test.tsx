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
import { afterEach, describe, expect, test, vi } from "vitest";

import type { ArabicItem } from "@/content/schema";
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

/** What the learner can actually read, with whitespace collapsed. */
function screenText(node: HTMLElement): string {
  return (node.textContent ?? "").replace(/\s+/g, " ").trim();
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
      expect(e.conceptId).toMatch(/\S/);
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
    // claim about what was shown even though `render` ignores it.
    fixRandom();
    const view = render(<div>{getGames(["family-sorter"])[0].render({ data })}</div>);
    for (const e of exemplarsOf("family-sorter")) {
      const id = e.itemKey.slice("family-sorter/".length);
      expect(screen.getByTestId(`fragment-${id}`)).toBeTruthy();
    }
    view.unmount();
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
