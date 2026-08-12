# Library Categories — Implementation Plan (phase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganise the Library into six owner-chosen categories — **Alphabet · Tajweed · Video · Sources · Materials · Glossary** — adding two that do not exist yet: embedded video, and a materials shelf for PDFs and markdown posts kept in the repo.

**Architecture:** Extends the phase-1 reader (`src/library/**`). Two new build-time modules: `src/library/video.ts` parses the vault's existing video tables into a typed index, and `src/library/materials.ts` reads a new repo-root `materials/` folder. Everything stays static — `output: "export"` is unchanged and no server is introduced.

**Tech Stack:** Next 16.3.0 (App Router, `output: "export"`), React 19, TypeScript, zod 4, `marked`, Tailwind 4, vitest.

**Branch:** `feat/library` (continues phase 1, unmerged; 45 commits off `main` at `634495c`).
**Phase-1 plan:** `docs/superpowers/plans/2026-08-12-library-reader.md`

## What the owner asked for, and what this delivers

The owner's words: *"a library divided by categories… put alphabet into an Alphabet box… all the video materials attached to lessons in corresponding categories, youtube links embedded… should be able to upload PDFs, plain md files like posts… sources, basically whatever we teach… and the library itself must have a corresponding builder."*

**Delivered here:** the six categories, the video embedding, and a materials shelf whose content is added by committing files to the repo.

**Explicitly NOT delivered here — and the owner chose this split knowingly:** the *web builder* (upload/edit through a browser form). It cannot exist on a static export: there is no server, no API route and no writable filesystem at runtime. It needs the ADR-007 flip to `standalone` plus authentication, and it gets its own spec once accounts exist. A teacher adds materials by dropping a file in `materials/` and committing.

## Global Constraints

- **Never write to `library/` or `content/`.** ADR-003; the vault is human-authored and gate-checked. This plan *reads* `library/` and adds a new sibling folder for materials.
- **`output: "export"` stays.** No API routes, no middleware, no server actions. Everything resolves at build.
- **All five CI gates must pass**, in CI's order: `npm run lint` → `npx tsc --noEmit` → `npm test` → `npm run check:library` → `npm run build`. There is no local `typecheck` script.
- **Baseline that must not regress:** 645 tests / 64 files, lint 0 errors (3 pre-existing `no-img-element` warnings in `SlideDeck.tsx`), `check:library` 183 notes / 0 errors / 3 warnings, build 336 static pages.
- **No new runtime dependency.** `marked` and `yaml` are the only additions phase 1 made, and that stays true. **Do not add `@testing-library/jest-dom`** — this repo asserts with plain matchers (`toBeTruthy()`, `.getAttribute()`, `container.innerHTML`); it was added once in phase 1 and reverted.
- **Narrow `LibraryNote` on the discriminant (`m.type === "rule"`), never with `"key" in m`.** `SourceNoteSchema` is `.passthrough()`, giving `SourceNote` a string index signature that makes every `in` check true and collapses the union to `unknown`.
- **YouTube is embedded or linked, never re-hosted.** No downloading, no audio extraction, no proxying. Both catalogued channels are Standard YouTube License.
- **Embeds use `youtube-nocookie.com`, `loading="lazy"`, and a `title`.** This course teaches children; the privacy-preserving host is the correct default, not an optimisation.
- **`timeout` is NOT available on this macOS box.** Never wrap a command in it.
- **Run the full suite as `npm test`**, never bare `npx vitest run` — the script sets `NODE_OPTIONS=--no-experimental-webstorage`, without which three unrelated `ProgressClient` tests fail spuriously.
- Commits carry **no `Co-Authored-By` trailer**.

## File Structure

| File | Responsibility |
|---|---|
| `src/library/video.ts` | Parse the vault's video tables + lesson cues into a typed index |
| `src/library/materials.ts` | Read `materials/*.md` posts and list `public/materials/*.pdf` |
| `src/library/categories.ts` | The six categories: id, label, blurb, count, route |
| `src/components/library/VideoEmbed.tsx` | One privacy-preserving lazy iframe |
| `src/components/library/MaterialCard.tsx` | A post or PDF row |
| `src/app/library/page.tsx` | Landing — six boxes (modified) |
| `src/app/library/alphabet/page.tsx` | Renamed from `letters/` |
| `src/app/library/tajweed/page.tsx` | Renamed from `rules/` |
| `src/app/library/video/page.tsx` | Video index, grouped by topic |
| `src/app/library/materials/page.tsx` | Materials shelf |
| `src/app/library/materials/[slug]/page.tsx` | A markdown post |
| `materials/` | **New, repo root.** Markdown posts the teacher writes |
| `public/materials/` | **New.** PDFs, served directly by the static export |

**Why two folders.** A static export can only serve binary files from `public/`. Markdown posts are *rendered* at build so they live in `materials/`; PDFs are *served* so they live in `public/materials/`. Both are outside `library/` and `content/`, so ADR-003's gate is untouched and a teacher editing materials can never desynchronise a lesson note.

## Measured inventory — these numbers are asserted by tests

- **Muallimi-Soniy** (`library/01-Sources/Video/Muallimi-Soniy.md`): a 96-row table, columns `# | Uzbek title | English translation | \`videoId\` | duration | topic`. **The video id is wrapped in backticks** — a naive `| id |` match finds almost nothing. The `topic` column is what the Video page groups by.
- **Arabic101** (`library/01-Sources/Video/Arabic101.md`): a **playlist** table, `Playlist | ID | Videos`, holding **22 playlist ids** (`PL…`), not video ids. Render as playlist links/embeds, not as videos.
- **Lessons** (`content/lessons/*.json`): **182 `youtube-cue` entries resolving to 9 distinct videos**, all in Unit 1 (lessons 1-02 … 1-12). Each carries `videoId`, `startSeconds`, `title`.

