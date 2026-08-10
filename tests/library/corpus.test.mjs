import { describe, it, expect, beforeAll } from "vitest";
import { loadCorpus, verifyExample } from "../../scripts/lib/corpus.mjs";

let corpus;
beforeAll(() => { corpus = loadCorpus(); });

describe("loadCorpus", () => {
  it("indexes every ayah", () => {
    expect(corpus.size).toBe(6236);
  });
  it("keys by surah:ayah", () => {
    expect(corpus.get("1:1")).toContain("بِسْمِ");
  });
});

describe("verifyExample", () => {
  it("accepts a real fragment at the right ref", () => {
    const ayah = corpus.get("106:4");
    const fragment = ayah.slice(0, 10);
    expect(verifyExample(corpus, { ref: "106:4", text: fragment }).ok).toBe(true);
  });

  it("rejects a fragment that is not in that ayah", () => {
    const r = verifyExample(corpus, { ref: "106:4", text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/not found/i);
  });

  it("rejects an unknown ref", () => {
    const r = verifyExample(corpus, { ref: "999:1", text: "x" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/no such ayah/i);
  });

  it("normalises NFC before comparing", () => {
    const ayah = corpus.get("1:2");
    const decomposed = ayah.slice(0, 8).normalize("NFD");
    expect(verifyExample(corpus, { ref: "1:2", text: decomposed }).ok).toBe(true);
  });
});
