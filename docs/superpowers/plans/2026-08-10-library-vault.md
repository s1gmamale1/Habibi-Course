# Tajweed Course Library (Sub-project L) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Obsidian vault at `library/` holding every rule, letter, source, and lesson of the tajweed course as machine-verified markdown, so that no lesson is written into JSON slides until its content and citations have been proven correct.

**Architecture:** A plain-markdown Obsidian vault committed to the repo, with a typed YAML frontmatter contract on every note. A Node validator (`scripts/check-library.mjs`) enforces that contract and — critically — verifies every quoted Qur'anic example against the pinned Tanzil corpus by exact string match. Content correctness becomes a build gate, not a promise.

**Tech Stack:** Markdown + YAML frontmatter · Obsidian (viewer only; the vault is plain files) · Node ≥20 ESM · Vitest · `yaml` (new devDependency)

## Global Constraints

- **Qur'an text is NEVER hand-typed.** Every Arabic example must byte-match the pinned corpus at its cited `surah:ayah` after NFC normalisation. The validator enforces this; there is no manual override.
- **The pinned corpus is `cpfair`'s 2017 Tanzil snapshot**, not quran.com's `text_uthmani`. They differ by inserted U+0640 TATWEEL, waqf signs, and basmala prefixing. Never mix them.
- **Full text is vendored only for public-domain or openly-licensed works.** Tuhfat al-Atfal (d. 1198 AH) and al-Muqaddimah al-Jazariyyah (d. 833 AH) are public domain. `cpfair/quran-tajweed` is CC BY 4.0, Tanzil is CC BY 3.0. **In-copyright modern books get a structured citation note recording title, author, ISBN, and which claim they support — never the book's text.**
- **Never re-host audio or video.** Both YouTube channels are Standard YouTube License: link/embed only.
- Node ≥20. ESM (`.mjs`) for scripts, matching `scripts/check-refs.mjs`.
- Commits: `<type>(<scope>): <description>`, types `feat|fix|docs|style|refactor|perf|test|chore`. **No `Co-Authored-By` trailer** — `.claude/settings.json` does not set `attribution.commit`.
- `library/` is committed. `library/.obsidian/workspace*.json` is gitignored (per-machine UI state).
- Another session is concurrently editing `content/lessons/`, `src/games/`, and `content/course.json`. **This plan must not touch those files.**

---

## File Structure

```
library/                                  # the Obsidian vault
├── .obsidian/app.json                    # minimal committed config
├── 00-Index/
│   ├── Home.md                           # vault entry point, map of content
│   ├── Glossary.md                       # Arabic ↔ Uzbek ↔ English terms
│   └── Verification-Log.md               # what was checked, how, when
├── 01-Sources/
│   ├── Source-Manifest.md                # every source, licence, status
│   ├── Classical/                        # public-domain matn, full text
│   ├── Video/                            # playlist inventories
│   └── Data/                             # dataset provenance notes
├── 02-Rules/                             # one note per tajweed rule (~40)
├── 03-Letters/                           # one note per letter (28)
├── 04-Curriculum/
│   ├── Unit-2-Reading-Mechanics/         # 14 lesson notes
│   ├── Unit-3-Tajweed/                   # 36 lesson notes
│   └── Unit-4-Kalimas/                   # 8 lesson notes
├── 05-Pedagogy/                          # methodology, assessment, mistakes, hifz
└── 99-Corpus/                            # vendored, never hand-edited
    ├── quran-uthmani.txt                 # 1.38 MB pinned Tanzil
    └── tajweed.hafs.json                 # 5.58 MB cpfair annotations

scripts/
├── check-library.mjs                     # the validator (new)
└── lib/
    ├── frontmatter.mjs                   # parse note → {data, body}
    ├── corpus.mjs                        # load + index the pinned corpus
    └── rules.mjs                         # the 18 cpfair keys, families
tests/
└── library/                              # vitest specs for the validator
```

**Responsibility split:** `frontmatter.mjs` knows only how to split and parse a note. `corpus.mjs` knows only how to answer "what is the text of 106:4?". `rules.mjs` holds the closed vocabularies. `check-library.mjs` composes them into checks and reports. Each is independently testable and none exceeds ~150 lines.

