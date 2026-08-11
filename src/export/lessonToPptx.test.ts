// @vitest-environment node
import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";
import PptxGenJS from "pptxgenjs";
import { allLessonIds, loadLesson } from "@/content/load";
import type { Lesson } from "@/content/schema";
import { buildLessonDeck, drillTableRows, type Deck, type DeckSlide } from "./lessonToPptx";

const requireFromTest = createRequire(import.meta.url);

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
  prerequisites: [],
  games: [],
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

// Type-valid lesson with no homework slide, to exercise the notes fallback
// that pins homework notes onto the last deck slide.
const noHomeworkSlideLesson: Lesson = {
  id: "1-98",
  phase: 1,
  unit: "1.9",
  title: "Mini (no homework slide)",
  objectives: ["obj one"],
  prerequisites: [],
  games: [],
  slides: [
    { kind: "title", heading: "Mini lesson", arabicDecor: "ح" },
    {
      kind: "letter",
      item: { arabic: "ح", name: "haa", audio: teacherVoice("breathy h") },
      makhraj: "throat",
      notes: ["breathy letter"],
    },
  ],
  practice: { drills: [], dailyChecklist: ["read"] },
  teacherNotes: { script: ["say hello"], listenFor: ["breathy haa"], homework: "trace letters" },
  videos: [],
};

const recapItem = (n: number) => ({ arabic: `ح${n}`, audio: teacherVoice("x") });

function lessonWithRecap(itemCount: number): Lesson {
  return {
    id: "1-97",
    phase: 1,
    unit: "1.9",
    title: "Recap fixture",
    objectives: ["obj"],
    prerequisites: [],
    games: [],
    slides: [
      { kind: "title", heading: "Title", arabicDecor: "ح" },
      { kind: "recap", heading: "Recap", items: Array.from({ length: itemCount }, (_, i) => recapItem(i)) },
      { kind: "homework", heading: "Homework", tasks: ["review"] },
    ],
    practice: { drills: [], dailyChecklist: ["read"] },
    teacherNotes: { script: ["hi"], listenFor: ["x"], homework: "trace" },
    videos: [],
  };
}

const drillItem = (n: number) => ({ arabic: `د${n}`, audio: teacherVoice("x") });

function lessonWithDrillRows(rowCount: number): Lesson {
  return {
    id: "1-96",
    phase: 1,
    unit: "1.9",
    title: "Drill fixture",
    objectives: ["obj"],
    prerequisites: [],
    games: [],
    slides: [
      { kind: "title", heading: "Title", arabicDecor: "د" },
      { kind: "drill", heading: "Drill", instructions: "match the letters", grid: Array.from({ length: rowCount }, (_, i) => [drillItem(i)]) },
      { kind: "homework", heading: "Homework", tasks: ["review"] },
    ],
    practice: { drills: [], dailyChecklist: ["read"] },
    teacherNotes: { script: ["hi"], listenFor: ["x"], homework: "trace" },
    videos: [],
  };
}

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

  test("falls back to the last slide for homework notes when the lesson has no homework slide", () => {
    const deck = new FakeDeck();
    buildLessonDeck(deck, noHomeworkSlideLesson);
    const lastSlide = deck.slides[deck.slides.length - 1];
    expect(lastSlide.notes.join("\n")).toContain(noHomeworkSlideLesson.teacherNotes.homework);
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

  test("accepts an explicit fontSize for shrunk drill grids", () => {
    const item = (arabic: string) => ({ arabic, audio: teacherVoice("x") });
    const rows = drillTableRows([[item("ا")]], 14) as { options: { fontSize: number } }[][];
    expect(rows[0][0].options.fontSize).toBe(14);
  });
});

describe("renderRecap column layout", () => {
  test.each([
    [30, 3, 12],
    [56, 3, 11],
  ])("recap with %i items splits into %i columns at %ipt", (itemCount, expectedCols, expectedFontSize) => {
    const deck = new FakeDeck();
    buildLessonDeck(deck, lessonWithRecap(itemCount));
    const recapSlide = deck.slides[1];
    const columnRuns = recapSlide.texts.slice(1) as { text: { options: { fontSize: number } }[] }[]; // [0] is the heading
    expect(columnRuns).toHaveLength(expectedCols);
    const totalLines = columnRuns.reduce((sum, run) => sum + run.text.length, 0);
    expect(totalLines).toBe(itemCount);
    for (const run of columnRuns) {
      for (const line of run.text) {
        expect(line.options.fontSize).toBe(expectedFontSize);
      }
    }
  });

  test("small recap stays a single column at the base fontSize", () => {
    const deck = new FakeDeck();
    buildLessonDeck(deck, lessonWithRecap(5));
    const recapSlide = deck.slides[1];
    const columnRuns = recapSlide.texts.slice(1) as { text: { options: { fontSize: number } }[] }[];
    expect(columnRuns).toHaveLength(1);
    expect(columnRuns[0].text[0].options.fontSize).toBe(20);
  });

  // The deck honours RTL everywhere else — drill rows are reversed — and the teacher reading
  // it scans right to left. A recap that starts in the leftmost column reads backwards.
  test("recap columns fill right-to-left, so the first items sit furthest right", () => {
    const deck = new FakeDeck();
    buildLessonDeck(deck, lessonWithRecap(30)); // three columns
    const runs = deck.slides[1].texts.slice(1) as {
      text: { text: string }[];
      opts: { x: number };
    }[];
    expect(runs).toHaveLength(3);
    const xs = runs.map((r) => r.opts.x);
    expect(xs[0]).toBeGreaterThan(xs[1]);
    expect(xs[1]).toBeGreaterThan(xs[2]);
  });

  // 14 items at 20pt in a single column ends ~0.3" past the canvas. Unreachable in current
  // content (the largest real single-column recap is 13) but a latent trap for future content.
  test("a 14-item recap drops below the base fontSize rather than overflowing", () => {
    const deck = new FakeDeck();
    buildLessonDeck(deck, lessonWithRecap(14));
    const runs = deck.slides[1].texts.slice(1) as { text: { options: { fontSize: number } }[] }[];
    expect(runs[0].text[0].options.fontSize).toBeLessThan(20);
  });

  test("13 items — the largest recap in real content — still uses the base fontSize", () => {
    const deck = new FakeDeck();
    buildLessonDeck(deck, lessonWithRecap(13));
    const runs = deck.slides[1].texts.slice(1) as { text: { options: { fontSize: number } }[] }[];
    expect(runs).toHaveLength(1);
    expect(runs[0].text[0].options.fontSize).toBe(20);
  });
});

