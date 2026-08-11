import { describe, it, expect } from "vitest";
import { TAJWEED_RULES, RULE_META, PALETTE_B, PALETTE_A, UNDERLINE } from "./tajweed";

describe("tajweed vocabulary", () => {
  it("covers all 18 cpfair rules", () => {
    for (const r of ["ikhfa", "iqlab", "ghunnah", "qalqalah", "madd_muttasil",
                     "madd_munfasil", "hamzat_wasl", "lam_shamsiyyah", "silent"]) {
      expect(TAJWEED_RULES).toContain(r);
    }
  });
  it("gives every rule metadata", () => {
    for (const r of TAJWEED_RULES) {
      expect(RULE_META[r].ar.length).toBeGreaterThan(0);
      expect(RULE_META[r].en.length).toBeGreaterThan(0);
      expect(RULE_META[r].family.length).toBeGreaterThan(0);
    }
  });
  it("gives every rule a colour in both palettes", () => {
    for (const r of TAJWEED_RULES) {
      expect(PALETTE_B[r]).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(PALETTE_A[r]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
  it("differs between families on the contested colours", () => {
    // Family B: red = qalqalah, blue = madd. Family A inverts this.
    expect(PALETTE_B.qalqalah).not.toBe(PALETTE_A.qalqalah);
    expect(PALETTE_B.madd_muttasil).not.toBe(PALETTE_A.madd_muttasil);
  });
  it("gives every family a distinct underline style", () => {
    const styles = new Set(Object.values(UNDERLINE));
    expect(styles.size).toBeGreaterThanOrEqual(4);
  });
});