---

## Task 1: Vault skeleton and corpus vendoring

**Files:**
- Create: `library/.obsidian/app.json`, `library/00-Index/Home.md`, and the directory tree above
- Create: `library/99-Corpus/quran-uthmani.txt`, `library/99-Corpus/tajweed.hafs.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: the pinned corpus at known paths, consumed by every later task.

- [ ] **Step 1: Create the directory tree**

```bash
cd /Users/habibi/projects/Habibi-Course
mkdir -p library/{00-Index,01-Sources/{Classical,Video,Data},02-Rules,03-Letters,04-Curriculum/{Unit-2-Reading-Mechanics,Unit-3-Tajweed,Unit-4-Kalimas},05-Pedagogy,99-Corpus,.obsidian}
```

- [ ] **Step 2: Download the pinned corpus and verify sizes**

```bash
cd library/99-Corpus
curl -sL -o quran-uthmani.txt "https://github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt"
curl -sL -o tajweed.hafs.json "https://raw.githubusercontent.com/cpfair/quran-tajweed/master/output/tajweed.hafs.uthmani-pause-sajdah.json"
wc -c quran-uthmani.txt tajweed.hafs.json
```

Expected: `quran-uthmani.txt` ≈ 1,376,504 bytes; `tajweed.hafs.json` ≈ 5,578,730 bytes. If either differs materially, **stop** — the upstream file changed and the offsets may no longer align.

- [ ] **Step 3: Sanity-check the corpus shape**

```bash
head -1 quran-uthmani.txt          # expect: 1|1|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
grep -c '^' quran-uthmani.txt      # expect: 6266
node -e "const d=require('./tajweed.hafs.json');console.log(d.length, d[0].annotations.length)"  # expect: 6236 7
```

- [ ] **Step 4: Gitignore per-machine Obsidian state**

Append to `.gitignore`:

```
# Obsidian per-machine UI state (the vault itself IS committed)
library/.obsidian/workspace*.json
library/.obsidian/cache
```

- [ ] **Step 5: Write the minimal Obsidian config**

`library/.obsidian/app.json`:

```json
{
  "attachmentFolderPath": "99-Corpus",
  "alwaysUpdateLinks": true,
  "newLinkFormat": "shortest",
  "useMarkdownLinks": false
}
```

- [ ] **Step 6: Write the vault entry point**

`library/00-Index/Home.md`:

```markdown
# Tajweed Course Library

The verified source of truth for all course content. Nothing becomes a JSON
lesson until it exists here and passes `npm run check:library`.

## Map

- [[Source-Manifest]] — every external source, its licence, and its status
- **02-Rules** — one note per tajweed rule
- **03-Letters** — one note per letter: makhraj, sifat, common mistakes
- **04-Curriculum** — lesson-by-lesson content
- **05-Pedagogy** — methodology, assessment, hifz method
- **99-Corpus** — vendored Qur'an text and tajweed annotations. Never hand-edit.

## Rules of this vault

1. Qur'an text is never typed by hand. Examples are verified against
   `99-Corpus/quran-uthmani.txt` by exact match.
2. Every factual claim cites a source note.
3. A note is `status: verified` only when a human has checked it against its
   cited source.
4. Full text is vendored only for public-domain or openly-licensed works.
```

- [ ] **Step 7: Commit**

```bash
git add .gitignore library/
git commit -m "feat(library): vault skeleton and pinned Quran corpus"
```

---

## Task 2: Frontmatter parser

**Files:**
- Create: `scripts/lib/frontmatter.mjs`
- Test: `tests/library/frontmatter.test.mjs`
- Modify: `package.json` (add `yaml` devDependency)

**Interfaces:**
- Produces: `parseNote(raw: string) => { data: object, body: string }`. Throws `Error` with a readable message when frontmatter is absent or malformed. Consumed by Tasks 3–6.

- [ ] **Step 1: Add the yaml dependency**

```bash
npm install --save-dev yaml
```

- [ ] **Step 2: Write the failing test**

`tests/library/frontmatter.test.mjs`:

```javascript
import { describe, it, expect } from "vitest";
import { parseNote } from "../../scripts/lib/frontmatter.mjs";