describe("renderDrill fontSize scaling", () => {
  test("a 12-row drill grid shrinks the cell fontSize", () => {
    const deck = new FakeDeck();
    buildLessonDeck(deck, lessonWithDrillRows(12));
    const drillSlide = deck.slides[1];
    const cell = drillSlide.tables[0].rows[0][0] as { options: { fontSize: number } };
    expect(cell.options.fontSize).toBe(14);
  });

  test("a 6-row drill grid keeps the default cell fontSize", () => {
    const deck = new FakeDeck();
    buildLessonDeck(deck, lessonWithDrillRows(6));
    const drillSlide = deck.slides[1];
    const cell = drillSlide.tables[0].rows[0][0] as { options: { fontSize: number } };
    expect(cell.options.fontSize).toBe(24);
  });
});

describe("smoke against real pptxgenjs", () => {
  test("keeps the audited PptxGenJS version and fails closed on its disabled image-size dependency", () => {
    expect(new PptxGenJS().version).toBe("4.0.1");
    expect(() => requireFromTest("image-size")).toThrow("all published releases are vulnerable");
  });

  test("produces a non-empty zip (pptx) for lesson 1-04", async () => {
    const pptx = new PptxGenJS();
    buildLessonDeck(pptx as unknown as Deck, loadLesson("1-04"));
    const b64 = (await pptx.write({ outputType: "base64" })) as string;
    expect(b64.startsWith("UEs")).toBeTruthy(); // "PK" zip magic in base64
  });
});

// C-1, from the independent review of PR #5. Five slide kinds — rule, ayah, contrast, legend,
// mistake — had no case in renderSlide and no default, so each rendered as a bare coloured
// background: 249 blank slides across the 74 published lessons. Every switch arm returns void,
// so TypeScript flagged nothing and all 425 tests stayed green.
//
// This sweeps REAL published content rather than a fixture, because the defect was invisible
// precisely to fixtures — the six pre-existing kinds worked fine.
describe("every published slide actually renders something", () => {
  const emptyByKind = new Map<string, string[]>();

  for (const id of allLessonIds()) {
    const lesson = loadLesson(id);
    const deck = new FakeDeck();
    buildLessonDeck(deck, lesson);
    lesson.slides.forEach((slide, i) => {
      const rendered = deck.slides[i];
      const objects = rendered.texts.length + rendered.images.length + rendered.tables.length;
      if (objects === 0) {
        const list = emptyByKind.get(slide.kind) ?? [];
        list.push(`${id}#${i}`);
        emptyByKind.set(slide.kind, list);
      }
    });
  }

  test("no slide in any published lesson exports with zero objects", () => {
    const summary = [...emptyByKind.entries()]
      .map(([kind, where]) => `${kind}: ${where.length} blank (e.g. ${where[0]})`)
      .join("; ");
    expect(summary, `blank slides in the exported deck — ${summary}`).toBe("");
  });

  test("all five tajweed slide kinds are present in the content being swept", () => {
    // Guards the test above against passing because the content stopped containing them.
    const kinds = new Set(allLessonIds().flatMap((id) => loadLesson(id).slides.map((s) => s.kind)));
    for (const k of ["rule", "ayah", "contrast", "legend", "mistake"]) {
      expect(kinds.has(k as never), `no ${k} slide in published content — sweep proves nothing`).toBe(true);
    }
  });
});

// I-3, same review. `listenFor` entries are a string OR a structured object; the notes builder
// interpolated both, so 367 entries across 59 lessons exported as "- [object Object]" in the
// speaker notes a teacher reads while teaching.
describe("speaker notes format structured listenFor entries", () => {
  test("no exported note anywhere contains [object Object]", () => {
    const offenders: string[] = [];
    for (const id of allLessonIds()) {
      const deck = new FakeDeck();
      buildLessonDeck(deck, loadLesson(id));
      for (const s of deck.slides) {
        if (s.notes.join("\n").includes("[object Object]")) offenders.push(id);
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });

  test("a structured entry contributes its item and correction cue", () => {
    const id = allLessonIds().find((i) =>
      loadLesson(i).teacherNotes.listenFor.some((s) => typeof s !== "string"),
    );
    expect(id, "no lesson uses the structured form — this test proves nothing").toBeTruthy();
    const lesson = loadLesson(id as string);
    const entry = lesson.teacherNotes.listenFor.find((s) => typeof s !== "string");
    const deck = new FakeDeck();
    buildLessonDeck(deck, lesson);
    const notes = deck.slides.map((s) => s.notes.join("\n")).join("\n");
    if (entry && typeof entry !== "string") {
      expect(notes).toContain(entry.item);
      expect(notes).toContain(entry.correctionCue);
    }
  });
});
