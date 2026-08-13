import { allLessons } from "@/content/load";
import { deriveGameData, type GameData } from "@/games/derive";
import type { StudySet } from "./types";

/**
 * A study set from a lesson.
 *
 * `rules` is empty for the slice: Unit 1 lessons teach letters, and the tajweed
 * drills are not ported yet. It exists on the type now so the widening phase
 * adds data rather than changing the shape everything already consumes.
 */
export function setFromGameData(data: GameData, title: string): StudySet {
  return {
    id: `lesson:${data.lessonId}`,
    title,
    letters: data.letterPool,
    words: data.wordPool,
    forms: data.formEntries,
    rules: [],
  };
}

export function lessonSet(lessonId: string): StudySet {
  const lessons = allLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  const data = deriveGameData(lessons, lessonId);
  return setFromGameData(data, lesson?.title ?? lessonId);
}
