import type { SourceNote } from "./schema";

export type SourceDisplay = "withhold-matn" | "full";

/**
 * Which sources withhold their source text.
 *
 * `full-text`, `partial` and `excerpts` all carry Arabic a student could memorise
 * from — Jazariyyah (144 Arabic lines), Tuhfah (95), Shatibiyyah (33), Nihayat (47).
 * `citation-only` (Sajawandi) has no matn by design, and `metadata-only` (Everyayah,
 * the two video notes) are catalogues — so far this matches `vendored` alone.
 *
 * But `vendored: full-text` is not unique to those four: Tanzil and
 * cpfair/quran-tajweed are also `full-text` (they vendor the Qur'an corpus and its
 * tajweed annotations), and neither has a matn a student could memorise from — they
 * are machine-readable data, not a classical treatise. `author_arabic` is what
 * actually separates the two cases: it is set only on works attributed to a named
 * classical author, which is exactly the four sources above (Sajawandi has it too,
 * but its `citation-only` vendoring already excludes it here).
 */
export function displayModeFor(note: SourceNote): SourceDisplay {
  const carriesSourceText =
    note.vendored === "full-text" || note.vendored === "partial" || note.vendored === "excerpts";
  return carriesSourceText && note.author_arabic !== undefined ? "withhold-matn" : "full";
}

const ARABIC = /[؀-ۿ]/g;
const arabicShare = (s: string) => (s.match(ARABIC) ?? []).length / Math.max(s.length, 1);

/**
 * Is this heading the start of a matn section?
 *
 * This is STRUCTURAL, not statistical, and that matters — an earlier draft of this
 * function judged individual lines by Arabic density and withheld almost nothing,
 * because the matn lives inside TABLES (Jazariyyah 119 of its 144 Arabic lines,
 * Tuhfah 71 of 95) and inside BLOCKQUOTES (Nihayat, 21 of 47). Any line-shape rule
 * that preserves tables and quotes — as it must, since glossaries and symbol tables
 * are exactly what we keep — preserves the matn along with them.
 *
 * The four notes mark their matn three different ways:
 *   - Tuhfah and Jazariyyah: an explicit `# The matn` H1.
 *   - Nihayat: five `## Excerpt N — …` sections.
 *   - Shatibiyyah: four Arabic-titled bab H2s.
 */
function isMatnHeading(text: string, depth: number): boolean {
  const t = text.trim();
  if (depth === 1) return /^the matn$/i.test(t);
  if (depth === 2 && /^excerpt\s/i.test(t)) return true;
  if (depth === 2 && arabicShare(t) >= 0.35) return true;
  return false;
}

/**
 * Remove the matn, keeping everything that frames it.
 *
 * "Matn" here means TEXT A STUDENT COULD MEMORISE FROM — the vocalised verse lines
 * and excerpt bodies. It does NOT mean every Arabic glyph. Headings are ALWAYS kept,
 * including Arabic bab headings, and so is all frontmatter-derived metadata, the
 * chapter-structure tables, the provenance prose and the English rendering.
 *
 * Withholding every Arabic character would leave an unreadable page and would
 * overstate the instruction, which is about memorisable source text specifically.
 *
 * Measured over the real notes: Jazariyyah 147 lines withheld, Tuhfah 85,
 * Shatibiyyah 42, Nihayat 84, Sajawandi (citation-only, no matn) 0.
 */
export function withholdMatn(body: string): { body: string; withheldLines: number } {
  let inMatn = false;
  let withheldLines = 0;
  const kept: string[] = [];

  for (const line of body.split("\n")) {
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const depth = h[1].length;
      if (isMatnHeading(h[2], depth)) inMatn = true;
      else if (depth <= 2) inMatn = false;  // an English H1/H2 closes the matn
      kept.push(line);                       // headings are never withheld
      continue;
    }
    if (inMatn && line.trim()) { withheldLines += 1; continue; }
    kept.push(line);
  }

  return { body: kept.join("\n"), withheldLines };
}
