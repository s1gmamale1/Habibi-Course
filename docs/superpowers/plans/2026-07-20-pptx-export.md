# PPTX Teacher-Deck Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One-click "Export PPTX" button on each `/teach/[id]` page that downloads the lesson as a PowerPoint teacher deck (slides + `teacherNotes` as speaker notes).

**Architecture:** A pure builder module (`src/export/lessonToPptx.ts`) maps a Zod-validated `Lesson` onto a narrow structural `Deck` interface (satisfied by a real pptxgenjs instance in the app, and by a lightweight fake in unit tests). A `"use client"` button on the teach page lazy-imports pptxgenjs on first click, rasterizes referenced makhraj SVGs to PNG data URLs in the browser, calls the builder, and saves the file.

**Tech Stack:** Next.js 16 (App Router, `output: "export"`), React 19, TypeScript, Zod 4, pptxgenjs ^4.0.1, vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-20-pptx-export-design.md` (approved).

## Global Constraints

- Only new dependency: `pptxgenjs` (^4.0.1), loaded via dynamic `import()` in the click handler only — it must NOT be statically imported by any page/component module (bundle stays clean; static export unaffected).
- Output filename: `tajweed-<lesson.id>.pptx` (e.g. `tajweed-1-04.pptx`), one deck per lesson.
- Teacher deck only: speaker notes come from `teacherNotes`; student pages remain untouched.
- Failed image fetch/rasterize skips that image; the deck still exports.
- Test style: repo uses vitest globals-off imports (`import { describe, expect, test } from "vitest"`) and `toBeTruthy()`/`toBeNull()` assertions — there is NO jest-dom, so never use `toBeInTheDocument()`.
- Gate must stay green: `npm run lint`, `npm test`, `npm run build`.
- Import alias `@/` → `src/` (works in app and vitest).

## File Structure

- Create: `src/export/lessonToPptx.ts` — pure deck builder + notes formatters + `Deck`/`DeckSlide` interfaces (no React, no DOM).
- Create: `src/export/lessonToPptx.test.ts` — node-environment unit tests (fake deck + all 12 real lessons + real-pptxgenjs smoke test).
- Create: `src/components/ExportPptxButton.tsx` — client button: lazy import, SVG→PNG rasterize, build, save, idle/working/done/error states.
- Create: `src/components/ExportPptxButton.test.tsx` — jsdom component test with mocked pptxgenjs.
- Modify: `src/app/teach/[id]/page.tsx` — render the button under the `<h1>`.
- Create: `src/app/teach/[id]/page.test.tsx` — page renders the button.

---

### Task 1: Deck builder module (`lessonToPptx.ts`)

**Files:**
- Create: `src/export/lessonToPptx.ts`
- Create: `src/export/lessonToPptx.test.ts`
- Modify: `package.json` (add pptxgenjs)

**Interfaces:**
- Consumes: `Lesson`, `Slide`, `ArabicItem` types from `@/content/schema`; `loadLesson(id)` / `allLessonIds()` from `@/content/load` (tests only).
- Produces (Task 2 relies on these exact exports):
  - `export type DeckSlide = { background?: { color: string }; addText(text: unknown, opts?: Record<string, unknown>): unknown; addImage(opts: Record<string, unknown>): unknown; addTable(rows: unknown[][], opts?: Record<string, unknown>): unknown; addNotes(notes: string): unknown }`
  - `export type Deck = { layout: string; addSlide(): DeckSlide }`
  - `export function buildLessonDeck(deck: Deck, lesson: Lesson, images?: Record<string, string>): void` — `images` maps a slide's `image` path (e.g. `/images/makhraj/lisan.svg`) to a PNG data URL.
  - `export function drillTableRows(grid: ArabicItem[][])` — exported for direct testing.

- [ ] **Step 1: Install pptxgenjs**

Run: `npm install pptxgenjs`
Expected: `package.json` dependencies gain `"pptxgenjs": "^4.0.1"` (or newer 4.x). Commit happens at end of task.

- [ ] **Step 2: Write the failing tests**

Create `src/export/lessonToPptx.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, test } from "vitest";
import PptxGenJS from "pptxgenjs";
import { allLessonIds, loadLesson } from "@/content/load";
import type { Lesson } from "@/content/schema";
import { buildLessonDeck, drillTableRows, type Deck, type DeckSlide } from "./lessonToPptx";

