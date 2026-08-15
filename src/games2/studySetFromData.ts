import type { GameData } from "@/games/derive";
import { RULE_CONCEPTS } from "@/generated/concepts";
import type { StudySet } from "./types";

const RULES: ReadonlySet<string> = new Set(RULE_CONCEPTS);

/**
 * A study set from game data.
 *
 * Split out of `studySet.ts` on purpose: that module imports `allLessons` from
 * `@/content/load` at module scope, which pulls in `node:fs` even for a caller
 * that only wants this one fs-free function — exactly the trap `SetScreen.tsx`
 * already worked around by taking a pre-built `StudySet` as a prop instead of
 * calling `lessonSet` itself. `PracticeSession.tsx` is `"use client"` and calls
 * this directly, so it needs the function reachable without the `fs` import
 * riding along.
 *
 * `concepts` is a parameter rather than derived here from `data.lessonId`:
 * this function has to stay fs-free, and `lessonConcepts` is safe to call
 * (it only reads the generated `@/generated/concepts` constant, a plain TS
 * module with no `fs`), but a caller building a set that is *not* one
 * lesson's material — `SetScreen`'s "due today" sets, for one — has no
 * single `lessonId` to derive concepts from. Taking the list as a parameter
 * lets every caller supply the concepts that are actually true of the set
 * it is building, rather than this function guessing from an id.
 *
 * `rules` is `concepts` narrowed to the ids `RULE_CONCEPTS` recognises;
 * everything else in `concepts` (letters) has no separate field here because
 * `letters` above already carries the full `ArabicItem`s, not bare ids.
 */
export function setFromGameData(
  data: GameData,
  id: string,
  title: string,
  concepts: string[],
): StudySet {
  return {
    id,
    title,
    letters: data.letterPool,
    words: data.wordPool,
    forms: data.formEntries,
    concepts,
    rules: concepts.filter((c) => RULES.has(c)),
  };
}