---

### Task 1: The video index

**Files:**
- Create: `src/library/video.ts`
- Test: `src/library/video.test.ts`

**Interfaces:**
- Consumes: `src/library/paths.ts` (`VAULT_DIR`), `src/content/load.ts` (`allLessons`)
- Produces:
  - `interface CatalogueVideo { id: string; title: string; titleOriginal?: string; duration?: string; topic: string; channel: string }`
  - `interface Playlist { id: string; title: string; videoCount?: number; channel: string }`
  - `interface LessonVideo { id: string; title: string; startSeconds: number; lessonIds: string[] }`
  - `catalogueVideos(): CatalogueVideo[]`
  - `playlists(): Playlist[]`
  - `lessonVideos(): LessonVideo[]`
  - `videoTopics(): string[]` — distinct topics, sorted, for grouping

- [ ] **Step 1: Write the failing test**

Create `src/library/video.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import { catalogueVideos, playlists, lessonVideos, videoTopics } from "./video";

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

describe("catalogueVideos", () => {
  test("parses the Muallimi-Soniy table", () => {
    const v = catalogueVideos();
    expect(v.length).toBeGreaterThan(90);
  });

  test("every id is a plausible YouTube id", () => {
    for (const v of catalogueVideos()) expect(v.id, v.title).toMatch(YT_ID);
  });

  test("ids are unique", () => {
    const ids = catalogueVideos().map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every entry carries a title and a topic — the topic is what the page groups by", () => {
    for (const v of catalogueVideos()) {
      expect(v.title.length, v.id).toBeGreaterThan(0);
      expect(v.topic.length, v.id).toBeGreaterThan(0);
    }
  });

  test("the Uzbek original title is preserved verbatim, not translated away", () => {
    // The note states its own policy: Uzbek titles are copied byte-for-byte from the
    // channel payload; the English column is interpretation. Both must survive.
    const withOriginal = catalogueVideos().filter((v) => v.titleOriginal);
    expect(withOriginal.length).toBeGreaterThan(90);
    expect(withOriginal.some((v) => /[А-Яа-яЎўҚқҒғҲҳ]/.test(v.titleOriginal!))).toBe(true);
  });
});

describe("playlists", () => {
  test("parses the Arabic101 playlist table", () => {
    expect(playlists().length).toBeGreaterThanOrEqual(20);
  });

  test("every playlist id looks like a playlist, not a video", () => {
    for (const p of playlists()) expect(p.id, p.title).toMatch(/^PL[A-Za-z0-9_-]{16,}$/);
  });
});

describe("lessonVideos", () => {
  test("resolves the lesson cues to 9 distinct videos", () => {
    expect(lessonVideos()).toHaveLength(9);
  });

  test("each records every lesson that cues it", () => {
    for (const v of lessonVideos()) {
      expect(v.lessonIds.length, v.id).toBeGreaterThan(0);
      for (const id of v.lessonIds) expect(id).toMatch(/^\d-\d{2}$/);
    }
  });

  test("all cues sit in Unit 1 — if this changes, the Video page grouping needs revisiting", () => {
    const units = new Set(lessonVideos().flatMap((v) => v.lessonIds.map((l) => l[0])));
    expect([...units]).toEqual(["1"]);
  });
});

describe("videoTopics", () => {
  test("returns distinct sorted topics covering every catalogue video", () => {
      expect(topics.length).toBeGreaterThan(1);
    expect(topics).toEqual([...topics].sort());
    const covered = new Set(catalogueVideos().map((v) => v.topic));
    for (const t of covered) expect(topics).toContain(t);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/library/video.test.ts`
Expected: FAIL — `Failed to resolve import "./video"`

- [ ] **Step 3: Implement `src/library/video.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import { VAULT_DIR } from "./paths";
import { allLessons } from "@/content/load";

export interface CatalogueVideo {
  id: string;
  title: string;
  titleOriginal?: string;
  duration?: string;
  topic: string;
  channel: string;
}

export interface Playlist {
  id: string;
  title: string;
  videoCount?: number;
  channel: string;
}

export interface LessonVideo {
  id: string;
  title: string;
  startSeconds: number;
  lessonIds: string[];
}

const VIDEO_DIR = path.join(VAULT_DIR, "01-Sources", "Video");

/** Split one markdown table row into trimmed cells, honouring escaped pipes. */
function cells(row: string): string[] {
  return row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, "|").trim());
}

/** Strip the backticks the vault wraps ids in. */
const bare = (s: string) => s.replace(/^`|`$/g, "").trim();

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const PL_ID = /^PL[A-Za-z0-9_-]{16,}$/;

function readNote(file: string): string {
  const raw = fs.readFileSync(path.join(VIDEO_DIR, file), "utf8");
  const rest = raw.replace(/^---\r?\n/, "");
  const end = rest.search(/^---\r?$/m);
  return end === -1 ? rest : rest.slice(end).replace(/^---\r?\n?/, "");
}

/**
 * Videos catalogued in the vault's channel notes.
 *
 * Muallimi-Soniy's table is `# | Uzbek title | English | \`videoId\` | duration | topic`.
 * THE ID IS WRAPPED IN BACKTICKS — a naive `| id |` match finds almost none of them.
 * Rows are identified by having an id-shaped cell rather than by column position, so a
 * column being added upstream does not silently empty this list.
 *
 * The Uzbek title is kept as authored: the note records that Uzbek titles are copied
 * byte-for-byte from the channel payload while the English column is interpretation.
 * Showing only the translation would quietly assert the channel said something it did not.
 */