class FakeSlide implements DeckSlide {
  background?: { color: string };
  texts: { text: unknown; opts?: Record<string, unknown> }[] = [];
  images: Record<string, unknown>[] = [];
  tables: { rows: unknown[][]; opts?: Record<string, unknown> }[] = [];
  notes: string[] = [];
  addText(text: unknown, opts?: Record<string, unknown>) { this.texts.push({ text, opts }); }
  addImage(opts: Record<string, unknown>) { this.images.push(opts); }
  addTable(rows: unknown[][], opts?: Record<string, unknown>) { this.tables.push({ rows, opts }); }
  addNotes(notes: string) { this.notes.push(notes); }
}

class FakeDeck implements Deck {
  layout = "";
  slides: FakeSlide[] = [];
  addSlide() { const s = new FakeSlide(); this.slides.push(s); return s; }
}

const teacherVoice = (cue: string) => ({ type: "teacher-voice" as const, cue });

// Type-valid minimal lesson (schema's 8-slide floor is runtime-only; builder trusts the type).
const miniLesson: Lesson = {
  id: "1-99",
  phase: 1,
  unit: "1.9",
  title: "Mini",
  objectives: ["obj one"],
  slides: [
    { kind: "title", heading: "Mini lesson", arabicDecor: "ص" },
    {
      kind: "letter",
      item: { arabic: "ص", name: "saad", audio: teacherVoice("heavy s") },
      makhraj: "tongue tip",
      notes: ["heavy letter"],
      image: "/images/makhraj/lisan.svg",
    },
    { kind: "homework", heading: "Homework", tasks: ["write it"] },
  ],
  practice: { drills: [], dailyChecklist: ["read"] },
  teacherNotes: { script: ["say hello"], listenFor: ["thin saad"], homework: "trace letters" },
  videos: [],
};

describe("buildLessonDeck", () => {
  test("builds every real lesson with one deck slide per content slide", () => {
    for (const id of allLessonIds()) {
      const lesson = loadLesson(id);
      const deck = new FakeDeck();
      buildLessonDeck(deck, lesson);
      expect(deck.slides).toHaveLength(lesson.slides.length);
      expect(deck.layout).toBe("LAYOUT_16x9");
    }
  });

  test("title slide notes carry objectives + numbered script; homework slide notes carry homework + listenFor", () => {
    const lesson = loadLesson("1-04");
    const deck = new FakeDeck();
    buildLessonDeck(deck, lesson);
    const titleNotes = deck.slides[0].notes.join("\n");
    expect(titleNotes).toContain(lesson.objectives[0]);
    expect(titleNotes).toContain(`1. ${lesson.teacherNotes.script[0]}`);
    const hwIdx = lesson.slides.findIndex((s) => s.kind === "homework");
    const hwNotes = deck.slides[hwIdx].notes.join("\n");
    expect(hwNotes).toContain(lesson.teacherNotes.homework);
    expect(hwNotes).toContain(lesson.teacherNotes.listenFor[0]);
  });

  test("letter slide embeds a provided image and skips a missing one", () => {
    const withImage = new FakeDeck();
    buildLessonDeck(withImage, miniLesson, { "/images/makhraj/lisan.svg": "data:image/png;base64,AAAA" });
    expect(withImage.slides[1].images).toHaveLength(1);
    expect(withImage.slides[1].images[0].data).toBe("data:image/png;base64,AAAA");

    const withoutImage = new FakeDeck();
    buildLessonDeck(withoutImage, miniLesson);
    expect(withoutImage.slides[1].images).toHaveLength(0);
  });
});

