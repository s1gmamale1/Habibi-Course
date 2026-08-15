import { LESSON_CONCEPTS } from "@/generated/concepts";

/**
 * What a lesson taught, as schedulable concepts.
 *
 * This is what the previous games layer had no access to: it planned over a
 * cumulative letter-and-word pool, so a lesson about madd generated questions
 * about `ا`. Generated at build time because the curriculum notes are read
 * through `node:fs` and this has to run in a browser.
 */
export function lessonConcepts(lessonId: string): string[] {
  return LESSON_CONCEPTS[lessonId] ?? [];
}
