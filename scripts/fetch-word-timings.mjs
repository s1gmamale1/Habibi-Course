#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const RECITATION = 12; // Husary Mu'allim
const SURAHS = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
const OUT_DIR = "src/generated/timings";
const UA = "habibi-course/1.0";

async function fetchChapter(n) {
  const url = `https://api.quran.com/api/v4/recitations/${RECITATION}/by_chapter/${n}?fields=segments`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${n}: HTTP ${res.status}`);
  const json = await res.json();
  return (json.audio_files ?? []).map((f) => ({
    ayah: Number(String(f.verse_key).split(":")[1]),
    segments: f.segments ?? [],
  }));
}

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const n of SURAHS) {
    const data = await fetchChapter(n);
    const missing = data.filter((d) => d.segments.length === 0).length;
    writeFileSync(join(OUT_DIR, `${n}.json`), JSON.stringify(data), "utf8");
    console.log(`surah ${n}: ${data.length} ayat, ${missing} without segments`);
    if (missing > 0) console.warn(`  WARN surah ${n} has ${missing} ayat with no timing data`);
  }
};

main().catch((e) => { console.error(e); process.exit(1); });
