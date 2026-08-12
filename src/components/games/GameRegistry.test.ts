import { describe, it, expect, beforeEach } from "vitest";
import { registerGame, getGames, clearGames, pickExemplar, startWith } from "./GameRegistry";

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

/**
 * The two helpers every drill honours its exemplar through. Tested here as
 * functions as well as through thirteen drills, because the properties that
 * matter are properties of the rotation and not of any one drill.
 */
describe("startWith", () => {
  const items = ["a", "b", "c", "d"];
  const id = (s: string) => s;

  it("puts the named item first and keeps everything else behind it", () => {
    expect(startWith(items, id, "c")).toEqual(["c", "d", "a", "b"]);
  });

  it("keeps the whole list, so the drill's own next question still exists", () => {
    // A session shows one question per mount, but the same component is mounted
    // from `GamePanel` with no plan and goes on cycling — and a learner can
    // press the drill's own "next" inside a slot. Truncating to the planned
    // item would leave that button doing nothing.
    expect(startWith(items, id, "c")).toHaveLength(items.length);
    expect([...startWith(items, id, "c")].sort()).toEqual(items);
  });

  it("leaves the order alone when no exemplar was planned", () => {
    expect(startWith(items, id)).toEqual(items);
  });

  it("leaves the order alone for a key it does not recognise", () => {
    // A pool assembled against an older build. Falling back costs the guarantee
    // that the question is the planned one; refusing to render would cost the
    // learner the slot.
    expect(startWith(items, id, "zz")).toEqual(items);
  });

  it("does not mutate the list it was given", () => {
    const original = [...items];
    startWith(items, id, "d");
    expect(items).toEqual(original);
  });
});

describe("pickExemplar", () => {
  const items = [{ k: "a" }, { k: "b" }];
  const key = (i: { k: string }) => i.k;

  it("finds the one named", () => {
    expect(pickExemplar(items, key, "b")).toBe(items[1]);
  });

  it("admits it has none rather than handing back the first", () => {
    // The difference between "the drill was told which exemplar to show" and
    // "the drill chose one" has to survive to the drill, or a stale key would
    // quietly drill something else while the row claimed otherwise.
    expect(pickExemplar(items, key, "zz")).toBeUndefined();
    expect(pickExemplar(items, key)).toBeUndefined();
  });
});
