import { describe, expect, test } from "vitest";
import { isConceptId } from "@/practice/concepts";
import "./games";
import { SLICE_GAME_IDS } from "./games";
import { allGames, questionsFor } from "./registry";
import { lessonSet } from "./studySet";
import { MODE_RANK } from "./types";

const SET = lessonSet("2-08");

describe("every registered game", () => {
  test("declares a mode, a cost and whether it grades", () => {
    for (const g of allGames()) {
      expect(MODE_RANK[g.mode]).toBeGreaterThanOrEqual(0);
      expect(g.cost).toBeGreaterThanOrEqual(1);
      expect(typeof g.graded).toBe("boolean");
    }
  });

  test("produces questions whose conceptId the scheduler can act on", () => {
    for (const g of allGames()) {
      for (const q of g.questions(SET)) expect(isConceptId(q.conceptId)).toBe(true);
    }
  });

  test("returns [] for an empty set rather than throwing", () => {
    const empty = { ...SET, letters: [], words: [], forms: [], rules: [] };
    for (const g of allGames()) expect(g.questions(empty)).toEqual([]);
  });
});

describe("the slice is not shallow", () => {
  const questions = questionsFor([...SLICE_GAME_IDS], SET, { gradedOnly: true });

  test("a Unit 1 set yields at least 3 distinct games", () => {
    // The owner played a session that offered two games in one mode band and
    // called it "guess the letter". This is that complaint, as a gate.
    expect(new Set(questions.map((q) => q.gameId)).size).toBeGreaterThanOrEqual(3);
  });

  test("and at least 2 distinct response modes", () => {
    const modes = new Set(allGames().filter((g) => questions.some((q) => q.gameId === g.id)).map((g) => g.mode));
    expect(modes.size).toBeGreaterThanOrEqual(2);
  });

  test("and reaches production, which the old session never did in 5 items", () => {
    const production = allGames().filter((g) => g.mode === "production").map((g) => g.id);
    expect(questions.some((q) => production.includes(q.gameId))).toBe(true);
  });
});

describe("no game reads a clock it was not given", () => {
  test("no source file in games2 calls Date.now directly", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "src/games2/games");
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))) {
      expect(readFileSync(join(dir, f), "utf8")).not.toMatch(/Date\.now\(\)/);
    }
  });
});
