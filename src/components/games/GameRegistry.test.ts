import { describe, it, expect, beforeEach } from "vitest";
import { registerGame, getGames, clearGames } from "./GameRegistry";

const entry = (id: string) => ({ id, label: id, render: () => null });

describe("GameRegistry", () => {
  beforeEach(() => clearGames());

  it("returns registered games in the order requested", () => {
    registerGame(entry("a"));
    registerGame(entry("b"));
    expect(getGames(["b", "a"]).map((g) => g.id)).toEqual(["b", "a"]);
  });

  it("drops unknown ids rather than throwing", () => {
    registerGame(entry("a"));
    expect(getGames(["a", "nope"]).map((g) => g.id)).toEqual(["a"]);
  });

  it("returns nothing when no ids are requested", () => {
    registerGame(entry("a"));
    expect(getGames([])).toEqual([]);
  });

  it("replaces an entry re-registered under the same id", () => {
    registerGame({ id: "a", label: "first", render: () => null });
    registerGame({ id: "a", label: "second", render: () => null });
    const [g] = getGames(["a"]);
    expect(g.label).toBe("second");
  });
});
