import { describe, it, expect } from "vitest";
import { buildVerses } from "../../scripts/build-quran-data.mjs";

describe("buildVerses", () => {
  const out = buildVerses();

  it("emits the hifz surahs", () => {
    expect(out.has(112)).toBe(true);
    expect(out.get(112).length).toBe(4);
  });

  it("spans never exceed the verse text length", () => {
    for (const [, ayat] of out) {
      for (const { text, spans } of ayat) {
        for (const s of spans) {
          expect(s.start).toBeGreaterThanOrEqual(0);
          expect(s.end).toBeLessThanOrEqual(text.length);
          expect(s.start).toBeLessThan(s.end);
        }
      }
    }
  });

  it("spans are disjoint and ascending", () => {
    for (const [, ayat] of out) {
      for (const { spans } of ayat) {
        for (let i = 1; i < spans.length; i++) {
          expect(spans[i].start).toBeGreaterThanOrEqual(spans[i - 1].end);
        }
      }
    }
  });

  it("finds qalqalah in al-Masad 111:1 (وَتَبَّ)", () => {
    const ayah = out.get(111).find((a) => a.ayah === 1);
    const rules = ayah.spans.flatMap((s) => s.rules);
    expect(rules).toContain("qalqalah");
  });

  it("carries every rule from the source annotations", () => {
    const ayah = out.get(1).find((a) => a.ayah === 1);
    const rules = new Set(ayah.spans.flatMap((s) => s.rules));
    expect(rules.has("hamzat_wasl")).toBe(true);
    expect(rules.has("lam_shamsiyyah")).toBe(true);
    expect(rules.has("madd_2")).toBe(true);
  });
});
