import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { parseNote } from "./frontmatter.mjs";
import { loadCorpus } from "./corpus.mjs";

const HIFZ_SURAHS = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e.startsWith(".")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === ".md") out.push(p);
  }
  return out;
}

/** Every "surah:ayah" the course needs rendered. */
export function courseVerses(libraryDir = "library") {
  const corpus = loadCorpus();
  const set = new Set();
  for (const key of corpus.keys()) {
    const surah = Number(key.split(":")[0]);
    if (HIFZ_SURAHS.includes(surah)) set.add(key);
  }
  for (const file of walk(libraryDir)) {
    let data;
    try { ({ data } = parseNote(readFileSync(file, "utf8"))); } catch { continue; }
    for (const ex of data.examples ?? []) {
      if (ex?.ref && corpus.has(ex.ref)) set.add(ex.ref);
    }
  }
  return set;
}