describe("parseNote", () => {
  it("splits frontmatter from body", () => {
    const raw = "---\ntype: rule\nid: iqlab\n---\n\n# Iqlab\n\nBody text.\n";
    const { data, body } = parseNote(raw);
    expect(data).toEqual({ type: "rule", id: "iqlab" });
    expect(body.trim()).toBe("# Iqlab\n\nBody text.".trim());
  });

  it("parses nested lists and objects", () => {
    const raw = "---\nletters: [ب, ت]\nexamples:\n  - ref: '106:4'\n    text: 'مِّن'\n---\nx\n";
    const { data } = parseNote(raw);
    expect(data.letters).toEqual(["ب", "ت"]);
    expect(data.examples[0]).toEqual({ ref: "106:4", text: "مِّن" });
  });

  it("throws when frontmatter is missing", () => {
    expect(() => parseNote("# No frontmatter\n")).toThrow(/missing frontmatter/i);
  });

  it("throws when frontmatter is unterminated", () => {
    expect(() => parseNote("---\ntype: rule\n")).toThrow(/unterminated/i);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx vitest run tests/library/frontmatter.test.mjs`
Expected: FAIL — cannot resolve `scripts/lib/frontmatter.mjs`.

- [ ] **Step 4: Implement**

`scripts/lib/frontmatter.mjs`:

```javascript
import { parse } from "yaml";

const OPEN = /^---\r?\n/;

/**
 * Split a markdown note into its YAML frontmatter and body.
 * @param {string} raw
 * @returns {{data: Record<string, unknown>, body: string}}
 */
export function parseNote(raw) {
  if (!OPEN.test(raw)) throw new Error("missing frontmatter: note must start with ---");
  const rest = raw.replace(OPEN, "");
  const end = rest.search(/^---\r?$/m);
  if (end === -1) throw new Error("unterminated frontmatter: no closing ---");
  const yamlText = rest.slice(0, end);
  const body = rest.slice(end).replace(/^---\r?\n?/, "");
  const data = parse(yamlText) ?? {};
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("frontmatter must be a mapping");
  }
  return { data, body };
}
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `npx vitest run tests/library/frontmatter.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/lib/frontmatter.mjs tests/library/frontmatter.test.mjs
git commit -m "feat(library): frontmatter parser for vault notes"
```

---

## Task 3: Corpus index and example verification

This is the task that makes "no one questions the source" real.

**Files:**
- Create: `scripts/lib/corpus.mjs`
- Test: `tests/library/corpus.test.mjs`

**Interfaces:**
- Produces:
  - `loadCorpus(path?: string) => Map<string, string>` keyed `"106:4"` → ayah text.
  - `verifyExample(corpus, {ref, text}) => {ok: boolean, reason?: string}` — `ok` when `text` occurs in the ayah at `ref` after NFC normalisation.

- [ ] **Step 1: Write the failing test**

`tests/library/corpus.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/library/corpus.test.mjs`
Expected: FAIL — cannot resolve `scripts/lib/corpus.mjs`.

- [ ] **Step 3: Implement**

`scripts/lib/corpus.mjs`:

```javascript
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CORPUS = join(HERE, "..", "..", "library", "99-Corpus", "quran-uthmani.txt");

/**
 * Load the pinned Tanzil corpus into a Map keyed "surah:ayah".
 * Format per line: surah|ayah|text
 */
export function loadCorpus(path = DEFAULT_CORPUS) {
  const raw = readFileSync(path, "utf8");
  const map = new Map();
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const first = line.indexOf("|");
    const second = line.indexOf("|", first + 1);
    if (first === -1 || second === -1) continue;
    const surah = line.slice(0, first);
    const ayah = line.slice(first + 1, second);
    const text = line.slice(second + 1).normalize("NFC");
    map.set(`${surah}:${ayah}`, text);
  }
  return map;
}

/**
 * Verify a quoted example occurs verbatim in the cited ayah.
 * @returns {{ok: boolean, reason?: string}}
 */
export function verifyExample(corpus, { ref, text }) {
  const ayah = corpus.get(ref);
  if (!ayah) return { ok: false, reason: `no such ayah: ${ref}` };
  const needle = String(text).normalize("NFC").trim();
  if (!needle) return { ok: false, reason: "empty example text" };
  if (!ayah.includes(needle)) {
    return { ok: false, reason: `not found in ${ref}: ${needle}` };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run tests/library/corpus.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/corpus.mjs tests/library/corpus.test.mjs
git commit -m "feat(library): corpus index and verbatim example verification"
```

---

## Task 4: Closed vocabularies

**Files:**
- Create: `scripts/lib/rules.mjs`
- Test: `tests/library/rules.test.mjs`

**Interfaces:**
- Produces: `CPFAIR_KEYS: Set<string>` (18), `RULE_FAMILIES: Set<string>`, `NOTE_TYPES: Set<string>`, `STATUSES: Set<string>`, `MAKHRAJ_ZONES: Set<string>`.

- [ ] **Step 1: Write the failing test**

`tests/library/rules.test.mjs`:

```javascript
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
    expect(CPFAIR_KEYS.has("tafkhim")).toBe(false); // hand-authored, not in cpfair
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
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/library/rules.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`scripts/lib/rules.mjs`:

```javascript
/** The 18 rule keys actually present in cpfair/quran-tajweed. */
export const CPFAIR_KEYS = new Set([
  "hamzat_wasl", "madd_2", "ikhfa", "ghunnah", "madd_246", "silent",
  "idghaam_ghunnah", "qalqalah", "madd_munfasil", "lam_shamsiyyah",
  "madd_muttasil", "idghaam_no_ghunnah", "idghaam_shafawi", "iqlab",
  "ikhfa_shafawi", "madd_6", "idghaam_mutajanisayn", "idghaam_mutaqaribayn",
]);

/** Rule families used for colour grouping and drill bucketing. */
export const RULE_FAMILIES = new Set([
  "preliminaries", "sifat", "tafkhim-tarqiq", "ra", "lam",
  "ghunnah", "meem-sakinah", "noon-sakinah", "idgham-theory",
  "madd", "qalqalah", "waqf", "orthography",
]);

export const NOTE_TYPES = new Set(["rule", "letter", "source", "lesson", "pedagogy", "index"]);
export const STATUSES = new Set(["draft", "needs-review", "verified"]);
export const MAKHRAJ_ZONES = new Set(["jawf", "halq", "lisan", "shafatan", "khayshum"]);
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run tests/library/rules.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/rules.mjs tests/library/rules.test.mjs
git commit -m "feat(library): closed vocabularies for note validation"
```

---

## Task 5: The validator

**Files:**
- Create: `scripts/check-library.mjs`
- Test: `tests/library/check-library.test.mjs`
- Modify: `package.json` (add `check:library` script)

**Interfaces:**
- Consumes: `parseNote`, `loadCorpus`, `verifyExample`, the vocabularies.
- Produces: `checkVault(dir, corpus) => {errors: string[], warnings: string[], counts: object}`. The CLI exits 1 when `errors.length > 0`.

**Checks enforced:**
1. Every note has `type` from `NOTE_TYPES` and `status` from `STATUSES`.
2. `type: rule` requires `id`, `arabic`, `translit`, `english`, `family` ∈ `RULE_FAMILIES`.
3. `cpfair_key`, when present, must be in `CPFAIR_KEYS`.
4. Every `examples[]` entry must pass `verifyExample`.
5. Every `[[wikilink]]` in the body must resolve to a note basename in the vault.
6. Every `sources[]` entry must reference an existing note.
7. A `type: lesson` note whose `teaches[]` names a rule that is not `status: verified` is a **warning**, not an error.

- [ ] **Step 1: Write the failing test**

`tests/library/check-library.test.mjs`:

```javascript
import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkVault } from "../../scripts/check-library.mjs";
import { loadCorpus } from "../../scripts/lib/corpus.mjs";

let corpus, dir;

function note(rel, content) {
  const p = join(dir, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, content, "utf8");
}

beforeAll(() => {
  corpus = loadCorpus();
  dir = mkdtempSync(join(tmpdir(), "vault-"));
  note("02-Rules/Iqlab.md", [
    "---", "type: rule", "id: iqlab", "arabic: الإقلاب", "translit: Iqlab",
    "english: Conversion", "family: noon-sakinah", "cpfair_key: iqlab",
    "status: verified", "sources: ['[[Tuhfat-al-Atfal]]']", "---",
    "See [[Ghunnah]].",
  ].join("\n"));
  note("02-Rules/Ghunnah.md", [
    "---", "type: rule", "id: ghunnah", "arabic: الغنة", "translit: Ghunnah",
    "english: Nasalisation", "family: ghunnah", "status: verified", "---", "x",
  ].join("\n"));
  note("01-Sources/Classical/Tuhfat-al-Atfal.md", [
    "---", "type: source", "id: tuhfat", "status: verified", "---", "x",
  ].join("\n"));
});

describe("checkVault", () => {
  it("passes a well-formed vault", () => {
    const { errors } = checkVault(dir, corpus);
    expect(errors).toEqual([]);
  });

  it("rejects an unknown cpfair_key", () => {
    note("02-Rules/Bad.md", [
      "---", "type: rule", "id: bad", "arabic: x", "translit: x", "english: x",
      "family: noon-sakinah", "cpfair_key: not_a_real_key", "status: draft", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/not_a_real_key/);
  });

  it("rejects an unresolvable wikilink", () => {
    note("02-Rules/Dangling.md", [
      "---", "type: rule", "id: dangling", "arabic: x", "translit: x", "english: x",
      "family: madd", "status: draft", "---", "See [[No-Such-Note]].",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/No-Such-Note/);
  });

  it("rejects a fabricated Quranic example", () => {
    note("02-Rules/Fake.md", [
      "---", "type: rule", "id: fake", "arabic: x", "translit: x", "english: x",
      "family: madd", "status: draft",
      "examples:", "  - ref: '106:4'", "    text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ'", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/not found in 106:4/);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/library/check-library.test.mjs`
Expected: FAIL — cannot resolve `scripts/check-library.mjs`.

- [ ] **Step 3: Implement**

`scripts/check-library.mjs`:

```javascript
#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename, extname, relative } from "node:path";
import { parseNote } from "./lib/frontmatter.mjs";
import { loadCorpus, verifyExample } from "./lib/corpus.mjs";
import { CPFAIR_KEYS, RULE_FAMILIES, NOTE_TYPES, STATUSES } from "./lib/rules.mjs";

const WIKILINK = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === ".md") out.push(p);
  }
  return out;
}

export function checkVault(dir, corpus) {
  const errors = [];
  const warnings = [];
  const files = walk(dir);
  const names = new Set(files.map((f) => basename(f, ".md")));
  const notes = [];

  for (const file of files) {
    const rel = relative(dir, file);
    let parsed;
    try {
      parsed = parseNote(readFileSync(file, "utf8"));
    } catch (e) {
      errors.push(`${rel}: ${e.message}`);
      continue;
    }
    const { data, body } = parsed;
    notes.push({ rel, data });

    if (!NOTE_TYPES.has(data.type)) errors.push(`${rel}: invalid type "${data.type}"`);
    if (!STATUSES.has(data.status)) errors.push(`${rel}: invalid status "${data.status}"`);

    if (data.type === "rule") {
      for (const field of ["id", "arabic", "translit", "english", "family"]) {
        if (!data[field]) errors.push(`${rel}: rule missing required field "${field}"`);
      }
      if (data.family && !RULE_FAMILIES.has(data.family)) {
        errors.push(`${rel}: unknown family "${data.family}"`);
      }
      if (data.cpfair_key && !CPFAIR_KEYS.has(data.cpfair_key)) {
        errors.push(`${rel}: unknown cpfair_key "${data.cpfair_key}"`);
      }
    }

    for (const ex of data.examples ?? []) {
      const r = verifyExample(corpus, ex);
      if (!r.ok) errors.push(`${rel}: example ${r.reason}`);
    }

    for (const src of data.sources ?? []) {
      const m = String(src).match(/\[\[([^\]|#]+)/);
      const target = m ? m[1].trim() : String(src).trim();
      if (!names.has(target)) errors.push(`${rel}: source note not found "${target}"`);
    }

    for (const m of body.matchAll(WIKILINK)) {
      const target = m[1].trim();
      if (!names.has(target)) errors.push(`${rel}: dangling wikilink [[${target}]]`);
    }
  }

  const ruleStatus = new Map(
    notes.filter((n) => n.data.type === "rule").map((n) => [n.data.id, n.data.status]),
  );
  for (const n of notes.filter((x) => x.data.type === "lesson")) {
    for (const id of n.data.teaches ?? []) {
      if (ruleStatus.get(id) !== "verified") {
        warnings.push(`${n.rel}: teaches "${id}" which is not verified`);
      }
    }
  }

  return {
    errors,
    warnings,
    counts: {
      notes: notes.length,
      rules: notes.filter((n) => n.data.type === "rule").length,
      letters: notes.filter((n) => n.data.type === "letter").length,
      lessons: notes.filter((n) => n.data.type === "lesson").length,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] ?? "library";
  const { errors, warnings, counts } = checkVault(dir, loadCorpus());
  for (const w of warnings) console.warn(`WARN  ${w}`);
  for (const e of errors) console.error(`ERROR ${e}`);
  console.log(
    `\n${counts.notes} notes — ${counts.rules} rules, ${counts.letters} letters, ` +
    `${counts.lessons} lessons · ${errors.length} errors, ${warnings.length} warnings`,
  );
  process.exit(errors.length > 0 ? 1 : 0);
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run tests/library/check-library.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 5: Add the npm script**

In `package.json` `scripts`, after `check:refs`:

```json
"check:library": "node scripts/check-library.mjs library"
```

- [ ] **Step 6: Run it against the real vault**

Run: `npm run check:library`
Expected: exit 0, reporting 1 note (Home.md) — which will fail until Home.md gains frontmatter. Add to `library/00-Index/Home.md` at the top:

```yaml
---
type: index
status: verified
---
```

Re-run. Expected: `1 notes — 0 rules, 0 letters, 0 lessons · 0 errors, 0 warnings`.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-library.mjs tests/library/check-library.test.mjs package.json library/00-Index/Home.md
git commit -m "feat(library): vault validator with verbatim Quran example checking"
```

---

## Task 6: Source notes

**Files:**
- Create: `library/01-Sources/Source-Manifest.md`
- Create: `library/01-Sources/Classical/Tuhfat-al-Atfal.md`, `Muqaddimah-Jazariyyah.md`
- Create: `library/01-Sources/Video/Arabic101.md`, `Muallimi-Soniy.md`
- Create: `library/01-Sources/Data/cpfair-quran-tajweed.md`, `Tanzil.md`, `Everyayah.md`

**Interfaces:**
- Produces: source note basenames that `sources:` fields in Tasks 7–9 reference by wikilink.

- [ ] **Step 1: Write the source note template and the manifest**

Every source note uses this frontmatter:

```yaml
---
type: source
id: tuhfat-al-atfal
title: Tuhfat al-Atfal wal-Ghilman fi Tajwid al-Qur'an
author: Sulayman ibn Husayn ibn Muhammad al-Jamzuri
year: 1198 AH / 1784 CE
licence: public-domain
url: <retrieved URL>
retrieved: 2026-08-10
vendored: full-text
status: verified
---
```

`vendored` is one of `full-text` (public domain / open licence), `metadata-only` (link-only, e.g. YouTube), or `citation-only` (in-copyright book).

- [ ] **Step 2: Write the two classical text notes with full matn**

Both are public domain. Each note carries the Arabic verses numbered, an English rendering, and a chapter table matching the spec's §1.1. Source the Arabic from a public-domain edition and record the URL in `url:`.

- [ ] **Step 3: Write the video source notes**

`Arabic101.md` and `Muallimi-Soniy.md` carry the full retrieved playlist inventories — video id, duration, title, inferred topic — with `vendored: metadata-only` and an explicit line: *Standard YouTube License. Link/embed only; never re-host.* The Uzbek note must record the correction: the series is **82 lessons, gap-free** — `docs/research/uzbek-channel.md`'s claim of 83 is wrong.

- [ ] **Step 4: Write the data source notes**

`cpfair-quran-tajweed.md` records CC BY 4.0, the 18 rule keys with counts, the 60,057-annotation total, and the **text-mismatch trap** (never pair with quran.com `text_uthmani`). `Tanzil.md` records CC BY 3.0 and the attribution requirement.

- [ ] **Step 5: Verify and commit**

```bash
npm run check:library
git add library/01-Sources
git commit -m "docs(library): source manifest and provenance notes"
```

---

## Task 7: Letter notes (28)

**Files:**
- Create: `library/03-Letters/<letter>.md` × 28

**Interfaces:**
- Produces: letter note basenames referenced by rule notes and lesson notes.

- [ ] **Step 1: Establish the template**

```yaml
---
type: letter
id: dad
arabic: ض
name: ḍād
makhraj: edge of the tongue against the opposing molars
makhraj_zone: lisan
sifat: [jahr, rakhawah, istila, itbaq, ismat, istitalah]
istila: true
qalqalah: false
taught_in: "1-04"
status: draft
sources: ["[[Muqaddimah-Jazariyyah]]"]
---
```

Body sections, in order: **Makhraj** (prose + which of the 17 points) · **Sifat** (each with its opposite) · **Common mistakes** (from the priority error list, with the correction cue) · **Contrasts** (the letters it is confused with) · **In tajweed** (which rules it triggers).

- [ ] **Step 2: Author all 28**

Content comes from the taxonomy's §2 (makharij by zone) and §3 (sifat), and from the spec's §8 priority error list. `makhraj_zone` must be one of `MAKHRAJ_ZONES`.

- [ ] **Step 3: Verify and commit**

```bash
npm run check:library
git add library/03-Letters
git commit -m "docs(library): 28 letter notes with makhraj, sifat and error cues"
```

---

## Task 8: Rule notes (~40)

**Files:**
- Create: `library/02-Rules/<Rule-Name>.md` × ~40

- [ ] **Step 1: Establish the template**

```yaml
---
type: rule
id: ikhfa_haqiqi
arabic: الإخفاء الحقيقي
translit: al-Ikhfāʾ al-Ḥaqīqī
english: True Concealment
family: noon-sakinah
cpfair_key: ikhfa
colour_b: "#9400A8"
colour_a: green
harakat: 2
letters: [ص, ذ, ث, ك, ج, ش, ق, س, د, ط, ز, ف, ت, ض, ظ]
taught_in: "3-23"
prerequisites: [ghunnah, sukun, tanwin]
status: draft
sources: ["[[Tuhfat-al-Atfal]]", "[[Muqaddimah-Jazariyyah]]"]
examples:
  - ref: "106:4"
    text: "مِّن جُوعٍ"
    note: "ج is one of the 15 ikhfāʾ letters"
---
```

Body sections: **Definition** · **Trigger condition** (precisely: what letter, in what state, followed by what) · **How to perform it** · **Letters** (with the mnemonic where one exists) · **Examples** (each keyed to an `examples[]` entry, so the validator proves the Arabic) · **Common mistakes** · **Contrast with** (the sibling rules that make good quiz distractors) · **Sources**.

- [ ] **Step 2: Author the rules, family by family**

Order matches the spec's Unit 3 stages so each batch is independently reviewable: sifat/heaviness → rā'/lām → ghunnah/meem → noon → idghām theory → madd → waqf. Rules absent from cpfair (`tafkhim`, `tarqiq`, `ra_rules`, `lam_jalalah`, `madd_badal`, `madd_iwad`, `sakt`) omit `cpfair_key`.

- [ ] **Step 3: Record the disputed points**

Every rule touching the spec's §9 disagreement list gains a `## Scholars differ` section naming both positions and which the course teaches. Never present a disputed point as settled.

- [ ] **Step 4: Verify and commit per family**

```bash
npm run check:library
git add library/02-Rules
git commit -m "docs(library): <family> rule notes with verified examples"
```

---

## Task 9: Pedagogy and curriculum notes

**Files:**
- Create: `library/05-Pedagogy/{Methodology,Assessment,Common-Mistakes,Hifz-Method}.md`
- Create: `library/04-Curriculum/**` × 58 lesson notes

- [ ] **Step 1: Write the pedagogy notes**

`Methodology.md` records the Jazariyyah spine and *why* (ḥaqq before mustaḥaqq), the Tuhfah ghunnah inversion fix, and the two-pass waqf decision. `Assessment.md` carries the Jali/Khafi model and the four final tests. `Hifz-Method.md` carries Sabaq/Sabqi/Manzil with the repetition numbers. `Common-Mistakes.md` is the separate remediation track.

- [ ] **Step 2: Establish the lesson template**

```yaml
---
type: lesson
id: "3-23"
unit: "3.4"
stage: Noon Sākinah & Tanwīn
title: Ikhfāʾ Ḥaqīqī I
teaches: [ikhfa_haqiqi]
prerequisites: ["3-14", "2-03"]
hifz: "113:1-3"
status: draft
---
```

Body sections: **Objectives** (≤4) · **Hook** (the corrective/myth-busting opening) · **Teaching sequence** · **Examples** · **Drills** · **Listen-for** (the 7-field structured entries) · **Homework** · **Prerequisites in prose**.

- [ ] **Step 3: Re-scope Unit 2 against shipped Phase 1 — do this before authoring**

**Phase 1 grew after this plan was written.** Commit `c385ad0` added Unit 1.4
(`1-13`, `1-14`, `1-15`), which already teaches **sukūn**, **hamza**, and **the heavy
letters including tafkhīm heard in the adjacent vowel**. Read those three lesson files
first, then adjust:

| Planned | Was going to | Must become |
|---|---|---|
| `2-03`, `2-04` sukūn | introduce sukūn | extend to harder clusters; assume sukūn known |
| `2-09` hamzatul-waṣl | introduce hamza | waṣl vs qaṭʿ **contrast**; qaṭʿ already taught in `1-13` |
| `3-03`, `3-06` isti'lā / tafkhīm | introduce heaviness | formalise the sifah behind the cue `1-14` already gave |

Re-check `content/course.json` for further growth before starting — that session is still
active. Record the reconciliation in `Verification-Log.md`.

- [ ] **Step 4: Author Unit 2 (14 notes)**

Unit 2 is the first content to ship as JSON, so it is the first to be written and reviewed here. Include the practical-stopping additions to 2-12, 2-13 and 2-14.

- [ ] **Step 5: Author Units 3 and 4 (44 notes)**

- [ ] **Step 6: Verify and commit per unit**

```bash
npm run check:library
git add library/04-Curriculum library/05-Pedagogy
git commit -m "docs(library): <unit> lesson notes"
```

---

## Task 10: Wire the gate

**Files:**
- Modify: `package.json`, `library/00-Index/Verification-Log.md`

- [ ] **Step 1: Make `npm test` cover the library**

The vitest config already discovers `tests/**`. Confirm:

Run: `npm test`
Expected: existing suite plus the new library specs, all passing.

- [ ] **Step 2: Write the verification log**

`Verification-Log.md` records, per batch: what was checked, against which source, by whom, and on what date — the human half of verification that a script cannot do.

- [ ] **Step 3: Final gate**

```bash
npm run check:library && npm run check:refs && npm test && npm run lint
```

Expected: all four pass.

- [ ] **Step 4: Commit**

```bash
git add package.json library/00-Index/Verification-Log.md
git commit -m "chore(library): wire check:library into the local gate"
```

---

## Self-Review

**Spec coverage.** Every §-numbered element of the design spec maps to a task: structure → Task 9; hifz → Task 9; schema → *deliberately out of scope* (sub-project C); games → *out of scope* (D); data/licensing → Tasks 1 and 6; assessment → Task 9; priority errors → Tasks 7 and 9; open items → tracked in `Verification-Log.md`, not resolved here.

**Deliberate scope exclusions.** This plan produces **no** JSON lesson content and **no** schema changes. It ends when the library is complete and verified. Sub-projects A–E follow.

**Known gaps carried forward.** Open items 3 (Dar al-Ma'rifah hex sampling), 5 (waqf glyph placement), 6 (letter audio recording) and 7 (يَبْصُۜطُ verification) are not resolvable by writing markdown — they need a physical mushaf, a dataset, a microphone and a teacher respectively. They are recorded in the vault as `status: needs-review` notes so they surface rather than being forgotten.

**Type consistency.** `parseNote` → `{data, body}` used identically in Task 5. `loadCorpus` → `Map` and `verifyExample(corpus, {ref,text})` → `{ok, reason}` match their Task 3 definitions. Vocabulary set names match between Tasks 4 and 5.