describe("drillTableRows", () => {
  test("reverses rows for RTL and pads ragged rows to a rectangle", () => {
    const item = (arabic: string) => ({ arabic, audio: teacherVoice("x") });
    const rows = drillTableRows([[item("ا"), item("ب"), item("ت")], [item("ث")]]) as {
      text: string;
    }[][];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(3);
    expect(rows[1]).toHaveLength(3);
    expect(rows[0][0].text).toBe("ت"); // first row reversed: last item now leftmost
    expect(rows[0][2].text).toBe("ا"); // first item rendered rightmost (RTL)
    expect(rows[1][2].text).toBe("ث"); // single item sits in the rightmost column
    expect(rows[1][0].text).toBe("");  // padding fills the left
  });
});

describe("smoke against real pptxgenjs", () => {
  test("produces a non-empty zip (pptx) for lesson 1-04", async () => {
    const pptx = new PptxGenJS();
    buildLessonDeck(pptx as unknown as Deck, loadLesson("1-04"));
    const b64 = (await pptx.write({ outputType: "base64" })) as string;
    expect(b64.startsWith("UEs")).toBeTruthy(); // "PK" zip magic in base64
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/export/lessonToPptx.test.ts`
Expected: FAIL — cannot resolve `./lessonToPptx` (module does not exist yet).

- [ ] **Step 4: Implement the builder**

Create `src/export/lessonToPptx.ts`:

```ts
import type { ArabicItem, Lesson, Slide } from "@/content/schema";

// Narrow structural view of pptxgenjs. The app passes a real PptxGenJS
// instance; unit tests pass a lightweight fake.
export type DeckSlide = {
  background?: { color: string };
  addText(text: unknown, opts?: Record<string, unknown>): unknown;
  addImage(opts: Record<string, unknown>): unknown;
  addTable(rows: unknown[][], opts?: Record<string, unknown>): unknown;
  addNotes(notes: string): unknown;
};

export type Deck = {
  layout: string;
  addSlide(): DeckSlide;
};

const BG = "0B1020";
const HEADING = "7DD3FC";
const TEXT = "E7E9EE";
const MUTED = "AAB2C5";
const ACCENT = "FCD34D";
const ARABIC_FONT = "Amiri";
const TABLE_BORDER = { type: "solid", color: "3A4160", pt: 0.5 };

const bullets = (lines: string[], fontSize: number, color: string) =>
  lines.map((text) => ({ text, options: { bullet: true, breakLine: true, fontSize, color } }));

function addHeading(slide: DeckSlide, text: string): void {
  slide.addText(text, { x: 0.5, y: 0.35, w: 9, h: 0.6, fontSize: 26, bold: true, color: HEADING });
}

function renderTitle(slide: DeckSlide, s: Extract<Slide, { kind: "title" }>): void {
  slide.addText(s.heading, { x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 34, bold: true, color: TEXT, align: "center" });
  if (s.arabicDecor) {
    slide.addText(s.arabicDecor, {
      x: 0.5, y: 2.8, w: 9, h: 1.4,
      fontSize: 60, fontFace: ARABIC_FONT, color: ACCENT, align: "center", rtlMode: true,
    });
  }
}

function renderConcept(slide: DeckSlide, s: Extract<Slide, { kind: "concept" }>, images: Record<string, string>): void {
  addHeading(slide, s.heading);
  const img = s.image ? images[s.image] : undefined;
  slide.addText(bullets(s.body, 16, TEXT), { x: 0.5, y: 1.15, w: img ? 6.2 : 9, h: 2.3 });
  if (img) slide.addImage({ data: img, x: 7.0, y: 1.15, w: 2.5, h: 2.5 });
  if (s.items?.length) {
    slide.addText(s.items.map((i) => i.arabic).join("   "), {
      x: 0.5, y: 3.7, w: 9, h: 1.3,
      fontSize: 36, fontFace: ARABIC_FONT, color: ACCENT, align: "center", rtlMode: true,
    });
  }
}

function renderLetter(slide: DeckSlide, s: Extract<Slide, { kind: "letter" }>, images: Record<string, string>): void {
  const img = s.image ? images[s.image] : undefined;
  const title = [s.item.name, s.item.translit ? `(${s.item.translit})` : ""].filter(Boolean).join(" ");
  slide.addText(s.item.arabic, { x: 6.0, y: 0.6, w: 3.5, h: 2.4, fontSize: 110, fontFace: ARABIC_FONT, color: TEXT, align: "center" });
  slide.addText(title || s.item.arabic, { x: 0.5, y: 0.5, w: 5.2, h: 0.5, fontSize: 24, bold: true, color: TEXT });
  slide.addText(`Makhraj: ${s.makhraj}`, { x: 0.5, y: 1.1, w: 5.2, h: 0.4, fontSize: 15, color: HEADING });
  if (s.notes.length) slide.addText(bullets(s.notes, 13, MUTED), { x: 0.5, y: 1.65, w: 5.2, h: 1.6 });
  if (img) slide.addImage({ data: img, x: 0.5, y: 3.4, w: 1.9, h: 1.9 });
  const forms = s.forms;
  if (forms) {
    const order = ["isolated", "initial", "medial", "final"] as const;
    slide.addTable(
      [
        order.map((k) => ({ text: forms[k] ?? "—", options: { fontSize: 24, fontFace: ARABIC_FONT, color: TEXT, align: "center" } })),
        order.map((k) => ({ text: k, options: { fontSize: 9, color: MUTED, align: "center" } })),
      ],
      { x: 2.7, y: 3.5, w: 3.2, colW: [0.8, 0.8, 0.8, 0.8], border: TABLE_BORDER },
    );
  }
  if (s.example) {
    slide.addText(s.example.arabic, {
      x: 6.0, y: 3.3, w: 3.5, h: 0.7,
      fontSize: 30, fontFace: ARABIC_FONT, color: ACCENT, align: "center", rtlMode: true,
    });
    slide.addText(`${s.example.translit} — ${s.example.meaning}`, { x: 6.0, y: 4.0, w: 3.5, h: 0.5, fontSize: 12, color: MUTED, align: "center" });
  }
}

const drillCell = (text: string) => ({
  text,
  options: { fontSize: 24, fontFace: ARABIC_FONT, color: TEXT, align: "center" },
});

export function drillTableRows(grid: ArabicItem[][]) {
  const cols = Math.max(...grid.map((r) => r.length));
  return grid.map((row) => {
    const cells = row.map((item) => drillCell(item.arabic));
    while (cells.length < cols) cells.push(drillCell(""));
    return cells.reverse(); // RTL: first item lands in the rightmost column
  });
}

function renderDrill(slide: DeckSlide, s: Extract<Slide, { kind: "drill" }>): void {
  addHeading(slide, s.heading);
  slide.addText(s.instructions, { x: 0.5, y: 1.0, w: 9, h: 0.4, fontSize: 14, italic: true, color: MUTED });
  const rows = drillTableRows(s.grid);
  const cols = rows[0].length;
  slide.addTable(rows, {
    x: 0.5, y: 1.6, w: 9,
    colW: Array(cols).fill(9 / cols),
    rowH: Math.min(0.6, 3.6 / rows.length),
    border: TABLE_BORDER,
  });
}

function renderRecap(slide: DeckSlide, s: Extract<Slide, { kind: "recap" }>): void {
  addHeading(slide, s.heading);
  const lines = s.items.map((i) => [i.arabic, i.name ?? i.translit ?? ""].filter(Boolean).join(" — "));
  slide.addText(
    lines.map((text) => ({ text, options: { bullet: true, breakLine: true, fontSize: 20, fontFace: ARABIC_FONT, color: TEXT } })),
    { x: 0.5, y: 1.2, w: 9, h: 3.8 },
  );
}

function renderHomework(slide: DeckSlide, s: Extract<Slide, { kind: "homework" }>): void {
  addHeading(slide, s.heading);
  slide.addText(bullets(s.tasks, 16, TEXT), { x: 0.5, y: 1.2, w: 9, h: 3.8 });
}

function renderSlide(slide: DeckSlide, s: Slide, images: Record<string, string>): void {
  switch (s.kind) {
    case "title": return renderTitle(slide, s);
    case "concept": return renderConcept(slide, s, images);
    case "letter": return renderLetter(slide, s, images);
    case "drill": return renderDrill(slide, s);
    case "recap": return renderRecap(slide, s);
    case "homework": return renderHomework(slide, s);
  }
}

function titleNotes(lesson: Lesson): string {
  return [
    "OBJECTIVES:",
    ...lesson.objectives.map((o) => `- ${o}`),
    "",
    "TALKING SCRIPT:",
    ...lesson.teacherNotes.script.map((s, i) => `${i + 1}. ${s}`),
  ].join("\n");
}

function homeworkNotes(lesson: Lesson): string {
  return [
    `HOMEWORK: ${lesson.teacherNotes.homework}`,
    "",
    "LISTEN FOR:",
    ...lesson.teacherNotes.listenFor.map((s) => `- ${s}`),
  ].join("\n");
}

export function buildLessonDeck(deck: Deck, lesson: Lesson, images: Record<string, string> = {}): void {
  deck.layout = "LAYOUT_16x9";
  const slides = lesson.slides.map((s) => {
    const slide = deck.addSlide();
    slide.background = { color: BG };
    renderSlide(slide, s, images);
    return slide;
  });

  // Single addNotes call per slide, even if both note blocks land on one slide.
  const hwIdx = lesson.slides.findIndex((s) => s.kind === "homework");
  const notes = new Map<number, string[]>();
  const push = (i: number, text: string) => notes.set(i, [...(notes.get(i) ?? []), text]);
  push(0, titleNotes(lesson));
  push(hwIdx === -1 ? slides.length - 1 : hwIdx, homeworkNotes(lesson));
  for (const [i, parts] of notes) slides[i]?.addNotes(parts.join("\n\n"));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/export/lessonToPptx.test.ts`
Expected: PASS — 5 tests (12-lesson loop, notes, images, drill rows, smoke).

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: clean. (If `Extract<Slide, ...>` switch-return style trips a rule, fix per lint output — no rule suppressions.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/export/lessonToPptx.ts src/export/lessonToPptx.test.ts
git commit -m "feat: pptx deck builder mapping lesson slides + teacher notes"
```

---

### Task 2: ExportPptxButton component

**Files:**
- Create: `src/components/ExportPptxButton.tsx`
- Test: `src/components/ExportPptxButton.test.tsx`

**Interfaces:**
- Consumes: `buildLessonDeck`, `Deck` from `@/export/lessonToPptx` (Task 1); `Lesson` type from `@/content/schema`; dynamic `import("pptxgenjs")`.
- Produces: `export default function ExportPptxButton({ lesson }: { lesson: Lesson })` — Task 3 renders this on the teach page.

- [ ] **Step 1: Write the failing test**

Create `src/components/ExportPptxButton.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadLesson } from "@/content/load";
import ExportPptxButton from "./ExportPptxButton";

const writeFileMock = vi.fn();

vi.mock("pptxgenjs", () => ({
  default: class {
    layout = "";
    addSlide() {
      return { addText() {}, addImage() {}, addTable() {}, addNotes() {} };
    }
    writeFile = writeFileMock;
  },
}));

describe("ExportPptxButton", () => {
  beforeEach(() => {
    writeFileMock.mockReset().mockResolvedValue("ok");
    // Image fetches fail in tests → rasterize returns null → deck exports without images.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  });

  test("exports the deck with the lesson filename", async () => {
    const lesson = loadLesson("1-01");
    render(<ExportPptxButton lesson={lesson} />);
    await userEvent.click(screen.getByRole("button", { name: /export pptx/i }));
    expect(await screen.findByText(/exported/i)).toBeTruthy();
    expect(writeFileMock).toHaveBeenCalledWith({ fileName: "tajweed-1-01.pptx" });
  });

  test("shows a retry state when export fails", async () => {
    writeFileMock.mockRejectedValueOnce(new Error("boom"));
    render(<ExportPptxButton lesson={loadLesson("1-01")} />);
    await userEvent.click(screen.getByRole("button", { name: /export pptx/i }));
    expect(await screen.findByText(/failed/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ExportPptxButton.test.tsx`
Expected: FAIL — cannot resolve `./ExportPptxButton`.

- [ ] **Step 3: Implement the component**

Create `src/components/ExportPptxButton.tsx`:

```tsx
"use client";
import { useState } from "react";
import type { Lesson } from "@/content/schema";
import { buildLessonDeck, type Deck } from "@/export/lessonToPptx";

type Status = "idle" | "working" | "done" | "error";

// SVG → PNG data URL via canvas. Returns null on any failure so the
// export continues without that image.
async function rasterizeSvg(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const svg = await res.text();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`failed to load ${path}`));
        img.src = url;
      });
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = (img.naturalWidth || 512) * scale;
      canvas.height = (img.naturalHeight || 512) * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

const LABELS: Record<Status, string> = {
  idle: "⤓ Export PPTX",
  working: "Generating…",
  done: "Exported ✓ — export again",
  error: "Export failed — try again",
};

export default function ExportPptxButton({ lesson }: { lesson: Lesson }) {
  const [status, setStatus] = useState<Status>("idle");

  async function onExport() {
    setStatus("working");
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const paths = [...new Set(lesson.slides.flatMap((s) => ("image" in s && s.image ? [s.image] : [])))];
      const images: Record<string, string> = {};
      for (const p of paths) {
        const data = await rasterizeSvg(p);
        if (data) images[p] = data;
      }
      const pptx = new PptxGenJS();
      buildLessonDeck(pptx as unknown as Deck, lesson, images);
      await pptx.writeFile({ fileName: `tajweed-${lesson.id}.pptx` });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={status === "working"}
      className="mb-4 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-sky-300 hover:bg-white/10 disabled:opacity-50 print:hidden"
    >
      {LABELS[status]}
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ExportPptxButton.test.tsx`
Expected: PASS — 2 tests. (jsdom has no 2D canvas, so `rasterizeSvg` returns null and the deck builds without images — that path is intentional.)

- [ ] **Step 5: Lint + commit**

Run: `npm run lint`
Expected: clean.

```bash
git add src/components/ExportPptxButton.tsx src/components/ExportPptxButton.test.tsx
git commit -m "feat: ExportPptxButton — lazy pptxgenjs, svg rasterize, status states"
```

---

### Task 3: Wire into /teach page + full gate

**Files:**
- Modify: `src/app/teach/[id]/page.tsx` (add import + one JSX line)
- Create: `src/app/teach/[id]/page.test.tsx`

**Interfaces:**
- Consumes: `ExportPptxButton` default export from `@/components/ExportPptxButton` (Task 2).
- Produces: user-visible button on every `/teach/[id]` page.

- [ ] **Step 1: Write the failing page test**

Create `src/app/teach/[id]/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import TeachPage from "./page";

vi.mock("pptxgenjs", () => ({ default: class {} }));

describe("TeachPage", () => {
  test("renders the PPTX export button", async () => {
    render(await TeachPage({ params: Promise.resolve({ id: "1-01" }) }));
    expect(screen.getByRole("button", { name: /export pptx/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "src/app/teach/[id]/page.test.tsx"`
Expected: FAIL — no button role found (page doesn't render it yet).

- [ ] **Step 3: Add the button to the page**

Modify `src/app/teach/[id]/page.tsx` — add the import at the top:

```tsx
import ExportPptxButton from "@/components/ExportPptxButton";
```

and render it between the `<h1>` and the `.glass` div (the `<h1>` is at line 14):

```tsx
      <h1 className="gradient-text mb-4 text-2xl font-bold">{l.title}</h1>
      <ExportPptxButton lesson={l} />
      <div className="glass space-y-4 rounded-2xl p-4 sm:p-5">
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "src/app/teach/[id]/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Full gate**

Run: `npm run lint && npm test && npm run build`
Expected: lint clean; whole suite passes; static export build succeeds (confirms pptxgenjs is only in an async chunk and `output: "export"` still works).

- [ ] **Step 6: Commit**

```bash
git add "src/app/teach/[id]/page.tsx" "src/app/teach/[id]/page.test.tsx"
git commit -m "feat: pptx export button on teach pages"
```

- [ ] **Step 7: Manual smoke check (recommended)**

Run: `npm run dev`, open `http://localhost:3000/teach/1-04`, click **⤓ Export PPTX**, open `tajweed-1-04.pptx` in PowerPoint/Keynote: 16 dark slides, Arabic renders, title slide has speaker notes (objectives + script), homework slide has speaker notes (homework + listen-for), letter slides show the makhraj diagram images.
