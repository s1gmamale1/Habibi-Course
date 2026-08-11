import { describe, expect, test } from "vitest";
import { allCheckpointIds, allLessonIds, loadCheckpoint, loadCourse, loadLesson } from "./load";

describe("all real content validates", () => {
  test("course.json parses", () => {
    expect(loadCourse().phases.length).toBeGreaterThan(0);
  });
  test("every lesson file parses and ids match filenames", () => {
    for (const id of allLessonIds()) expect(loadLesson(id).id).toBe(id);
  });
  test("every authored lesson file is listed in the course map, unless it is a draft", () => {
    // The point of this test is to catch a lesson that was written and then
    // forgotten. A lesson marked `draft: true` is deliberately not in the map
    // yet — it has been authored but not reviewed, so the student cannot reach
    // it. Without that distinction, authoring and publishing are the same act.
    const mapped = new Set(loadCourse().phases.flatMap((p) => p.lessons.map((l) => l.id)));
    for (const id of allLessonIds()) {
      if (loadLesson(id).draft) continue;
      expect(mapped.has(id), `content/lessons/${id}.json missing from course.json`).toBe(true);
    }
  });
  test("no lesson in the course map is still marked draft", () => {
    // The inverse guard. Publishing means clearing `draft` AND adding the map
    // entry; this catches doing only the second half.
    const mapped = loadCourse().phases.flatMap((p) => p.lessons.map((l) => l.id));
    for (const id of mapped)
      expect(loadLesson(id).draft ?? false, `${id} is in course.json but still marked draft`).toBe(false);
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
  test("every title slide names the lesson it belongs to", () => {
    // The title slide's heading is the first thing a student reads, and it is the one
    // place a stale lesson number is visible rather than internal.
    //
    // This exists because it happened. Inserting 3-04 renumbered 3-04…3-36 upward, and
    // the pass matched the hyphenated "3-27". These headings are written "Lesson 3.27",
    // so all 33 survived it — and Unit 3 published with every lesson from 3-05 up
    // displaying the number of the lesson before it. `check-library` gained the same
    // check for the markdown notes at the time; it reads the vault, not content/, so it
    // could not see this half.
    //
    // Compared by number: "3.7" and "3-07" are the same lesson written two ways.
    for (const id of allLessonIds()) {
      const lesson = loadLesson(id);
      const title = lesson.slides.find((s) => s.kind === "title");
      if (!title || !("heading" in title)) continue;
      const m = String(title.heading).match(/Lesson\s+(\d+)[-.](\d+)/i);
      if (!m) continue;
      const [, phase, num] = m;
      const [idPhase, idNum] = id.split("-");
      expect(
        Number(phase) === Number(idPhase) && Number(num) === Number(idNum),
        `${id}: title slide says "Lesson ${phase}.${num}"`,
      ).toBe(true);
    }
  });
  test("no Unit 4 slide presents the Kalimas as Qur'an", () => {
    // The `ayah` slide kind means Qur'an: it takes a surah/ayah pair, pulls the text
    // from the pinned corpus and renders it with tajweed colouring. The Kalimas are
    // creedal formulae, not revelation. An `ayah` slide here would present them as
    // Qur'anic — and it would render perfectly, break no schema and fail no other
    // test, so nothing else in the suite can catch it.
    for (const id of allLessonIds()) {
      const lesson = loadLesson(id);
      if (lesson.phase !== 4) continue;
      for (const slide of lesson.slides)
        expect(slide.kind, `${id}: Kalima lesson uses an 'ayah' slide — that kind means Qur'an`).not.toBe("ayah");
    }
  });
  test("every course-map checkpoint id has a content file", () => {
    // Publishing a phase links the student to /checkpoint/<id> from the progress
    // page. `generateStaticParams` enumerates checkpoint FILES, so a phase naming
    // a checkpoint that does not exist builds clean and ships a dead link — the
    // build cannot fail on a route it was never asked to generate. Nothing else
    // here checks the course map's half of that pair.
    const have = new Set(allCheckpointIds());
    for (const phase of loadCourse().phases)
      expect(
        have.has(phase.checkpoint.id),
        `phase ${phase.number} points at missing content/checkpoints/${phase.checkpoint.id}.json`,
      ).toBe(true);
  });
  test("every course-map lesson id has a content file", () => {
    const have = new Set(allLessonIds());
    for (const phase of loadCourse().phases)
      for (const l of phase.lessons) expect(have.has(l.id), `missing content/lessons/${l.id}.json`).toBe(true);
  });
});
