import { describe, it, expect } from "vitest";
import { CPFAIR_KEYS, RULE_FAMILIES, NOTE_TYPES, STATUSES } from "../../scripts/lib/rules.mjs";

describe("closed vocabularies", () => {
  it("has exactly the 18 cpfair rule keys", () => {
    expect(CPFAIR_KEYS.size).toBe(18);
    for (const k of ["ikhfa", "iqlab", "ghunnah", "qalqalah", "madd_muttasil",
                     "madd_munfasil", "hamzat_wasl", "lam_shamsiyyah", "silent"]) {
      expect(CPFAIR_KEYS.has(k)).toBe(true);
    }
  });
  it("does not admit invented keys", () => {
    expect(CPFAIR_KEYS.has("tafkhim")).toBe(false);
  });
  it("defines note types and statuses", () => {
    expect(NOTE_TYPES.has("rule")).toBe(true);
    expect(STATUSES.has("verified")).toBe(true);
    expect(STATUSES.has("draft")).toBe(true);
  });
  it("defines rule families", () => {
    expect(RULE_FAMILIES.has("noon-sakinah")).toBe(true);
  });
});
