import type { ArabicItem, Lesson, Slide } from "@/content/schema";
import { PALETTE_B, RULE_META } from "@/content/tajweed";
import { lookupVerse } from "@/components/tajweed/verses";

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
    case "rule": return renderRule(slide, s, images);
    case "ayah": return renderAyah(slide, s);
    case "contrast": return renderContrast(slide, s);
    case "legend": return renderLegend(slide, s);
    case "mistake": return renderMistake(slide, s);
    default: {
      // Exhaustiveness guard. Adding a slide kind to the schema without rendering it here is
      // now a COMPILE error — previously it was a blank slide in an exported deck, discovered
      // by a teacher rather than by the toolchain. This assignment is the whole point.
      const unhandled: never = s;
      throw new Error(`lessonToPptx: no renderer for slide kind ${JSON.stringify(unhandled)}`);
    }
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

// ─── The five tajweed slide kinds ──────────────────────────────────────────────────────────
//
// These shipped for weeks exporting as BLANK slides — 249 of them across the 74 published
// lessons (107 ayah, 55 rule, 45 mistake, 25 contrast, 17 legend). `renderSlide`'s switch had
// no case for them and no `default`, and because every arm returns `void`, TypeScript had
// nothing to complain about. A teacher exporting any Unit 3 deck got mostly empty slides.
//
// The `default: never` at the bottom of renderSlide is the part that stops this recurring:
// the next slide kind added to the schema now fails to compile until it is rendered here.

// pptxgenjs wants "RRGGBB"; the palette stores CSS "#RRGGBB".
const hex = (css: string) => css.replace("#", "").toUpperCase();

function ruleLabel(id: keyof typeof RULE_META): string {
  const m = RULE_META[id];
  return `${m.translit} — ${m.en}`;
}

function renderRule(slide: DeckSlide, s: Extract<Slide, { kind: "rule" }>, images: Record<string, string>): void {
  addHeading(slide, s.heading);
  const colour = hex(PALETTE_B[s.ruleId]);
  slide.addText(s.condition, { x: 0.5, y: 1.05, w: 9, h: 0.45, fontSize: 15, italic: true, color: colour });

  if (s.letters?.length) {
    slide.addText(s.letters.join("   "), {
      x: 0.5, y: 1.55, w: 9, h: 0.9,
      fontSize: 40, fontFace: ARABIC_FONT, color: colour, align: "center", rtlMode: true,
    });
  }
  const bodyY = s.letters?.length ? 2.5 : 1.6;
  const img = s.image ? images[s.image] : undefined;
  slide.addText(bullets(s.body, 15, TEXT), { x: 0.5, y: bodyY, w: img ? 6.2 : 9, h: 1.9 });
  if (img) slide.addImage({ data: img, x: 7.0, y: bodyY, w: 2.5, h: 2.5 });

  const footer = [
    s.harakat !== undefined ? `${s.harakat} ḥarakāt` : "",
    s.mnemonic ? `Mnemonic: ${s.mnemonic}` : "",
  ].filter(Boolean).join("     ");
  if (footer) slide.addText(footer, { x: 0.5, y: 4.6, w: 9, h: 0.4, fontSize: 13, color: ACCENT });
}

function renderAyah(slide: DeckSlide, s: Extract<Slide, { kind: "ayah" }>): void {
  const verse = lookupVerse(s.surah, s.ayah);
  addHeading(slide, `Qur'ān ${s.surah}:${s.ayah}`);
  // A missing verse is a content bug, not a render bug — say so on the slide rather than
  // emitting an empty one, which is exactly the failure this whole block exists to fix.
  slide.addText(verse?.text ?? `[verse ${s.surah}:${s.ayah} not in the bundled set]`, {
    x: 0.5, y: 1.2, w: 9, h: 1.8,
    fontSize: 34, fontFace: ARABIC_FONT, color: verse ? TEXT : ACCENT, align: "center", rtlMode: true,
  });
  if (s.translation) {
    slide.addText(s.translation, { x: 0.5, y: 3.1, w: 9, h: 0.9, fontSize: 14, italic: true, color: MUTED, align: "center" });
  }
  if (s.highlight?.length) {
    slide.addText(
      s.highlight.map((id) => ({
        text: ruleLabel(id),
        options: { fontSize: 12, color: hex(PALETTE_B[id]), breakLine: false },
      })),
      { x: 0.5, y: 4.15, w: 9, h: 0.6, align: "center" },
    );
  }
}

