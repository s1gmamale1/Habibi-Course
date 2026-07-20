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
