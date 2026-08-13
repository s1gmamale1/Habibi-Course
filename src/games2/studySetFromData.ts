import type { GameData } from "@/games/derive";
import type { StudySet } from "./types";

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
 * `rules` is empty for the slice: Unit 1 lessons teach letters, and the tajweed
 * drills are not ported yet. It exists on the type now so the widening phase
 * adds data rather than changing the shape everything already consumes.
 */
export function setFromGameData(data: GameData, id: string, title: string): StudySet {
  return {
    id,
    title,
    letters: data.letterPool,
    words: data.wordPool,
    forms: data.formEntries,
    rules: [],
  };
}
