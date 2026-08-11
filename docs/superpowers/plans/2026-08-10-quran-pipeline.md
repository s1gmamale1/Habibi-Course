# Quran Data Pipeline (Sub-project B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the vendored Qur'an corpus and tajweed annotations into a build-time-generated, statically-served dataset that the app can render with correct coloured rule spans, correct word timings, and no runtime API calls.

**Architecture:** A build script reads the pinned Tanzil text and cpfair annotations, restricts them to the course's bounded verse set, flattens overlapping annotations into non-overlapping segments, normalises every boundary outward to a grapheme-cluster edge, and emits one JSON file per surah into `src/generated/`. A second script caches Husary Mu'allim word timings. Nothing hits the network at runtime.

**Tech Stack:** Node ≥20 ESM · Vitest · the vendored corpus from Sub-project L

## Global Constraints

- **The pinned corpus is authoritative.** `library/99-Corpus/quran-uthmani.txt` (cpfair's 2017 Tanzil snapshot) is the ONLY text these offsets may be applied to. quran.com's `text_uthmani` differs by inserted U+0640 TATWEEL before superscript alef (9,838 occurrences), waqf signs absent from the pinned text, and basmala prefixing on 113 surahs. **Mixing them mis-highlights nearly every ayah.**
- **Never split inside a grapheme cluster.** cpfair's README states plainly: *"Annotations do not always start or stop on letter boundaries."* Every span boundary must be walked outward over Unicode `Mn` (non-spacing mark) codepoints before it is emitted. This is the single most likely source of rendering bugs.
- **Annotations overlap and nest.** `hamzat_wasl` sits inside `lam_shamsiyyah` in 1:1. Emitting nested spans naively produces invalid or mis-shaped markup. Flatten first.
- **The course's verse set is bounded**: al-Fātiḥa (1:1–7) + surahs 105–114, plus any rule-example ayah cited by a library note. Do not process all 604 pages.
- The word-timings endpoint parameter is **`?fields=segments`**. `?segments=true` returns 200 with the data silently missing.
- Any script that calls `api.quran.com` **must set a User-Agent** — it returns 403 without one.
- Node ≥20, ESM `.mjs`, matching `scripts/check-refs.mjs`.
- Commits: `<type>(<scope>): <description>`. **No `Co-Authored-By` trailer.**
- Generated files go in `src/generated/` and ARE committed (static export, no build-time network).

---

## File Structure

```
scripts/
├── build-quran-data.mjs        # CLI: corpus + annotations → src/generated/
├── fetch-word-timings.mjs      # CLI: quran.com segments → src/generated/timings/
└── lib/
    ├── spans.mjs               # flatten overlaps + cluster-safe boundaries
    └── verse-set.mjs           # which ayat the course needs
src/generated/
├── verses/<surah>.json         # {ayah, text, spans[]}
└── timings/<surah>.json        # {ayah, segments[]}
tests/quran/
├── spans.test.mjs
└── build-quran-data.test.mjs
```

`spans.mjs` is the only file with real algorithmic risk; it gets the heaviest tests.

---

## Task 1: Cluster-safe span flattening

**Files:**
- Create: `scripts/lib/spans.mjs`
- Test: `tests/quran/spans.test.mjs`

**Interfaces:**
- Produces:
  - `clusterSafe(text, index, direction) => number` — move an index outward to a grapheme-cluster edge. `direction` is `-1` (start, move left) or `+1` (end, move right).
  - `flatten(annotations) => Array<{start, end, rules: string[]}>` — non-overlapping segments in ascending order; each carries every rule active over it.

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/quran/spans.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```javascript
/**
 * Move `index` outward to a grapheme-cluster edge.
 * direction -1 = span start (walk left off combining marks onto the base letter)
 * direction +1 = span end   (walk right to swallow trailing combining marks)
 */
export function clusterSafe(text, index, direction) {
  const isMark = (cp) => cp !== undefined && /\p{Mn}/u.test(String.fromCodePoint(cp));
  let i = Math.max(0, Math.min(index, text.length));
  if (direction < 0) {
    while (i > 0 && isMark(text.codePointAt(i))) i--;
    return i;
  }
  while (i < text.length && isMark(text.codePointAt(i))) i++;
  return i;
}

/**
 * Flatten possibly-overlapping annotations into disjoint segments.
 * Each output segment lists every rule active across it, in input order.
 */
export function flatten(annotations) {
  if (annotations.length === 0) return [];
  const edges = new Set();
  for (const a of annotations) { edges.add(a.start); edges.add(a.end); }
  const points = [...edges].sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const rules = annotations
      .filter((a) => a.start < end && a.end > start)
      .map((a) => a.rule);
    if (rules.length > 0) out.push({ start, end, rules });
  }
  return out;
}
```

- [ ] **Step 4: Run it and confirm all 9 tests pass**

If `clusterSafe` fails, inspect the actual codepoints rather than adjusting the expectation:
`node -e "console.log([...'بِسْمِ'].map((c,i)=>i+':'+c.codePointAt(0).toString(16)))"`

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/spans.mjs tests/quran/spans.test.mjs
git commit -m "feat(quran): cluster-safe span flattening"
```

---

## Task 2: The verse set

**Files:**
- Create: `scripts/lib/verse-set.mjs`
- Test: `tests/quran/verse-set.test.mjs`

**Interfaces:**
- Produces: `courseVerses(libraryDir?) => Set<string>` — every `"surah:ayah"` the course needs: al-Fātiḥa 1:1–7, surahs 105–114 in full, plus every `examples[].ref` found in the library vault.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from "vitest";
import { courseVerses } from "../../scripts/lib/verse-set.mjs";

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
  it("excludes verses the course does not use", () => {
    expect(set.has("18:1")).toBe(false);
  });
  it("is a reasonable size, not the whole Quran", () => {
    expect(set.size).toBeGreaterThan(50);
    expect(set.size).toBeLessThan(400);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails.**

- [ ] **Step 3: Implement**

```javascript
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { parseNote } from "./frontmatter.mjs";
import { loadCorpus } from "./corpus.mjs";

const HIFZ_SURAHS = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e.startsWith(".")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === ".md") out.push(p);
  }
  return out;
}

