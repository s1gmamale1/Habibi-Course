#!/usr/bin/env node
// Points every tongue-letter slide at its own makhraj diagram.
//
// The mapping is READ FROM `makhraj_point` in the library notes — never typed
// out here. ADR-003 makes the note the source and the JSON the transcription,
// and a second hand-written table is exactly the thing that goes stale: the
// rule/lesson `taught_in` drift recorded in `check-library.mjs` happened that
// way. `src/content/makhraj.test.ts` re-derives the same join independently, so
// this script and that gate cannot agree by sharing a mistake.
//
// Idempotent: rerunning changes nothing once the JSON already agrees.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const points = new Map();
const letterDir = join(ROOT, "library", "03-Letters");
for (const file of readdirSync(letterDir)) {
  if (!file.endsWith(".md")) continue;
  const text = readFileSync(join(letterDir, file), "utf8");
  if (!/^makhraj_zone: lisan$/m.test(text)) continue;
  const arabic = /^arabic:\s*(.+)$/m.exec(text)?.[1].trim().replace(/^"|"$/g, "");
  const point = /^makhraj_point:\s*(\d+)$/m.exec(text)?.[1];
  if (arabic && point) points.set(arabic, Number(point));
}
if (points.size !== 18) {
  console.error(`ERROR expected 18 tongue letters, found ${points.size}`);
  process.exit(1);
}

const lessonDir = join(ROOT, "content", "lessons");
let changed = 0;
const skipped = [];

for (const file of readdirSync(lessonDir).sort()) {
  if (!file.endsWith(".json")) continue;
  const path = join(lessonDir, file);
  const raw = readFileSync(path, "utf8");
  const lesson = JSON.parse(raw);

  const wanted = [];
  for (const slide of lesson.slides ?? []) {
    if (slide.kind !== "letter") continue;
    const point = points.get(slide.item?.arabic);
    if (!point) continue;
    const want = `/images/makhraj/lisan-${point}.jpg`;
    if (slide.image !== want) wanted.push({ slide, want, had: slide.image });
  }
  if (wanted.length === 0) continue;

  /**
   * Is this file in `JSON.stringify(…, 2)` form already?
   *
   * Most lesson JSON is, but `1-01.json` is hand-authored with one slide per
   * line. Re-serialising that turned 26 field edits into 413 lines of
   * whitespace churn, which buries the real change and throws away a layout its
   * author chose. So the round-trip is only used where it is provably lossless;
   * everything else gets a surgical text edit.
   */
  const lossless = `${JSON.stringify(lesson, null, 2)}\n` === raw;

  if (lossless) {
    for (const w of wanted) w.slide.image = w.want;
    writeFileSync(path, `${JSON.stringify(lesson, null, 2)}\n`);
    changed += wanted.length;
    console.log(`  ${file}  (${wanted.length})`);
    continue;
  }

  // Hand-formatted: replace image VALUES in document order, one occurrence at a
  // time. Inserting a missing key would mean guessing where the author would
  // have put it, so that is refused loudly rather than done badly.
  const insertions = wanted.filter((w) => !w.had);
  if (insertions.length) {
    skipped.push(`${file}: ${insertions.length} slide(s) need an image key added by hand`);
    continue;
  }
  let text = raw;
  let cursor = 0;
  for (const w of wanted) {
    const needle = `"image": ${JSON.stringify(w.had)}`;
    const at = text.indexOf(needle, cursor);
    if (at === -1) {
      skipped.push(`${file}: could not locate ${needle}`);
      break;
    }
    const replacement = `"image": ${JSON.stringify(w.want)}`;
    text = text.slice(0, at) + replacement + text.slice(at + needle.length);
    cursor = at + replacement.length;
    changed += 1;
  }
  writeFileSync(path, text);
  console.log(`  ${file}  (${wanted.length}, text-patched)`);
}

for (const s of skipped) console.error(`SKIPPED ${s}`);
console.log(`\n${changed} letter slides wired to their makhraj point`);
if (skipped.length) process.exit(1);
