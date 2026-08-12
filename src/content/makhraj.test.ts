/**
 * Every tongue letter shows its own makhraj, and the file is really there.
 *
 * 18 of the 29 letters issue from the tongue, and for most of the project's
 * life all of them pointed at one diagram whose highlight covered the whole
 * tongue — so ك (back), ض (side) and ت (tip) were indistinguishable to the
 * learner this course was built for. The owner's original ask was diagrams so
 * she "wouldn't have to guess"; for the tongue letters she still did.
 *
 * This is the join between the two halves of ROADMAP Phase 7a: `makhraj_point`
 * in the library notes says which of the ten points a letter belongs to, and
 * the lesson JSON has to agree with it. Neither half is checkable alone — the
 * library gate proves the points are complete and self-consistent, and this
 * proves the slides actually use them.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { allLessons } from "./load";

const ROOT = process.cwd();

/** letter → makhraj point, read from the library frontmatter that owns it. */
function tonguePoints(): Map<string, number> {
  const dir = join(ROOT, "library", "03-Letters");
  const out = new Map<string, number>();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const text = readFileSync(join(dir, file), "utf8");
    if (!/^makhraj_zone: lisan$/m.test(text)) continue;
    const arabic = /^arabic:\s*(.+)$/m.exec(text)?.[1].trim().replace(/^"|"$/g, "");
    const point = /^makhraj_point:\s*(\d+)$/m.exec(text)?.[1];
    if (arabic && point) out.set(arabic, Number(point));
  }
  return out;
}

const POINTS = tonguePoints();
const letterSlides = allLessons().flatMap((l) =>
  l.slides.flatMap((s) => (s.kind === "letter" ? [{ lesson: l.id, slide: s }] : [])),
);
const tongueSlides = letterSlides.filter((r) => POINTS.has(r.slide.item.arabic));

describe("per-letter makhraj diagrams", () => {
  test("the library really does classify 18 tongue letters", () => {
    // The premise of everything below. If this drifts, it should fail here and
    // say so, rather than as a confusing miss further down.
    expect(POINTS.size).toBe(18);
  });

  test("every tongue-letter slide points at its own makhraj point", () => {
    expect(tongueSlides.length).toBeGreaterThan(0);
    for (const { lesson, slide } of tongueSlides) {
      const point = POINTS.get(slide.item.arabic);
      expect(`${lesson} ${slide.item.arabic} → ${slide.image}`).toBe(
        `${lesson} ${slide.item.arabic} → /images/makhraj/lisan-${point}.jpg`,
      );
    }
  });

  test("no tongue letter is left on the old whole-tongue diagram", () => {
    // The specific regression: `lisan.jpg` highlights the entire tongue, so a
    // slide still on it is a slide that cannot answer "where exactly?".
    const stragglers = tongueSlides
      .filter((r) => r.slide.image === "/images/makhraj/lisan.jpg")
      .map((r) => `${r.lesson} ${r.slide.item.arabic}`);
    expect(stragglers).toEqual([]);
  });

  test("every image a slide names actually exists on disk", () => {
    // A 404 here is invisible in a static export: the page renders, the figure
    // is simply blank, and the learner sees nothing rather than an error.
    const missing = letterSlides
      .map((r) => r.slide.image)
      .filter((src): src is string => Boolean(src))
      .filter((src) => !existsSync(join(ROOT, "public", src)))
      .sort();
    expect([...new Set(missing)]).toEqual([]);
  });

  test("the three points one highlight used to collapse are three different images", () => {
    // ك is the back of the tongue, ض its side, ت its tip. This is the concrete
    // complaint Phase 7a was written to answer, asserted end to end.
    const imageOf = (letter: string) =>
      tongueSlides.find((r) => r.slide.item.arabic === letter)?.slide.image;
    const [back, side, tip] = [imageOf("ك"), imageOf("ض"), imageOf("ت")];
    for (const src of [back, side, tip]) expect(src).toBeTruthy();
    expect(new Set([back, side, tip]).size).toBe(3);
  });

  test("letters that share a point share an image, and letters that do not, do not", () => {
    // ت د ط are one contact and legitimately share a diagram; ص is a different
    // one. A per-letter image that ignored the grouping would be 18 renders of
    // 10 facts, and would drift.
    const imageOf = (letter: string) =>
      tongueSlides.find((r) => r.slide.item.arabic === letter)?.slide.image;
    expect(imageOf("د")).toBe(imageOf("ت"));
    expect(imageOf("ط")).toBe(imageOf("ت"));
    expect(imageOf("ص")).not.toBe(imageOf("ت"));
  });
});
