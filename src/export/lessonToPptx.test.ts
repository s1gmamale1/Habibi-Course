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
