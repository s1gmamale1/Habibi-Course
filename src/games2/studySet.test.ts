import { describe, expect, test } from "vitest";
import { allLessons } from "@/content/load";
import { deriveGameData } from "@/games/derive";
import { lessonSet, setFromGameData } from "./studySet";

describe("lessonSet", () => {
  test("carries the lesson's letters, words and forms", () => {
    const set = lessonSet("2-08");
    expect(set.id).toBe("lesson:2-08");
    expect(set.letters.length).toBeGreaterThan(25);
    expect(set.words.length).toBeGreaterThan(75);
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

describe("setFromGameData", () => {
  test("does not assume the set came from a lesson", () => {
    const data = deriveGameData(allLessons(), "2-08");
    expect(setFromGameData(data, "due:2026-08-13", "Due today").id).toBe("due:2026-08-13");
  });
});
