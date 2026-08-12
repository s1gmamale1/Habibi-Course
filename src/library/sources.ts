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

const ARABIC = /[؀-ۿ]/;

/**
 * Does this heading OPEN a matn section?
 *
 * Only two shapes open one: the explicit `# The matn` H1 (Tuhfah, Jazariyyah) and the
 * `## Excerpt N — …` H2s (Nihayat). Shatibiyyah has neither — its matn sits directly
 * under Arabic-titled bab H2s — which `withholdMatn` handles via the continuation rule.
 */
function isMatnOpener(text: string, depth: number): boolean {
  const t = text.trim();
  if (depth === 1) return /^the matn$/i.test(t);
  if (depth === 2 && /^excerpt\s/i.test(t)) return true;
  return false;
}

/**
 * Remove the matn, keeping everything that frames it.
 *
 * THE CLOSING RULE IS WHAT MATTERS, and an earlier version got it wrong in a way that
 * shipped a live leak. That version asked "is this heading at least 35% Arabic?" and
 * treated anything below as the end of the matn. Every real bab in Jazariyyah scores
 * 0.366–0.585 — but `## المقدمة — Introduction` scores **0.318**, because half of it is
 * the English word "Introduction". So the matn "ended" at the Introduction, and the
 * opening verses of both poems — the most-memorised lines in the book — rendered in
 * full, next to a panel announcing that the source text was withheld. A false assurance
 * is worse than no assurance.
 *
 * The rule is now categorical rather than statistical: once a matn section is open, it
 * closes ONLY on an H1, or on an H2 with NO Arabic at all (`## Licensing`, `## What this
 * book does not cover`). A bab heading always carries some Arabic; back matter carries
 * none. An H2 that has Arabic and appears while closed opens a section — that is
 * Shatibiyyah's shape.
 *
 * "Matn" still means TEXT A STUDENT COULD MEMORISE FROM. Headings are always kept,
 * including Arabic bab headings, along with all metadata, chapter-structure tables,
 * provenance prose and the English rendering.
 *
 * Measured over the real notes: Jazariyyah 157 lines withheld, Tuhfah 92,
 * Shatibiyyah 51, Nihayat 84, Sajawandi (citation-only, no matn) 0.
 */
export function withholdMatn(body: string): { body: string; withheldLines: number } {
  let inMatn = false;
  let withheldLines = 0;
  const kept: string[] = [];

  for (const line of body.split("\n")) {
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const depth = h[1].length;
      const text = h[2].trim();
      if (isMatnOpener(text, depth)) inMatn = true;
      else if (depth === 1) inMatn = false;                       // any other H1 closes
      else if (depth === 2 && !ARABIC.test(text)) inMatn = false; // pure-English H2 closes
      else if (depth === 2 && !inMatn && ARABIC.test(text)) inMatn = true; // bab opens (Shatibiyyah)
      // an Arabic-bearing H2 while already open is a bab INSIDE the matn: leave it open
      kept.push(line);                                            // headings are never withheld
      continue;
    }
    if (inMatn && line.trim()) { withheldLines += 1; continue; }
    kept.push(line);
  }

  return { body: kept.join("\n"), withheldLines };
}