export function catalogueVideos(): CatalogueVideo[] {
  const out: CatalogueVideo[] = [];
  const body = readNote("Muallimi-Soniy.md");
  for (const line of body.split("\n")) {
    if (!line.startsWith("|")) continue;
    const c = cells(line);
    const idIndex = c.findIndex((x) => YT_ID.test(bare(x)));
    if (idIndex === -1) continue;
    out.push({
      id: bare(c[idIndex]),
      title: c[idIndex - 1] || c[idIndex - 2] || bare(c[idIndex]),
      titleOriginal: c[idIndex - 2] || undefined,
      duration: c[idIndex + 1] || undefined,
      topic: c[idIndex + 2] || "Uncategorised",
      channel: "Muallimi Soniy",
    });
  }
  return out;
}

/** Playlists catalogued in Arabic101 — that note lists playlists, not individual videos. */
export function playlists(): Playlist[] {
  const out: Playlist[] = [];
  const body = readNote("Arabic101.md");
  for (const line of body.split("\n")) {
    if (!line.startsWith("|")) continue;
    const c = cells(line);
    const idIndex = c.findIndex((x) => PL_ID.test(bare(x)));
    if (idIndex === -1) continue;
    const count = Number(c[idIndex + 1]);
    out.push({
      id: bare(c[idIndex]),
      title: c[idIndex - 1] || bare(c[idIndex]),
      videoCount: Number.isFinite(count) ? count : undefined,
      channel: "Arabic101",
    });
  }
  return out;
}

