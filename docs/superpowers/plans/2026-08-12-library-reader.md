# Library Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a read-only student Library that renders 101 vault notes from `library/` as static pages, so a learner can browse every rule, letter and source the course is built on.

**Architecture:** A new `src/library/` module reads `library/` at build time. Frontmatter is parsed with `yaml` and validated by a zod discriminated union into a typed index (powering listings, facets and cross-links); the markdown body is converted to React elements with `marked`'s lexer. Nothing ships to the browser but HTML — pages are pure server components with no client boundary. Wikilinks are rewritten to real routes before lexing.

**Tech Stack:** Next 16.3.0 (App Router, `output: "export"`), React 19.2.4, TypeScript, zod 4, `marked` 18 (new), `yaml` 2 (promoted to prod), Tailwind 4, vitest 4 + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-08-12-library-reader-design.md`
**Branch:** `feat/library-reader` (already created, off `main` @ `634495c`)

## Global Constraints

- **Never write to `library/` or `content/`.** This work is render-only. ADR-003 makes the vault a human-authored surface; a feature agent editing a note silently desynchronises it from its transcribed JSON.
- **All five CI gates must pass** (`.github/workflows/ci.yml`, in order): `npm run lint` → `npx tsc --noEmit` → `npm test` → `npm run check:library` → `npm run build`. **There is no local `typecheck` script** — run `npx tsc --noEmit` by hand.
- **No gate may be weakened to pass.** Verified baseline on `main` at 2026-08-12: **535 tests / 52 files**, 0 lint errors (3 pre-existing `no-img-element` warnings at `SlideDeck.tsx:33,45,128`), library 0 errors / 3 warnings, 231 static pages, `tsc` clean. Test count may only go up.
- **Read the vault the way the gate does:** skip dotfiles and dot-directories (`check-library.mjs:49`); require a leading `---` or throw (`frontmatter.mjs:11-14`); resolve wikilinks by **bare basename ignoring directory** (`check-library.mjs:62`).
- **Route by `type`, never by directory.** `library/02-Rules/Sifat.md` is `type: index`, not a rule.
- **Zero `[[` may reach a student.** Every wikilink either routes or renders as plain text.
- **No classical matn is displayed.** See Task 8 for the exact definition of what "matn" means here.
- **No YouTube asset is re-hosted** — link or embed only. No downloading, no audio extraction, no proxying.
- **The `<Credits/>` footer keeps rendering on every page** (`layout.tsx:21`). It discharges four separate attribution obligations.
- **Dark theme only.** No `prefers-color-scheme`, no `data-theme`, no toggle. Reuse the class layer in `src/app/globals.css`: `.glass`, `.glass-strong`, `.gradient-text`, `.arabic`, `.quran`, `.rim-static`, `text-white/{90,75,60,50}`.
- **Commits carry no `Co-Authored-By` trailer** — this project's `.claude/settings.json` has no `attribution.commit` key.

## File Structure

| File | Responsibility |
|---|---|
| `src/library/paths.ts` | Vault location; the dotfile-skipping walker |
| `src/library/frontmatter.ts` | Split note into `{data, body}`; same throw contract as the gate |
| `src/library/schema.ts` | zod discriminated union on `type`; closed vocabularies |
| `src/library/routes.ts` | basename ↔ slug; uniqueness and reserved-segment guards |
| `src/library/load.ts` | `allNotes()` / `noteBySlug()` / `allSlugs()`, sorted, throws with filename |
| `src/library/sources.ts` | `vendored` → display mode; the matn-withholding rule |
| `src/library/markdown/slug.ts` | Heading → stable, deduped, Unicode-safe id |
| `src/library/markdown/wikilinks.ts` | `[[…]]` → markdown link or plain text |
| `src/library/markdown/parse.ts` | `marked` lexer, GFM tables on |
| `src/library/markdown/render.tsx` | Tokens → React elements; raw HTML never interpreted |
| `src/components/library/StatusNotice.tsx` | The two status signals |
| `src/components/library/NoteBody.tsx` | Renders a note's body end to end |
| `src/components/SiteNav.tsx` | Global nav (new site-wide chrome) |
| `src/app/library/page.tsx` | Landing |
| `src/app/library/rules/page.tsx` | 59 rules, faceted by `family` |
| `src/app/library/letters/page.tsx` | 29 letters, faceted by `makhraj_zone` |
| `src/app/library/sources/page.tsx` | 11 sources, grouped |
| `src/app/library/[slug]/page.tsx` | 101 detail pages |

---

### Task 1: Dependencies, vault paths, frontmatter reader

**Files:**
- Modify: `package.json` (add `marked`, move `yaml` dev → prod)
- Create: `src/library/paths.ts`
- Create: `src/library/frontmatter.ts`
- Test: `src/library/frontmatter.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `VAULT_DIR: string`
  - `SECTION_DIRS: string[]` — the four in-scope roots
  - `walkNotes(dir: string): string[]` — absolute paths to `.md` files, sorted, dotfiles skipped
  - `inScopeNoteFiles(): string[]` — the 101 absolute paths, sorted
  - `parseNote(raw: string): { data: Record<string, unknown>; body: string }`

- [ ] **Step 1: Install `marked` and promote `yaml`**

```bash
npm install marked@18
npm install yaml@^2.9.0          # re-installs into dependencies
npm uninstall --save-dev yaml    # remove the devDependency entry
```

Then confirm `package.json` shows both under `"dependencies"` and `yaml` is gone from `"devDependencies"`.

Run: `node -e "const p=require('./package.json'); console.log('deps:', Object.keys(p.dependencies).join(', ')); console.log('yaml in dev?', 'yaml' in (p.devDependencies||{}))"`
Expected: `marked` and `yaml` listed in deps; `yaml in dev? false`

- [ ] **Step 2: Write the failing test**

Create `src/library/frontmatter.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import fs from "node:fs";
import { parseNote } from "./frontmatter";
import { inScopeNoteFiles, VAULT_DIR } from "./paths";

describe("parseNote", () => {
  test("splits frontmatter from body", () => {
    const { data, body } = parseNote("---\ntype: rule\nid: ghunnah\n---\n\n# Al-Ghunnah\n");
    expect(data).toEqual({ type: "rule", id: "ghunnah" });
    expect(body.trim()).toBe("# Al-Ghunnah");
  });

  test("throws when frontmatter is missing", () => {
    expect(() => parseNote("# No frontmatter\n")).toThrow(/missing frontmatter/);
  });

  test("throws when frontmatter is unterminated", () => {
    expect(() => parseNote("---\ntype: rule\n")).toThrow(/unterminated frontmatter/);
  });

  test("throws when frontmatter is not a mapping", () => {
    expect(() => parseNote("---\n- a\n- b\n---\nbody\n")).toThrow(/must be a mapping/);
  });
});

describe("inScopeNoteFiles", () => {
  test("finds exactly the 101 in-scope notes", () => {
    expect(inScopeNoteFiles()).toHaveLength(101);
  });

  test("is sorted and absolute", () => {
    const files = inScopeNoteFiles();
    expect(files).toEqual([...files].sort());
    expect(files.every((f) => f.startsWith("/"))).toBe(true);
  });

  test("skips dot-directories such as .obsidian", () => {
    // Check the path RELATIVE to the vault. Checking the absolute path is wrong:
    // a git worktree lives under `.claude/worktrees/`, so every absolute path
    // contains "/." and the assertion fails for a reason unrelated to the vault.
    const rel = inScopeNoteFiles().map((f) => f.slice(VAULT_DIR.length));
    expect(rel.some((f) => f.includes("/."))).toBe(false);
  });

  test("every in-scope note parses", () => {
    for (const file of inScopeNoteFiles()) {
      expect(() => parseNote(fs.readFileSync(file, "utf8")), file).not.toThrow();
    }
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/library/frontmatter.test.ts`
Expected: FAIL — `Failed to resolve import "./frontmatter"`

- [ ] **Step 4: Implement `src/library/paths.ts`**

```ts
import fs from "node:fs";
import path from "node:path";

/** The Obsidian vault. ADR-003 makes it the source of record; we only ever read it. */
export const VAULT_DIR = path.join(process.cwd(), "library");

/**
 * The four in-scope roots. Curriculum, Pedagogy, the Verification-Log and the raw
 * corpus are deliberately excluded — they are teacher material, internal QA, or data.
 */
export const SECTION_DIRS = ["02-Rules", "03-Letters", "01-Sources"];
export const GLOSSARY_FILE = path.join(VAULT_DIR, "00-Index", "Glossary.md");

/**
 * Markdown files under `dir`, recursively, sorted.
 *
 * Dotfiles and dot-directories are skipped, exactly as scripts/check-library.mjs:49
 * does — that is what keeps `library/.obsidian/` out. Diverging here would let the app
 * and the gate disagree about which notes exist.
 */
export function walkNotes(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkNotes(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out.sort();
}

/** The 101 in-scope note paths, sorted. */
export function inScopeNoteFiles(): string[] {
  const sectioned = SECTION_DIRS.flatMap((d) => walkNotes(path.join(VAULT_DIR, d)));
  return [...sectioned, GLOSSARY_FILE].sort();
}
```

- [ ] **Step 5: Implement `src/library/frontmatter.ts`**

This is a TypeScript twin of `scripts/lib/frontmatter.mjs`. The contract — the three
throw conditions and their messages — is deliberately identical, so a note the gate
accepts is a note the app accepts.

```ts
import { parse } from "yaml";

const OPEN = /^---\r?\n/;

/** Split a markdown note into its YAML frontmatter and body. */
export function parseNote(raw: string): { data: Record<string, unknown>; body: string } {
  if (!OPEN.test(raw)) throw new Error("missing frontmatter: note must start with ---");
  const rest = raw.replace(OPEN, "");
  const end = rest.search(/^---\r?$/m);
  if (end === -1) throw new Error("unterminated frontmatter: no closing ---");
  const data = parse(rest.slice(0, end)) ?? {};
  const body = rest.slice(end).replace(/^---\r?\n?/, "");
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("frontmatter must be a mapping");
  }
  return { data: data as Record<string, unknown>, body };
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/library/frontmatter.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/library/paths.ts src/library/frontmatter.ts src/library/frontmatter.test.ts
git commit -m "feat(library): read the vault the way the gate does

marked is added for its zero dependencies — markdown-it pulls 6 transitive
packages and micromark 10+, which does not survive comparison in a repo whose
only prior supply-chain move was ADR-006.

yaml moves dev -> prod. It was dev-only and used solely by scripts/; the moment
src/ imports it, a build run with npm ci --omit=dev breaks, which is exactly how
the ADR-007 VPS build would run."
```

---

### Task 2: Schema — the typed note index

**Files:**
- Create: `src/library/schema.ts`
- Test: `src/library/schema.test.ts`

**Interfaces:**
- Consumes: `parseNote`, `inScopeNoteFiles` (Task 1)
- Produces:
  - `LibraryNoteSchema` — zod discriminated union on `type`
  - `type LibraryNote = z.infer<typeof LibraryNoteSchema>`
  - `type RuleNote`, `type LetterNote`, `type SourceNote`, `type IndexNote`
  - `STATUSES`, `RULE_FAMILIES`, `MAKHRAJ_ZONES`, `VENDORED_MODES` as const tuples

- [ ] **Step 1: Write the failing test**

Create `src/library/schema.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import fs from "node:fs";
import { parseNote } from "./frontmatter";
import { inScopeNoteFiles } from "./paths";
import { LibraryNoteSchema } from "./schema";

describe("LibraryNoteSchema", () => {
  test("every in-scope note validates", () => {
    for (const file of inScopeNoteFiles()) {
      const { data } = parseNote(fs.readFileSync(file, "utf8"));
      const result = LibraryNoteSchema.safeParse(data);
      expect(result.success, `${file}: ${result.error?.message}`).toBe(true);
    }
  });

  test("the four types are all present in the corpus", () => {
    const types = new Set(
      inScopeNoteFiles().map(
        (f) => LibraryNoteSchema.parse(parseNote(fs.readFileSync(f, "utf8")).data).type,
      ),
    );
    expect([...types].sort()).toEqual(["index", "letter", "rule", "source"]);
  });

  test("counts by type match the vault", () => {
    const counts: Record<string, number> = {};
    for (const f of inScopeNoteFiles()) {
      const n = LibraryNoteSchema.parse(parseNote(fs.readFileSync(f, "utf8")).data);
      counts[n.type] = (counts[n.type] ?? 0) + 1;
    }
    expect(counts).toEqual({ rule: 59, letter: 29, source: 11, index: 2 });
  });

  test("rejects an unknown status", () => {
    const bad = { type: "rule", id: "x", status: "published", arabic: "س", translit: "s", english: "e", family: "madd" };
    expect(LibraryNoteSchema.safeParse(bad).success).toBe(false);
  });

  test("rejects an unknown rule family", () => {
    const bad = { type: "rule", id: "x", status: "verified", arabic: "س", translit: "s", english: "e", family: "invented" };
    expect(LibraryNoteSchema.safeParse(bad).success).toBe(false);
  });

  test("sources[] wikilink strings survive as authored", () => {
    const n = LibraryNoteSchema.parse({
      type: "rule", id: "ghunnah", status: "verified", arabic: "الغنة",
      translit: "al-Ghunnah", english: "Nasalisation", family: "ghunnah",
      sources: ["[[Tuhfat-al-Atfal]]"],
    });
    expect(n.type === "rule" && n.sources).toEqual(["[[Tuhfat-al-Atfal]]"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/library/schema.test.ts`
Expected: FAIL — `Failed to resolve import "./schema"`

- [ ] **Step 3: Implement `src/library/schema.ts`**

Field presence below is measured across the real vault, not assumed. The eleven fields
that are 100% present on rules are missing from exactly one note — `Sifat.md`, which is
`type: index`, not a rule — which is why routing by `type` rather than by directory
matters.

```ts
import { z } from "zod";

/** Mirrors STATUSES in scripts/lib/rules.mjs:17. */
export const STATUSES = ["draft", "needs-review", "verified"] as const;

/** Mirrors RULE_FAMILIES in scripts/lib/rules.mjs:10-14. 13 legal, 12 in use. */
export const RULE_FAMILIES = [
  "preliminaries", "sifat", "tafkhim-tarqiq", "ra", "lam", "ghunnah",
  "meem-sakinah", "noon-sakinah", "idgham-theory", "madd", "qalqalah",
  "waqf", "orthography",
] as const;

/** Mirrors MAKHRAJ_ZONES in scripts/lib/rules.mjs:18. 5 legal, 4 in use. */
export const MAKHRAJ_ZONES = ["jawf", "halq", "lisan", "shafatan", "khayshum"] as const;

/**
 * `vendored` is NOT constrained by rules.mjs and takes five values in practice.
 * Source-Manifest.md documents only three of them — do not trust it as the vocabulary.
 */
export const VENDORED_MODES = [
  "full-text", "partial", "excerpts", "citation-only", "metadata-only",
] as const;

const StatusSchema = z.enum(STATUSES);

/** {ref: "108:3", text: "إِنَّ", note?: "..."} — already verified verbatim by the gate. */
const ExampleSchema = z.object({
  ref: z.string(),
  text: z.string(),
  note: z.string().optional(),
});

const BaseFields = { id: z.string(), status: StatusSchema };

export const RuleNoteSchema = z.object({
  type: z.literal("rule"),
  ...BaseFields,
  arabic: z.string(),
  translit: z.string(),
  english: z.string(),
  family: z.enum(RULE_FAMILIES),
  taught_in: z.string().optional(),
  prerequisites: z.array(z.string()).default([]),
  // Values are wikilink strings, e.g. "[[Tuhfat-al-Atfal]]". Kept as authored; the
  // renderer resolves them. 88 of the 100 sectioned notes carry this.
  sources: z.array(z.string()).default([]),
  examples: z.array(ExampleSchema).default([]),
  letters: z.array(z.string()).optional(),
  colour_b: z.string().optional(),
  harakat: z.number().optional(),
  harakat_options: z.array(z.number()).optional(),
  cpfair_key: z.string().optional(),
});

export const LetterNoteSchema = z.object({
  type: z.literal("letter"),
  ...BaseFields,
  arabic: z.string(),
  name: z.string(),
  makhraj: z.string(),
  makhraj_zone: z.enum(MAKHRAJ_ZONES),
  sifat: z.array(z.string()),
  istila: z.boolean(),
  qalqalah: z.boolean(),
  taught_in: z.string().optional(),
  sources: z.array(z.string()).default([]),
  examples: z.array(ExampleSchema).default([]),
});

/**
 * The ragged one: 36 distinct keys across 11 notes, 15 appearing exactly once.
 * Only type/status/id are universal — Source-Manifest.md carries nothing else.
 * Unknown keys are permitted and simply not rendered.
 */
export const SourceNoteSchema = z.object({
  type: z.literal("source"),
  ...BaseFields,
  vendored: z.enum(VENDORED_MODES).optional(),
  url: z.string().optional(),
  url_secondary: z.string().optional(),
  title: z.string().optional(),
  arabic_title: z.string().optional(),
  author: z.string().optional(),
  author_arabic: z.string().optional(),
  author_source: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  retrieved: z.union([z.string(), z.date()]).optional(),
  licence: z.string().optional(),
  licence_note: z.string().optional(),
  licence_terms_url: z.string().optional(),
  licence_source: z.string().optional(),
  metre: z.string().optional(),
  language: z.string().optional(),
  verses: z.union([z.string(), z.number()]).optional(),
  ayahs: z.number().optional(),
  handle: z.string().optional(),
  channel_id: z.string().optional(),
  playlist_id: z.string().optional(),
  playlist_title: z.string().optional(),
}).passthrough();

export const IndexNoteSchema = z.object({ type: z.literal("index"), ...BaseFields });

export const LibraryNoteSchema = z.discriminatedUnion("type", [
  RuleNoteSchema, LetterNoteSchema, SourceNoteSchema, IndexNoteSchema,
]);

export type RuleNote = z.infer<typeof RuleNoteSchema>;
export type LetterNote = z.infer<typeof LetterNoteSchema>;
export type SourceNote = z.infer<typeof SourceNoteSchema>;
export type IndexNote = z.infer<typeof IndexNoteSchema>;
export type LibraryNote = z.infer<typeof LibraryNoteSchema>;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/library/schema.test.ts`
Expected: PASS — 6 tests. If "every in-scope note validates" fails, the message names the offending file and the zod error; loosen the specific field to `.optional()` rather than loosening the type.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 6: Commit**

```bash
git add src/library/schema.ts src/library/schema.test.ts
git commit -m "feat(library): a typed note index over the vault's frontmatter

Four types, discriminated on \`type\` and never on directory — Sifat.md sits in
02-Rules while being type: index, so directory routing would mis-file it and it
would fail every rule-shaped assertion.

vendored takes five values in practice; Source-Manifest.md documents three."
```

---

### Task 3: Loader, slugs and route guards

**Files:**
- Create: `src/library/routes.ts`
- Create: `src/library/load.ts`
- Test: `src/library/load.test.ts`

**Interfaces:**
- Consumes: Tasks 1–2
- Produces:
  - `interface LoadedNote { slug: string; basename: string; file: string; meta: LibraryNote; body: string }`
  - `allNotes(): LoadedNote[]` — sorted by slug
  - `noteBySlug(slug: string): LoadedNote`
  - `allSlugs(): string[]`
  - `loadNote(file: string): LoadedNote` — exported so the failure path can be driven with a real file
  - `slugFor(basename: string): string`
  - `RESERVED_SEGMENTS: readonly string[]`

- [ ] **Step 1: Write the failing test**

Create `src/library/load.test.ts`:

```ts
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { allNotes, allSlugs, noteBySlug, loadNote } from "./load";
import { slugFor, RESERVED_SEGMENTS } from "./routes";
import { VAULT_DIR, walkNotes } from "./paths";

describe("slugFor", () => {
  test("lowercases the basename", () => {
    expect(slugFor("Ghunnah")).toBe("ghunnah");
    expect(slugFor("Idgham-Maal-Ghunnah")).toBe("idgham-maal-ghunnah");
  });
});

describe("allNotes", () => {
  test("loads exactly 101 notes", () => {
    expect(allNotes()).toHaveLength(101);
  });

  test("is sorted by slug", () => {
    const slugs = allNotes().map((n) => n.slug);
    expect(slugs).toEqual([...slugs].sort());
  });

  test("noteBySlug round-trips", () => {
    const n = noteBySlug("ghunnah");
    expect(n.basename).toBe("Ghunnah");
    expect(n.meta.type).toBe("rule");
    expect(n.body).toContain("## Definition");
  });

  test("noteBySlug throws for an unknown slug", () => {
    expect(() => noteBySlug("no-such-note")).toThrow(/unknown library slug/);
  });
});

describe("slug safety", () => {
  // Guards the WHOLE vault, not just the 101 in scope, so adding a note later
  // cannot silently collide with one already published.
  test("lowercasing preserves uniqueness across all 183 vault basenames", () => {
    const basenames = walkNotes(VAULT_DIR).map((f) => path.basename(f, ".md"));
    expect(basenames).toHaveLength(183);
    const slugs = basenames.map(slugFor);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("no note claims a reserved section segment", () => {
    const slugs = new Set(allSlugs());
    for (const seg of RESERVED_SEGMENTS) expect(slugs.has(seg)).toBe(false);
  });

  test("every slug is URL-safe", () => {
    for (const s of allSlugs()) expect(s).toMatch(/^[a-z0-9._-]+$/);
  });
});

/**
 * These exercise the failure path for real. `loadNote` is exported precisely so this
 * can be driven with a genuine file on disk rather than by mocking `fs` — mocking
 * would also have to defeat `allNotes()`'s memo, which is a lot of machinery to prove
 * a one-line `catch`.
 */
describe("failure reporting", () => {
  let dir: string;
  const write = (name: string, body: string) => {
    const f = path.join(dir, name);
    fs.writeFileSync(f, body);
    return f;
  };

  beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "library-bad-")); });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  test("a note with no frontmatter throws, naming its own file", () => {
    const f = write("NoFrontmatter.md", "# Just a heading\n");
    expect(() => loadNote(f)).toThrow(/NoFrontmatter\.md/);
    expect(() => loadNote(f)).toThrow(/missing frontmatter/);
  });

  test("a note whose frontmatter fails the schema throws, naming its own file", () => {
    const f = write("BadStatus.md", "---\ntype: rule\nid: x\nstatus: published\n---\n# x\n");
    expect(() => loadNote(f)).toThrow(/BadStatus\.md/);
  });

  test("a valid note does not throw — proves the above fail for the right reason", () => {
    const f = write("Fine.md", "---\ntype: index\nid: fine\nstatus: verified\n---\n# Fine\n");
    expect(() => loadNote(f)).not.toThrow();
  });
});

/**
 * walkNotes' dot-skip cannot be falsified against the real vault: `library/.obsidian`
 * exists but holds no .md files, and it sits outside the three section directories
 * inScopeNoteFiles() walks. So an assertion over real data passes whether or not the
 * skip works. This builds a throwaway fixture in the OS temp dir — never in library/,
 * which this feature must never write to — so the behaviour is actually pinned.
 */
describe("walkNotes dot-skip, against a fixture that can fail", () => {
  let root: string;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "library-walk-"));
    fs.mkdirSync(path.join(root, "visible"), { recursive: true });
    fs.mkdirSync(path.join(root, ".hidden"), { recursive: true });
    fs.writeFileSync(path.join(root, "visible", "Kept.md"), "---\ntype: index\n---\n");
    fs.writeFileSync(path.join(root, ".hidden", "Skipped.md"), "---\ntype: index\n---\n");
    fs.writeFileSync(path.join(root, ".Dotfile.md"), "---\ntype: index\n---\n");
  });

  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  test("a .md inside a dot-directory is not returned", () => {
    expect(walkNotes(root).map((f) => path.basename(f))).toEqual(["Kept.md"]);
  });

  test("a dotfile .md at the top level is not returned", () => {
    expect(walkNotes(root).some((f) => f.endsWith(".Dotfile.md"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/library/load.test.ts`
Expected: FAIL — `Failed to resolve import "./load"`

- [ ] **Step 3: Implement `src/library/routes.ts`**

```ts
/**
 * Section landing segments. A note basename that lowercased to one of these would
 * shadow its index page, so `allSlugs()` is asserted against this list.
 */
export const RESERVED_SEGMENTS = ["rules", "letters", "sources"] as const;

/**
 * Route slug for a note.
 *
 * Resolution is by BARE BASENAME ignoring directory, matching the gate
 * (scripts/check-library.mjs:62) — a flat route space is what makes every wikilink
 * resolve without a path lookup. All 183 vault basenames are unique and already
 * URL-safe; lowercasing is purely cosmetic and is asserted not to collide.
 */
export function slugFor(basename: string): string {
  return basename.toLowerCase();
}
```

- [ ] **Step 4: Implement `src/library/load.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import { inScopeNoteFiles } from "./paths";
import { parseNote } from "./frontmatter";
import { LibraryNoteSchema, type LibraryNote } from "./schema";
import { slugFor } from "./routes";

export interface LoadedNote {
  slug: string;
  basename: string;
  file: string;
  meta: LibraryNote;
  body: string;
}

/**
 * Every read is schema-validated and failures throw WITH THE FILENAME, matching
 * parseJsonFile in src/content/load.ts:7. A vault note that stops validating should
 * fail the build loudly, not degrade into a blank page.
 */
export function loadNote(file: string): LoadedNote {
  try {
    const { data, body } = parseNote(fs.readFileSync(file, "utf8"));
    const basename = path.basename(file, ".md");
    return { slug: slugFor(basename), basename, file, meta: LibraryNoteSchema.parse(data), body };
  } catch (err) {
    throw new Error(`Invalid library note ${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

let cache: LoadedNote[] | null = null;

/** All in-scope notes, sorted by slug. Memoised — this runs once per page at build. */
export function allNotes(): LoadedNote[] {
  if (!cache) cache = inScopeNoteFiles().map(loadNote).sort((a, b) => a.slug.localeCompare(b.slug));
  return cache;
}

export function allSlugs(): string[] {
  return allNotes().map((n) => n.slug);
}

export function noteBySlug(slug: string): LoadedNote {
  const found = allNotes().find((n) => n.slug === slug);
  if (!found) throw new Error(`unknown library slug: ${slug}`);
  return found;
}
```

Note the memo: `src/content/load.ts:32-34` re-parses every lesson for every page and is a
known O(N²) item in WISHLIST. Do not repeat that here.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/library/load.test.ts`
Expected: PASS — 13 tests

- [ ] **Step 6: Commit**

```bash
git add src/library/routes.ts src/library/load.ts src/library/load.test.ts
git commit -m "feat(library): loader with slug uniqueness guarded across the whole vault

Slug collision is asserted over all 183 basenames rather than the 101 in scope,
so publishing a 102nd note later cannot silently shadow one already live.

Memoised, unlike allLessons() — that one re-parses every lesson for every page."
```

---

### Task 4: Heading slug generator

**Files:**
- Create: `src/library/markdown/slug.ts`
- Test: `src/library/markdown/slug.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `slugifyHeading(text: string): string` — **pure**, no dedup. Used by link resolution.
  - `createHeadingSlugger(): (text: string) => string` — stateful per document, dedupes within it. Used when stamping ids onto headings.

**Why both.** These must not be the same function, and the distinction is load-bearing.
`renderTokens` walks *every heading in document order*, so it needs dedup. Link resolution
walks *only the links*, in link order — a different and shorter sequence. If link
resolution also deduped, a note containing two `[[#Sources]]` links would emit `#sources`
for the first and `#sources-2` for the second, silently sending the second link to the
wrong heading. Link resolution must therefore be stateless.

- [ ] **Step 1: Write the failing test**

Create `src/library/markdown/slug.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import { createHeadingSlugger, slugifyHeading } from "./slug";

describe("createHeadingSlugger", () => {
  test("lowercases and hyphenates plain headings", () => {
    const s = createHeadingSlugger();
    expect(s("Common mistakes")).toBe("common-mistakes");
  });

  test("keeps headings distinct when they differ only by Unicode", () => {
    const s = createHeadingSlugger();
    const a = s("⚠ The count is disputed");
    const b = s("The count is disputed");
    expect(a).not.toBe(b);
  });

  test("survives an em-dash plus Arabic — the live trap 3 target", () => {
    const s = createHeadingSlugger();
    const slug = s("The four-word exception — iẓhār muṭlaq");
    expect(slug).toBeTruthy();
    expect(slug).not.toMatch(/^-+$/);
    expect(slug).toContain("four-word");
  });

  test("preserves Arabic headings without collapsing them to empty", () => {
    const s = createHeadingSlugger();
    const a = s("بَابُ الْمَدِّ وَالْقَصْر");
    const b = s("بَابُ النُّونِ السَّاكِنَة");
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });

  test("dedupes repeats with a numeric suffix", () => {
    const s = createHeadingSlugger();
    expect(s("Sources")).toBe("sources");
    expect(s("Sources")).toBe("sources-2");
    expect(s("Sources")).toBe("sources-3");
  });

  test("is stable — the same document yields the same ids twice", () => {
    const run = () => { const s = createHeadingSlugger(); return ["Definition", "Sources", "Sources"].map(s); };
    expect(run()).toEqual(run());
  });
});

describe("slugifyHeading", () => {
  test("is pure — repeated calls never drift", () => {
    expect(slugifyHeading("Sources")).toBe("sources");
    expect(slugifyHeading("Sources")).toBe("sources");
    expect(slugifyHeading("Sources")).toBe("sources");
  });

  test("agrees with the slugger's FIRST emission for a heading", () => {
    const s = createHeadingSlugger();
    expect(s("Common mistakes")).toBe(slugifyHeading("Common mistakes"));
  });

  test("never returns empty, even for a symbol-only heading", () => {
    expect(slugifyHeading("⚠")).toBe("section");
  });

  test("strips Arabic harakat, so a bab heading reads as words not letters", () => {
    // Without stripping marks this becomes "ب-اب-ال-م-د-و-ال-ق-ص-ر" — every harakah
    // turns into a hyphen and the word boundaries are lost.
    expect(slugifyHeading("بَابُ الْمَدِّ وَالْقَصْر")).toBe("باب-المد-والقصر");
  });

  test("KEEPS Latin transliteration diacritics — they are semantic here", () => {
    // ẓ is not z: ظ vs ز. NFC leaves these precomposed, so mark-stripping never sees them.
    expect(slugifyHeading("The four-word exception — iẓhār muṭlaq"))
      .toBe("the-four-word-exception-iẓhār-muṭlaq");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/library/markdown/slug.test.ts`
Expected: FAIL — `Failed to resolve import "./slug"`

- [ ] **Step 3: Implement `src/library/markdown/slug.ts`**

```ts
/**
 * Heading → anchor id.
 *
 * Vault headings carry ⚠, em-dashes, Arabic script and combining marks — e.g.
 * `## ⚠ The count is disputed`, `## ط → ت is nāqiṣ`, `## بَابُ الْمَدِّ وَالْقَصْر`.
 * A naive [^a-z0-9]+ strip collapses the Arabic ones to the empty string and makes
 * distinct headings collide, so we keep any Unicode letter or number and only strip
 * punctuation and symbols. `\p{L}`, `\p{N}` and `\p{M}` need the `u` flag.
 *
 * NFC-then-strip-marks does exactly the right thing in both scripts, and the asymmetry
 * is the point:
 *   - Arabic has no precomposed letter+harakah characters, so NFC leaves the harakat as
 *     separate `\p{M}` marks and they are removed. Without this, every harakah becomes a
 *     hyphen: `بَابُ الْمَدِّ وَالْقَصْر` slugs to `ب-اب-ال-م-د-و-ال-ق-ص-ر` and the word
 *     boundaries are destroyed. With it: `باب-المد-والقصر`.
 *   - Latin transliteration diacritics ARE precomposed by NFC (ẓ is U+1E93), so
 *     mark-stripping never sees them and they survive. That matters: ẓ is not z, it is
 *     ظ rather than ز. `iẓhār muṭlaq` stays `iẓhār-muṭlaq`.
 * Measured over all 840 headings in the 101 in-scope notes: 0 collisions between
 * distinct headings, 0 fallbacks to "section".
 *
 * `slugifyHeading` is PURE. `createHeadingSlugger` adds per-document dedup on top.
 * They are separate on purpose — see the Interfaces block for this task. Link
 * resolution walks only the links, in link order, so it must not dedupe; heading
 * rendering walks every heading in document order, so it must.
 */
export function slugifyHeading(text: string): string {
  return (
    text
      .normalize("NFC")
      .trim()
      .toLowerCase()
      .replace(/\p{M}+/gu, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

/** Stateful, per-document: ids must be unique within one page. */
export function createHeadingSlugger(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base = slugifyHeading(text);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/library/markdown/slug.test.ts`
Expected: PASS — 11 tests

The "differ only by Unicode" test passes because `⚠` becomes a leading separator that
is trimmed — giving `the-count-is-disputed` — while a bare heading gives the same base
and is therefore deduped to `the-count-is-disputed-2`. Distinct ids, which is the
requirement.

- [ ] **Step 5: Commit**

```bash
git add src/library/markdown/slug.ts src/library/markdown/slug.test.ts
git commit -m "feat(library): Unicode-safe heading anchors

A naive ASCII strip collapses every Arabic heading to the empty string and makes
distinct headings collide. Keeping \\p{L}/\\p{N} and stripping only punctuation
keeps them apart."
```

---

### Task 5: Wikilink resolution

**Files:**
- Create: `src/library/markdown/wikilinks.ts`
- Test: `src/library/markdown/wikilinks.test.ts`

**Interfaces:**
- Consumes: `createHeadingSlugger` (Task 4), `allNotes` (Task 3)
- Produces:
  - `resolveWikilinks(markdown: string, resolve: (basename: string) => string | null): string`
  - `stripWikilink(value: string): string` — for frontmatter `sources:` entries
  - `buildResolver(): (basename: string) => string | null`

- [ ] **Step 1: Write the failing test**

Create `src/library/markdown/wikilinks.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import fs from "node:fs";
import { resolveWikilinks, stripWikilink, buildResolver } from "./wikilinks";
import { allNotes } from "../load";

const resolve = (name: string) => (name === "Ghunnah" || name === "Izhar-Shafawi" ? `/library/${name.toLowerCase()}` : null);

describe("resolveWikilinks", () => {
  test("rewrites a plain wikilink to a markdown link", () => {
    expect(resolveWikilinks("see [[Ghunnah]] now", resolve)).toBe("see [Ghunnah](/library/ghunnah) now");
  });

  test("uses the alias as display text", () => {
    expect(resolveWikilinks("[[Ghunnah|the nasal sound]]", resolve)).toBe("[the nasal sound](/library/ghunnah)");
  });

  test("TRAP 1 — a wikilink spanning two lines still resolves", () => {
    const md = "a fully-formed meem — [[Izhar-Shafawi|iẓhār\nshafawī]], the wrong rule.";
    const out = resolveWikilinks(md, resolve);
    expect(out).not.toContain("[[");
    expect(out).toContain("(/library/izhar-shafawi)");
  });

  test("TRAP 3 — an empty target becomes a same-page anchor", () => {
    const out = resolveWikilinks("see [[#The four-word exception — iẓhār muṭlaq]] below", resolve);
    expect(out).not.toContain("[[");
    expect(out).toContain("(#the-four-word-exception-i");
  });

  test("carries a heading fragment onto the target route", () => {
    expect(resolveWikilinks("[[Ghunnah#Duration — 2 harakāt]]", resolve)).toContain("(/library/ghunnah#duration-2-harak");
  });

  test("an unresolvable target degrades to plain text, never leaking brackets", () => {
    const out = resolveWikilinks("see [[No-Such-Note]] here", resolve);
    expect(out).toBe("see No-Such-Note here");
  });

  test("an unresolvable aliased target keeps the alias as plain text", () => {
    expect(resolveWikilinks("[[No-Such-Note|the thing]]", resolve)).toBe("the thing");
  });
});

describe("stripWikilink", () => {
  test("TRAP 4 — frontmatter sources[] entries are wikilinks", () => {
    expect(stripWikilink("[[Tuhfat-al-Atfal]]")).toBe("Tuhfat-al-Atfal");
  });

  test("passes a bare string through", () => {
    expect(stripWikilink("Tuhfat-al-Atfal")).toBe("Tuhfat-al-Atfal");
  });
});

describe("against the real vault", () => {
  test("PRECONDITION — no [[ appears inside a code span or fence", () => {
    // resolveWikilinks runs on raw markdown BEFORE lexing, which is only safe while
    // this holds. If a note ever puts [[x]] inside code, this fails and the transform
    // must move into the token walk instead.
    //
    // Extract the code segments and test THOSE. Do not try to subtract the non-code
    // text from the body — `body.replace(withoutCode, "")` looks plausible and is
    // wrong: `withoutCode` is not a substring of `body` whenever the note contains
    // any code, so the replace matches nothing, the whole body survives, and the
    // assertion then trips on ordinary prose wikilinks.
    for (const n of allNotes()) {
      const fences = n.body.match(/```[\s\S]*?```/g) ?? [];
      const inline = n.body.replace(/```[\s\S]*?```/g, "").match(/`[^`\n]*`/g) ?? [];
      for (const segment of [...fences, ...inline]) {
        expect(segment.includes("[["), `${n.file}: ${segment.slice(0, 60)}`).toBe(false);
      }
    }
  });

  test("every wikilink in every in-scope note resolves — the set is link-closed", () => {
    const r = buildResolver();
    for (const n of allNotes()) {
      const out = resolveWikilinks(n.body, r);
      expect(out.includes("[["), `${n.file} leaked a wikilink`).toBe(false);
    }
  });

  test("the resolver knows all 101 notes", () => {
    const r = buildResolver();
    for (const n of allNotes()) expect(r(n.basename)).toBe(`/library/${n.slug}`);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/library/markdown/wikilinks.test.ts`
Expected: FAIL — `Failed to resolve import "./wikilinks"`

- [ ] **Step 3: Implement `src/library/markdown/wikilinks.ts`**

```ts
import { allNotes } from "../load";
import { slugifyHeading } from "./slug";

/**
 * Obsidian wikilink, in every form the vault uses.
 *
 *   [[Target]]  [[Target|alias]]  [[Target#heading]]  [[#heading]]
 *
 * Two departures from the gate's regex (scripts/check-library.mjs:9), both deliberate:
 *
 * 1. The target may be EMPTY. The gate requires one non-# character before the
 *    fragment, which is why `[[#The four-word exception — iẓhār muṭlaq]]` at
 *    library/02-Rules/Idgham-Maal-Ghunnah.md:65 slips past it. That link is a
 *    same-note anchor and must render as one.
 * 2. The alias matches [\s\S] rather than [^\]]. A wikilink WRAPS A LINE at
 *    library/02-Rules/Ikhfa-Shafawi.md:46 — `[[Izhar-Shafawi|iẓhār\nshafawī]]`.
 *    A line-oriented pattern misses it and emits literal `[[Izhar-Shafawi|iẓhār`
 *    to the student, which is precisely the defect WISHLIST:146 calls most likely.
 */
const WIKILINK = /\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|([\s\S]*?))?\]\]/g;

/** Frontmatter `sources:` values are wikilink strings, not plain names. */
export function stripWikilink(value: string): string {
  const m = /^\[\[([^\]|#]+)/.exec(value.trim());
  return m ? m[1] : value.trim();
}

/**
 * Rewrite every wikilink to a markdown link, or to plain text when unresolvable.
 *
 * This runs on RAW MARKDOWN before the lexer, so `marked` never has to deal with
 * `[[`, whose bracket nesting it would otherwise try to read as a reference link.
 * That is safe only while no `[[` appears inside a code span or fence — a
 * precondition asserted by test "PRECONDITION" in wikilinks.test.ts.
 */
export function resolveWikilinks(
  markdown: string,
  resolve: (basename: string) => string | null,
): string {
  // slugifyHeading, NOT createHeadingSlugger. Link resolution walks only the links,
  // in link order — a shorter and different sequence than the headings. A deduping
  // slugger here would send a note's SECOND `[[#Sources]]` link to `#sources-2`,
  // silently landing it on the wrong heading.
  const anchorFor = (heading: string) => slugifyHeading(heading);

  return markdown.replace(WIKILINK, (_all, rawTarget: string, rawHeading?: string, rawAlias?: string) => {
    const target = (rawTarget ?? "").trim();
    const heading = rawHeading?.trim();
    const alias = rawAlias?.trim();
    const display = alias || target || heading || "";

    // Empty target — an anchor inside this same note.
    if (!target) {
      return heading ? `[${display}](#${anchorFor(heading)})` : display;
    }

    const href = resolve(target);
    if (!href) return display; // never leak brackets
    return `[${display}](${heading ? `${href}#${anchorFor(heading)}` : href})`;
  });
}

/** basename → route, over every in-scope note. */
export function buildResolver(): (basename: string) => string | null {
  const map = new Map(allNotes().map((n) => [n.basename, `/library/${n.slug}`]));
  return (basename: string) => map.get(basename) ?? null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/library/markdown/wikilinks.test.ts`
Expected: PASS — 12 tests

If "every wikilink … resolves" fails, the failure message names the file. Do **not**
special-case it — a genuinely unresolvable link should fall through to plain text, so a
leak means the regex is wrong, not the data.

- [ ] **Step 5: Commit**

```bash
git add src/library/markdown/wikilinks.ts src/library/markdown/wikilinks.test.ts
git commit -m "feat(library): wikilink resolution, with the two live traps pinned

One wikilink wraps a line (Ikhfa-Shafawi.md:46) and one has an empty target
(Idgham-Maal-Ghunnah.md:65, a same-note anchor the gate's own regex cannot see).
Both are regression-tested by name — between them they are the whole of the
'[[Foo]] leaks to a student' failure WISHLIST calls most likely."
```

---

### Task 6: Markdown → React

**Files:**
- Create: `src/library/markdown/parse.ts`
- Create: `src/library/markdown/render.tsx`
- Test: `src/library/markdown/render.test.tsx`

**Interfaces:**
- Consumes: Tasks 4–5
- Produces:
  - `lexNote(markdown: string): Token[]` (re-exports `marked`'s `Token`)
  - `renderTokens(tokens: Token[], slugger: (t: string) => string): React.ReactNode`
  - `<NoteBody note={LoadedNote} />` is added in Task 7; this task exposes the primitives

- [ ] **Step 1: Write the failing test**

Create `src/library/markdown/render.test.tsx`:

```tsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { lexNote, renderTokens } from "./render";
import { createHeadingSlugger } from "./slug";

function draw(md: string) {
  return render(<>{renderTokens(lexNote(md), createHeadingSlugger())}</>);
}

describe("block rendering", () => {
  test("headings get anchor ids", () => {
    draw("## Common mistakes\n");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "common-mistakes");
  });

  test("renders a GFM table", () => {
    draw("| Sifah | Opposite |\n|---|---|\n| jahr | hams |\n");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Sifah" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "jahr" })).toBeInTheDocument();
  });

  test("TRAP 2 — an escaped pipe stays inside its cell", () => {
    draw("| Title | Id |\n|---|---|\n| Alif \\| Ba | abc |\n");
    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(2);
    expect(cells[0].textContent).toBe("Alif | Ba");
  });

  test("TRAP 5 — a blockquote containing a heading keeps the heading", () => {
    const { container } = draw("> ### ⚠ Status: needs-review — sīn or ṣād?\n");
    expect(container.querySelector("blockquote h3")).not.toBeNull();
  });

  test("renders nested unordered lists", () => {
    const { container } = draw("- outer\n  - inner\n");
    expect(container.querySelectorAll("ul")).toHaveLength(2);
  });

  test("renders an ordered list", () => {
    const { container } = draw("1. first\n2. second\n");
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
  });

  test("renders a fenced code block", () => {
    const { container } = draw("```json\n{\"a\":1}\n```\n");
    expect(container.querySelector("pre code")).not.toBeNull();
  });

  test("renders a horizontal rule", () => {
    const { container } = draw("---\n");
    expect(container.querySelector("hr")).not.toBeNull();
  });
});

describe("inline rendering", () => {
  test("bold, italic and inline code", () => {
    const { container } = draw("**b** and *i* and `c`\n");
    expect(container.querySelector("strong")?.textContent).toBe("b");
    expect(container.querySelector("em")?.textContent).toBe("i");
    expect(container.querySelector("code")?.textContent).toBe("c");
  });

  test("external links open in a new tab safely", () => {
    draw("[tanzil.net](https://tanzil.net)\n");
    const a = screen.getByRole("link", { name: "tanzil.net" });
    expect(a).toHaveAttribute("href", "https://tanzil.net");
    expect(a).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  test("internal links stay same-tab", () => {
    draw("[Ghunnah](/library/ghunnah)\n");
    expect(screen.getByRole("link", { name: "Ghunnah" })).not.toHaveAttribute("target");
  });
});

describe("raw HTML is never interpreted", () => {
  test("an html token renders as visible text, not markup", () => {
    const { container } = draw("<script>alert(1)</script>\n");
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/library/markdown/render.test.tsx`
Expected: FAIL — `Failed to resolve import "./render"`

- [ ] **Step 3: Implement `src/library/markdown/parse.ts`**

```ts
import { Lexer, type Token, type Tokens } from "marked";

export type { Token, Tokens };

/**
 * Lex markdown to tokens. GFM is on for tables — the vault has 1,504 table rows across
 * 84 of the 100 sectioned notes, including 60 escaped pipes in Muallimi-Soniy.md that
 * marked's own table tokenizer already handles correctly.
 *
 * We take TOKENS rather than HTML on purpose: the renderer emits React elements, so
 * dangerouslySetInnerHTML never appears and `html` tokens are shown as text rather
 * than parsed (see render.tsx).
 */
export function lexNote(markdown: string): Token[] {
  return new Lexer({ gfm: true, breaks: false }).lex(markdown);
}
```

- [ ] **Step 4: Implement `src/library/markdown/render.tsx`**

```tsx
import React from "react";
import { lexNote, type Token, type Tokens } from "./parse";

export { lexNote };

type Slugger = (text: string) => string;

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Inline tokens → React. `html` is deliberately absent: it falls through to text. */
function renderInline(tokens: Token[] | undefined, key = "i"): React.ReactNode {
  if (!tokens) return null;
  return tokens.map((t, i) => {
    const k = `${key}-${i}`;
    switch (t.type) {
      case "text":
        return <React.Fragment key={k}>{(t as Tokens.Text).tokens ? renderInline((t as Tokens.Text).tokens, k) : (t as Tokens.Text).text}</React.Fragment>;
      case "strong":
        return <strong key={k} className="font-semibold text-white/90">{renderInline((t as Tokens.Strong).tokens, k)}</strong>;
      case "em":
        return <em key={k}>{renderInline((t as Tokens.Em).tokens, k)}</em>;
      case "codespan":
        return <code key={k} className="rounded bg-white/10 px-1 py-0.5 text-[0.9em]">{(t as Tokens.Codespan).text}</code>;
      case "br":
        return <br key={k} />;
      case "del":
        return <del key={k}>{renderInline((t as Tokens.Del).tokens, k)}</del>;
      case "link": {
        const l = t as Tokens.Link;
        const ext = isExternal(l.href);
        return (
          <a
            key={k}
            href={l.href}
            className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70"
            {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {renderInline(l.tokens, k)}
          </a>
        );
      }
      // `escape` carries the already-unescaped character, e.g. \| -> |
      case "escape":
        return <React.Fragment key={k}>{(t as Tokens.Escape).text}</React.Fragment>;
      // Raw HTML is NEVER interpreted. The two occurrences in the vault are false
      // positives inside code spans (<Video ID>, <audio>); showing the source text is
      // both correct for them and the cheapest safety property available here.
      default:
        return <React.Fragment key={k}>{(t as { raw?: string }).raw ?? ""}</React.Fragment>;
    }
  });
}

/** Block tokens → React. */
export function renderTokens(tokens: Token[], slugger: Slugger, key = "b"): React.ReactNode {
  return tokens.map((t, i) => {
    const k = `${key}-${i}`;
    switch (t.type) {
      case "space":
        return null;
      case "heading": {
        const h = t as Tokens.Heading;
        const id = slugger(h.text);
        const cls = h.depth <= 2 ? "mt-8 mb-3 text-xl font-bold text-white/90" : "mt-6 mb-2 font-semibold text-white/85";
        const Tag = (`h${Math.min(h.depth, 6)}`) as "h1";
        return <Tag key={k} id={id} className={cls}>{renderInline(h.tokens, k)}</Tag>;
      }
      case "paragraph":
        return <p key={k} className="my-3 leading-relaxed text-white/75">{renderInline((t as Tokens.Paragraph).tokens, k)}</p>;
      case "blockquote":
        return (
          <blockquote key={k} className="my-4 border-l-2 border-white/25 pl-4 text-white/70">
            {renderTokens((t as Tokens.Blockquote).tokens, slugger, k)}
          </blockquote>
        );
      case "list": {
        const l = t as Tokens.List;
        const Tag = l.ordered ? "ol" : "ul";
        return (
          <Tag key={k} className={`my-3 space-y-1 pl-6 text-white/75 ${l.ordered ? "list-decimal" : "list-disc"}`}>
            {l.items.map((item, j) => (
              <li key={`${k}-${j}`}>{renderTokens(item.tokens, slugger, `${k}-${j}`)}</li>
            ))}
          </Tag>
        );
      }
      case "table": {
        const tb = t as Tokens.Table;
        return (
          <div key={k} className="my-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {tb.header.map((cell, j) => (
                    <th key={`${k}-h-${j}`} className="border-b border-white/20 px-2 py-1.5 text-left font-semibold text-white/85">
                      {renderInline(cell.tokens, `${k}-h-${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tb.rows.map((row, r) => (
                  <tr key={`${k}-r-${r}`}>
                    {row.map((cell, c) => (
                      <td key={`${k}-r-${r}-${c}`} className="border-b border-white/10 px-2 py-1.5 align-top text-white/75">
                        {renderInline(cell.tokens, `${k}-r-${r}-${c}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case "code":
        return (
          <pre key={k} className="my-4 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs">
            <code>{(t as Tokens.Code).text}</code>
          </pre>
        );
      case "hr":
        return <hr key={k} className="my-6 border-white/15" />;
      case "text":
        return <p key={k} className="my-3 leading-relaxed text-white/75">{renderInline((t as Tokens.Text).tokens ?? [t], k)}</p>;
      default:
        return <p key={k} className="my-3 leading-relaxed text-white/75">{(t as { raw?: string }).raw ?? ""}</p>;
    }
  });
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/library/markdown/render.test.tsx`
Expected: PASS — 12 tests

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: `tsc` silent; lint reports only the 3 pre-existing `no-img-element` warnings

- [ ] **Step 7: Commit**

```bash
git add src/library/markdown/parse.ts src/library/markdown/render.tsx src/library/markdown/render.test.tsx
git commit -m "feat(library): markdown to React, no dangerouslySetInnerHTML

Tokens rather than HTML, so raw HTML is never interpreted — it renders as its own
source text. The only two <> occurrences in scope are false positives inside code
spans, so disabling it costs nothing and is worth far more once a teacher editor
can write into this pipeline.

The escaped-pipe case is pinned: 60 of them hold Muallimi-Soniy's 96-row table
together."
```

---

### Task 7: Status notices and the note body component

**Files:**
- Create: `src/components/library/StatusNotice.tsx`
- Create: `src/components/library/NoteBody.tsx`
- Test: `src/components/library/StatusNotice.test.tsx`

**Interfaces:**
- Consumes: Tasks 3–6
- Produces:
  - `<StatusNotice status={Status} kind={"rule"|"letter"|"source"} />`
  - `<NoteBody note={LoadedNote} />` — resolves wikilinks, lexes, renders

- [ ] **Step 1: Write the failing test**

Create `src/components/library/StatusNotice.test.tsx`:

```tsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusNotice } from "./StatusNotice";
import { NoteBody } from "./NoteBody";
import { allNotes } from "@/library/load";

describe("StatusNotice", () => {
  test("needs-review renders a visible caution with a role", () => {
    render(<StatusNotice status="needs-review" kind="rule" />);
    const el = screen.getByRole("note");
    expect(el.textContent).toMatch(/needs review/i);
  });

  test("draft renders a quiet factual line, not an alarm", () => {
    render(<StatusNotice status="draft" kind="letter" />);
    const el = screen.getByRole("note");
    expect(el.textContent).toMatch(/not yet reviewed/i);
    // The two signals must be visually distinct: draft carries no amber warning tint.
    expect(el.className).not.toMatch(/amber/);
  });

  test("needs-review IS tinted, so the two never look alike", () => {
    render(<StatusNotice status="needs-review" kind="rule" />);
    expect(screen.getByRole("note").className).toMatch(/amber/);
  });

  test("verified renders nothing at all", () => {
    const { container } = render(<StatusNotice status="verified" kind="rule" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("NoteBody against the real vault", () => {
  test("THE INVARIANT — no note leaks a wikilink bracket", () => {
    for (const note of allNotes()) {
      const { container, unmount } = render(<NoteBody note={note} />);
      expect(container.textContent ?? "", `${note.file} leaked [[`).not.toContain("[[");
      unmount();
    }
  });

  test("every note renders some text", () => {
    for (const note of allNotes()) {
      const { container, unmount } = render(<NoteBody note={note} />);
      expect((container.textContent ?? "").trim().length, note.file).toBeGreaterThan(0);
      unmount();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/library/StatusNotice.test.tsx`
Expected: FAIL — `Failed to resolve import "./StatusNotice"`

- [ ] **Step 3: Implement `src/components/library/StatusNotice.tsx`**

```tsx
import type { LibraryNote } from "@/library/schema";

type Status = LibraryNote["status"];

/**
 * The two status signals, kept deliberately distinct.
 *
 * `needs-review` means a sourcing claim is unsettled, and surfacing it is mandatory —
 * WISHLIST:141: "A library that presents an unverified rule as settled is worse than
 * no library." It gets the amber caution.
 *
 * `draft` describes the NOTE'S authoring state, not the correctness of the teaching.
 * All 29 letter notes are draft while those letters are taught in live lessons today,
 * so an alarm here would tell a student that material she has already been taught is
 * untrustworthy. It gets a quiet factual line.
 *
 * Note that `status` is NOT a publish signal in this vault and must never be used as
 * one — see the docblock at scripts/check-library.mjs:19-22.
 */
export function StatusNotice({ status, kind }: { status: Status; kind: "rule" | "letter" | "source" }) {
  if (status === "verified") return null;

  if (status === "needs-review") {
    return (
      <p role="note" className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100/90">
        <strong className="font-semibold">Needs review.</strong>{" "}
        This {kind} is not yet verified against a vendored source. The note below records what is still missing.
      </p>
    );
  }

  return (
    <p role="note" className="mb-4 text-xs text-white/50">
      This note has not yet been reviewed.
    </p>
  );
}
```

- [ ] **Step 4: Implement `src/components/library/NoteBody.tsx`**

```tsx
import type { LoadedNote } from "@/library/load";
import { lexNote, renderTokens } from "@/library/markdown/render";
import { createHeadingSlugger } from "@/library/markdown/slug";
import { resolveWikilinks, buildResolver } from "@/library/markdown/wikilinks";

/**
 * A note's markdown body, rendered.
 *
 * Wikilinks are rewritten to real routes BEFORE lexing, so `marked` never meets `[[`
 * — whose bracket nesting it would otherwise try to read as a reference link.
 *
 * The two slug paths are deliberately asymmetric. `resolveWikilinks` uses the PURE
 * `slugifyHeading` because it walks only the links; `renderTokens` gets a fresh
 * DEDUPING `createHeadingSlugger` because it walks every heading in document order and
 * ids must be unique within the page. Making either one match the other breaks anchors.
 */
export function NoteBody({ note }: { note: LoadedNote }) {
  const markdown = resolveWikilinks(note.body, buildResolver());
  return <div className="library-prose">{renderTokens(lexNote(markdown), createHeadingSlugger())}</div>;
}
```

> **Implementer's note.** A `[[#Heading]]` anchor lands correctly because
> `slugifyHeading(h)` always equals the FIRST id `createHeadingSlugger` emits for `h`
> (Task 4 asserts exactly that). An anchor can therefore only miss when a note has two
> headings with identical text — the link goes to the first, which is the right answer.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/library/StatusNotice.test.tsx`
Expected: PASS — 6 tests. "THE INVARIANT" renders all 101 notes and is the executable
form of WISHLIST's done-when.

- [ ] **Step 6: Commit**

```bash
git add src/components/library/ && git commit -m "feat(library): two status signals, and the no-brackets invariant

needs-review is a caution; draft is a footnote. They are different facts: all 29
letters are draft while being taught live, so one shared badge would tell a
student her finished lessons are untrustworthy.

The invariant test renders all 101 notes and asserts zero '[[' reaches the DOM."
```

---

### Task 8: Source display modes and matn withholding

**Files:**
- Create: `src/library/sources.ts`
- Create: `src/components/library/MatnWithheld.tsx`
- Test: `src/library/sources.test.ts`

**Interfaces:**
- Consumes: Tasks 2–3
- Produces:
  - `type SourceDisplay = "withhold-matn" | "full"`
  - `displayModeFor(note: SourceNote): SourceDisplay`
  - `withholdMatn(body: string): { body: string; withheldLines: number }`
  - `<MatnWithheld note={SourceNote} lines={number} />`

**What "withheld" means — read before implementing.** The Arabic *source text* is
withheld: the vocalised matn verses and the excerpt bodies, i.e. **text a student could
memorise from**. It does **not** mean stripping Arabic from the page. `arabic_title`,
`author_arabic`, bāb/chapter headings, printed page numbers (p. ٩٤) and Arabic inside
the notes' own explanatory prose all still render. A page that removed every Arabic
glyph would be unreadable and would misrepresent the instruction.

The instruction itself is in `library/01-Sources/Source-Manifest.md`, on Tuhfat al-Atfal:
the transcription *"must be collated against a printed critical edition before being
shown to a learner."*

- [ ] **Step 1: Write the failing test**

Create `src/library/sources.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import { allNotes } from "./load";
import { displayModeFor, withholdMatn } from "./sources";
import type { SourceNote } from "./schema";

const sources = () => allNotes().filter((n) => n.meta.type === "source");
const bySlug = (s: string) => allNotes().find((n) => n.slug === s)!;

describe("displayModeFor", () => {
  test("the four text-bearing classical sources withhold their matn", () => {
    for (const slug of ["muqaddimah-jazariyyah", "tuhfat-al-atfal", "shatibiyyah", "nihayat-al-qawl-al-mufid"]) {
      const n = bySlug(slug);
      expect(displayModeFor(n.meta as SourceNote), slug).toBe("withhold-matn");
    }
  });

  test("citation-only and metadata-only sources render in full", () => {
    for (const slug of ["sajawandi-waqf", "everyayah", "tanzil", "arabic101", "muallimi-soniy"]) {
      const n = bySlug(slug);
      expect(displayModeFor(n.meta as SourceNote), slug).toBe("full");
    }
  });

  test("every source note gets a mode", () => {
    for (const n of sources()) expect(["withhold-matn", "full"]).toContain(displayModeFor(n.meta as SourceNote));
  });
});

describe("withholdMatn", () => {
  test("removes an Arabic verse line", () => {
    const md = "## Text\n\nوَغُنَّ مِيمًا ثُمَّ نُونًا شُدِّدَا ⁕ وَسَمِّ كُلًّا حَرْفَ غُنَّةٍ بَدَا\n\nplain english line\n";
    const { body, withheldLines } = withholdMatn(md);
    expect(withheldLines).toBe(1);
    expect(body).not.toContain("وَغُنَّ");
    expect(body).toContain("plain english line");
  });

  test("KEEPS headings even when they are Arabic", () => {
    const md = "## بَابُ الْمَدِّ وَالْقَصْر\n\nوَغُنَّ مِيمًا ثُمَّ نُونًا شُدِّدَا\n";
    const { body } = withholdMatn(md);
    expect(body).toContain("## بَابُ الْمَدِّ وَالْقَصْر");
    expect(body).not.toContain("وَغُنَّ مِيمًا");
  });

  test("KEEPS Arabic inside a table cell — those are glossaries, not matn", () => {
    const md = "| Term | Arabic |\n|---|---|\n| ghunnah | الغنة |\n";
    const { body } = withholdMatn(md);
    expect(body).toContain("الغنة");
  });
});

describe("the real classical notes", () => {
  test("the matn is gone but the Arabic title and bab headings survive", () => {
    const n = bySlug("tuhfat-al-atfal");
    const { body, withheldLines } = withholdMatn(n.body);
    expect(withheldLines).toBeGreaterThan(30);
    const meta = n.meta as SourceNote;
    if (meta.arabic_title) expect(meta.arabic_title.length).toBeGreaterThan(0);
    // A heading line starting with ## is never withheld, whatever script it is in.
    for (const line of body.split("\n")) {
      if (line.startsWith("#")) expect(line.length).toBeGreaterThan(1);
    }
  });

  test("over-correction guard — the page is not stripped of all Arabic", () => {
    const n = bySlug("nihayat-al-qawl-al-mufid");
    const { body } = withholdMatn(n.body);
    // Headings, page numbers and prose keep Arabic; only free-standing verse lines go.
    expect(/[؀-ۿ]/.test(body), "all Arabic was stripped — too aggressive").toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/library/sources.test.ts`
Expected: FAIL — `Failed to resolve import "./sources"`

- [ ] **Step 3: Implement `src/library/sources.ts`**

```ts
import type { SourceNote } from "./schema";

export type SourceDisplay = "withhold-matn" | "full";

/**
 * Which sources withhold their source text.
 *
 * `full-text`, `partial` and `excerpts` all carry Arabic a student could memorise
 * from — Jazariyyah (144 Arabic lines), Tuhfah (95), Shatibiyyah (33), Nihayat (47).
 * `citation-only` (Sajawandi) has no matn by design, and `metadata-only` (Everyayah,
 * the two video notes) are catalogues.
 */
export function displayModeFor(note: SourceNote): SourceDisplay {
  return note.vendored === "full-text" || note.vendored === "partial" || note.vendored === "excerpts"
    ? "withhold-matn"
    : "full";
}

const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

/**
 * Remove free-standing Arabic verse lines, keeping everything else.
 *
 * "Matn" here means TEXT A STUDENT COULD MEMORISE FROM — the vocalised verse lines and
 * excerpt bodies. It does NOT mean every Arabic glyph. These are kept on purpose:
 *
 *   - headings (`#…`), including Arabic bab headings
 *   - table rows (`|…`) — glossaries and symbol tables, not matn
 *   - blockquotes (`>…`) — the notes' own commentary
 *   - list items and prose that merely mention an Arabic term
 *
 * Withholding every Arabic glyph would leave an unreadable page and would overstate
 * the instruction, which is about memorisable source text specifically.
 */
export function withholdMatn(body: string): { body: string; withheldLines: number } {
  let withheldLines = 0;
  const kept = body.split("\n").filter((line) => {
    const t = line.trim();
    if (!t) return true;
    if (/^[#>|\-*\d]/.test(t)) return true; // headings, quotes, tables, lists
    if (!ARABIC.test(t)) return true;        // no Arabic at all
    // A free-standing line that is predominantly Arabic: this is matn.
    const arabicChars = (t.match(/[؀-ۿ]/g) ?? []).length;
    if (arabicChars / t.length < 0.4) return true;
    withheldLines += 1;
    return false;
  });
  return { body: kept.join("\n"), withheldLines };
}
```

- [ ] **Step 4: Implement `src/components/library/MatnWithheld.tsx`**

```tsx
import type { SourceNote } from "@/library/schema";

/**
 * Shown in place of a withheld matn.
 *
 * This is not caution for its own sake. library/01-Sources/Source-Manifest.md records
 * that the Tuhfah transcription carries "visible vocalisation defects (missing shadda
 * in verses 2 and 52, a wrong vowel in verse 60, `ى` for final `ي` in several places)"
 * and instructs that "since a matn is memorised from the page, it must be collated
 * against a printed critical edition before being shown to a learner."
 */
export function MatnWithheld({ note, lines }: { note: SourceNote; lines: number }) {
  return (
    <aside role="note" className="glass my-6 rounded-2xl border border-amber-400/30 p-4 sm:p-5">
      <h2 className="mb-2 font-semibold text-amber-100/90">The source text is not shown here</h2>
      <p className="text-sm leading-relaxed text-white/75">
        {lines} lines of Arabic from this work are withheld pending collation against a printed
        critical edition. A matn is memorised from the page, so an uncollated transcription is
        not safe to learn from — the structure, chapter order and translation below are.
      </p>
      {note.url && (
        <p className="mt-3 text-sm">
          <a href={note.url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70">
            Read the original at the source
          </a>{" "}
          <span className="text-white/50">({note.licence ?? "public domain"})</span>
        </p>
      )}
    </aside>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/library/sources.test.ts`
Expected: PASS — 8 tests

If `withheldLines` for Tuhfah comes in below 30, the 0.4 Arabic-density threshold is too
strict for that note's line shapes — tune the threshold, **not** the test, and re-check
the over-correction guard still passes.

- [ ] **Step 6: Commit**

```bash
git add src/library/sources.ts src/library/sources.test.ts src/components/library/MatnWithheld.tsx
git commit -m "feat(library): withhold the classical matn, per the vault's own instruction

Source-Manifest.md does not merely flag Tuhfah — it instructs that the matn 'must
be collated against a printed critical edition before being shown to a learner'.
That covers 239 Arabic lines across four sources.

Withholding is scoped to memorisable source text. Arabic titles, bab headings,
page numbers and glossary cells all survive, and a test asserts that too — an
over-correction that stripped every Arabic glyph would fail just as loudly."
```

---

### Task 9: The 101 detail pages

**Files:**
- Create: `src/app/library/[slug]/page.tsx`
- Create: `src/components/library/NoteHeader.tsx`
- Test: `src/app/library/library-routes.test.tsx`

**Interfaces:**
- Consumes: Tasks 3, 7, 8
- Produces: route `/library/[slug]`; `generateStaticParams` yielding 101 params

- [ ] **Step 1: Write the failing test**

Create `src/app/library/library-routes.test.tsx`:

```tsx
import { describe, test, expect } from "vitest";
import { generateStaticParams } from "./[slug]/page";
import { allSlugs } from "@/library/load";

describe("/library/[slug]", () => {
  test("generates exactly 101 pages", () => {
    expect(generateStaticParams()).toHaveLength(101);
  });

  test("covers every loaded slug", () => {
    const params = generateStaticParams().map((p) => p.slug);
    expect([...params].sort()).toEqual([...allSlugs()].sort());
  });

  test("no param collides with a section landing route", () => {
    const params = new Set(generateStaticParams().map((p) => p.slug));
    for (const seg of ["rules", "letters", "sources"]) expect(params.has(seg)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/app/library/library-routes.test.tsx`
Expected: FAIL — `Failed to resolve import "./[slug]/page"`

- [ ] **Step 3: Implement `src/components/library/NoteHeader.tsx`**

```tsx
import Link from "next/link";
import type { LoadedNote } from "@/library/load";
import { stripWikilink } from "@/library/markdown/wikilinks";
import { slugFor } from "@/library/routes";

const ZONE_IMAGE: Record<string, string> = {
  jawf: "/images/makhraj/jawf.jpg",
  halq: "/images/makhraj/halq.jpg",
  lisan: "/images/makhraj/lisan.jpg",
  shafatan: "/images/makhraj/shafatan.jpg",
};

/** Title block plus the frontmatter facts worth showing above the prose. */
export function NoteHeader({ note }: { note: LoadedNote }) {
  const m = note.meta;
  const sources = "sources" in m ? m.sources : [];
  const taughtIn = "taught_in" in m ? m.taught_in : undefined;

  return (
    <header className="mb-6">
      <h1 className="gradient-text mb-2 text-3xl font-bold">
        {"english" in m ? m.english : "name" in m ? m.name : "title" in m && m.title ? String(m.title) : note.basename}
      </h1>

      {"arabic" in m && (
        <p className="arabic quran mb-3 text-3xl" dir="rtl" lang="ar">{m.arabic}</p>
      )}

      {m.type === "letter" && (
        <>
          <p className="text-sm text-white/60">Makhraj — {m.makhraj}</p>
          {ZONE_IMAGE[m.makhraj_zone] && (
            // eslint-disable-next-line @next/next/no-img-element -- output: "export"; the app uses raw <img> throughout
            <img src={ZONE_IMAGE[m.makhraj_zone]} alt={`Makhraj zone: ${m.makhraj_zone}`} className="my-4 w-full rounded-xl" />
          )}
        </>
      )}

      {taughtIn && (
        <p className="mt-2 text-sm">
          <Link href={`/lesson/${taughtIn}`} className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70">
            Taught in lesson {taughtIn}
          </Link>
        </p>
      )}

      {sources.length > 0 && (
        <p className="mt-2 text-sm text-white/60">
          Sources:{" "}
          {sources.map((s, i) => {
            const name = stripWikilink(s);
            return (
              <span key={name}>
                {i > 0 && ", "}
                <Link href={`/library/${slugFor(name)}`} className="underline decoration-white/30 underline-offset-2">{name}</Link>
              </span>
            );
          })}
        </p>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Implement `src/app/library/[slug]/page.tsx`**

```tsx
import { allSlugs, noteBySlug } from "@/library/load";
import type { SourceNote } from "@/library/schema";
import { displayModeFor, withholdMatn } from "@/library/sources";
import { NoteHeader } from "@/components/library/NoteHeader";
import { NoteBody } from "@/components/library/NoteBody";
import { StatusNotice } from "@/components/library/StatusNotice";
import { MatnWithheld } from "@/components/library/MatnWithheld";

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export default async function LibraryNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = noteBySlug(slug);
  const kind = note.meta.type === "index" ? "rule" : note.meta.type;

  // Source notes whose Arabic is uncollated show structure, never the matn.
  let body = note;
  let withheld = 0;
  if (note.meta.type === "source" && displayModeFor(note.meta as SourceNote) === "withhold-matn") {
    const stripped = withholdMatn(note.body);
    withheld = stripped.withheldLines;
    body = { ...note, body: stripped.body };
  }

  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <NoteHeader note={note} />
      <StatusNotice status={note.meta.status} kind={kind} />
      {withheld > 0 && <MatnWithheld note={note.meta as SourceNote} lines={withheld} />}
      <NoteBody note={body} />
    </main>
  );
}
```

`max-w-3xl` rather than the house `max-w-2xl` is a deliberate deviation, approved in the
spec: these pages carry long-form prose and 1,504 table rows of Arabic-plus-transliteration.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/app/library/library-routes.test.tsx`
Expected: PASS — 3 tests

- [ ] **Step 6: Build, and confirm the page count moved**

Run: `npm run build`
Expected: success; the route table lists `/library/[slug]` with **101** pages, and total
static pages rise from 231 to 332 (the 4 index pages arrive in Task 10).

- [ ] **Step 7: Commit**

```bash
git add src/app/library src/components/library/NoteHeader.tsx
git commit -m "feat(library): 101 detail pages

taught_in becomes a real link into the course — all 37 distinct lesson ids on
in-scope notes resolve to live routes. The makhraj zone images in public/ have
existed all along with no note referencing them; the 29 letter pages use them now.

max-w-3xl rather than the house max-w-2xl: long-form prose and 1,504 table rows."
```

---

### Task 10: Landing and the three section indexes

**Files:**
- Create: `src/app/library/page.tsx`
- Create: `src/app/library/rules/page.tsx`
- Create: `src/app/library/letters/page.tsx`
- Create: `src/app/library/sources/page.tsx`
- Create: `src/components/library/NoteCard.tsx`
- Test: `src/app/library/library-index.test.tsx`

**Interfaces:**
- Consumes: Tasks 3, 7, 8
- Produces: routes `/library`, `/library/rules`, `/library/letters`, `/library/sources`

- [ ] **Step 1: Write the failing test**

Create `src/app/library/library-index.test.tsx`:

```tsx
import { describe, test, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import RulesPage from "./rules/page";
import LettersPage from "./letters/page";
import SourcesPage from "./sources/page";
import { allNotes } from "@/library/load";

describe("/library/rules", () => {
  test("lists all 59 rules and no non-rules", () => {
    render(<RulesPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(59);
  });

  test("groups by family and shows every family in use", () => {
    render(<RulesPage />);
    const families = new Set(allNotes().filter((n) => n.meta.type === "rule").map((n) => (n.meta as { family: string }).family));
    for (const f of families) expect(screen.getByRole("heading", { name: new RegExp(f, "i") })).toBeInTheDocument();
  });

  test("Sifat.md is NOT listed as a rule — it is type: index", () => {
    render(<RulesPage />);
    expect(screen.queryByRole("link", { name: /^Ṣifāt al-Ḥurūf/ })).toBeNull();
  });
});

describe("/library/letters", () => {
  test("lists all 29 letters", () => {
    render(<LettersPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(29);
  });
});

describe("/library/sources", () => {
  test("lists all 11 sources — the index is generated, not read from the manifest", () => {
    render(<SourcesPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(11);
  });

  test("the three sources missing from Source-Manifest.md are present anyway", () => {
    render(<SourcesPage />);
    for (const name of [/Shatibiyyah/i, /Sajawandi/i, /Nihayat/i]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/app/library/library-index.test.tsx`
Expected: FAIL — `Failed to resolve import "./rules/page"`

- [ ] **Step 3: Implement `src/components/library/NoteCard.tsx`**

```tsx
import Link from "next/link";
import type { LoadedNote } from "@/library/load";

/** One row in a section index. Status is shown here so arrival is never a surprise. */
export function NoteCard({ note }: { note: LoadedNote }) {
  const m = note.meta;
  const title = "english" in m ? m.english : "name" in m ? m.name : "title" in m && m.title ? String(m.title) : note.basename;
  return (
    <li className="glass rim-static rounded-2xl p-4">
      <Link href={`/library/${note.slug}`} className="block">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-white/90">{title}</span>
          {"arabic" in m && <span className="arabic text-xl text-white/80" dir="rtl" lang="ar">{m.arabic}</span>}
        </span>
        {m.status === "needs-review" && <span className="mt-1 block text-xs text-amber-200/80">Needs review</span>}
        {m.status === "draft" && <span className="mt-1 block text-xs text-white/45">Not yet reviewed</span>}
      </Link>
    </li>
  );
}
```

- [ ] **Step 4: Implement `src/app/library/rules/page.tsx`**

```tsx
import { allNotes } from "@/library/load";
import { RULE_FAMILIES } from "@/library/schema";
import { NoteCard } from "@/components/library/NoteCard";

export default function RulesPage() {
  const rules = allNotes().filter((n) => n.meta.type === "rule");
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-6 text-3xl font-bold">Tajweed rules</h1>
      {RULE_FAMILIES.map((family) => {
        const inFamily = rules.filter((n) => (n.meta as { family: string }).family === family);
        if (inFamily.length === 0) return null;
        return (
          <section key={family} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">{family}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {inFamily.map((n) => <NoteCard key={n.slug} note={n} />)}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
```

- [ ] **Step 5: Implement `src/app/library/letters/page.tsx`**

```tsx
import { allNotes } from "@/library/load";
import { MAKHRAJ_ZONES } from "@/library/schema";
import { NoteCard } from "@/components/library/NoteCard";

export default function LettersPage() {
  const letters = allNotes().filter((n) => n.meta.type === "letter");
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-6 text-3xl font-bold">The letters</h1>
      {MAKHRAJ_ZONES.map((zone) => {
        const inZone = letters.filter((n) => (n.meta as { makhraj_zone: string }).makhraj_zone === zone);
        if (inZone.length === 0) return null;
        return (
          <section key={zone} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">{zone}</h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {inZone.map((n) => <NoteCard key={n.slug} note={n} />)}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
```

- [ ] **Step 6: Implement `src/app/library/sources/page.tsx`**

```tsx
import { allNotes } from "@/library/load";
import { NoteCard } from "@/components/library/NoteCard";

/**
 * The index is generated FROM THE NOTES, never rendered from Source-Manifest.md.
 *
 * The manifest lists 7 of the 11 sources — Shatibiyyah, Sajawandi-Waqf and Nihayat are
 * absent — and it is `status: verified`, so nothing flags the omission. Rendering it as
 * the index would silently vanish three of the five classical sources.
 */
const GROUPS = [
  { label: "Classical", match: (f: string) => f.includes("/Classical/") },
  { label: "Data", match: (f: string) => f.includes("/Data/") },
  { label: "Video", match: (f: string) => f.includes("/Video/") },
  { label: "Manifest", match: (f: string) => f.endsWith("Source-Manifest.md") },
];

export default function SourcesPage() {
  const sources = allNotes().filter((n) => n.meta.type === "source");
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-6 text-3xl font-bold">Sources</h1>
      {GROUPS.map((g) => {
        const inGroup = sources.filter((n) => g.match(n.file));
        if (inGroup.length === 0) return null;
        return (
          <section key={g.label} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">{g.label}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {inGroup.map((n) => <NoteCard key={n.slug} note={n} />)}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
```

- [ ] **Step 7: Implement `src/app/library/page.tsx`**

```tsx
import Link from "next/link";
import { allNotes } from "@/library/load";

export default function LibraryPage() {
  const notes = allNotes();
  const count = (t: string) => notes.filter((n) => n.meta.type === t).length;
  const sections = [
    { href: "/library/rules", title: "Tajweed rules", n: count("rule"), blurb: "Every rule the course teaches, with its sources and worked examples." },
    { href: "/library/letters", title: "The letters", n: count("letter"), blurb: "All 29 letters — makhraj, sifat, and what each is confused with." },
    { href: "/library/sources", title: "Sources", n: count("source"), blurb: "The classical matns and data sets this course is built on." },
    { href: "/library/glossary", title: "Glossary", n: 1, blurb: "Uzbek · Arabic · English, in the forms this course uses." },
  ];

  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-2 text-3xl font-bold">Library</h1>
      <p className="mb-8 text-white/65">Everything the course is built on, in one place.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.href} className="glass rim-static rounded-2xl p-5">
            <Link href={s.href}>
              <h2 className="mb-1 font-semibold text-white/90">{s.title} <span className="text-white/45">({s.n})</span></h2>
              <p className="text-sm text-white/65">{s.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run src/app/library/`
Expected: PASS — 6 tests across both index files

- [ ] **Step 9: Commit**

```bash
git add src/app/library src/components/library/NoteCard.tsx
git commit -m "feat(library): landing and three faceted section indexes

The sources index is generated from the notes, not rendered from
Source-Manifest.md — the manifest lists 7 of 11 sources and is marked verified,
so using it would have silently dropped three classical sources. Regression-tested
by name."
```

---

### Task 11: Global navigation

**Files:**
- Create: `src/components/SiteNav.tsx`
- Modify: `src/app/layout.tsx:19-22`
- Modify: `src/app/globals.css` (skip-link styles, appended)
- Test: `src/components/SiteNav.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `<SiteNav />`, rendered once from the root layout

**Ownership note.** This edits `src/app/layout.tsx`, which is **outside** the file-ownership
envelope WISHLIST:38 grants the Library agent. The spec records the widening deliberately.
`/teach` is **not** added to the nav — WISHLIST wants that route gated, not discovered.

- [ ] **Step 1: Write the failing test**

Create `src/components/SiteNav.test.tsx`:

```tsx
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteNav } from "./SiteNav";

describe("SiteNav", () => {
  test("exposes a navigation landmark", () => {
    render(<SiteNav />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  test("links to the course, the library and credits", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "Course" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute("href", "/library");
    expect(screen.getByRole("link", { name: "Credits" })).toHaveAttribute("href", "/credits");
  });

  test("does NOT surface /teach — that route is meant to be gated, not discovered", () => {
    render(<SiteNav />);
    expect(screen.queryByRole("link", { name: /teach/i })).toBeNull();
  });

  test("offers a skip link as the first focusable element", () => {
    render(<SiteNav />);
    const skip = screen.getByRole("link", { name: /skip to content/i });
    expect(skip).toHaveAttribute("href", "#content");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/SiteNav.test.tsx`
Expected: FAIL — `Failed to resolve import "./SiteNav"`

- [ ] **Step 3: Implement `src/components/SiteNav.tsx`**

```tsx
import Link from "next/link";

/**
 * The app's first navigation.
 *
 * Until now there was no <nav> anywhere in src/: no header, no tab bar, no breadcrumb,
 * no skip link. Navigation was link-to-link and /teach was reachable from nowhere.
 *
 * /teach stays off this list on purpose — WISHLIST wants that route GATED once accounts
 * exist, so making 74 teacher notes discoverable now would move the wrong way.
 *
 * The print stylesheet (globals.css:270) already hides `nav`, so this drops out of
 * printed pages with no extra work.
 */
export function SiteNav() {
  return (
    <>
      <a href="#content" className="skip-link">Skip to content</a>
      <nav aria-label="Site" className="glass-strong sticky top-0 z-20 border-b border-white/10">
        <ul className="mx-auto flex max-w-3xl gap-5 px-6 py-3 text-sm">
          <li><Link href="/" className="text-white/75 hover:text-white">Course</Link></li>
          <li><Link href="/library" className="text-white/75 hover:text-white">Library</Link></li>
          <li className="ml-auto"><Link href="/credits" className="text-white/55 hover:text-white">Credits</Link></li>
        </ul>
      </nav>
    </>
  );
}
```

- [ ] **Step 4: Append skip-link styles to `src/app/globals.css`**

```css
/* ── Skip link — visible only when focused, for keyboard users ── */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 50;
  padding: 0.5rem 0.75rem;
  border-radius: 0 0 0.5rem 0;
  background: var(--glass-fill-strong);
  color: var(--foreground);
}
.skip-link:focus {
  left: 0;
}
```

- [ ] **Step 5: Wire it into `src/app/layout.tsx`**

Replace lines 19–22 — the `<div className="relative z-10">` block — with:

```tsx
        <div className="relative z-10">
          <SiteNav />
          <div id="content">{children}</div>
          <Credits />
        </div>
```

and add the import beside the existing `Credits` import at line 5:

```tsx
import { SiteNav } from "@/components/SiteNav";
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/components/SiteNav.test.tsx`
Expected: PASS — 4 tests

- [ ] **Step 7: Run the whole suite — the layout change touches every page test**

Run: `npm test`
Expected: PASS. Total must be **above 535**. If an existing page test breaks on the new
`#content` wrapper or the nav landmark, fix the **test's** query rather than removing the
nav — but read the failure first; a broken landmark query can indicate a real duplicate.

- [ ] **Step 8: Commit**

```bash
git add src/components/SiteNav.tsx src/components/SiteNav.test.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat(nav): the app's first navigation, and a skip link

There was no <nav> anywhere in src/ — no header, no breadcrumb, no skip link, and
/teach reachable from nowhere. A Library tab had nothing to attach to.

This edits layout.tsx, outside the ownership envelope WISHLIST:38 draws for this
work; the spec widens it deliberately rather than doing it quietly. /teach stays
off the nav — that route is meant to be gated, not discovered."
```

---

### Task 12: ADR-009, follow-ups, and the full gate run

**Files:**
- Modify: `ROADMAP.md` (ADR section — append ADR-009)
- Modify: `WISHLIST.md` (append follow-ups)

**Interfaces:**
- Consumes: everything
- Produces: nothing code-facing

- [ ] **Step 1: Append ADR-009 to `ROADMAP.md`**

Insert immediately after the ADR-007 block:

```markdown
### ADR-009 — The vault is a read surface for the app, in one direction only
**Decision.** The app may **read** `library/` at build time; it must never write to it.
Transcription from `library/` into `content/` stays a human act per ADR-003. The reader
resolves links by bare basename, the way `scripts/check-library.mjs:62` does.
**Context.** Until the Library reader, nothing in `src/` read the vault at all — ADR-003
described it as an authoring surface whose only consumers were a human transcriber and the
validator. That is no longer true, and an undocumented new edge between the app and the
vault is exactly the kind of coupling that rots.
**Consequences.** (+) 101 notes reach a student without a second copy being generated, so
there is no transcribed artifact to drift. (+) Sharing the gate's link semantics means the
app and the gate cannot disagree about what `[[Foo]]` means. (−) A malformed note now fails
the **build**, not just the gate — deliberate, and it throws with the filename. (−) The vault's
authoring conventions are now load-bearing for a user-facing surface, so a note's markdown
is no longer free to change shape arbitrarily.
```

- [ ] **Step 2: Append the follow-ups to `WISHLIST.md`**

Add under a new heading near the top of the capture inbox:

```markdown
## From building the Library reader — 2026-08-12

- **`Source-Manifest.md` lists 7 of the 11 sources** and is `status: verified`, so nothing
  flags the gap. Shatibiyyah, Sajawandi-Waqf and Nihayat are absent. The Library generates its
  sources index from the notes instead, so nothing is currently hidden — but the manifest is
  wrong and a future reader may trust it.
- **The classical matns are withheld pending collation.** `Muqaddimah-Jazariyyah` (144 Arabic
  lines) and `Tuhfat-al-Atfal` (95) are displayed as structure + translation only, per the
  manifest's own instruction. Collating them against printed critical editions would unlock
  239 lines of source text. Needs a qualified reader and printed editions.
- **All 29 letter notes are `status: draft`** while the letters are taught in live lessons.
  They render with a quiet "not yet reviewed" line. A content pass would clear it.
- **WISHLIST was stale in ~7 places, verified 2026-08-12.** The "there is no CI" section is
  false — `.github/workflows/ci.yml` has run five gates since `c038064`. The stated floor of
  423 tests is really **535 / 52 files**. Five Moderate/Minor findings from the PR #5 review
  are fixed (`check-library` abort, `publishedLessonIds` fail-open, `onRuleTap`, `role="text"`,
  `FamilySorter` shake key), as are both Important export findings. `TajweedText.tsx` is cited
  at the wrong path — it lives at `src/components/tajweed/`.
- **The seven tajweed drills are wired at `/practice/[id]` but not in-lesson.**
  `src/app/lesson/[id]/page.tsx:13` has no barrel import, so the registry is empty on that
  route and `src/games/deck.ts:4`'s slide type has no field to carry game ids.
```

- [ ] **Step 3: Run every gate, in CI's order**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run check:library && npm run build
```

Expected:
- lint: 0 errors, 3 pre-existing warnings
- tsc: silent
- test: PASS, total **above 535**
- check:library: `183 notes — 59 rules, 29 letters, 74 lessons · 0 errors, 3 warnings` — unchanged, because nothing wrote to the vault
- build: success, **336** static pages (231 + 105)

- [ ] **Step 4: Verify the pages actually render**

```bash
npx serve out -p 3000 &
sleep 2
for p in library library/rules library/letters library/sources library/ghunnah library/dad library/tuhfat-al-atfal library/glossary; do
  printf "%-32s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000/$p")"
done
curl -s http://localhost:3000/library/ghunnah | grep -c '\[\[' || echo "0 wikilink leaks"
kill %1
```

Expected: all 200; zero `[[` in the served HTML.

- [ ] **Step 5: Commit**

```bash
git add ROADMAP.md WISHLIST.md
git commit -m "docs: ADR-009, and what building the Library turned up

ADR-009 records the new edge — src/ now reads library/, which ADR-003 never
contemplated. Read-only, one direction, gate-compatible link semantics.

The follow-ups are things this work found and deliberately did not fix: a source
manifest that lists 7 of 11 sources while marked verified, 239 lines of matn
awaiting collation, and a WISHLIST stale in about seven places — including a
'there is no CI' section that has been false since c038064."
```

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: §1 module → T1/T3; §2 schema → T2;
§3 routing → T3/T9/T10; §4 data flow → T5/T6; §5 renderer + five traps → T4/T5/T6
(traps 1, 3 in T5; 2, 5 in T6; 4 in T5 `stripWikilink` and T9 `NoteHeader`); §6 status →
T7; §7 sources → T8/T10; §8 nav → T11; §9 visual → T9/T10/T11; §10 cross-linking → T9;
§11 error handling → T1/T3/T5; §12 tests → distributed, with the gate run in T12; ADR-009
and follow-ups → T12.

**Spec tests 1–10 → plan tests.** 1→T2; 2→T7 "THE INVARIANT"; 3→T5 "link-closed"; 4→T5
traps 1/3, T6 traps 2/5; 5→T4; 6→T3; 7→T7; 8→T8; 9→T9; 10→T9 `NoteHeader` renders
`.arabic`/`.quran` with `dir`/`lang`.

**One deliberate deviation from the spec.** The spec proposed `src/library/markdown/parse.ts`
and `render.tsx` as separate modules; `render.tsx` re-exports `lexNote` so tests and
components import from one place. Both files still exist with their stated responsibilities.

**Type consistency.** `LoadedNote` is defined in T3 and used unchanged in T7/T8/T9/T10.
`slugFor` (T3) is used in T5's resolver and T9's `NoteHeader`. `createHeadingSlugger` (T4)
is consumed by T5 and T6. `displayModeFor`/`withholdMatn` (T8) are consumed by T9.
`stripWikilink` (T5) is consumed by T9. `RULE_FAMILIES`/`MAKHRAJ_ZONES` are exported from
`schema.ts` (T2) and consumed by T10 — note they are exported from `schema.ts`, **not**
re-derived from `scripts/lib/rules.mjs`, which is an `.mjs` module `src/` does not import.

**Known risk, flagged rather than hidden.** T8's `withholdMatn` uses a line-shape heuristic
(leading character + 0.4 Arabic density) rather than a parse of verse structure, because the
four notes format their matn differently. Its tests assert both directions — enough lines
withheld, and not all Arabic stripped — so an over- or under-correction fails loudly. If the
threshold needs tuning during implementation, tune it and keep both assertions.
