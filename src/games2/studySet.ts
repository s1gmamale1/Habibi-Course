import { allLessons } from "@/content/load";
import { deriveGameData } from "@/games/derive";
import { setFromGameData } from "./studySetFromData";
import type { StudySet } from "./types";

// Re-exported so every existing caller of `setFromGameData` from this module
// keeps working. `studySetFromData.ts` is the fs-free source of truth — see
// that file for why the split exists.
export { setFromGameData };

export function lessonSet(lessonId: string): StudySet {
  const lessons = allLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  const data = deriveGameData(lessons, lessonId);
  return setFromGameData(data, `lesson:${lessonId}`, lesson?.title ?? lessonId);
}
