import { describe, it, expect } from "vitest";
import { clusterSafe, flatten } from "../../scripts/lib/spans.mjs";

describe("clusterSafe", () => {
  it("leaves an index already on a base letter alone", () => {
    const t = "بِسْمِ";            // ب + kasra + س + sukun + م + kasra
    expect(clusterSafe(t, 0, -1)).toBe(0);
  });

  it("moves a start index left off a combining mark onto its base", () => {
    const t = "بِسْمِ";
    // index 1 is the kasra (Mn) attached to ب at index 0
    expect(clusterSafe(t, 1, -1)).toBe(0);
  });

  it("moves an end index right to include trailing combining marks", () => {
    const t = "بِسْمِ";
    // end index 1 would cut ب off from its kasra; extend to 2
    expect(clusterSafe(t, 1, +1)).toBe(2);
  });

  it("clamps at string boundaries", () => {
    const t = "بِ";
    expect(clusterSafe(t, 0, -1)).toBe(0);
    expect(clusterSafe(t, t.length, +1)).toBe(t.length);
  });
});

describe("flatten", () => {
  it("returns disjoint segments for non-overlapping input", () => {
    const out = flatten([
      { start: 0, end: 2, rule: "a" },
      { start: 5, end: 7, rule: "b" },
    ]);
    expect(out).toEqual([
      { start: 0, end: 2, rules: ["a"] },
      { start: 5, end: 7, rules: ["b"] },
    ]);
  });

  it("splits an overlap into three segments carrying both rules in the middle", () => {
    const out = flatten([
      { start: 0, end: 5, rule: "a" },
      { start: 3, end: 8, rule: "b" },
    ]);
    expect(out).toEqual([
      { start: 0, end: 3, rules: ["a"] },
      { start: 3, end: 5, rules: ["a", "b"] },
      { start: 5, end: 8, rules: ["b"] },
    ]);
  });

  it("handles full nesting", () => {
    const out = flatten([
      { start: 0, end: 10, rule: "outer" },
      { start: 4, end: 6, rule: "inner" },
    ]);
    expect(out).toEqual([
      { start: 0, end: 4, rules: ["outer"] },
      { start: 4, end: 6, rules: ["outer", "inner"] },
      { start: 6, end: 10, rules: ["outer"] },
    ]);
  });

  it("emits nothing for empty input", () => {
    expect(flatten([])).toEqual([]);
  });

  it("is order-independent", () => {
    const a = flatten([{ start: 3, end: 8, rule: "b" }, { start: 0, end: 5, rule: "a" }]);
    const b = flatten([{ start: 0, end: 5, rule: "a" }, { start: 3, end: 8, rule: "b" }]);
    expect(a).toEqual(b);
  });
});
