import { describe, expect, test } from "vitest";
import path from "node:path";
import { parseLessonFile } from "./load";

const fx = (f: string) => path.join(__dirname, "__fixtures__", f);

describe("parseLessonFile", () => {
  test("parses a valid lesson file", () => {
    expect(parseLessonFile(fx("lesson-valid.json")).id).toBe("1-01");
  });
  test("throws naming the file for an invalid audio tier", () => {
    expect(() => parseLessonFile(fx("lesson-bad-audio.json"))).toThrow(/lesson-bad-audio\.json/);
  });
  test("throws naming the file for invalid JSON syntax", () => {
    expect(() => parseLessonFile(fx("lesson-broken.json"))).toThrow(/lesson-broken\.json/);
  });
});
