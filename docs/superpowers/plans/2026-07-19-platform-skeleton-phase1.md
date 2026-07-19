# Tajweed Course Platform Skeleton + Phase 1 Content — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the deployed Next.js course platform with all 12 Phase 1 lessons and the Checkpoint 1 kit, so live teaching can start.

**Architecture:** Static-export Next.js App Router site. All course content lives in validated JSON files (`content/`), parsed at build time by a Zod schema whose core is the three-tier `AudioSource` union from `docs/research/addenda/gap-1.md`. React components render lessons as fullscreen slide decks, practice pages as tap-to-hear drill grids with print CSS, and a `/teach` route exposes teacher scripts. Progress is localStorage-only (no backend, no accounts — spec v1).

**Tech Stack:** Next.js 15 (App Router, `output: 'export'`), TypeScript, Tailwind CSS v4, Zod, Vitest + @testing-library/react (jsdom), @fontsource/amiri, Vercel.

## Global Constraints

- **No backend, no accounts, no database** — progress in localStorage only (spec: "No accounts, no backend, no database in v1").
- **Quran text is NEVER hand-typed** (spec cross-cutting rule). Phase 1 contains *no* Quran text — only isolated letters/syllables, which are not Quran quotations and may be typed directly (per phase-1-letters.md's own provenance note).
- **Audio three-tier rule** (gap-1 addendum): every drill item declares `audio` as exactly one of `qari-clip` / `youtube-cue` / `teacher-voice`. The tap affordance is never hidden and never a silent no-op.
- **YouTube content is embedded/linked only, never downloaded/re-hosted** (Standard YouTube License — research: arabic101.md, uzbek-channel.md).
- **Arabic display font: Amiri** (SIL OFL; chosen over Noto Naskh due to documented diacritic-stacking bugs — fonts-rendering.md). KFGQPC Uthmanic is NOT needed for Phase 1 (no Quran text) and is deliberately out of scope for this plan.
- **Every external URL in content must pass `npm run check:refs`** before deploy (spec: "every audio reference must resolve").
- **Course language: English**; Arabic terms transliterated (spec).
- **Lesson IDs** are zero-padded strings `"1-01"` … `"1-12"`; checkpoint ID `"checkpoint-1"`.
- Node ≥ 20 (built-in `fetch` used by scripts).

## File Structure

```
package.json / next.config.ts / tsconfig.json / vitest.config.ts   (Task 1)
src/app/layout.tsx, globals.css              — fonts, print CSS, shell (Tasks 1, 8)
src/app/page.tsx                             — course map home (Task 7)
src/app/lesson/[id]/page.tsx                 — slide deck route (Task 6)
src/app/practice/[id]/page.tsx               — homework/drills route (Task 8)
src/app/teach/[id]/page.tsx                  — teacher notes route (Task 9)
src/app/checkpoint/[id]/page.tsx             — checkpoint kit route (Task 10)
src/content/schema.ts                        — Zod schema, single source of truth (Task 2)
src/content/load.ts                          — build-time loader/validator (Task 3)
src/components/TapToHear.tsx                 — three-tier audio button (Task 5)
src/components/SlideDeck.tsx                 — deck engine (Task 6)
src/components/DrillGrid.tsx                 — practice drill grid (Task 8)
src/components/ProgressClient.tsx            — localStorage progress hook + UI bits (Task 7)
content/course.json                          — phase/lesson/checkpoint map (Task 4)
content/lessons/1-01.json … 1-12.json        — lesson content (Tasks 4, 12, 13)
content/checkpoints/checkpoint-1.json        — Checkpoint 1 kit (Task 10)
scripts/check-refs.mjs                       — external-URL QA script (Task 11)
```

Content-authoring source of truth: `docs/syllabus/phase-1-letters.md` (exact lesson sections listed in Tasks 12–13). Teacher `listenFor` text doubles as the `teacher-voice` popover cue (gap-1 §6.5 — reuse, don't duplicate-author).

---

### Task 1: Scaffold app, tooling, fonts

**Files:**
- Create: Next.js app at repo root (`package.json`, `next.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/globals.css`, `.gitignore`)
- Create: `vitest.config.ts`, `src/setupTests.ts`, `src/smoke.test.tsx`

**Interfaces:**
- Produces: working `npm run dev` / `npm run build` / `npm test`; global CSS classes `.arabic` (Amiri, RTL) used by every later component.

- [ ] **Step 1: Scaffold** (repo root already contains `docs/`; create-next-app tolerates non-empty dirs only when empty-ish — scaffold in a temp dir and move):

```bash
cd "/Users/scorpionn/Desktop/Tajweed Course"
npx create-next-app@latest _scaffold --ts --tailwind --eslint --app --src-dir --no-import-alias --use-npm --skip-install
rsync -a _scaffold/ ./ && rm -rf _scaffold
npm install
npm install zod @fontsource/amiri
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

- [ ] **Step 2: Configure static export** — replace `next.config.ts`:

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "export" };
export default nextConfig;
```

- [ ] **Step 3: Fonts + base styles** — `src/app/layout.tsx`:

```tsx
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tajweed Course" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900">{children}</body>
    </html>
  );
}
```

Append to `src/app/globals.css` (keep the Tailwind import line create-next-app added):

```css
.arabic {
  font-family: "Amiri", serif;
  direction: rtl;
  line-height: 2.1; /* room for stacked harakat */
}
```

- [ ] **Step 4: Vitest config** — `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: "./src/setupTests.ts", globals: true },
});
```

`src/setupTests.ts`:

```ts
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(() => cleanup());
```

`src/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

test("smoke: react renders under vitest", () => {
  render(<p>bismillah</p>);
  expect(screen.getByText("bismillah")).toBeTruthy();
});
```

Add to `package.json` scripts: `"test": "vitest run", "check:refs": "node scripts/check-refs.mjs"`.

- [ ] **Step 5: Verify** — Run: `npm test` → smoke test PASS. Run: `npm run build` → static export succeeds (default create-next-app home page is fine for now).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js static-export app with Vitest and Amiri font"
```

---

### Task 2: Content schema (Zod)

**Files:**
- Create: `src/content/schema.ts`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Produces (imported by every later task): `AudioSourceSchema`, `ArabicItemSchema`, `SlideSchema`, `DrillSchema`, `LessonSchema`, `CourseSchema`, `CheckpointSchema` and inferred types `AudioSource`, `ArabicItem`, `Slide`, `Drill`, `Lesson`, `Course`, `Checkpoint`.

- [ ] **Step 1: Write failing test** — `src/content/schema.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { AudioSourceSchema, LessonSchema } from "./schema";

describe("AudioSourceSchema (three-tier, gap-1)", () => {
  test("accepts qari-clip with url + reciter", () => {
    expect(
      AudioSourceSchema.parse({
        type: "qari-clip",
        url: "https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3",
        reciter: "Husary (Mu'allim)",
      }).type,
    ).toBe("qari-clip");
  });
  test("accepts youtube-cue with videoId + startSeconds + title", () => {
    expect(
      AudioSourceSchema.parse({
        type: "youtube-cue",
        videoId: "VhRHKdPcNPA",
        startSeconds: 1117,
        title: "Muallimi Soniy — letters that make A, I, U",
      }).type,
    ).toBe("youtube-cue");
  });
  test("accepts teacher-voice with a practice cue line", () => {
    expect(
      AudioSourceSchema.parse({
        type: "teacher-voice",
        cue: "ح: mid-throat, breathy, no vibration — as taught live",
      }).type,
    ).toBe("teacher-voice");
  });
  test("rejects an item with no audio tier (no silent audio state)", () => {
    expect(() => AudioSourceSchema.parse({ type: "none" })).toThrow();
  });
});

describe("LessonSchema", () => {
  test("rejects a lesson whose id is not zero-padded phase-number form", () => {
    expect(() =>
      LessonSchema.parse({ id: "lesson one", phase: 1, unit: "1.1", title: "x", objectives: [], slides: [], practice: { drills: [], dailyChecklist: [] }, teacherNotes: { script: [], listenFor: [], homework: "" }, videos: [] }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure** — Run: `npm test -- schema` → FAIL (`schema.ts` not found).

- [ ] **Step 3: Implement** — `src/content/schema.ts`:

```ts
import { z } from "zod";

// Three-tier audio model — docs/research/addenda/gap-1.md §3.
export const AudioSourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("qari-clip"), url: z.string().url(), reciter: z.string().min(1) }),
  z.object({
    type: z.literal("youtube-cue"),
    videoId: z.string().regex(/^[\w-]{6,20}$/),
    startSeconds: z.number().int().nonnegative(),
    title: z.string().min(1),
  }),
  z.object({ type: z.literal("teacher-voice"), cue: z.string().min(1) }),
]);
export type AudioSource = z.infer<typeof AudioSourceSchema>;

export const ArabicItemSchema = z.object({
  arabic: z.string().min(1),
  name: z.string().optional(),      // e.g. "ba"
  translit: z.string().optional(),  // e.g. "b"
  audio: AudioSourceSchema,
});
export type ArabicItem = z.infer<typeof ArabicItemSchema>;

export const SlideSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("title"), heading: z.string(), arabicDecor: z.string().optional() }),
  z.object({
    kind: z.literal("concept"),
    heading: z.string(),
    body: z.array(z.string()).min(1),
    items: z.array(ArabicItemSchema).optional(),
  }),
  z.object({
    kind: z.literal("letter"),
    item: ArabicItemSchema,
    makhraj: z.string().min(1),
    notes: z.array(z.string()),
  }),
  z.object({
    kind: z.literal("drill"),
    heading: z.string(),
    instructions: z.string().min(1),
    grid: z.array(z.array(ArabicItemSchema)).min(1),
  }),
  z.object({ kind: z.literal("recap"), heading: z.string(), items: z.array(ArabicItemSchema).min(1) }),
  z.object({ kind: z.literal("homework"), heading: z.string(), tasks: z.array(z.string()).min(1) }),
]);
export type Slide = z.infer<typeof SlideSchema>;

export const DrillSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  grid: z.array(z.array(ArabicItemSchema)).min(1),
});
export type Drill = z.infer<typeof DrillSchema>;

export const LessonSchema = z.object({
  id: z.string().regex(/^\d-\d{2}$/), // "1-01"
  phase: z.number().int().min(1).max(3),
  unit: z.string().min(1),            // "1.1"
  title: z.string().min(1),
  objectives: z.array(z.string()).min(1).max(4),
  slides: z.array(SlideSchema).min(8).max(15), // spec: 8–15 slides/lesson
  practice: z.object({ drills: z.array(DrillSchema), dailyChecklist: z.array(z.string()).min(1) }),
  teacherNotes: z.object({
    script: z.array(z.string()).min(1),
    listenFor: z.array(z.string()).min(1),
    homework: z.string().min(1),
  }),
  videos: z.array(z.object({ title: z.string(), url: z.string().url() })),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const CourseSchema = z.object({
  title: z.string(),
  phases: z.array(
    z.object({
      number: z.number().int(),
      title: z.string(),
      lessons: z.array(z.object({ id: z.string().regex(/^\d-\d{2}$/), title: z.string(), calendarSlot: z.string() })),
      checkpoint: z.object({ id: z.string(), title: z.string() }),
    }),
  ),
});
export type Course = z.infer<typeof CourseSchema>;

export const CheckpointSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  durationMinutes: z.string(), // e.g. "30–40"
  steps: z.array(z.object({ name: z.string(), script: z.string(), items: z.array(ArabicItemSchema).optional() })).min(1),
  rubric: z.array(z.object({ criterion: z.string(), pass: z.string() })).min(1),
  revisionMap: z.array(z.object({ weakSpot: z.string(), lessons: z.array(z.string()) })).min(1),
});
export type Checkpoint = z.infer<typeof CheckpointSchema>;
```

Note the schema's objectives cap is 4 (syllabus lessons use 2–4) — the LessonSchema test above uses `objectives: []` which fails `.min(1)`, and the bad-id case fails the regex; both throw as asserted.

- [ ] **Step 4: Run tests** — Run: `npm test -- schema` → all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/schema.ts src/content/schema.test.ts
git commit -m "feat: content schema with three-tier AudioSource union"
```

---

### Task 3: Content loader

**Files:**
- Create: `src/content/load.ts`
- Test: `src/content/load.test.ts`, fixture `src/content/__fixtures__/lesson-valid.json`, `src/content/__fixtures__/lesson-bad-audio.json`

**Interfaces:**
- Consumes: schemas from Task 2.
- Produces: `loadCourse(): Course`, `allLessonIds(): string[]`, `loadLesson(id: string): Lesson`, `loadCheckpoint(id: string): Checkpoint`, `allCheckpointIds(): string[]`. All read from `content/` at the repo root, throw with the offending file path on invalid content (build fails loudly, per spec QA rule).

- [ ] **Step 1: Fixtures.** `lesson-valid.json` — minimal valid lesson (id `1-01`, one of each required field, 8 slides of kind `concept` is fine). `lesson-bad-audio.json` — identical but one drill item has `"audio": {"type": "mp3"}`.

`src/content/__fixtures__/lesson-valid.json`:

```json
{
  "id": "1-01", "phase": 1, "unit": "1.1", "title": "Fixture",
  "objectives": ["o1"],
  "slides": [
    {"kind": "concept", "heading": "h", "body": ["b"]}, {"kind": "concept", "heading": "h", "body": ["b"]},
    {"kind": "concept", "heading": "h", "body": ["b"]}, {"kind": "concept", "heading": "h", "body": ["b"]},
    {"kind": "concept", "heading": "h", "body": ["b"]}, {"kind": "concept", "heading": "h", "body": ["b"]},
    {"kind": "concept", "heading": "h", "body": ["b"]}, {"kind": "concept", "heading": "h", "body": ["b"]}
  ],
  "practice": {
    "drills": [{"title": "d", "instructions": "i", "grid": [[{"arabic": "ب", "name": "ba", "audio": {"type": "teacher-voice", "cue": "lips together"}}]]}],
    "dailyChecklist": ["say each letter 10x"]
  },
  "teacherNotes": {"script": ["s"], "listenFor": ["l"], "homework": "h"},
  "videos": []
}
```

`lesson-bad-audio.json`: copy of the above with the drill item's audio replaced by `{"type": "mp3", "url": "https://example.com/a.mp3"}`.

- [ ] **Step 2: Write failing test** — `src/content/load.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import path from "node:path";
import { parseLessonFile } from "./load";

const fx = (f: string) => path.join(__dirname, "__fixtures__", f);

describe("parseLessonFile", () => {
  test("parses a valid lesson file", () => {
    expect(parseLessonFile(fx("lesson-valid.json")).id).toBe("1-01");
  });
  test("throws naming the file for an invalid audio tier", () => {
    expect(() => parseLessonFile(fx("lesson-bad-audio.json"))).toThrow(/lesson-bad-audio\.json/);
  });
});
```

- [ ] **Step 3: Run to verify failure** — `npm test -- load` → FAIL (module missing).

- [ ] **Step 4: Implement** — `src/content/load.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import { CheckpointSchema, CourseSchema, LessonSchema, type Checkpoint, type Course, type Lesson } from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

function parseJsonFile<T>(file: string, parse: (raw: unknown) => T): T {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  try {
    return parse(raw);
  } catch (err) {
    throw new Error(`Invalid content in ${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function parseLessonFile(file: string): Lesson {
  return parseJsonFile(file, (raw) => LessonSchema.parse(raw));
}

export function loadCourse(): Course {
  return parseJsonFile(path.join(CONTENT_DIR, "course.json"), (raw) => CourseSchema.parse(raw));
}

export function allLessonIds(): string[] {
  return fs.readdirSync(path.join(CONTENT_DIR, "lessons")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
}

export function loadLesson(id: string): Lesson {
  return parseLessonFile(path.join(CONTENT_DIR, "lessons", `${id}.json`));
}

export function allCheckpointIds(): string[] {
  const dir = path.join(CONTENT_DIR, "checkpoints");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
}

export function loadCheckpoint(id: string): Checkpoint {
  return parseJsonFile(path.join(CONTENT_DIR, "checkpoints", `${id}.json`), (raw) => CheckpointSchema.parse(raw));
}
```

- [ ] **Step 5: Run tests** — `npm test -- load` → PASS.

- [ ] **Step 6: Commit** — `git add src/content && git commit -m "feat: content loader with fail-loud validation"`

---

### Task 4: `course.json` + Lesson 1.1 content (worked example)

**Files:**
- Create: `content/course.json`, `content/lessons/1-01.json`
- Test: `src/content/allContent.test.ts` (validates every real content file — grows automatically as lessons land)

**Interfaces:**
- Consumes: loader from Task 3.
- Produces: the content-file pattern every later lesson follows; `content/course.json` consumed by the course-map page (Task 7).

- [ ] **Step 1: `content/course.json`** — Phase 1 only for now (Phases 2–3 entries are added by their own future content plans). Lesson titles verbatim from `docs/syllabus/phase-1-letters.md`:

```json
{
  "title": "Tajweed Course",
  "phases": [
    {
      "number": 1,
      "title": "Letters & Sounds",
      "lessons": [
        {"id": "1-01", "title": "Orientation + Alif & the ب ت ث family", "calendarSlot": "Week 1 — Mon"},
        {"id": "1-02", "title": "The throat-and-dot family: ج ح خ / د ذ", "calendarSlot": "Week 1 — Wed"},
        {"id": "1-03", "title": "ر ز and the sibilants س ش", "calendarSlot": "Week 1 — Sat"},
        {"id": "1-04", "title": "The heavy four: ص ض ط ظ", "calendarSlot": "Week 2 — Mon"},
        {"id": "1-05", "title": "Deep throat & back-of-tongue: ع غ ف ق", "calendarSlot": "Week 2 — Wed"},
        {"id": "1-06", "title": "The rest of the alphabet + full 28-letter review: ك ل م ن ه و ي", "calendarSlot": "Week 2 — Sat"},
        {"id": "1-07", "title": "Letters change shape: initial / medial / final / isolated forms", "calendarSlot": "Week 3 — Mon"},
        {"id": "1-08", "title": "The 6 letters that never connect forward: ا د ذ ر ز و", "calendarSlot": "Week 3 — Wed"},
        {"id": "1-09", "title": "Reading connected clusters — full joining review", "calendarSlot": "Week 3 — Sat"},
        {"id": "1-10", "title": "Fatha: the \"a\" sound, full letter × fatha grid", "calendarSlot": "Week 4 — Mon"},
        {"id": "1-11", "title": "Kasra & Damma: full letter × kasra and letter × damma grids", "calendarSlot": "Week 4 — Wed"},
        {"id": "1-12", "title": "Full mixed grid + 2–3 syllable combinations + checkpoint dry run", "calendarSlot": "Week 4 — Sat"}
      ],
      "checkpoint": {"id": "checkpoint-1", "title": "Checkpoint 1 — Letters & Sounds gate"}
    }
  ]
}
```

- [ ] **Step 2: `content/lessons/1-01.json`** — full transcription of syllabus §"Lesson 1.1" (docs/syllabus/phase-1-letters.md lines 45–81). Complete file:

```json
{
  "id": "1-01",
  "phase": 1,
  "unit": "1.1",
  "title": "Orientation + Alif & the ب ت ث family",
  "objectives": [
    "Explain that Arabic is read right-to-left and letters are learned by shape-family",
    "Identify and correctly pronounce ا ب ت ث in isolation, on sight, in random order",
    "Locate the makhraj (articulation point) for each of these 4 letters when asked"
  ],
  "slides": [
    {"kind": "title", "heading": "Lesson 1.1 — Meet the Alphabet", "arabicDecor": "ا ب ت ث"},
    {"kind": "concept", "heading": "How this course works", "body": ["Live lesson + this slide deck + tap-to-hear + daily homework", "Three lessons a week (Mon/Wed/Sat), 15–20 min practice every day", "Nothing is ever locked — repeat any lesson, any time"]},
    {"kind": "concept", "heading": "Arabic reads right-to-left", "body": ["Lines flow right → left; so do the letters inside a word", "We learn letters in shape-families (letters that look alike), not dictionary order"]},
    {"kind": "concept", "heading": "Makhraj — where a sound is born", "body": ["Every Arabic letter has one home in your mouth or throat", "Five broad zones: chest cavity, throat, tongue, lips, nose", "Getting the makhraj right IS tajweed's foundation — we start today, not in Phase 3"]},
    {"kind": "letter", "item": {"arabic": "ا", "name": "alif", "translit": "ā", "audio": {"type": "youtube-cue", "videoId": "VhRHKdPcNPA", "startSeconds": 1117, "title": "Muallimi Soniy — the letters that make A, I, U"}}, "makhraj": "al-jawf — the empty space of the mouth/chest cavity; an open, unobstructed sound", "notes": ["The simplest letter: a single vertical stroke", "In Phase 2 alif becomes the long-vowel (madd) letter — foreshadow only"]},
    {"kind": "letter", "item": {"arabic": "ب", "name": "ba", "translit": "b", "audio": {"type": "teacher-voice", "cue": "ب: both lips close fully, then release — like English b but with complete lip contact"}}, "makhraj": "the two lips (shafatan), fully closed", "notes": ["One dot BELOW the body"]},
    {"kind": "letter", "item": {"arabic": "ت", "name": "ta", "translit": "t", "audio": {"type": "teacher-voice", "cue": "ت: tongue-tip taps the ridge behind the upper front teeth — light, no heaviness"}}, "makhraj": "tip of tongue against the upper front teeth / gum ridge", "notes": ["Two dots ABOVE the body — same body as ب"]},
    {"kind": "letter", "item": {"arabic": "ث", "name": "tha", "translit": "th", "audio": {"type": "teacher-voice", "cue": "ث: tongue-tip BETWEEN the teeth, unvoiced 'th' as in think — never plain t, never s"}}, "makhraj": "tip of tongue between the teeth (interdental)", "notes": ["Three dots ABOVE — same body as ب and ت"]},
    {"kind": "drill", "heading": "Spot the dots", "instructions": "Same body, different dots. Teacher points, student names the letter and its dot pattern.", "grid": [[
      {"arabic": "ب", "name": "ba", "audio": {"type": "teacher-voice", "cue": "one dot below"}},
      {"arabic": "ت", "name": "ta", "audio": {"type": "teacher-voice", "cue": "two dots above"}},
      {"arabic": "ث", "name": "tha", "audio": {"type": "teacher-voice", "cue": "three dots above"}}
    ]]},
    {"kind": "drill", "heading": "Name it back", "instructions": "Teacher says a letter name aloud; student points to it and says it back. All 4 letters, randomized, 3 rounds.", "grid": [[
      {"arabic": "ا", "name": "alif", "audio": {"type": "youtube-cue", "videoId": "VhRHKdPcNPA", "startSeconds": 1117, "title": "Muallimi Soniy — alif section"}},
      {"arabic": "ب", "name": "ba", "audio": {"type": "teacher-voice", "cue": "lips fully together"}},
      {"arabic": "ت", "name": "ta", "audio": {"type": "teacher-voice", "cue": "tongue-tip on gum ridge"}},
      {"arabic": "ث", "name": "tha", "audio": {"type": "teacher-voice", "cue": "tongue between teeth"}}
    ]]},
    {"kind": "concept", "heading": "28 or 29 letters?", "body": ["You may hear both numbers. Hamza (ء) is a glottal-stop mark — in this course we count 28 letters and treat hamza separately when it appears.", "1-minute aside — details in the linked video, optional"]},
    {"kind": "recap", "heading": "Today's four letters", "items": [
      {"arabic": "ا", "name": "alif", "audio": {"type": "youtube-cue", "videoId": "VhRHKdPcNPA", "startSeconds": 1117, "title": "Muallimi Soniy — alif section"}},
      {"arabic": "ب", "name": "ba", "audio": {"type": "teacher-voice", "cue": "lips fully together"}},
      {"arabic": "ت", "name": "ta", "audio": {"type": "teacher-voice", "cue": "tongue-tip on gum ridge"}},
      {"arabic": "ث", "name": "tha", "audio": {"type": "teacher-voice", "cue": "tongue between teeth"}}
    ]},
    {"kind": "homework", "heading": "Homework — 15–20 min/day", "tasks": [
      "Print the flashcard sheet from the practice page (ا ب ت ث, one per box)",
      "Say each letter's name + sound aloud 10× per letter in mixed order — tick the tally boxes",
      "Re-watch the two linked Arabic101 orientation videos once this week"
    ]}
  ],
  "practice": {
    "drills": [
      {"title": "Flashcard grid", "instructions": "Name each letter + produce its sound. Shuffle your order every round.", "grid": [[
        {"arabic": "ا", "name": "alif", "audio": {"type": "youtube-cue", "videoId": "VhRHKdPcNPA", "startSeconds": 1117, "title": "Muallimi Soniy — alif section"}},
        {"arabic": "ب", "name": "ba", "audio": {"type": "teacher-voice", "cue": "ب: both lips close fully, then release"}},
        {"arabic": "ت", "name": "ta", "audio": {"type": "teacher-voice", "cue": "ت: tongue-tip taps behind upper front teeth"}},
        {"arabic": "ث", "name": "tha", "audio": {"type": "teacher-voice", "cue": "ث: tongue between teeth, soft 'th' as in think"}}
      ]]},
      {"title": "Minimal-pair listening: ت vs ث", "instructions": "Someone says ت or ث — point to the glyph you heard. (With your teacher live, or self-test against the cue lines.)", "grid": [[
        {"arabic": "ت", "name": "ta", "audio": {"type": "teacher-voice", "cue": "plain t — tongue on gum ridge"}},
        {"arabic": "ث", "name": "tha", "audio": {"type": "teacher-voice", "cue": "soft th — tongue between teeth"}}
      ]]}
    ],
    "dailyChecklist": [
      "Flashcard round ×3 (mixed order)",
      "ت vs ث minimal-pair round ×1",
      "Watch one linked orientation video (first two days)"
    ]
  },
  "teacherNotes": {
    "script": [
      "Open with the course tour (slide 2): live lessons Mon/Wed/Sat, slides re-openable at home, tap-to-hear on every Arabic item, nothing is ever locked.",
      "Makhraj slide: keep it plain-English — 'where the sound is born'. Do not introduce Arabic zone names yet.",
      "Model each letter's sound 3× before asking the student to imitate; correct on the FIRST wrong repetition, not the third (ijazah-style immediate correction — teaching-mistakes-assessment.md B).",
      "Before the lesson: self-check your own ث and ب against the linked Arabic101 orientation videos — teacher voice is the student's primary audio for these letters."
    ],
    "listenFor": [
      "ث flattened toward plain ت or toward س — Uzbek/Turkic phonology has no interdental fricative; highest-risk error of the lesson",
      "ب produced without full lip closure (weak v-like glide)",
      "ا given an added glottal catch (hamza) — isolated alif should be open and unobstructed"
    ],
    "homework": "Flashcard sheet ا ب ت ث, 10× per letter daily in mixed order with tally boxes; re-watch both orientation videos once."
  },
  "videos": [
    {"title": "Arabic101 — alphabet orientation (1)", "url": "https://www.youtube.com/watch?v=j9BwXWpzB1Y"},
    {"title": "Arabic101 — alphabet orientation (2)", "url": "https://www.youtube.com/watch?v=c-7SVieC_04"},
    {"title": "Arabic101 — 28 or 29 letters?", "url": "https://www.youtube.com/watch?v=JLee5VQvdIo"},
    {"title": "Muallimi Soniy — alphabet compilation (alif/long-vowel section)", "url": "https://youtu.be/VhRHKdPcNPA?t=1117"}
  ]
}
```

- [ ] **Step 3: Write the all-content test** — `src/content/allContent.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { allCheckpointIds, allLessonIds, loadCheckpoint, loadCourse, loadLesson } from "./load";

describe("all real content validates", () => {
  test("course.json parses", () => {
    expect(loadCourse().phases.length).toBeGreaterThan(0);
  });
  test("every lesson file parses and ids match filenames", () => {
    for (const id of allLessonIds()) expect(loadLesson(id).id).toBe(id);
  });
  test("every course-map lesson id has a content file", () => {
    const have = new Set(allLessonIds());
    for (const phase of loadCourse().phases)
      for (const l of phase.lessons) expect(have.has(l.id), `missing content/lessons/${l.id}.json`).toBe(true);
  });
  test("every checkpoint file parses", () => {
    for (const id of allCheckpointIds()) expect(loadCheckpoint(id).id).toBe(id);
  });
});
```

- [ ] **Step 4: Run** — `npm test -- allContent` → the "every course-map lesson id has a content file" test FAILS for `1-02`…`1-12` (only 1-01 exists). **Temporarily** trim `course.json` to only lesson 1-01? **No** — keep the full map (it is the source of truth) and instead mark this one test with `test.fails` is wrong too. Correct approach: keep the test green by making it assert only over lessons up to the highest authored file, i.e. replace that test body with:

```ts
  test("every authored lesson file is listed in the course map", () => {
    const mapped = new Set(loadCourse().phases.flatMap((p) => p.lessons.map((l) => l.id)));
    for (const id of allLessonIds()) expect(mapped.has(id), `content/lessons/${id}.json missing from course.json`).toBe(true);
  });
```

(The inverse check — every mapped lesson has a file — moves to Task 13 Step 3, once all 12 files exist.) Run again → PASS.

- [ ] **Step 5: Commit** — `git add content src/content/allContent.test.ts && git commit -m "feat: course map and Lesson 1.1 content"`

---

### Task 5: TapToHear component (three-tier)

**Files:**
- Create: `src/components/TapToHear.tsx`
- Test: `src/components/TapToHear.test.tsx`

**Interfaces:**
- Consumes: `ArabicItem` type (Task 2).
- Produces: `<TapToHear item={ArabicItem} size="lg" | "md" />` — used by SlideDeck (Task 6) and DrillGrid (Task 8).

- [ ] **Step 1: Failing test** — `src/components/TapToHear.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { TapToHear } from "./TapToHear";

describe("TapToHear renders per audio tier (gap-1 §4)", () => {
  test("qari-clip: tap plays audio", async () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    render(<TapToHear item={{ arabic: "بِ", audio: { type: "qari-clip", url: "https://example.com/a.mp3", reciter: "Husary (Mu'allim)" } }} />);
    await userEvent.click(screen.getByRole("button", { name: /بِ/ }));
    expect(play).toHaveBeenCalled();
  });
  test("youtube-cue: tap opens embed iframe with start param", async () => {
    render(<TapToHear item={{ arabic: "ا", audio: { type: "youtube-cue", videoId: "VhRHKdPcNPA", startSeconds: 1117, title: "Muallimi Soniy" } }} />);
    await userEvent.click(screen.getByRole("button", { name: /ا/ }));
    const iframe = screen.getByTitle("Muallimi Soniy") as HTMLIFrameElement;
    expect(iframe.src).toContain("youtube.com/embed/VhRHKdPcNPA");
    expect(iframe.src).toContain("start=1117");
    expect(screen.getByText(/via Muallimi Soniy/)).toBeTruthy();
  });
  test("teacher-voice: tap opens practice-cue popover — never a silent no-op", async () => {
    render(<TapToHear item={{ arabic: "ب", audio: { type: "teacher-voice", cue: "lips fully together" } }} />);
    await userEvent.click(screen.getByRole("button", { name: /ب/ }));
    expect(screen.getByText("lips fully together")).toBeTruthy();
    expect(screen.getByText(/practice live with your teacher/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- TapToHear` → FAIL (module missing).

- [ ] **Step 3: Implement** — `src/components/TapToHear.tsx`:

```tsx
"use client";
import { useRef, useState } from "react";
import type { ArabicItem } from "@/content/schema";

export function TapToHear({ item, size = "md" }: { item: ArabicItem; size?: "md" | "lg" }) {
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const a = item.audio;

  function onTap() {
    if (a.type === "qari-clip") {
      if (!audioRef.current) audioRef.current = new Audio(a.url);
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } else {
      setOpen((v) => !v);
    }
  }

  return (
    <span className="relative inline-block text-center">
      <button
        type="button"
        onClick={onTap}
        aria-label={`${item.arabic}${item.name ? ` (${item.name})` : ""} — tap to hear`}
        className={`arabic rounded-xl border border-stone-300 bg-white px-3 py-1 shadow-sm active:scale-95 ${size === "lg" ? "text-6xl" : "text-3xl"}`}
      >
        {item.arabic}
        <span aria-hidden className="ml-1 align-super text-xs">🔊</span>
      </button>
      {open && a.type === "youtube-cue" && (
        <span className="absolute left-1/2 z-10 mt-2 block w-72 -translate-x-1/2 rounded-lg bg-black p-1 shadow-lg">
          <iframe
            title={a.title}
            src={`https://www.youtube.com/embed/${a.videoId}?start=${a.startSeconds}&autoplay=1`}
            className="aspect-video w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          <span className="block px-1 py-0.5 text-xs text-stone-300">via {a.title} ↗</span>
        </span>
      )}
      {open && a.type === "teacher-voice" && (
        <span className="absolute left-1/2 z-10 mt-2 block w-64 -translate-x-1/2 rounded-lg border border-stone-200 bg-white p-3 text-left shadow-lg">
          <span className="arabic block text-5xl">{item.arabic}</span>
          <span className="mt-1 block text-sm">{a.cue}</span>
          <span className="mt-1 block text-xs text-stone-500">No recording exists for this item — practice live with your teacher.</span>
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Run** — `npm test -- TapToHear` → PASS.
- [ ] **Step 5: Commit** — `git add src/components/TapToHear.* && git commit -m "feat: three-tier TapToHear component"`

---

### Task 6: SlideDeck engine + lesson route

**Files:**
- Create: `src/components/SlideDeck.tsx`, `src/app/lesson/[id]/page.tsx`
- Test: `src/components/SlideDeck.test.tsx`

**Interfaces:**
- Consumes: `Lesson`, `Slide` types; `TapToHear`; `loadLesson`/`allLessonIds`.
- Produces: route `/lesson/<id>`; `<SlideDeck lesson={Lesson} />` (client component; arrow keys ←→, swipe, slide counter, Esc→`/`).

- [ ] **Step 1: Failing test** — `src/components/SlideDeck.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { SlideDeck } from "./SlideDeck";
import type { Lesson } from "@/content/schema";

const lesson: Lesson = {
  id: "1-01", phase: 1, unit: "1.1", title: "T", objectives: ["o"],
  slides: [
    { kind: "title", heading: "First slide" },
    { kind: "concept", heading: "Second slide", body: ["point one"] },
    { kind: "letter", item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } }, makhraj: "the two lips", notes: ["one dot below"] },
    { kind: "concept", heading: "s4", body: ["b"] }, { kind: "concept", heading: "s5", body: ["b"] },
    { kind: "concept", heading: "s6", body: ["b"] }, { kind: "concept", heading: "s7", body: ["b"] },
    { kind: "homework", heading: "Homework", tasks: ["do drills"] },
  ],
  practice: { drills: [], dailyChecklist: ["x"] },
  teacherNotes: { script: ["s"], listenFor: ["l"], homework: "h" },
  videos: [],
};

describe("SlideDeck", () => {
  test("shows first slide and advances with ArrowRight", async () => {
    render(<SlideDeck lesson={lesson} />);
    expect(screen.getByText("First slide")).toBeTruthy();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Second slide")).toBeTruthy();
    expect(screen.getByText("2 / 8")).toBeTruthy();
  });
  test("letter slide renders makhraj and a TapToHear button", async () => {
    render(<SlideDeck lesson={lesson} />);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByText(/the two lips/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /ب/ })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- SlideDeck` → FAIL.

- [ ] **Step 3: Implement** — `src/components/SlideDeck.tsx`:

```tsx
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lesson, Slide } from "@/content/schema";
import { TapToHear } from "./TapToHear";

function SlideView({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case "title":
      return (
        <div className="text-center">
          {slide.arabicDecor && <p className="arabic mb-6 text-7xl">{slide.arabicDecor}</p>}
          <h1 className="text-4xl font-bold">{slide.heading}</h1>
        </div>
      );
    case "concept":
      return (
        <div className="max-w-2xl">
          <h2 className="mb-6 text-3xl font-bold">{slide.heading}</h2>
          <ul className="list-disc space-y-3 pl-6 text-xl">{slide.body.map((b) => <li key={b}>{b}</li>)}</ul>
          {slide.items && <div className="mt-6 flex flex-wrap gap-3">{slide.items.map((it) => <TapToHear key={it.arabic} item={it} />)}</div>}
        </div>
      );
    case "letter":
      return (
        <div className="text-center">
          <TapToHear item={slide.item} size="lg" />
          <p className="mt-4 text-2xl font-semibold">{slide.item.name}{slide.item.translit ? ` — ${slide.item.translit}` : ""}</p>
          <p className="mt-2 text-lg"><span className="font-semibold">Makhraj:</span> {slide.makhraj}</p>
          <ul className="mt-3 space-y-1 text-stone-600">{slide.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      );
    case "drill":
      return (
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold">{slide.heading}</h2>
          <p className="mb-6 text-stone-600">{slide.instructions}</p>
          {slide.grid.map((row, i) => (
            <div key={i} dir="rtl" className="mb-3 flex flex-wrap justify-center gap-3">{row.map((it) => <TapToHear key={it.arabic + i} item={it} size="lg" />)}</div>
          ))}
        </div>
      );
    case "recap":
      return (
        <div className="text-center">
          <h2 className="mb-6 text-3xl font-bold">{slide.heading}</h2>
          <div dir="rtl" className="flex flex-wrap justify-center gap-4">{slide.items.map((it) => <TapToHear key={it.arabic} item={it} size="lg" />)}</div>
        </div>
      );
    case "homework":
      return (
        <div className="max-w-2xl">
          <h2 className="mb-6 text-3xl font-bold">{slide.heading}</h2>
          <ol className="list-decimal space-y-3 pl-6 text-xl">{slide.tasks.map((t) => <li key={t}>{t}</li>)}</ol>
        </div>
      );
  }
}

export function SlideDeck({ lesson }: { lesson: Lesson }) {
  const [i, setI] = useState(0);
  const router = useRouter();
  const touchX = useRef<number | null>(null);
  const last = lesson.slides.length - 1;
  const go = useCallback((d: number) => setI((v) => Math.min(last, Math.max(0, v + d))), [last]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router]);

  return (
    <div
      className="flex min-h-screen flex-col"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex flex-1 items-center justify-center p-6">
        <SlideView slide={lesson.slides[i]} />
      </div>
      <div className="flex items-center justify-between p-4 text-sm text-stone-500">
        <button type="button" onClick={() => go(-1)} className="rounded px-3 py-1 hover:bg-stone-200">← Back</button>
        <span>{i + 1} / {lesson.slides.length}</span>
        <button type="button" onClick={() => go(1)} className="rounded px-3 py-1 hover:bg-stone-200">Next →</button>
      </div>
    </div>
  );
}
```

`src/app/lesson/[id]/page.tsx`:

```tsx
import { allLessonIds, loadLesson } from "@/content/load";
import { SlideDeck } from "@/components/SlideDeck";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SlideDeck lesson={loadLesson(id)} />;
}
```

- [ ] **Step 4: Run** — `npm test -- SlideDeck` → PASS. Then `npm run build` → export succeeds with `/lesson/1-01`.
- [ ] **Step 5: Commit** — `git add src/components/SlideDeck.* src/app/lesson && git commit -m "feat: slide deck engine and lesson route"`

---

### Task 7: Progress store + course map home

**Files:**
- Create: `src/components/ProgressClient.tsx`, replace `src/app/page.tsx`
- Test: `src/components/ProgressClient.test.tsx`

**Interfaces:**
- Consumes: `loadCourse` (Task 3).
- Produces: `useProgress(): { isDone(id): boolean; toggleDone(id): void }` (exported for Task 8's practice page); home page listing phases → lessons (title, calendar slot, done-toggle, links to Lesson / Practice) and the checkpoint gate row linking to `/checkpoint/checkpoint-1`. localStorage key: `"tajweed-progress-v1"`, shape `{ done: string[] }`.

- [ ] **Step 1: Failing test** — `src/components/ProgressClient.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { CourseMap } from "./ProgressClient";
import type { Course } from "@/content/schema";

const course: Course = {
  title: "Tajweed Course",
  phases: [{ number: 1, title: "Letters & Sounds", lessons: [{ id: "1-01", title: "Orientation", calendarSlot: "Week 1 — Mon" }], checkpoint: { id: "checkpoint-1", title: "Checkpoint 1" } }],
};

describe("CourseMap + progress", () => {
  beforeEach(() => localStorage.clear());
  test("renders lesson with links and toggles done state persistently", async () => {
    render(<CourseMap course={course} />);
    expect(screen.getByRole("link", { name: /lesson/i })).toBeTruthy();
    await userEvent.click(screen.getByRole("checkbox", { name: /done/i }));
    expect(JSON.parse(localStorage.getItem("tajweed-progress-v1")!).done).toContain("1-01");
  });
  test("shows checkpoint gate row", () => {
    render(<CourseMap course={course} />);
    expect(screen.getByText(/Checkpoint 1/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- ProgressClient` → FAIL.

- [ ] **Step 3: Implement** — `src/components/ProgressClient.tsx`:

```tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Course } from "@/content/schema";

const KEY = "tajweed-progress-v1";

export function useProgress() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(KEY) ?? '{"done":[]}').done ?? []); } catch { setDone([]); }
  }, []);
  function toggleDone(id: string) {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify({ done: next }));
      return next;
    });
  }
  return { isDone: (id: string) => done.includes(id), toggleDone };
}

export function CourseMap({ course }: { course: Course }) {
  const { isDone, toggleDone } = useProgress();
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-3xl font-bold">{course.title}</h1>
      <p className="mb-8 text-stone-500">Calendar is suggested — checkpoints decide advancement. Repeat anything, anytime.</p>
      {course.phases.map((phase) => (
        <section key={phase.number} className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Phase {phase.number} — {phase.title}</h2>
          <ul className="space-y-2">
            {phase.lessons.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
                <input type="checkbox" aria-label={`done: ${l.title}`} checked={isDone(l.id)} onChange={() => toggleDone(l.id)} className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">{l.title}</p>
                  <p className="text-xs text-stone-500">{l.calendarSlot}</p>
                </div>
                <Link className="rounded bg-stone-800 px-3 py-1 text-sm text-white" href={`/lesson/${l.id}`}>Lesson</Link>
                <Link className="rounded border border-stone-300 px-3 py-1 text-sm" href={`/practice/${l.id}`}>Practice</Link>
              </li>
            ))}
            <li className="rounded-lg border-2 border-amber-400 bg-amber-50 p-3">
              <Link href={`/checkpoint/${phase.checkpoint.id}`} className="font-semibold">🚩 {phase.checkpoint.title}</Link>
              <p className="text-xs text-stone-600">Live gate with your teacher — pass to move on, or revise the mapped lessons and retest.</p>
            </li>
          </ul>
        </section>
      ))}
    </main>
  );
}
```

Replace `src/app/page.tsx`:

```tsx
import { loadCourse } from "@/content/load";
import { CourseMap } from "@/components/ProgressClient";

export default function Home() {
  return <CourseMap course={loadCourse()} />;
}
```

- [ ] **Step 4: Run** — `npm test -- ProgressClient` → PASS; `npm run build` → succeeds.
- [ ] **Step 5: Commit** — `git add src/components/ProgressClient.* src/app/page.tsx && git commit -m "feat: course map with localStorage progress"`

---

### Task 8: Practice pages + print CSS

**Files:**
- Create: `src/components/DrillGrid.tsx`, `src/app/practice/[id]/page.tsx`
- Modify: `src/app/globals.css` (print rules)
- Test: `src/components/DrillGrid.test.tsx`

**Interfaces:**
- Consumes: `Lesson`, `Drill`, `TapToHear`, `loadLesson`/`allLessonIds`.
- Produces: route `/practice/<id>` — drill grids (tap-to-hear), daily checklist, linked videos, Print button. Print stylesheet hides buttons/audio chrome and renders grids as large-glyph flashcard boxes with tally rows.

- [ ] **Step 1: Failing test** — `src/components/DrillGrid.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DrillGrid } from "./DrillGrid";

describe("DrillGrid", () => {
  test("renders title, instructions, and one TapToHear per item", () => {
    render(
      <DrillGrid drill={{ title: "Flashcards", instructions: "Name each letter.", grid: [[
        { arabic: "ا", name: "alif", audio: { type: "teacher-voice", cue: "open sound" } },
        { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } },
      ]] }} />,
    );
    expect(screen.getByText("Flashcards")).toBeTruthy();
    expect(screen.getByText("Name each letter.")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- DrillGrid` → FAIL.

- [ ] **Step 3: Implement** — `src/components/DrillGrid.tsx`:

```tsx
import type { Drill } from "@/content/schema";
import { TapToHear } from "./TapToHear";

export function DrillGrid({ drill }: { drill: Drill }) {
  return (
    <section className="drill mb-8 break-inside-avoid">
      <h3 className="mb-1 text-xl font-semibold">{drill.title}</h3>
      <p className="mb-4 text-stone-600">{drill.instructions}</p>
      {drill.grid.map((row, i) => (
        <div key={i} dir="rtl" className="mb-3 flex flex-wrap gap-3">
          {row.map((it, j) => (
            <span key={`${it.arabic}-${j}`} className="drill-cell">
              <TapToHear item={it} size="lg" />
              <span className="tally mt-1 hidden text-xs tracking-widest text-stone-400">☐☐☐☐☐☐☐☐☐☐</span>
            </span>
          ))}
        </div>
      ))}
    </section>
  );
}
```

`src/app/practice/[id]/page.tsx`:

```tsx
import { allLessonIds, loadLesson } from "@/content/load";
import { DrillGrid } from "@/components/DrillGrid";
import { PrintButton } from "@/components/ProgressClient";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = loadLesson(id);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Practice — {lesson.title}</h1>
      <p className="mb-6 text-stone-500">15–20 minutes daily. Tap any Arabic item to hear it (or get its practice cue).</p>
      <PrintButton />
      {lesson.practice.drills.map((d) => <DrillGrid key={d.title} drill={d} />)}
      <section className="mb-8 print:hidden">
        <h3 className="mb-2 text-xl font-semibold">Daily checklist</h3>
        <ul className="list-disc pl-6">{lesson.practice.dailyChecklist.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
      <section className="print:hidden">
        <h3 className="mb-2 text-xl font-semibold">Linked videos</h3>
        <ul className="list-disc pl-6">
          {lesson.videos.map((v) => <li key={v.url}><a className="underline" href={v.url} target="_blank" rel="noreferrer">{v.title}</a></li>)}
        </ul>
      </section>
    </main>
  );
}
```

Add `PrintButton` to `src/components/ProgressClient.tsx` (it's the client-components file):

```tsx
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="mb-6 rounded border border-stone-300 px-3 py-1 text-sm print:hidden">
      🖨 Print this sheet
    </button>
  );
}
```

Append to `src/app/globals.css`:

```css
@media print {
  nav, button, iframe, .print\:hidden { display: none !important; }
  .drill-cell { display: inline-block; border: 1px solid #999; border-radius: 8px; padding: 18px 26px; margin: 4px; }
  .drill-cell .tally { display: block !important; }
  .drill-cell .arabic { font-size: 54px !important; }
  body { background: white; }
}
```

- [ ] **Step 4: Run** — `npm test -- DrillGrid` → PASS; `npm run build` → succeeds. Manual: `npm run dev`, open `/practice/1-01`, browser print-preview shows flashcard boxes with tally rows and no buttons.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: practice pages with printable drill sheets"`

---

### Task 9: /teach route (teacher notes)

**Files:**
- Create: `src/app/teach/[id]/page.tsx`
- Test: `src/app/teach/teach.test.tsx`

**Interfaces:**
- Consumes: `loadLesson`, `allLessonIds`.
- Produces: route `/teach/<id>` — talking script, listen-for list, homework line, objectives, linked videos. Not linked from any student-facing page (obscurity is the v1 access model, per spec).

- [ ] **Step 1: Failing test** — `src/app/teach/teach.test.tsx` (render the page component directly with a real lesson):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TeachPage from "./[id]/page";

describe("TeachPage", () => {
  test("renders script and listen-for from real lesson 1-01", async () => {
    render(await TeachPage({ params: Promise.resolve({ id: "1-01" }) }));
    expect(screen.getByText(/listen for/i)).toBeTruthy();
    expect(screen.getByText(/interdental fricative/)).toBeTruthy(); // real 1-01 listenFor content
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- teach` → FAIL.

- [ ] **Step 3: Implement** — `src/app/teach/[id]/page.tsx`:

```tsx
import { allLessonIds, loadLesson } from "@/content/load";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function TeachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = loadLesson(id);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <p className="mb-2 text-xs uppercase tracking-wide text-amber-700">Teacher notes — do not share this link</p>
      <h1 className="mb-4 text-2xl font-bold">{l.title}</h1>
      <h2 className="mb-1 font-semibold">Objectives</h2>
      <ul className="mb-4 list-disc pl-6">{l.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
      <h2 className="mb-1 font-semibold">Talking script</h2>
      <ol className="mb-4 list-decimal space-y-1 pl-6">{l.teacherNotes.script.map((s) => <li key={s}>{s}</li>)}</ol>
      <h2 className="mb-1 font-semibold">Listen for (this lesson's mistakes)</h2>
      <ul className="mb-4 list-disc space-y-1 pl-6">{l.teacherNotes.listenFor.map((s) => <li key={s}>{s}</li>)}</ul>
      <h2 className="mb-1 font-semibold">Homework to assign</h2>
      <p className="mb-4">{l.teacherNotes.homework}</p>
      <h2 className="mb-1 font-semibold">Reference videos (audition before the lesson)</h2>
      <ul className="list-disc pl-6">{l.videos.map((v) => <li key={v.url}><a className="underline" href={v.url} target="_blank" rel="noreferrer">{v.title}</a></li>)}</ul>
    </main>
  );
}
```

- [ ] **Step 4: Run** — `npm test -- teach` → PASS.
- [ ] **Step 5: Commit** — `git add src/app/teach && git commit -m "feat: teacher notes route"`

---

### Task 10: Checkpoint kit content + route

**Files:**
- Create: `content/checkpoints/checkpoint-1.json`, `src/app/checkpoint/[id]/page.tsx`
- Test: covered by `allContent.test.ts` (checkpoint parse) + `src/app/checkpoint/checkpoint.test.tsx`

**Interfaces:**
- Consumes: `loadCheckpoint`, `allCheckpointIds`, `CheckpointSchema`.
- Produces: route `/checkpoint/checkpoint-1` rendering test script steps, rubric table, revision map. Results are noted on paper/by the teacher (print button) — no digital result storage in v1 beyond the lesson done-toggles.

- [ ] **Step 1: Author `content/checkpoints/checkpoint-1.json`** — transcribe `docs/syllabus/phase-1-letters.md` §"Checkpoint 1 Kit" (lines 518–560: test script ~30–40 min, pass rubric, weak-spot→unit revision mapping). Structure per `CheckpointSchema`: each script stage becomes a `steps[]` entry (`name`, `script`, optional `items` grid of the letters being tested — audio tier `teacher-voice` with the letter's cue from its lesson); rubric rows as `{criterion, pass}`; revision mapping as `{weakSpot, lessons: ["1-04", …]}` using lesson ids, not prose. Also add the **printable results-recording template** the workflow critic flagged as missing: include as a final step `{"name": "Record results", "script": "Print this page; per rubric row mark pass / revise, note the mapped revision lessons, date and sign."}`.

- [ ] **Step 2: Failing test** — `src/app/checkpoint/checkpoint.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import CheckpointPage from "./[id]/page";

describe("CheckpointPage", () => {
  test("renders rubric and revision map from real checkpoint-1", async () => {
    render(await CheckpointPage({ params: Promise.resolve({ id: "checkpoint-1" }) }));
    expect(screen.getByText(/rubric/i)).toBeTruthy();
    expect(screen.getByText(/revision/i)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run to verify failure**, then implement `src/app/checkpoint/[id]/page.tsx`:

```tsx
import { allCheckpointIds, loadCheckpoint } from "@/content/load";
import { DrillGrid } from "@/components/DrillGrid";
import { PrintButton } from "@/components/ProgressClient";

export function generateStaticParams() {
  return allCheckpointIds().map((id) => ({ id }));
}

export default async function CheckpointPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cp = loadCheckpoint(id);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">🚩 {cp.title}</h1>
      <p className="mb-6 text-stone-500">Live with your teacher · {cp.durationMinutes} minutes. A miss here is never a restart — revise the mapped lessons and retest.</p>
      <PrintButton />
      {cp.steps.map((s, i) => (
        <section key={s.name} className="mb-6">
          <h2 className="font-semibold">{i + 1}. {s.name}</h2>
          <p className="mb-2">{s.script}</p>
          {s.items && <DrillGrid drill={{ title: "", instructions: "", grid: [s.items] }} />}
        </section>
      ))}
      <h2 className="mb-2 font-semibold">Pass rubric</h2>
      <table className="mb-6 w-full border-collapse text-sm">
        <tbody>{cp.rubric.map((r) => (
          <tr key={r.criterion} className="border-b border-stone-200">
            <td className="py-2 pr-3">{r.criterion}</td>
            <td className="py-2 font-medium">{r.pass}</td>
            <td className="py-2 pl-3 text-stone-400">☐ pass ☐ revise</td>
          </tr>
        ))}</tbody>
      </table>
      <h2 className="mb-2 font-semibold">Weak spot → revision map</h2>
      <ul className="list-disc pl-6">{cp.revisionMap.map((m) => (
        <li key={m.weakSpot}>{m.weakSpot} → revise {m.lessons.join(", ")}</li>
      ))}</ul>
    </main>
  );
}
```

- [ ] **Step 4: Run** — `npm test` → all PASS (including allContent's checkpoint test); `npm run build` → succeeds.
- [ ] **Step 5: Commit** — `git add content/checkpoints src/app/checkpoint && git commit -m "feat: checkpoint 1 kit and route"`

---

### Task 11: External-reference QA script

**Files:**
- Create: `scripts/check-refs.mjs`

**Interfaces:**
- Consumes: all JSON under `content/`.
- Produces: `npm run check:refs` — exits 1 listing any failing URL. Checks: `qari-clip.url` via HTTP HEAD (GET fallback on 405); `youtube-cue.videoId` and every `videos[].url` containing youtube/youtu.be via the oEmbed endpoint (`https://www.youtube.com/oembed?url=…&format=json` — 200 means the video exists AND is embeddable, per gap-1 §2); other `videos[].url` via HEAD.

- [ ] **Step 1: Implement** — `scripts/check-refs.mjs`:

```js
import fs from "node:fs";
import path from "node:path";

const urls = new Map(); // url -> kind
function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (node && typeof node === "object") {
    if (node.type === "qari-clip" && node.url) urls.set(node.url, "audio");
    if (node.type === "youtube-cue" && node.videoId) urls.set(`https://www.youtube.com/watch?v=${node.videoId}`, "youtube");
    if (typeof node.url === "string" && /youtu\.?be/.test(node.url) && !node.type) urls.set(node.url, "youtube");
    else if (typeof node.url === "string" && !node.type) urls.set(node.url, "link");
    Object.values(node).forEach(walk);
  }
}

const contentDir = path.join(process.cwd(), "content");
for (const file of fs.readdirSync(contentDir, { recursive: true })) {
  if (String(file).endsWith(".json")) walk(JSON.parse(fs.readFileSync(path.join(contentDir, String(file)), "utf8")));
}

let failures = 0;
for (const [url, kind] of urls) {
  const target = kind === "youtube"
    ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    : url;
  try {
    let res = await fetch(target, { method: kind === "youtube" ? "GET" : "HEAD", redirect: "follow" });
    if (res.status === 405) res = await fetch(target, { method: "GET", redirect: "follow" });
    if (!res.ok) { failures++; console.error(`FAIL ${res.status} [${kind}] ${url}`); }
    else console.log(`ok   [${kind}] ${url}`);
  } catch (err) {
    failures++; console.error(`FAIL error [${kind}] ${url}: ${err.message}`);
  }
}
console.log(`\n${urls.size - failures}/${urls.size} references ok`);
process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run** — `npm run check:refs` → every URL in 1-01 + checkpoint-1 prints `ok`; exit 0. If a YouTube URL fails oEmbed, replace or remove that reference in the content file (embeddability is a content requirement, not a warning).
- [ ] **Step 3: Commit** — `git add scripts/check-refs.mjs && git commit -m "feat: external-reference QA script"`

---

### Task 12: Author lessons 1.2–1.6 (Unit 1.1)

**Files:**
- Create: `content/lessons/1-02.json` … `content/lessons/1-06.json`

**Interfaces:**
- Consumes: the Lesson 1.1 file (Task 4) as the structural exemplar; `docs/syllabus/phase-1-letters.md` sections (line anchors): Lesson 1.2 (§85), 1.3 (§127), 1.4 (§166), 1.5 (§211), 1.6 (§253).
- Produces: five validated lesson files, one per syllabus section.

Authoring rules (apply to every file; these are the complete transformation spec):
1. Transcribe the syllabus section field-for-field: objectives → `objectives`; each numbered slide-outline entry → one `slides[]` entry choosing the matching `kind` (`title`/`concept`/`letter`/`drill`/`recap`/`homework`); Drills → `practice.drills`; Homework → `practice.dailyChecklist` + `teacherNotes.homework`; Teacher listen-for → `teacherNotes.listenFor` (verbatim, including source citations); Video → `videos[]` and, where the syllabus maps a specific video/timestamp to a letter, that letter's `audio` as `youtube-cue`.
2. Audio tier assignment (gap-1 §5, tightened per user directive 2026-07-19): actively maximize `youtube-cue` coverage — for each letter, first check the syllabus lesson's Video list, then `docs/research/arabic101.md` (per-letter Makharij & Sifaat episodes) and `docs/research/uzbek-channel.md` (Muallimi Soniy compilation chapter timestamps) for a matching segment; assign `teacher-voice` ONLY when no segment exists in either source. The course owner plans to record their own letter clips later — those will land as `qari-clip` entries (`reciter: "Teacher recording"`), so no schema change is ever needed for that upgrade. No Quran-verse `qari-clip`s in Phase 1 (no Quran words yet).
3. `teacher-voice.cue` lines must be self-contained articulation guidance (they render in the popover) — not "see notes".
4. `teacherNotes.script` = the syllabus lesson's teaching-flow guidance distilled to 3–6 imperative lines (model 3×, correct on first error, pre-audition videos — as in 1-01).

- [ ] **Step 1:** Author `1-02.json` from syllabus §Lesson 1.2. Run `npm test -- allContent` → PASS. Run `npm run check:refs` → all ok.
- [ ] **Step 2:** Commit: `git add content/lessons/1-02.json && git commit -m "content: lesson 1.2"`
- [ ] **Steps 3–10:** Repeat the author→validate→check-refs→commit cycle for `1-03.json`, `1-04.json`, `1-05.json`, `1-06.json` (one commit each: `content: lesson 1.X`).

---

### Task 13: Author lessons 1.7–1.12 + full-map integrity check

**Files:**
- Create: `content/lessons/1-07.json` … `content/lessons/1-12.json`
- Modify: `src/content/allContent.test.ts` (restore the inverse integrity check)

**Interfaces:**
- Consumes: syllabus sections: Lesson 1.7 (§299), 1.8 (§334), 1.9 (§369), 1.10 (§404), 1.11 (§441), 1.12 (§482). Same authoring rules as Task 12.
- Produces: complete Phase 1 content; the course map's every entry backed by a file.

Unit 1.3 specifics (lessons 1.10–1.12): the letter×harakat grids are `practice.drills` grids of 28 cells per harakat. Per user directive, check `docs/research/uzbek-channel.md`'s Muallimi Soniy chapter map first — its compilation covers harakat+letter mini-lessons, so cells whose letter+harakat section exists get `youtube-cue` with that timestamp; remaining cells get `teacher-voice` with `cue` = "<letter> + <harakat>: <letter's articulation line>, vowel <a/i/u>". Add ONE grid-level `videos[]` entry per gap-1: the vetted "hear the whole grid" Noorani Qaida video — **only after the teacher has auditioned it** (verified-resources.md §4 marks the candidates UNVERIFIED; if not yet auditioned, ship without it and note in teacherNotes.script to demonstrate the grid live).

Workflow-critic pacing note for Lesson 1.11 (56 new cells in one session): add to `1-11.json`'s `teacherNotes.script`: "If the damma grid doesn't fit in the hour, stop — 1.12's dry-run slot absorbs the overflow; do not rush 56 cells."

- [ ] **Steps 1–6:** Author each of `1-07` … `1-12` with the author→`npm test -- allContent`→`npm run check:refs`→commit cycle (one commit per lesson).
- [ ] **Step 7:** Restore the inverse integrity test in `src/content/allContent.test.ts` (now that all files exist), appended to the describe block:

```ts
  test("every course-map lesson id has a content file", () => {
    const have = new Set(allLessonIds());
    for (const phase of loadCourse().phases)
      for (const l of phase.lessons) expect(have.has(l.id), `missing content/lessons/${l.id}.json`).toBe(true);
  });
```

- [ ] **Step 8:** Run `npm test` → ALL tests pass. Run `npm run check:refs` → exit 0. Run `npm run build` → 12 lesson routes + practice + teach + checkpoint export cleanly.
- [ ] **Step 9:** Commit: `git add -A && git commit -m "content: complete Phase 1 (lessons 1.7-1.12) with map integrity check"`

---

### Task 14: Deploy + phone QA

**Files:**
- None new (Vercel config is zero-config for static Next.js).

- [ ] **Step 1:** Full local gate: `npm test && npm run check:refs && npm run build` → all green.
- [ ] **Step 2:** Deploy. Vercel login is interactive — the user must run it themselves: ask the user to run `! npx vercel login`, then run `npx vercel deploy --prod --yes`. Expected output ends with the production URL.
- [ ] **Step 3:** Phone QA checklist (open the production URL on a phone; spec: student is mobile-first) — verify each: course map renders and toggles persist across reload · lesson 1-01 deck swipes and taps play/popover correctly · a `youtube-cue` item plays inline at the right timestamp · practice page print-preview shows flashcard boxes · `/teach/1-01` loads and is absent from all student-facing links · Arabic glyphs render in Amiri with no tofu boxes.
- [ ] **Step 4:** Record the production URL in `docs/superpowers/specs/2026-07-19-tajweed-course-design.md` under a new final line: `**Live (v1 Phase 1):** <URL>`. Commit: `git add -A && git commit -m "docs: record production URL"`.

---

## Self-Review (done at plan-writing time)

1. **Spec coverage:** course map ✓(T7) · lesson decks w/ tap-to-hear ✓(T5,T6) · practice + print ✓(T8) · checkpoint pages ✓(T10) · /teach ✓(T9) · content model portable JSON ✓(T2–T4) · QA "every reference resolves" ✓(T11, wired into T12–14 cycles) · Amiri/rendering ✓(T1) · localStorage progress ✓(T7) · gap-1 three-tier audio ✓(T2,T5) · Phase 1 12 lessons + Checkpoint 1 ✓(T4,T12,T13,T10) · Vercel link ✓(T14). Not covered by design: KFGQPC font & Quran-text pipeline (Phase 2 plan), Phases 2–3 content (own plans per spec build order).
2. **Placeholder scan:** content-authoring tasks (12–13) intentionally source lesson text from named syllabus sections with a complete transformation spec + full worked example (T4) rather than inlining 12 lessons of prose — the syllabus file is the content, not a TBD.
3. **Type consistency:** `AudioSource`/`ArabicItem`/`Lesson`/`Course`/`Checkpoint` names and loader signatures (`loadCourse`, `allLessonIds`, `loadLesson`, `loadCheckpoint`, `allCheckpointIds`, `parseLessonFile`) are used identically across Tasks 2–11; `useProgress`/`PrintButton` live in `ProgressClient.tsx` and are imported as named exports in T8/T10.
