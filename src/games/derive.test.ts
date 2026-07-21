import { describe, expect, test } from "vitest";
import type { Lesson } from "@/content/schema";
import { allLessons } from "@/content/load";
import { deriveGameData } from "./derive";

const cue = { type: "teacher-voice" as const, cue: "cue" };

function letterSlide(arabic: string, extra: Record<string, unknown> = {}) {
  return {
    kind: "letter" as const,
    item: { arabic, name: `name-${arabic}`, audio: cue },
    makhraj: "m",
    notes: [],
    ...extra,
  };
}

// Cast: derive only reads `id` and `slides`; full zod-valid lessons need 8+ slides.
function lesson(id: string, slides: unknown[]): Lesson {
  return { id, slides } as unknown as Lesson;
}

const fixtures: Lesson[] = [
  lesson("1-01", [
    letterSlide("ب", {
      forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
      examples: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
    }),
    letterSlide("ا"),
  ]),
  lesson("1-02", [
    letterSlide("ت", {
      forms: { isolated: "ت", final: "ـت" }, // only 2 forms → no formEntry
      examples: [
        { arabic: "تَاب", translit: "tāb", meaning: "repented" },
        { arabic: "تَمْر", translit: "tamr", meaning: "dates" }, // م not taught → excluded
      ],
    }),
    letterSlide("ب"), // duplicate → deduped
  ]),
  lesson("1-07", [
    letterSlide("م", { forms: { isolated: "م", initial: "مـ", medial: "ـمـ", final: "ـم" } }),
    letterSlide("ر"),
  ]),
];

describe("deriveGameData (fixtures)", () => {
  test("letterPool is cumulative and deduped; newLetters is this lesson only", () => {
    const d = deriveGameData(fixtures, "1-02");
    expect(d.letterPool.map((i) => i.arabic)).toEqual(["ب", "ا", "ت"]);
    expect(d.newLetters.map((i) => i.arabic)).toEqual(["ت", "ب"]);
  });
  test("wordPool only admits words whose base letters are all learned", () => {
    const d1 = deriveGameData(fixtures, "1-01");
    expect(d1.wordPool.map((w) => w.arabic)).toEqual(["بَاب"]);
    const d2 = deriveGameData(fixtures, "1-02");
    expect(d2.wordPool.map((w) => w.arabic)).toEqual(["بَاب", "تَاب"]); // تمر still excluded
    const d7 = deriveGameData(fixtures, "1-07");
    expect(d7.wordPool.map((w) => w.arabic)).toContain("تَمْر"); // م now learned
  });
  test("formEntries require >=3 forms", () => {
    const d = deriveGameData(fixtures, "1-02");
    expect(d.formEntries.map((f) => f.item.arabic)).toEqual(["ب"]);
  });
  test("formsTaught flips at 1-07", () => {
    expect(deriveGameData(fixtures, "1-02").formsTaught).toBe(false);
    expect(deriveGameData(fixtures, "1-07").formsTaught).toBe(true);
  });
  test("unknown lesson id throws", () => {
    expect(() => deriveGameData(fixtures, "9-99")).toThrow(/Unknown lesson/);
  });
});

describe("deriveGameData (real content)", () => {
  test("lesson 1-03 has 13 cumulative letters and only fully-learned words", () => {
    const d = deriveGameData(allLessons(), "1-03");
    expect(d.letterPool).toHaveLength(13);
    const words = d.wordPool.map((w) => w.arabic);
    expect(words).toContain("خُبْز"); // خ ب ز all taught by 1-03
    expect(words).not.toContain("رَجُل"); // ل taught in 1-06
    expect(words).not.toContain("سَمَك"); // م ك taught in 1-06
  });
  test("lesson 1-06 has all 28 letters", () => {
    expect(deriveGameData(allLessons(), "1-06").letterPool).toHaveLength(28);
  });
});
