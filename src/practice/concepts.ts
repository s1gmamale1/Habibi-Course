/**
 * What may be called a concept.
 *
 * Scheduling is keyed on concepts, not items (ADR-008): **88 of them**, 59
 * tajweed rules and 29 letters, generated from the library — the source of
 * truth — into `@/generated/concepts` (see `scripts/build-concepts.mjs`).
 * Nothing enforced that before this module. A typo in a `conceptId` wrote a
 * real row that `derive()` folded and `schedulesFromLedger` built a schedule
 * for — a concept the learner could never be shown, because no exemplar in
 * any pool carries that id. The ledger is append-only, so the row could not
 * be corrected afterwards either.
 *
 * **The check is asymmetric on purpose.** A rule id is validated against the
 * closed list of 59, so `"ikhfaa"` is rejected. A letter is validated
 * *structurally* — one Arabic letter — rather than against the 29, because the
 * taught letters are derived per lesson from `content/lessons/*.json` behind
 * `node:fs` and this module has to run in a browser, and after ADR-007 on a
 * server with no DOM. That limit is honest rather than incidental: it catches
 * malformed ids, not wrong-but-well-formed ones. A `"ب"` mistyped as `"ت"` is a
 * different valid concept, and nothing cheap tells those apart.
 */
import { RULE_CONCEPTS } from "@/generated/concepts";

const RULES: ReadonlySet<string> = new Set(RULE_CONCEPTS);

/**
 * One Arabic letter, as a single grapheme cluster.
 *
 * Graphemes rather than code points: the Uthmani corpus writes the maddah as a
 * combining U+0653 over a plain alif, so a letter concept can be two code
 * points and still be one letter. `\p{Script=Arabic}` covers the letters and
 * their combining marks; the base must be a letter, so a bare mark or a lone
 * tatweel does not qualify.
 */
const SEGMENTER = new Intl.Segmenter("ar", { granularity: "grapheme" });

/**
 * An Arabic base letter followed by any combining marks.
 *
 * `\p{M}*` for the tail, **not** `\p{Script=Arabic}*`: a combining mark carries
 * `Script=Inherited`, not the script of what it sits on, so the maddah U+0653
 * over an alif fails a script test on the mark. That is not hypothetical — it
 * is how the corpus writes آ, and it was what the first version of this rejected.
 *
 * `\p{Lo}` for the base rather than `\p{L}`: Arabic letters are Other_Letter,
 * while the tatweel U+0640 is Modifier_Letter. A lone tatweel is a stretch of
 * baseline, not a concept.
 */
const ARABIC_LETTER = /^(?=\p{Lo})\p{Script=Arabic}\p{M}*$/u;

function isSingleArabicLetter(value: string): boolean {
  const graphemes = [...SEGMENTER.segment(value)];
  if (graphemes.length !== 1) return false;
  return ARABIC_LETTER.test(graphemes[0].segment);
}

/**
 * Is this a concept the scheduler can act on?
 *
 * Used at the ledger's append boundary, which is the only place a bad id can
 * become permanent. Pure and IO-free, so it runs unchanged server-side.
 */
export function isConceptId(value: string): boolean {
  if (!value || !value.trim()) return false;
  return RULES.has(value) || isSingleArabicLetter(value);
}
