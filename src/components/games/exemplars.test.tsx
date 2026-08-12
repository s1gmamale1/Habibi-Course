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
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { ArabicItem } from "@/content/schema";
import type { GameData } from "@/games/derive";
import { getGames, type Exemplar } from "./GameRegistry";
import { LETTER_GAME_IDS } from "./letters";
import { TAJWEED_GAME_IDS } from "./tajweed";

const ALL_IDS = [...LETTER_GAME_IDS, ...TAJWEED_GAME_IDS];

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
    expect(all.length).toBeGreaterThan(0);
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
      "family-sorter",
      "listen-identify",
      "rule-identifier",
      "span-tapper",
      "spot-the-letter",
      "word-builder",
    ]);
  });
});

describe("a drill honours the exemplar it is handed", () => {
  test.each(ALL_IDS)("%s shows a different question for a different exemplar", (gameId) => {
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

  test("ghunnah-timer holds the rule the exemplar names", () => {
    for (const rule of ["ghunnah", "madd_6"]) {
      fixRandom();
      const view = render(
        <div>
          {getGames(["ghunnah-timer"])[0].render({
            data,
            item: { conceptId: rule, itemKey: `ghunnah-timer/${rule}` },
          })}
        </div>,
      );
      // The target count is the rule's, and it is on screen in ḥarakāt.
      const wanted = rule === "ghunnah" ? "2" : "6";
      expect(screenText(view.container)).toMatch(new RegExp(`${wanted}`));
      view.unmount();
    }
  });
});
