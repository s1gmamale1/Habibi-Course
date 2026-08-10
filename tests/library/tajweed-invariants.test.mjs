import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseNote } from "../../scripts/lib/frontmatter.mjs";

/**
 * Domain invariants over the library vault.
 *
 * The validator checks that notes are well-formed. These check that they are
 * *right* — structural facts about tajweed that hold regardless of how anyone
 * phrases them, and that would be silently wrong if a letter were mistyped or
 * a set were miscopied.
 */

const RULES = "library/02-Rules";
const ALPHABET = [..."ءبتثجحخدذرزسشصضطظعغفقكلمنهوي"]; // 28

function frontmatter(name) {
  const p = join(RULES, `${name}.md`);
  if (!existsSync(p)) return null;
  return parseNote(readFileSync(p, "utf8")).data;
}

function letters(name) {
  const data = frontmatter(name);
  return data?.letters ?? null;
}

describe("noon sakinah & tanwin partition the alphabet", () => {
  const parts = {
    "Izhar-Halqi": 6,
    "Idgham-Maal-Ghunnah": 4,
    "Idgham-Bila-Ghunnah": 2,
    Iqlab: 1,
    "Ikhfa-Haqiqi": 15,
  };

  for (const [note, count] of Object.entries(parts)) {
    it(`${note} lists exactly ${count} letters`, () => {
      expect(letters(note)).toHaveLength(count);
    });
  }

  it("covers all 28 letters with no overlap and no gap", () => {
    const all = Object.keys(parts).flatMap((n) => letters(n) ?? []);
    expect(all).toHaveLength(28);
    expect(new Set(all).size).toBe(28);
    const uncovered = ALPHABET.filter((l) => !all.includes(l));
    expect(uncovered).toEqual([]);
  });
});

describe("closed letter sets", () => {
  it("qalqalah is exactly قطب جد", () => {
    const q = frontmatter("Qalqalah-sifah")?.letters ?? letters("Qalqalah-Sughra");
    expect(new Set(q)).toEqual(new Set([..."قطبجد"]));
  });

  it("isti'la is exactly خص ضغط قظ", () => {
    expect(new Set(letters("Istila"))).toEqual(new Set([..."خصضغطقظ"]));
  });

  it("izhar halqi is exactly the six throat letters", () => {
    expect(new Set(letters("Izhar-Halqi"))).toEqual(new Set([..."ءهعحغخ"]));
  });

  it("idgham ma'al ghunnah is exactly ينمو", () => {
    expect(new Set(letters("Idgham-Maal-Ghunnah"))).toEqual(new Set([..."ينمو"]));
  });

  it("iqlab and ikhfa shafawi are both triggered by ب alone", () => {
    expect(letters("Iqlab")).toEqual(["ب"]);
    expect(letters("Ikhfa-Shafawi")).toEqual(["ب"]);
  });
});

describe("durations in harakat", () => {
  const counts = {
    Ghunnah: 2,
    "Ikhfa-Haqiqi": 2,
    Iqlab: 2,
    "Madd-Tabii": 2,
    "Madd-Muttasil": 4,
    "Madd-Munfasil": 4,
    "Madd-Lazim": 6,
  };

  for (const [note, harakat] of Object.entries(counts)) {
    it(`${note} is ${harakat} harakat`, () => {
      expect(frontmatter(note)?.harakat).toBe(harakat);
    });
  }
});

describe("rule metadata integrity", () => {
  it("no two rule notes share an id", () => {
    const ids = readdirSync(RULES)
      .filter((f) => f.endsWith(".md"))
      .map((f) => frontmatter(f.replace(/\.md$/, ""))?.id)
      .filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
