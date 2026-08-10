import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { courseVerses } from "../../scripts/lib/verse-set.mjs";
import { parseNote } from "../../scripts/lib/frontmatter.mjs";

const HIFZ = new Set([1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e.startsWith(".")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === ".md") out.push(p);
  }
  return out;
}

/** Every examples[].ref cited anywhere in the vault. */
function citedRefs(libraryDir = "library") {
  const cited = new Set();
  for (const f of walk(libraryDir)) {
    let data;
    try { ({ data } = parseNote(readFileSync(f, "utf8"))); } catch { continue; }
    for (const ex of data.examples ?? []) if (ex?.ref) cited.add(ex.ref);
  }
  return cited;
}

describe("courseVerses", () => {
  const set = courseVerses();
  it("includes all of al-Fatiha", () => {
    for (let a = 1; a <= 7; a++) expect(set.has(`1:${a}`)).toBe(true);
  });
  it("includes the hifz set 105-114", () => {
    expect(set.has("112:1")).toBe(true);
    expect(set.has("114:6")).toBe(true);
    expect(set.has("105:1")).toBe(true);
  });
  it("contains only hifz-set verses and verses the library cites", () => {
    const cited = citedRefs();
    for (const key of set) {
      const surah = Number(key.split(":")[0]);
      expect(HIFZ.has(surah) || cited.has(key)).toBe(true);
    }
  });
  it("is a reasonable size, not the whole Quran", () => {
    expect(set.size).toBeGreaterThan(50);
    expect(set.size).toBeLessThan(400);
  });
});
