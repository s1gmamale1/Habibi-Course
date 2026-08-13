/**
 * `session.test.ts` proves `planSession` against hand-built fixture pools
 * where every concept has an identical spread of drills (`poolFor` hands
 * every named concept the same full complement of games), so the
 * mode-coverage tiebreak `orderDue` now applies can never fire there — every
 * candidate ties on coverage, exactly as it should for those fixtures. The
 * bug this file guards against only shows up where concepts' pools genuinely
 * differ, and only real content produces that: alif has no discrimination
 * candidate (see the comment on `orderDue` in `session.ts`), and no fixture
 * pool models that asymmetry.
 *
 * Real games2 game modules are `"use client"` React components, which is
 * exactly what `session.test.ts`'s own docstring avoids importing to keep
 * that file able to run with no DOM — hence a separate file here rather than
 * adding this to it.
 */
import { describe, expect, test } from "vitest";
import { allLessons } from "@/content/load";
import { deriveGameData } from "@/games/derive";
import "@/games2/games";
import { SLICE_GAME_IDS } from "@/games2/games";
import { questionsFor } from "@/games2/registry";
import { setFromGameData } from "@/games2/studySetFromData";
import { derive } from "./derive";
import { conceptRoster, planSession, schedulesFromLedger } from "./session";

const NOW = 1_700_009_000_000;

function coldPlanFor(lessonId: string) {
  const data = deriveGameData(allLessons(), lessonId);
  const set = setFromGameData(data, lessonId, lessonId);
  const questions = questionsFor([...SLICE_GAME_IDS], set, { gradedOnly: true });
  const roster = conceptRoster(questions);
  const schedules = schedulesFromLedger([], roster, NOW);
  return planSession(schedules, derive([], NOW), questions, NOW);
}

describe("cold-start mode coverage, against real content", () => {
  test("lesson 2-08 reaches discrimination on a completely empty ledger", () => {
    // On day one every concept is seeded due at the same millisecond, so
    // `orderDue`'s tiebreak decides the focus outright. Before the
    // mode-coverage tiebreak below weakness, that fell straight to plain
    // codepoint comparison, and `ا` (alif, U+0627) has the lowest codepoint
    // of any taught letter. Alif is a non-connector — it is only ever
    // written isolated or final — so it never earns the three authored
    // positional forms `deriveGameData` requires before a letter enters
    // `set.forms`, and `broken-form` can never ask about it. The backbone
    // draws almost entirely from the focus concept, so focus = alif meant no
    // `broken-form` item ever appeared cold, on 63 of 68 lessons, however
    // large the pool behind it was.
    const plan = coldPlanFor("2-08");
    const modes = new Set(plan.items.map((i) => i.mode));
    expect(modes).toEqual(new Set(["recognition", "discrimination", "production"]));
    // The mode assertion above is the one that survives a future game being
    // added; this one pins today's actual cause down directly.
    expect(plan.items.some((i) => i.gameId === "broken-form")).toBe(true);
  });

  test("lesson 2-08 interleaves, cold — the sibling of the mode-coverage test above", () => {
    // C2: with only one recognition game (`match`) and one discrimination game
    // (`broken-form`) registered, `tryPlace` could only ever try to insert a
    // review at the one mode its own gameId already occupied on both
    // neighbours, so `hasRun` rejected every slot and every session — on all
    // 74 lessons — covered exactly one concept with zero interleaved items.
    // This is the test that would have caught it.
    const plan = coldPlanFor("2-08");
    expect(plan.items.some((i) => i.isInterleaved)).toBe(true);
    expect(new Set(plan.items.map((i) => i.conceptId)).size).toBeGreaterThan(1);
  });

  test("a spread of lessons all reach at least three distinct modes, cold", () => {
    // 1-01 and 1-02 are excluded on purpose, not weakened around: each
    // teaches exactly one word in its lesson examples, and `matchQuestions`
    // needs at least two words in the set to build a multiple-choice
    // distractor pool — so `match`'s recognition question set is genuinely
    // empty that early, not merely deprioritised by the tiebreak. The word
    // pool clears that bar from 1-03 on.
    for (const id of ["1-06", "2-08", "3-10"]) {
      const modes = new Set(coldPlanFor(id).items.map((i) => i.mode));
      expect(modes.size).toBeGreaterThanOrEqual(3);
    }
  });
});
