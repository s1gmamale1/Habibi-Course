import { describe, expect, it } from "vitest";
import { resolveRuleSlideId } from "./rule-alias.mjs";

const RULE_IDS = new Set(["ikhfa_haqiqi", "iqlab", "qalqalah_sughra", "qalqalah_kubra"]);

describe("resolveRuleSlideId", () => {
  it("passes a canonical id straight through", () => {
    expect(resolveRuleSlideId("iqlab", "3-23", "f.json", RULE_IDS, new Map())).toBe("iqlab");
  });

  it("resolves a render-palette alias with one candidate", () => {
    const cpfairByKey = new Map([["ikhfa", [{ id: "ikhfa_haqiqi", taughtIn: "3-24" }]]]);
    expect(resolveRuleSlideId("ikhfa", "4-05", "f.json", RULE_IDS, cpfairByKey)).toBe(
      "ikhfa_haqiqi",
    );
  });

  it("an ambiguous alias resolves to the candidate this lesson introduces", () => {
    const cpfairByKey = new Map([
      [
        "qalqalah",
        [
          { id: "qalqalah_kubra", taughtIn: "3-06" },
          { id: "qalqalah_sughra", taughtIn: "3-05" },
        ],
      ],
    ]);
    expect(resolveRuleSlideId("qalqalah", "3-06", "3-06.json", RULE_IDS, cpfairByKey)).toBe(
      "qalqalah_kubra",
    );
    expect(resolveRuleSlideId("qalqalah", "3-05", "3-05.json", RULE_IDS, cpfairByKey)).toBe(
      "qalqalah_sughra",
    );
  });

  it("an ambiguous alias with no match on this lesson defaults to the earliest-taught candidate", () => {
    const cpfairByKey = new Map([
      [
        "qalqalah",
        [
          { id: "qalqalah_kubra", taughtIn: "3-06" },
          { id: "qalqalah_sughra", taughtIn: "3-05" },
        ],
      ],
    ]);
    // 4-02 is a Kalima lesson, neither 3-05 nor 3-06 — falls back to the
    // earlier-taught degree, matching what every such lesson's slide text
    // actually describes (mid-word, no pause).
    expect(resolveRuleSlideId("qalqalah", "4-02", "4-02.json", RULE_IDS, cpfairByKey)).toBe(
      "qalqalah_sughra",
    );
  });

  it("fails loudly on a ruleId that is neither canonical nor aliased", () => {
    expect(() =>
      resolveRuleSlideId("ikhfaa_typo", "3-24", "3-24.json", RULE_IDS, new Map()),
    ).toThrow(/ikhfaa_typo/);
  });
});
