import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CORPUS = join(HERE, "..", "..", "library", "99-Corpus", "quran-uthmani.txt");

/**
 * Load the pinned Tanzil corpus into a Map keyed "surah:ayah".
 * Format per line: surah|ayah|text
 *
 * The pinned file is CRLF-terminated and carries a `#` comment header and
 * footer, so split on either line ending and skip lines without two pipes.
 */
export function loadCorpus(path = DEFAULT_CORPUS) {
  const raw = readFileSync(path, "utf8");
  const map = new Map();
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const first = line.indexOf("|");
    const second = line.indexOf("|", first + 1);
    if (first === -1 || second === -1) continue;
    const surah = line.slice(0, first);
    const ayah = line.slice(first + 1, second);
    const text = line.slice(second + 1).normalize("NFC");
    map.set(`${surah}:${ayah}`, text);
  }
  return map;
}

/**
 * Verify a quoted example occurs verbatim in the cited ayah.
 * @returns {{ok: boolean, reason?: string}}
 */
export function verifyExample(corpus, { ref, text }) {
  const ayah = corpus.get(ref);
  if (!ayah) return { ok: false, reason: `no such ayah: ${ref}` };
  const needle = String(text).normalize("NFC").trim();
  if (!needle) return { ok: false, reason: "empty example text" };
  if (!ayah.includes(needle)) {
    return { ok: false, reason: `not found in ${ref}: ${needle}` };
  }
  return { ok: true };
}
