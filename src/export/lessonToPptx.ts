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
  if (s.examples?.length) {
    const rowH = 0.62;
    const startY = Math.max(2.6, 4.55 - s.examples.length * rowH);
    s.examples.forEach((ex, i) => {
      const y = startY + i * rowH;
      slide.addText(ex.arabic, {
        x: 6.0, y, w: 2.0, h: rowH,
        fontSize: 22, fontFace: ARABIC_FONT, color: ACCENT, align: "center", rtlMode: true,
      });
      slide.addText(`${ex.translit} — ${ex.meaning}${ex.form ? ` (${ex.form})` : ""}`, {
        x: 8.0, y: y + 0.08, w: 1.9, h: rowH, fontSize: 9, color: MUTED, align: "left",
      });
    });
  }
}

const drillCell = (text: string, fontSize = 24) => ({
  text,
  options: { fontSize, fontFace: ARABIC_FONT, color: TEXT, align: "center" },
});

export function drillTableRows(grid: ArabicItem[][], fontSize = 24) {
  const cols = Math.max(...grid.map((r) => r.length));
  return grid.map((row) => {
    const cells = row.map((item) => drillCell(item.arabic, fontSize));
    while (cells.length < cols) cells.push(drillCell("", fontSize));
    return cells.reverse(); // RTL: first item lands in the rightmost column
  });
}

// 24pt fits comfortably up to 6 rows; beyond that the fixed cell height
// (rowH, capped below) would force text past the slide bottom, so the
// font shrinks as row count grows.
function drillFontSize(rowCount: number): number {
  if (rowCount <= 6) return 24;
  if (rowCount <= 9) return 18;
  return 14;
}

function renderDrill(slide: DeckSlide, s: Extract<Slide, { kind: "drill" }>): void {
  addHeading(slide, s.heading);
  slide.addText(s.instructions, { x: 0.5, y: 1.0, w: 9, h: 0.4, fontSize: 14, italic: true, color: MUTED });
  const fontSize = drillFontSize(s.grid.length);
  const rows = drillTableRows(s.grid, fontSize);
  const cols = rows[0].length;
  slide.addTable(rows, {
    x: 0.5, y: 1.6, w: 9,
    colW: Array(cols).fill(9 / cols),
    rowH: Math.min(0.55, 3.7 / rows.length),
    border: TABLE_BORDER,
  });
}

// Recap slides can carry a handful of items or (for late lessons) the
// full cumulative alphabet — up to ~56 entries. A single 20pt column
// only fits ~15 lines before PowerPoint clips it in slideshow mode, so
// items fan out into up to 3 side-by-side columns and the font shrinks
// as the list grows.
function recapFontSize(itemCount: number): number {
  // 13, not 14: the column split only kicks in above 14 items, so a 14-item recap renders as
  // one column, and 14 lines at 20pt run ~0.3" past the 3.8" text box. 13 lines is the most
  // that fits, and is also the largest recap in real content — so it keeps the base size.
  // (The original note proposed 12; that would needlessly shrink a recap that fits.)
  if (itemCount <= 13) return 20;
  if (itemCount <= 28) return 14;
  if (itemCount <= 42) return 12;
  return 11;
}

function renderRecap(slide: DeckSlide, s: Extract<Slide, { kind: "recap" }>): void {
  addHeading(slide, s.heading);
  const lines = s.items.map((i) => [i.arabic, i.name ?? i.translit ?? ""].filter(Boolean).join(" — "));
  const fontSize = recapFontSize(lines.length);
  const colCount = Math.min(3, Math.max(1, Math.ceil(lines.length / 14)));
  const perCol = Math.ceil(lines.length / colCount);
  for (let col = 0; col < colCount; col++) {
    const colLines = lines.slice(col * perCol, (col + 1) * perCol);
    if (!colLines.length) continue;
    slide.addText(
      colLines.map((text) => ({ text, options: { bullet: true, breakLine: true, fontSize, fontFace: ARABIC_FONT, color: TEXT } })),
      // Right-to-left: column 0 holds the first items and belongs furthest right. The rest of
      // the deck already honours RTL (drill rows are reversed), and a teacher reading Arabic
      // scans that way — filling left-to-right made the recap read backwards against its own deck.
      { x: 0.5 + (colCount - 1 - col) * (9 / colCount), y: 1.2, w: 9 / colCount, h: 3.8 },
    );
  }
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