/** Every "surah:ayah" the course needs rendered. */
export function courseVerses(libraryDir = "library") {
  const corpus = loadCorpus();
  const set = new Set();
  for (const key of corpus.keys()) {
    const surah = Number(key.split(":")[0]);
    if (HIFZ_SURAHS.includes(surah)) set.add(key);
  }
  for (const file of walk(libraryDir)) {
    let data;
    try { ({ data } = parseNote(readFileSync(file, "utf8"))); } catch { continue; }
    for (const ex of data.examples ?? []) {
      if (ex?.ref && corpus.has(ex.ref)) set.add(ex.ref);
    }
  }
  return set;
}
```

- [ ] **Step 4: Run it, confirm 4 tests pass.**

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/verse-set.mjs tests/quran/verse-set.test.mjs
git commit -m "feat(quran): bounded course verse set"
```

---

## Task 3: The build script

**Files:**
- Create: `scripts/build-quran-data.mjs`
- Test: `tests/quran/build-quran-data.test.mjs`
- Modify: `package.json` (add `build:quran`)

**Interfaces:**
- Produces: `buildVerses() => Map<number, Array<{ayah, text, spans}>>` and, as a CLI, `src/generated/verses/<surah>.json`.

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run it, confirm it fails.**

- [ ] **Step 3: Implement**

```javascript
#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadCorpus } from "./lib/corpus.mjs";
import { courseVerses } from "./lib/verse-set.mjs";
import { flatten, clusterSafe } from "./lib/spans.mjs";

const ANNOTATIONS = "library/99-Corpus/tajweed.hafs.json";
const OUT_DIR = "src/generated/verses";

export function buildVerses() {
  const corpus = loadCorpus();
  const wanted = courseVerses();
  const raw = JSON.parse(readFileSync(ANNOTATIONS, "utf8"));
  const bySurah = new Map();

  for (const entry of raw) {
    const key = `${entry.surah}:${entry.ayah}`;
    if (!wanted.has(key)) continue;
    const text = corpus.get(key);
    if (!text) continue;

    const safe = entry.annotations.map((a) => ({
      rule: a.rule,
      start: clusterSafe(text, a.start, -1),
      end: clusterSafe(text, a.end, +1),
    })).filter((a) => a.start < a.end && a.end <= text.length);

    const spans = flatten(safe);
    if (!bySurah.has(entry.surah)) bySurah.set(entry.surah, []);
    bySurah.get(entry.surah).push({ ayah: entry.ayah, text, spans });
  }

  for (const ayat of bySurah.values()) ayat.sort((a, b) => a.ayah - b.ayah);
  return bySurah;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildVerses();
  mkdirSync(OUT_DIR, { recursive: true });
  let verses = 0;
  for (const [surah, ayat] of out) {
    writeFileSync(join(OUT_DIR, `${surah}.json`), JSON.stringify(ayat), "utf8");
    verses += ayat.length;
  }
  console.log(`wrote ${out.size} surahs, ${verses} verses to ${OUT_DIR}`);
}
```

- [ ] **Step 4: Run it, confirm 5 tests pass.**

- [ ] **Step 5: Generate and eyeball the output**

```bash
node scripts/build-quran-data.mjs
node -e "
const a=require('./src/generated/verses/111.json')[0];
console.log(a.text);
for (const s of a.spans) console.log(s.rules.join(','), JSON.stringify(a.text.slice(s.start,s.end)));
"
```

Every extracted slice must be a sensible letter-plus-marks unit — never a bare combining mark, never a cut ligature.

