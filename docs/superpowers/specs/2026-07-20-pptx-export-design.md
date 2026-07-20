# PPTX Export for Teacher Decks — Design

**Date:** 2026-07-20
**Status:** Approved (owner) — pending implementation plan

## Goal

Add a one-click "Export PPTX" option to each `/teach/[id]` page that downloads the
lesson as a PowerPoint deck the owner can teach from: the lesson's `slides` array
as slides, plus `teacherNotes` as speaker notes.

Decisions made during brainstorming:

- **Audience:** teacher deck (includes `teacherNotes`; consistent with teacher-only
  `/teach` pages — student pages never ship these notes).
- **Granularity:** one `.pptx` per lesson, named `tajweed-<id>.pptx` (e.g.
  `tajweed-1-04.pptx`).
- **Delivery:** client-side button on the `/teach` page. pptxgenjs is dynamically
  imported on first click so it never affects normal page-load. Works on the
  static export (`output: "export"`) and the cloudflared share flow.

## Architecture

Two new files, one edited page:

| File | Role |
|---|---|
| `src/export/lessonToPptx.ts` | Pure builder: `buildLessonDeck(pptx, lesson, images)` maps a Zod-validated `Lesson` onto a pptxgenjs instance. No React, no DOM — runs under vitest in node with the real pptxgenjs. |
| `src/components/ExportPptxButton.tsx` | `"use client"`. Props: `lesson: Lesson`. On click: dynamic `import("pptxgenjs")` → rasterize referenced makhraj SVGs → `buildLessonDeck` → `pptx.writeFile({ fileName })`. States: idle → generating → done/error (retry). |
| `src/app/teach/[id]/page.tsx` | Renders `<ExportPptxButton lesson={l} />` under the lesson title. The page already loads the full lesson server-side. |

New dependency: `pptxgenjs` (runtime dep; loaded lazily client-side only).

## Slide mapping

1:1 with the lesson's `slides` array. Dark background matching the site theme;
font name `Amiri` on Arabic runs with `rtlMode` — PowerPoint falls back to a
system Arabic font when Amiri isn't installed (pptxgenjs cannot embed fonts).

| Slide kind | Layout |
|---|---|
| `title` | Centered heading + large Arabic decor |
| `letter` | Huge glyph; name + makhraj line; isolated/initial/medial/final forms row; example word; makhraj image if present |
| `concept` | Heading, body paragraph, bullet items; Arabic items large + RTL; optional image |
| `drill` | Heading + instructions + RTL table of the grid's Arabic cells |
| `recap` | Heading + bullet items |
| `homework` | Heading + task bullets |

## Speaker notes

`teacherNotes.script` is a flat per-lesson array (not per-slide), so:

- **Title slide notes:** objectives + the numbered talking script.
- **Homework slide notes:** homework text + the "listen for" mistakes list.
  (Every lesson's last slide is `homework`; if a lesson lacked one, these notes
  attach to the final slide.)

## Images

Only the 5 makhraj SVGs under `public/images/makhraj/` are referenced by slides.
The button rasterizes each referenced SVG in the browser (load into `Image`,
draw to canvas at 2× scale, export PNG data URL) and passes them to the builder
as a `Record<path, dataUrl>`. A failed fetch/rasterize skips that image; the
deck still exports.

## Error handling

- Whole export wrapped in try/catch; button shows an error/retry state.
- Content is schema-validated at build time, so the builder trusts the `Lesson`
  type and does not re-validate.

## Testing

- **Unit (`src/export/lessonToPptx.test.ts`):** run `buildLessonDeck` against all
  12 real lessons — no throw, slide count matches `slides.length`, title-slide
  notes contain script text. Plus a minimal fixture case.
- **Component:** mock `pptxgenjs`; click the button; assert `writeFile` called
  with `tajweed-<id>.pptx` and error state on rejection.
- Existing gate (`npm run lint`, `npm test`) stays green.

## Out of scope

- Student-deck variant, whole-course combined deck (can layer on later).
- Font embedding, YouTube audio/video embedding in slides, PDF export.
