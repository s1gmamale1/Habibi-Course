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
  test("no Unit 1.4 drill cell carries a visible name caption", () => {
    // TapToHear renders `name` as a caption directly under the glyph, which
    // would print the answer beside the word and let the student read the
    // English instead of decoding the Arabic. Translit/meaning belong in the
    // tap-to-reveal cue only. Applies to in-deck drills AND the practice copies.
    // Scoped to Unit 1.4: the earlier units predate this rule and still caption
    // their drill cells (e.g. "ba" under ب in 1-01). Whether to retrofit them is
    // an open content decision, not something this test should force.
    for (const id of allLessonIds()) {
      const lesson = loadLesson(id);
      if (lesson.unit !== "1.4") continue;
      const grids = [
        ...lesson.slides.flatMap((s) => (s.kind === "drill" ? s.grid : [])),
        ...lesson.practice.drills.flatMap((d) => d.grid),
      ];
      for (const row of grids)
        for (const cell of row)
          expect(cell.name, `${id}: drill cell ${cell.arabic} has a visible name caption`).toBeUndefined();
    }
  });
  test("every course-map lesson id has a content file", () => {
    const have = new Set(allLessonIds());
    for (const phase of loadCourse().phases)
      for (const l of phase.lessons) expect(have.has(l.id), `missing content/lessons/${l.id}.json`).toBe(true);
  });
});
