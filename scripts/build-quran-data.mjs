#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadCorpus } from "./lib/corpus.mjs";
import { courseVerses } from "./lib/verse-set.mjs";
import { flatten, clusterSafe } from "./lib/spans.mjs";

const ANNOTATIONS = "library/99-Corpus/tajweed.hafs.json";
const OUT_DIR = "src/generated/verses";

export function buildVerses() {
  const corpus = loadCorpus();
  const wanted = courseVerses();
  const raw = JSON.parse(readFileSync(ANNOTATIONS, "utf8"));
  const bySurah = new Map();

  for (const entry of raw) {
    const key = `${entry.surah}:${entry.ayah}`;
    if (!wanted.has(key)) continue;
    const text = corpus.get(key);
    if (!text) continue;

    const safe = entry.annotations.map((a) => ({
      rule: a.rule,
      start: clusterSafe(text, a.start, -1),
      end: clusterSafe(text, a.end, +1),
    })).filter((a) => a.start < a.end && a.end <= text.length);

    const spans = flatten(safe);
    if (!bySurah.has(entry.surah)) bySurah.set(entry.surah, []);
    bySurah.get(entry.surah).push({ ayah: entry.ayah, text, spans });
  }

  for (const ayat of bySurah.values()) ayat.sort((a, b) => a.ayah - b.ayah);
  return bySurah;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildVerses();
  mkdirSync(OUT_DIR, { recursive: true });
  let verses = 0;
  for (const [surah, ayat] of out) {
    writeFileSync(join(OUT_DIR, `${surah}.json`), JSON.stringify(ayat), "utf8");
    verses += ayat.length;
  }
  console.log(`wrote ${out.size} surahs, ${verses} verses to ${OUT_DIR}`);
}
