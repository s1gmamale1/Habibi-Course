import { describe, expect, test } from "vitest";
import { allCheckpointIds, allLessonIds, loadCheckpoint, loadCourse, loadLesson } from "./load";

describe("all real content validates", () => {
  test("course.json parses", () => {
    expect(loadCourse().phases.length).toBeGreaterThan(0);
  });
  test("every lesson file parses and ids match filenames", () => {
    for (const id of allLessonIds()) expect(loadLesson(id).id).toBe(id);
  });
  test("every authored lesson file is listed in the course map", () => {
    const mapped = new Set(loadCourse().phases.flatMap((p) => p.lessons.map((l) => l.id)));
    for (const id of allLessonIds()) expect(mapped.has(id), `content/lessons/${id}.json missing from course.json`).toBe(true);
  });
  test("every checkpoint file parses", () => {
    for (const id of allCheckpointIds()) expect(loadCheckpoint(id).id).toBe(id);
  });
  test("every course-map lesson id has a content file", () => {
    const have = new Set(allLessonIds());
    for (const phase of loadCourse().phases)
      for (const l of phase.lessons) expect(have.has(l.id), `missing content/lessons/${l.id}.json`).toBe(true);
  });
});
