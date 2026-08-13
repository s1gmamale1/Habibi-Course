import { describe, expect, test } from "vitest";
import { lessonSet } from "./studySet";

describe("lessonSet", () => {
  test("carries the lesson's letters, words and forms", () => {
    const set = lessonSet("2-08");
    expect(set.id).toBe("lesson:2-08");
    expect(set.letters.length).toBeGreaterThan(20);
    expect(set.words.length).toBeGreaterThan(50);
    expect(set.forms.length).toBeGreaterThan(0);
  });

  test("every word carries the three fields the new games need", () => {
    // Arabic + transliteration + meaning is what Match, Word bank and Type it
    // all run on. A word missing one of them is unusable, not merely thinner.
    for (const w of lessonSet("2-08").words) {
      expect(w.arabic).toBeTruthy();
      expect(w.translit).toBeTruthy();
      expect(w.meaning).toBeTruthy();
    }
  });

  test("an early lesson has fewer letters than a later one", () => {
    expect(lessonSet("1-02").letters.length).toBeLessThan(lessonSet("2-08").letters.length);
  });
});