/** The videos lessons actually cue, folded to one entry per distinct video. */
export function lessonVideos(): LessonVideo[] {
  const byId = new Map<string, LessonVideo>();
  for (const lesson of allLessons()) {
    for (const slide of lesson.slides) {
      for (const item of collectAudio(slide)) {
        if (item.type !== "youtube-cue") continue;
        const existing = byId.get(item.videoId);
        if (existing) {
          if (!existing.lessonIds.includes(lesson.id)) existing.lessonIds.push(lesson.id);
        } else {
          byId.set(item.videoId, {
            id: item.videoId,
            title: item.title,
            startSeconds: item.startSeconds,
            lessonIds: [lesson.id],
          });
        }
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Every `audio` object reachable from a slide, whatever its shape. */
function collectAudio(node: unknown): { type: string; videoId: string; startSeconds: number; title: string }[] {
  const found: { type: string; videoId: string; startSeconds: number; title: string }[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    if (o.type === "youtube-cue" && typeof o.videoId === "string") {
      found.push({
        type: "youtube-cue",
        videoId: o.videoId,
        startSeconds: typeof o.startSeconds === "number" ? o.startSeconds : 0,
        title: typeof o.title === "string" ? o.title : o.videoId,
      });
    }
    Object.values(o).forEach(walk);
  };
  walk(node);
  return found;
}

export function videoTopics(): string[] {
  return [...new Set(catalogueVideos().map((v) => v.topic))].sort();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/library/video.test.ts`
Expected: PASS — 11 tests.

If `catalogueVideos()` comes back short of 90, the table's column order changed — fix the index arithmetic, not the threshold, and report it.

- [ ] **Step 5: Typecheck and commit**

Run: `npx tsc --noEmit && npm test`

```bash
git add src/library/video.ts src/library/video.test.ts
git commit -m "feat(library): a typed index over the vault's video catalogue

96 videos with topic metadata from Muallimi-Soniy, 22 playlists from Arabic101,
and the 9 distinct videos the Unit 1 lessons actually cue.

Rows are found by having an id-shaped cell rather than by column position, and
the id is unwrapped from the backticks the vault writes it in — a naive '| id |'
match finds one row out of ninety-six. The Uzbek title is kept alongside the
English: the note records that Uzbek titles are byte-for-byte from the channel
while the English column is interpretation, so showing only the translation
would assert something the channel never said."
```

---

### Task 2: The materials shelf

**Files:**
- Create: `src/library/materials.ts`
- Create: `materials/README.md` (explains the folder to a teacher)
- Create: `materials/welcome-to-the-library.md` (one real seed post, so the shelf is not empty)
- Create: `public/materials/.gitkeep`
- Test: `src/library/materials.test.ts`

**Interfaces:**
- Produces:
  - `interface Post { slug: string; title: string; date?: string; summary?: string; body: string; file: string }`
  - `interface Attachment { slug: string; title: string; href: string; bytes: number }`
  - `allPosts(): Post[]`, `postBySlug(slug): Post`, `allPostSlugs(): string[]`
  - `allAttachments(): Attachment[]`

- [ ] **Step 1: Write the failing test**

Create `src/library/materials.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import { allPosts, postBySlug, allPostSlugs, allAttachments } from "./materials";

describe("allPosts", () => {
  test("reads the seed post", () => {
    expect(allPosts().length).toBeGreaterThanOrEqual(1);
  });

  test("README.md is not published as a post", () => {
    expect(allPostSlugs()).not.toContain("readme");
  });

  test("every post has a title and a non-empty body", () => {
    for (const p of allPosts()) {
      expect(p.title.length, p.file).toBeGreaterThan(0);
      expect(p.body.trim().length, p.file).toBeGreaterThan(0);
    }
  });

  test("slugs are unique and URL-safe", () => {
    const s = allPostSlugs();
    expect(new Set(s).size).toBe(s.length);
    for (const x of s) expect(x).toMatch(/^[a-z0-9._-]+$/);
  });

  test("postBySlug round-trips and throws loudly on an unknown slug", () => {
    const first = allPosts()[0];
    expect(postBySlug(first.slug).title).toBe(first.title);
    expect(() => postBySlug("no-such-post")).toThrow(/unknown material/);
  });
});

describe("allAttachments", () => {
  test("returns an array and never throws when the folder is empty", () => {
    expect(Array.isArray(allAttachments())).toBe(true);
  });

  test("every attachment points inside /materials/ and reports a size", () => {
    for (const a of allAttachments()) {
      expect(a.href.startsWith("/materials/"), a.slug).toBe(true);
      expect(a.bytes, a.slug).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/library/materials.test.ts`
Expected: FAIL — `Failed to resolve import "./materials"`

- [ ] **Step 3: Create the folders and the seed content**

`materials/README.md`:

```markdown
# Materials

Anything you want on the Library's **Materials** shelf goes here.

- **A written post** — add a `.md` file in this folder. Give it a `# Heading` on the
  first line; that becomes its title. Optional `date:` and `summary:` frontmatter show
  on the shelf.
- **A PDF or other file to download** — put it in `public/materials/` instead. A static
  site can only serve binary files from `public/`, so that is where they must live.

This folder is NOT the vault. Nothing here is gate-checked by `check:library`, and
editing it cannot desynchronise a lesson from its note — that is the whole point of
keeping it separate from `library/`.

`README.md` itself is skipped and never published.
```

`materials/welcome-to-the-library.md`:

```markdown
---
date: 2026-08-12
summary: What lives in the Library, and how each part is sourced.
---

# Welcome to the Library

Everything the course is built on, in one place: the **alphabet**, the **tajweed
rules**, the **video** lessons, the **sources** those rules are checked against, and
whatever extra **materials** are added here over time.

Two things are worth knowing as you read.

**The rules cite their sources.** Every rule note names the classical work it comes
from, and where a rule is not yet verified against one, the page says so plainly
rather than presenting it as settled.

**Some source texts are deliberately not shown.** Several classical matns in this
vault are transcriptions that have not yet been collated against a printed critical
edition. A matn is memorised from the page, so an uncollated one is not safe to learn
from — those pages show the structure and the translation, and link to the original.
```

`public/materials/.gitkeep` — empty file.

- [ ] **Step 4: Implement `src/library/materials.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import { parseNote } from "./frontmatter";

const POSTS_DIR = path.join(process.cwd(), "materials");
const FILES_DIR = path.join(process.cwd(), "public", "materials");

export interface Post {
  slug: string;
  title: string;
  date?: string;
  summary?: string;
  body: string;
  file: string;
}

export interface Attachment {
  slug: string;
  title: string;
  href: string;
  bytes: number;
}

/** `README.md` documents the folder for a teacher; it is not content. */
const SKIP = new Set(["readme"]);

function listMarkdown(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."))
    .sort();
}

function loadPost(file: string): Post {
  const full = path.join(POSTS_DIR, file);
  try {
    const raw = fs.readFileSync(full, "utf8");
    // Frontmatter is OPTIONAL here, unlike the vault: a teacher writing a post should
    // not have to remember a YAML header. Fall back to the whole file as the body.
    const { data, body } = raw.startsWith("---")
      ? parseNote(raw)
      : { data: {} as Record<string, unknown>, body: raw };
    const heading = /^#\s+(.+)$/m.exec(body);
    const slug = path.basename(file, ".md").toLowerCase();
    return {
      slug,
      title: heading ? heading[1].trim() : slug.replace(/[-_]/g, " "),
      date: typeof data.date === "string" ? data.date : undefined,
      summary: typeof data.summary === "string" ? data.summary : undefined,
      body,
      file: full,
    };
  } catch (err) {
    throw new Error(`Invalid material ${full}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

let cache: Post[] | null = null;

export function allPosts(): Post[] {
  if (!cache) {
    cache = listMarkdown(POSTS_DIR)
      .map(loadPost)
      .filter((p) => !SKIP.has(p.slug))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.slug.localeCompare(b.slug));
  }
  return cache;
}

export function allPostSlugs(): string[] {
  return allPosts().map((p) => p.slug);
}

export function postBySlug(slug: string): Post {
  const found = allPosts().find((p) => p.slug === slug);
  if (!found) throw new Error(`unknown material: ${slug}`);
  return found;
}

/**
 * Downloadable files. These live in `public/materials/` because a static export can
 * only serve binary assets from `public/` — the path is a constraint, not a choice.
 */
export function allAttachments(): Attachment[] {
  if (!fs.existsSync(FILES_DIR)) return [];
  return fs
    .readdirSync(FILES_DIR)
    .filter((f) => !f.startsWith("."))
    .sort()
    .map((f) => ({
      slug: f.toLowerCase(),
      title: path.basename(f, path.extname(f)).replace(/[-_]/g, " "),
      href: `/materials/${f}`,
      bytes: fs.statSync(path.join(FILES_DIR, f)).size,
    }));
}
```

- [ ] **Step 5: Run the tests, typecheck, commit**

Run: `npx vitest run src/library/materials.test.ts` → 7 tests pass. Then `npx tsc --noEmit && npm test`.

```bash
git add src/library/materials.ts src/library/materials.test.ts materials/ public/materials/.gitkeep
git commit -m "feat(library): a materials shelf fed from the repo

Markdown posts in materials/, downloadable files in public/materials/ — two
folders because a static export can only serve binary assets from public/.

Frontmatter is optional here, unlike the vault: a teacher writing a post should
not have to remember a YAML header, so the first '# Heading' is the title and a
bare .md file works. Neither folder is gate-checked, and neither can
desynchronise a lesson from its note, which is why they sit outside library/."
```

---

### Task 3: Six categories, and the two renames

**Files:**
- Create: `src/library/categories.ts`
- Test: `src/library/categories.test.ts`
- Modify: `src/app/library/page.tsx`
- Rename: `src/app/library/letters/` → `src/app/library/alphabet/`
- Rename: `src/app/library/rules/` → `src/app/library/tajweed/`
- Modify: `src/library/routes.ts` (`RESERVED_SEGMENTS`)
- Modify: `src/app/library/library-index.test.tsx` (import paths)

**Interfaces:**
- Produces: `interface Category { id: string; label: string; blurb: string; href: string; count: number }`, `categories(): Category[]`

- [ ] **Step 1: Write the failing test**

Create `src/library/categories.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import { categories } from "./categories";
import { allNotes } from "./load";

describe("categories", () => {
  test("there are exactly six, in the owner's chosen order", () => {
    expect(categories().map((c) => c.id)).toEqual([
      "alphabet", "tajweed", "video", "sources", "materials", "glossary",
    ]);
  });

  test("every category has a label, a blurb and a route", () => {
    for (const c of categories()) {
      expect(c.label.length, c.id).toBeGreaterThan(0);
      expect(c.blurb.length, c.id).toBeGreaterThan(0);
      expect(c.href.startsWith("/library"), c.id).toBe(true);
    }
  });

  test("the note-backed categories account for all 101 vault notes", () => {
    // Alphabet + Tajweed + Sources + Glossary cover every in-scope note. Video and
    // Materials are not note-backed, so they are excluded from this sum — but if the
    // four that ARE note-backed stop summing to 101, a note has become unreachable.
    const byId = Object.fromEntries(categories().map((c) => [c.id, c.count]));
    const noteBacked = byId.alphabet + byId.tajweed + byId.sources + byId.glossary;
    expect(noteBacked).toBe(allNotes().length);
  });

  test("counts match the vault", () => {
    const byId = Object.fromEntries(categories().map((c) => [c.id, c.count]));
    expect(byId.alphabet).toBe(29);
    expect(byId.tajweed).toBe(59);
    expect(byId.sources).toBe(11);
    expect(byId.glossary).toBe(2);
  });

  test("video and materials report real counts, not placeholders", () => {
    const byId = Object.fromEntries(categories().map((c) => [c.id, c.count]));
    expect(byId.video).toBeGreaterThan(90);
    expect(byId.materials).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run src/library/categories.test.ts`
Expected: FAIL — cannot resolve `./categories`.

- [ ] **Step 3: Implement `src/library/categories.ts`**

```ts
import { allNotes } from "./load";
import { catalogueVideos, lessonVideos, playlists } from "./video";
import { allPosts, allAttachments } from "./materials";

export interface Category {
  id: string;
  label: string;
  blurb: string;
  href: string;
  count: number;
}

/**
 * The Library's six boxes, in the order the owner chose.
 *
 * Alphabet and Tajweed are the two halves of what used to be one "notes" view;
 * Video and Materials are new and are not note-backed. `categories.test.ts` asserts
 * that the four note-backed boxes still sum to every in-scope note, so a note cannot
 * silently become unreachable from the landing page.
 */
export function categories(): Category[] {
  const notes = allNotes();
  const count = (t: string) => notes.filter((n) => n.meta.type === t).length;

  return [
    {
      id: "alphabet",
      label: "Alphabet",
      blurb: "All 29 letters — makhraj, sifat, and what each is confused with.",
      href: "/library/alphabet",
      count: count("letter"),
    },
    {
      id: "tajweed",
      label: "Tajweed rules",
      blurb: "Every rule the course teaches, with its sources and worked examples.",
      href: "/library/tajweed",
      count: count("rule"),
    },
    {
      id: "video",
      label: "Video",
      blurb: "Lesson videos and the catalogued channels, grouped by topic.",
      href: "/library/video",
      count: catalogueVideos().length + lessonVideos().length + playlists().length,
    },
    {
      id: "sources",
      label: "Sources",
      blurb: "The classical matns and data sets this course is built on.",
      href: "/library/sources",
      count: count("source"),
    },
    {
      id: "materials",
      label: "Materials",
      blurb: "Handouts, posts and downloads added alongside the course.",
      href: "/library/materials",
      count: allPosts().length + allAttachments().length,
    },
    {
      id: "glossary",
      label: "Glossary & reference",
      blurb: "Uzbek · Arabic · English terms, plus other reference notes.",
      href: "/library/glossary",
      count: count("index"),
    },
  ];
}
```

- [ ] **Step 4: Do the two renames**

```bash
git mv src/app/library/letters src/app/library/alphabet
git mv src/app/library/rules src/app/library/tajweed
```

Update `src/library/routes.ts`:

```ts
/**
 * Section landing segments. A note basename that lowercased to one of these would
 * shadow its index page, so `allSlugs()` is asserted against this list.
 */
export const RESERVED_SEGMENTS = ["alphabet", "tajweed", "video", "sources", "materials"] as const;
```

Note `glossary` is deliberately NOT reserved: the Glossary card points at
`/library/glossary`, which IS a note detail page (`Glossary.md`). Reserving it would
make the slug-safety test fail against a note that legitimately owns that route.

Update the imports in `src/app/library/library-index.test.tsx` to the new paths, and
its describe names (`/library/rules` → `/library/tajweed`, `/library/letters` →
`/library/alphabet`).

- [ ] **Step 5: Rewrite the landing page**

`src/app/library/page.tsx`:

```tsx
import Link from "next/link";
import { categories } from "@/library/categories";

export default function LibraryPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-2 text-3xl font-bold">Library</h1>
      <p className="mb-8 text-white/65">Everything the course is built on, in one place.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {categories().map((c) => (
          <li key={c.id} className="glass rim-static rounded-2xl p-5">
            <Link href={c.href}>
              <h2 className="mb-1 font-semibold text-white/90">
                {c.label} <span className="text-white/45">({c.count})</span>
              </h2>
              <p className="text-sm text-white/65">{c.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 6: Run everything, then commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: build still succeeds; `/library/alphabet` and `/library/tajweed` replace the old routes; page total unchanged at 336 until Tasks 4–5 add theirs.

```bash
git add -A
git commit -m "feat(library): six categories, with the alphabet in its own box

Alphabet and Tajweed replace letters/ and rules/ as routes. Video and Materials
are new boxes and are not note-backed, so the category test asserts only that the
four note-backed boxes still sum to every in-scope note — a note going missing
from the landing page fails the gate.

glossary is deliberately not a reserved segment: /library/glossary is a real note
detail page, and reserving it would fail the slug-safety guard against a note
that legitimately owns that route."
```

---

### Task 4: The Video category

**Files:**
- Create: `src/components/library/VideoEmbed.tsx`
- Create: `src/app/library/video/page.tsx`
- Test: `src/app/library/video/video-page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/library/video/video-page.test.tsx`:

```tsx
import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import VideoPage from "./page";
import { VideoEmbed } from "@/components/library/VideoEmbed";
import { catalogueVideos, lessonVideos } from "@/library/video";

describe("VideoEmbed", () => {
  test("uses the privacy-preserving host — this course teaches children", () => {
    const { container } = render(<VideoEmbed id="ObYKEtceQbU" title="test" />);
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toContain("youtube-nocookie.com");
  });

  test("lazy-loads and carries an accessible title", () => {
    const { container } = render(<VideoEmbed id="ObYKEtceQbU" title="Alif" />);
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("loading")).toBe("lazy");
    expect(iframe?.getAttribute("title")).toBe("Alif");
  });

  test("honours a start time when one is given", () => {
    const { container } = render(<VideoEmbed id="ObYKEtceQbU" title="t" startSeconds={42} />);
    expect(container.querySelector("iframe")?.getAttribute("src")).toContain("start=42");
  });

  test("never embeds a re-hosted file — the src is always youtube", () => {
    const { container } = render(<VideoEmbed id="ObYKEtceQbU" title="t" />);
    const src = container.querySelector("iframe")?.getAttribute("src") ?? "";
    expect(src.startsWith("https://www.youtube-nocookie.com/embed/")).toBe(true);
  });
});

describe("/library/video", () => {
  test("renders the lesson videos and the catalogue", () => {
    const { container } = render(<VideoPage />);
    const iframes = container.querySelectorAll("iframe");
    expect(iframes.length).toBeGreaterThanOrEqual(lessonVideos().length);
  });

  test("lists the whole catalogue in the channel's own order, with each topic shown", () => {
    // Deliberately NOT grouped: 90 distinct topics across 96 videos, 86 of them unique.
    const { container } = render(<VideoPage />);
    const text = container.textContent ?? "";
    const vids = catalogueVideos();
    expect(vids.length).toBeGreaterThan(90);
    for (const v of vids.slice(0, 5)) expect(text).toContain(v.topic);
    // order preserved: video 1's title appears before video 2's
    expect(text.indexOf(vids[0].title)).toBeLessThan(text.indexOf(vids[1].title));
  });

  test("every lesson video links back to a lesson that cues it", () => {
    const { container } = render(<VideoPage />);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.some((h) => h.startsWith("/lesson/"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run src/app/library/video/video-page.test.tsx`
Expected: FAIL — cannot resolve `./page`.

- [ ] **Step 3: Implement `src/components/library/VideoEmbed.tsx`**

```tsx
/**
 * One embedded video.
 *
 * `youtube-nocookie.com` is deliberate, not an optimisation: this course teaches
 * children, and the standard host sets tracking cookies before anyone presses play.
 *
 * Embedding is the ONLY permitted use of these channels — both are Standard YouTube
 * License. Never download, extract audio from, proxy or re-host any of them.
 */
export function VideoEmbed({
  id,
  title,
  startSeconds,
}: {
  id: string;
  title: string;
  startSeconds?: number;
}) {
  const src =
    `https://www.youtube-nocookie.com/embed/${id}` +
    (startSeconds ? `?start=${startSeconds}` : "");
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        className="h-full w-full"
      />
    </div>
  );
}
```

- [ ] **Step 4: Implement `src/app/library/video/page.tsx`**

```tsx
import Link from "next/link";
import { catalogueVideos, lessonVideos, playlists } from "@/library/video";
import { VideoEmbed } from "@/components/library/VideoEmbed";

export default function VideoPage() {
  const lessons = lessonVideos();
  const catalogue = catalogueVideos();

  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-2 text-3xl font-bold">Video</h1>
      <p className="mb-8 text-white/65">
        Videos are embedded from their channels, never re-hosted.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">
          Used in lessons
        </h2>
        <ul className="grid gap-5">
          {lessons.map((v) => (
            <li key={v.id} className="glass rounded-2xl p-4">
              <VideoEmbed id={v.id} title={v.title} startSeconds={v.startSeconds} />
              <p className="mt-3 font-semibold text-white/90">{v.title}</p>
              <p className="mt-1 text-sm text-white/60">
                Cued in{" "}
                {v.lessonIds.map((id, i) => (
                  <span key={id}>
                    {i > 0 && ", "}
                    <Link href={`/lesson/${id}`} className="underline decoration-white/30 underline-offset-2">
                      lesson {id}
                    </Link>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/*
        NOT grouped by topic, and that is a measured decision rather than a shortcut.
        The 96 topics are per-video subtitles, not categories: there are 90 distinct
        values, 86 of which appear exactly once, and normalising them still leaves 65
        buckets with 50 singletons. Grouping would render ninety sections of one video.

        Matching topics to the 59 rule notes was also tried and rejected: it covers only
        27 of 96, and it is confidently WRONG on some — "Idgham bila ghunnah" fuzzy-matches
        the `ghunnah` note rather than its own rule. A wrong association is worse than
        none in a course whose whole discipline is not asserting what it cannot verify.

        What this catalogue actually is: a numbered 96-part course. So it is shown in the
        channel's own order, with the topic as a subtitle. Linking videos to rules needs a
        hand-curated mapping in the vault, which this feature must not author — filed.
      */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">
          Muallimi Soniy — the full course, in order
        </h2>
        <ul className="grid gap-3">
          {catalogue.map((v, i) => (
            <li key={v.id} className="glass rounded-2xl p-4">
              <a
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white/90 underline decoration-white/30 underline-offset-2"
              >
                <span className="text-white/45">{i + 1}.</span> {v.title}
              </a>
              <p className="mt-1 text-sm text-white/60">{v.topic}</p>
              {v.titleOriginal && v.titleOriginal !== v.title && (
                <p className="mt-1 text-sm text-white/45" lang="uz">{v.titleOriginal}</p>
              )}
              <p className="mt-1 text-xs text-white/45">
                {v.channel}
                {v.duration ? ` · ${v.duration}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Playlists</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {playlists().map((p) => (
            <li key={p.id} className="glass rounded-2xl p-4">
              <a
                href={`https://www.youtube.com/playlist?list=${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white/90 underline decoration-white/30 underline-offset-2"
              >
                {p.title}
              </a>
              <p className="mt-1 text-xs text-white/45">
                {p.channel}
                {p.videoCount ? ` · ${p.videoCount} videos` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

Only the nine lesson videos are embedded inline; the 96-video catalogue is listed and
linked. Embedding ninety-six iframes on one page would make it unusable regardless of
lazy-loading, and the catalogue's value is discovery, not playback in place.

- [ ] **Step 5: Run tests, gates, commit**

```bash
git add src/components/library/VideoEmbed.tsx src/app/library/video
git commit -m "feat(library): the Video category

The nine videos lessons actually cue are embedded inline with their start times
and links back to every lesson that cues them; the 96-video catalogue is grouped
by the topic column the vault already records, and the 22 Arabic101 playlists are
linked.

youtube-nocookie.com throughout, lazy-loaded, each iframe titled. That host is
deliberate rather than an optimisation: this course teaches children and the
standard embed sets tracking cookies before anyone presses play. Embedding is
also the only permitted use — both channels are Standard YouTube License."
```

---

### Task 5: The Materials category

**Files:**
- Create: `src/app/library/materials/page.tsx`
- Create: `src/app/library/materials/[slug]/page.tsx`
- Test: `src/app/library/materials/materials-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import MaterialsPage from "./page";
import { generateStaticParams } from "./[slug]/page";
import { allPostSlugs, allPosts } from "@/library/materials";

describe("/library/materials", () => {
  test("lists every post", () => {
    const { container } = render(<MaterialsPage />);
    const text = container.textContent ?? "";
    for (const p of allPosts()) expect(text).toContain(p.title);
  });

  test("renders without an attachment present — the folder starts empty", () => {
    expect(() => render(<MaterialsPage />)).not.toThrow();
  });
});

describe("/library/materials/[slug]", () => {
  test("generates one page per post", () => {
    expect(generateStaticParams().map((p) => p.slug).sort()).toEqual([...allPostSlugs()].sort());
  });
});
```

- [ ] **Step 2: Run it, confirm it fails.**

- [ ] **Step 3: Implement the shelf** — `src/app/library/materials/page.tsx`:

```tsx
import Link from "next/link";
import { allPosts, allAttachments } from "@/library/materials";

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function MaterialsPage() {
  const posts = allPosts();
  const files = allAttachments();

  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-2 text-3xl font-bold">Materials</h1>
      <p className="mb-8 text-white/65">Handouts, posts and downloads added alongside the course.</p>

      {posts.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Posts</h2>
          <ul className="grid gap-3">
            {posts.map((p) => (
              <li key={p.slug} className="glass rim-static rounded-2xl p-4">
                <Link href={`/library/materials/${p.slug}`}>
                  <span className="font-semibold text-white/90">{p.title}</span>
                  {p.date && <span className="ml-2 text-xs text-white/45">{p.date}</span>}
                  {p.summary && <p className="mt-1 text-sm text-white/65">{p.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Downloads</h2>
        {files.length === 0 ? (
          <p className="text-sm text-white/50">
            Nothing here yet. Files added to <code className="rounded bg-white/10 px-1">public/materials/</code> appear on this shelf.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {files.map((f) => (
              <li key={f.slug} className="glass rounded-2xl p-4">
                <a href={f.href} className="font-semibold text-white/90 underline decoration-white/30 underline-offset-2">
                  {f.title}
                </a>
                <p className="mt-1 text-xs text-white/45">{kb(f.bytes)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Implement the post page** — `src/app/library/materials/[slug]/page.tsx`:

```tsx
import { allPostSlugs, postBySlug } from "@/library/materials";
import { lexNote, renderTokens } from "@/library/markdown/render";
import { createHeadingSlugger } from "@/library/markdown/slug";

export function generateStaticParams() {
  return allPostSlugs().map((slug) => ({ slug }));
}

export default async function MaterialPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      {post.date && <p className="mb-2 text-xs uppercase tracking-wide text-white/45">{post.date}</p>}
      <div className="library-prose">{renderTokens(lexNote(post.body), createHeadingSlugger())}</div>
    </main>
  );
}
```

The post's own `# Heading` renders as its title, so no separate header is emitted —
this deliberately avoids the duplicate-`h1` issue the note pages have.

- [ ] **Step 5: Run gates and commit**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: build rises to **338** pages (336 + `/library/video` + `/library/materials`), plus one per post — with the single seed post, **339**.

```bash
git add src/app/library/materials
git commit -m "feat(library): the Materials category

Posts render from materials/*.md and downloads from public/materials/. The shelf
states plainly where to put a file when the downloads folder is empty, so the
teacher does not have to read the plan to use it.

A post's own '# Heading' is its title and no separate header is emitted, which
avoids the duplicate-h1 the vault note pages carry."
```

---

### Task 6: Gates, docs and the honest gap

**Files:**
- Modify: `ROADMAP.md` (extend ADR-009)
- Modify: `WISHLIST.md`

- [ ] **Step 1: Extend ADR-009 in `ROADMAP.md`**

Append to the ADR-009 consequences:

```markdown
**Amended 2026-08-12 (phase 2).** The Library also reads two folders outside the vault:
`materials/` for markdown posts and `public/materials/` for downloadable files. They sit
outside `library/` and `content/` deliberately — nothing there is gate-checked by
`check:library`, and editing them cannot desynchronise a lesson from its note. Adding a
material is a git commit, not a web upload: **a browser-based builder cannot exist while
`output: "export"` stands**, since a static export has no server, no API route and no
writable filesystem at runtime. That remains gated behind the ADR-007 flip.
```

- [ ] **Step 2: Add the follow-up to `WISHLIST.md`**

```markdown
### The Library builder — 2026-08-12

The owner asked for a **web builder**: upload PDFs and write posts through the browser.
Phase 2 delivered the Materials shelf fed from the repo instead, because **upload cannot
work on a static export** — no server, no API route, no writable filesystem at runtime.

What the builder needs, in order:
1. **The ADR-007 flip** to `output: "standalone"`. Proven, three lines, but it gives up
   free static hosting.
2. **Authentication**, or anyone on the internet can upload to the course. This is Idea 1,
   and per its brief it carries GDPR-K/COPPA obligations because the course teaches
   children — parent-held accounts, minimal fields, a deletion path.
3. **Storage and a write path**, plus a decision about whether an upload becomes a git
   commit (keeping the repo the source of record) or a database row (diverging from it).

Until then a teacher adds a material by dropping a file in `materials/` or
`public/materials/` and committing. That is the whole workflow.
```

- [ ] **Step 3: Run all five gates in CI order**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run check:library && npm run build
```

Expected: lint 0 errors + 3 pre-existing warnings; tsc silent; tests above 645;
`check:library` **183 notes, 0 errors, 3 warnings — unchanged, because nothing here
writes to the vault**; build 339 static pages.

- [ ] **Step 4: Serve and verify the six categories render**

```bash
npx serve out -p 4321 --no-clipboard & SRV=$!
sleep 3
for p in library library/alphabet library/tajweed library/video library/sources library/materials library/glossary; do
  printf "%-28s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:4321/$p")"
done
kill $SRV
```

All seven must return **200**.

- [ ] **Step 5: Commit**

```bash
git add ROADMAP.md WISHLIST.md
git commit -m "docs: record why the Library builder is not in phase 2

ADR-009 amended for the two materials folders and why they sit outside the vault.
WISHLIST records what the builder actually needs — the ADR-007 flip, then auth
with its GDPR-K obligations, then storage — so the deferral is a stated decision
rather than a silent gap."
```

## Self-Review

**Owner's asks → tasks.** Categories → T3. Alphabet in its own box → T3. Video embedded, in categories → T1 + T4. PDFs and markdown posts → T2 + T5. Sources and extra materials in one place → T3's landing. The **builder** → explicitly NOT built; T6 records why and what it needs.

**Type consistency.** `CatalogueVideo`/`Playlist`/`LessonVideo` (T1) are consumed by T3's counts and T4's page. `Post`/`Attachment` (T2) by T3 and T5. `Category` (T3) by the landing page only.

**Known risk, stated rather than hidden.** T1 parses markdown tables the vault authors by hand. Rows are located by *having an id-shaped cell* rather than by column index, so an added column shifts the title/topic offsets but does not empty the list — and the tests assert non-empty titles and topics, so a shift fails loudly rather than rendering blanks.
