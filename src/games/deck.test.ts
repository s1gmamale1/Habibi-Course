import { describe, expect, test } from "vitest";
import type { Slide } from "@/content/schema";
import type { GameData } from "./derive";
import { buildDeckSlides } from "./deck";

const data: GameData = {
  lessonId: "1-01",
  newLetters: [],
  letterPool: [{ arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "c" } }],
  formEntries: [],
  wordPool: [],
  formsTaught: false,
};

const slides: Slide[] = [
  { kind: "title", heading: "T" },
  { kind: "concept", heading: "C", body: ["b"] },
  { kind: "homework", heading: "HW", tasks: ["t"] },
];

describe("buildDeckSlides", () => {
  test("inserts the games slide before homework", () => {
    const out = buildDeckSlides(slides, data);
    expect(out.map((s) => s.kind)).toEqual(["title", "concept", "games", "homework"]);
  });
  test("appends when there is no homework slide", () => {
    const out = buildDeckSlides(slides.slice(0, 2), data);
    expect(out.map((s) => s.kind)).toEqual(["title", "concept", "games"]);
  });
  test("no games slide when there is nothing to play", () => {
    const empty = { ...data, letterPool: [], wordPool: [] };
    expect(buildDeckSlides(slides, empty).map((s) => s.kind)).toEqual(["title", "concept", "homework"]);
  });
});