function renderContrast(slide: DeckSlide, s: Extract<Slide, { kind: "contrast" }>): void {
  addHeading(slide, s.heading);
  const rows = [
    [
      { text: "Word", options: { bold: true, color: MUTED, fontSize: 12 } },
      { text: "Reference", options: { bold: true, color: MUTED, fontSize: 12 } },
      { text: "Why", options: { bold: true, color: MUTED, fontSize: 12 } },
    ],
    ...s.pairs.map((p) => [
      { text: p.text, options: { fontFace: ARABIC_FONT, fontSize: 22, color: hex(PALETTE_B[p.rule]), rtlMode: true } },
      { text: `${p.surah}:${p.ayah}`, options: { fontSize: 12, color: MUTED } },
      { text: p.note, options: { fontSize: 12, color: TEXT } },
    ]),
  ];
  slide.addTable(rows, { x: 0.5, y: 1.15, w: 9, colW: [2.4, 1.2, 5.4], border: TABLE_BORDER, autoPage: false });
}

function renderLegend(slide: DeckSlide, s: Extract<Slide, { kind: "legend" }>): void {
  addHeading(slide, s.heading);
  slide.addText(
    s.rules.map((id) => ({
      text: `${RULE_META[id].ar}  ·  ${ruleLabel(id)}`,
      options: { bullet: true, breakLine: true, fontSize: 15, color: hex(PALETTE_B[id]), fontFace: ARABIC_FONT },
    })),
    { x: 0.5, y: 1.15, w: 9, h: 3.6 },
  );
}

function renderMistake(slide: DeckSlide, s: Extract<Slide, { kind: "mistake" }>): void {
  addHeading(slide, s.heading);
  const rows = [
    [
      { text: "The mistake", options: { bold: true, color: MUTED, fontSize: 12 } },
      { text: "Why it happens", options: { bold: true, color: MUTED, fontSize: 12 } },
      { text: "The fix", options: { bold: true, color: MUTED, fontSize: 12 } },
    ],
    ...s.mistakes.map((m) => [
      { text: m.wrong, options: { fontSize: 13, color: "F87171" } },
      { text: m.why, options: { fontSize: 12, color: MUTED } },
      { text: m.fix, options: { fontSize: 13, color: TEXT } },
    ]),
  ];
  slide.addTable(rows, { x: 0.5, y: 1.15, w: 9, colW: [3, 3, 3], border: TABLE_BORDER, autoPage: false });
}

// `listenFor` entries are EITHER a plain string or the structured ListenFor object the tajweed
// units author. Interpolating the object form gave "- [object Object]" — 367 entries across 59
// lessons, in the speaker notes a teacher reads while teaching. Mirrors the rendering in
// src/app/teach/[id]/page.tsx so the deck and the teacher page say the same thing.
function formatListenFor(s: Lesson["teacherNotes"]["listenFor"][number]): string {
  if (typeof s === "string") return s;
  const parts = [s.item, s.makhraj ? `(${s.makhraj})` : ""].filter(Boolean).join(" ");
  const why = s.whyItHappens ? ` Why: ${s.whyItHappens}` : "";
  const severity = s.severityIfWrong
    ? ` [${s.severityIfWrong === "jali" ? "jali — major" : "khafi — minor"}]`
    : "";
  return `${parts} — mistake: ${s.commonMistake}.${why} Say: "${s.correctionCue}"${severity}`;
}

function homeworkNotes(lesson: Lesson): string {
  return [
    `HOMEWORK: ${lesson.teacherNotes.homework}`,
    "",
    "LISTEN FOR:",
    ...lesson.teacherNotes.listenFor.map((s) => `- ${formatListenFor(s)}`),
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