- [ ] **Step 6: Add the npm script and commit**

```json
"build:quran": "node scripts/build-quran-data.mjs"
```

```bash
git add scripts/build-quran-data.mjs tests/quran/ src/generated/verses package.json
git commit -m "feat(quran): build-time verse and span generation"
```

---

## Task 4: Word timings

**Files:**
- Create: `scripts/fetch-word-timings.mjs`
- Modify: `package.json` (add `fetch:timings`)

**Interfaces:**
- Produces: `src/generated/timings/<surah>.json` — `[{ayah, segments: [[wordIdx, wordPos, startMs, endMs], ...]}]`.

- [ ] **Step 1: Confirm the endpoint by hand before writing code**

```bash
curl -s -H "User-Agent: habibi-course/1.0" \
  "https://api.quran.com/api/v4/recitations/12/by_chapter/112?fields=segments" | head -c 400
```

Expected: JSON with `audio_files[].segments` populated. **If `segments` is missing or empty, you used `segments=true` instead of `fields=segments`** — that returns 200 with the data silently absent.

- [ ] **Step 2: Implement**

```javascript
#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const RECITATION = 12; // Husary Mu'allim
const SURAHS = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
const OUT_DIR = "src/generated/timings";
const UA = "habibi-course/1.0";

async function fetchChapter(n) {
  const url = `https://api.quran.com/api/v4/recitations/${RECITATION}/by_chapter/${n}?fields=segments`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${n}: HTTP ${res.status}`);
  const json = await res.json();
  return (json.audio_files ?? []).map((f) => ({
    ayah: Number(String(f.verse_key).split(":")[1]),
    segments: f.segments ?? [],
  }));
}

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const n of SURAHS) {
    const data = await fetchChapter(n);
    const missing = data.filter((d) => d.segments.length === 0).length;
    writeFileSync(join(OUT_DIR, `${n}.json`), JSON.stringify(data), "utf8");
    console.log(`surah ${n}: ${data.length} ayat, ${missing} without segments`);
    if (missing > 0) console.warn(`  WARN surah ${n} has ${missing} ayat with no timing data`);
  }
};

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Run it and verify coverage**

```bash
node scripts/fetch-word-timings.mjs
```

Expected: every surah reports `0 without segments`. Prior verification found 100% coverage on every surah sampled. **If any surah reports missing segments, stop and report it** — do not silently ship partial timings.

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-word-timings.mjs src/generated/timings package.json
git commit -m "feat(quran): cache Husary Muallim word timings"
```

---

## Task 5: The KFGQPC font

**Files:**
- Create: `public/fonts/UthmanicHafs1Ver18.woff2`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Download it (87 KB)**

```bash
mkdir -p public/fonts
curl -sL -o public/fonts/UthmanicHafs1Ver18.woff2 \
  "https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2"
wc -c public/fonts/UthmanicHafs1Ver18.woff2   # expect ~87760
```

**Do NOT subset this font.** Its licence permits free use and distribution but **prohibits modification**, and subsetting is modification. Ship the 87 KB file whole. (Amiri is OFL and may be subset freely — that constraint applies only to KFGQPC.)

- [ ] **Step 2: Register the face**

In `src/app/globals.css`:

```css
@font-face {
  font-family: "UthmanicHafs";
  src: url("/fonts/UthmanicHafs1Ver18.woff2") format("woff2");
  font-display: swap;
}
.quran { font-family: "UthmanicHafs", "Amiri", serif; line-height: 2.1; }
```

Keep `line-height: 2.1` — the repo already uses it and stacked harakat clip below that.

- [ ] **Step 3: Commit**

```bash
git add public/fonts src/app/globals.css
git commit -m "feat(quran): KFGQPC Uthmanic Hafs font, unmodified"
```

---

## Self-Review

**Spec coverage.** Design spec §6.1 stack → Tasks 3–5. §6.2 traps: text-mixing → Task 3 (pinned corpus only); `fields=segments` → Task 4 Step 1; no-subsetting → Task 5 Step 1; cluster normalisation and overlap flattening → Task 1; User-Agent → Task 4.

**Deliberate exclusions.** No React, no schema changes, no colour rendering — that is Sub-project C. This plan ends with correct data on disk.

**Type consistency.** `clusterSafe(text, index, direction) => number` and `flatten(annotations) => [{start,end,rules}]` from Task 1 are used with those exact signatures in Task 3. `courseVerses() => Set<string>` from Task 2 likewise. `loadCorpus`/`parseNote` are imported from Sub-project L unchanged.

**Known risk.** Task 1's `clusterSafe` tests assert specific indices into `"بِسْمِ"`. If the implementation's notion of a cluster edge differs from the test's, inspect real codepoints before touching either — the *tests* encode the requirement, but their specific indices are an assumption about that string worth verifying once.
