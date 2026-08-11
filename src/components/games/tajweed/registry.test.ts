import { describe, expect, test } from "vitest";
import { allLessonIds, loadLesson } from "@/content/load";
import { getGames } from "../GameRegistry";
import { TAJWEED_GAME_IDS } from "./index";

// I-4, from the independent review of PR #5.
//
// All seven tajweed drills call `registerGame(...)` at module scope, but nothing outside their
// own test files imported them. So in the built app the modules never loaded, the registry was
// empty, and the bundler tree-shook ~2,200 lines away. Meanwhile 33 published lessons named
// those drills in their `games:` field — and `LessonSchema` had no `games` field, so Zod
// stripped it and `lesson.games` was `undefined` regardless.
//
// Three independent breaks, each of which alone was enough to make the feature unreachable.
// The existing tests all passed, because a test that imports a component directly *does* fire
// its registration — which is exactly why this file imports the barrel instead.
describe("the tajweed drills are reachable", () => {
  test("importing the barrel registers all seven", () => {
    const found = getGames([...TAJWEED_GAME_IDS]);
    expect(found.map((g) => g.id).sort()).toEqual([...TAJWEED_GAME_IDS].sort());
  });

  test("every drill a published lesson asks for actually resolves", () => {
    const unresolved: string[] = [];
    for (const id of allLessonIds()) {
      const wanted = loadLesson(id).games;
      const got = getGames(wanted).map((g) => g.id);
      for (const w of wanted) if (!got.includes(w)) unresolved.push(`${id} → ${w}`);
    }
    expect(unresolved).toEqual([]);
  });

  test("lessons do ask for drills — otherwise the check above proves nothing", () => {
    // `games` survives schema parsing. It did not before: Zod stripped the undeclared field,
    // so this assertion is the one that catches a regression in the schema itself.
    const asking = allLessonIds().filter((id) => loadLesson(id).games.length > 0);
    expect(asking.length).toBeGreaterThanOrEqual(33);
  });

  test("every registered drill has a non-empty label to show in a tab", () => {
    for (const g of getGames([...TAJWEED_GAME_IDS])) {
      expect(g.label.trim().length, `${g.id} has no label`).toBeGreaterThan(0);
    }
  });
});
