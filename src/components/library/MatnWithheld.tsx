import type { SourceNote } from "@/library/schema";

/**
 * Shown in place of a withheld matn.
 *
 * This is not caution for its own sake. library/01-Sources/Source-Manifest.md records
 * that the Tuhfah transcription carries "visible vocalisation defects (missing shadda
 * in verses 2 and 52, a wrong vowel in verse 60, `ى` for final `ي` in several places)"
 * and instructs that "since a matn is memorised from the page, it must be collated
 * against a printed critical edition before being shown to a learner."
 */
export function MatnWithheld({ note, lines }: { note: SourceNote; lines: number }) {
  return (
    <aside role="note" className="glass my-6 rounded-2xl border border-amber-400/30 p-4 sm:p-5">
      <h2 className="mb-2 font-semibold text-amber-100/90">The source text is not shown here</h2>
      <p className="text-sm leading-relaxed text-white/75">
        {lines} lines of Arabic from this work are withheld pending collation against a printed
        critical edition. A matn is memorised from the page, so an uncollated transcription is
        not safe to learn from — the structure, chapter order and translation below are.
      </p>
      {note.url && (
        <p className="mt-3 text-sm">
          <a href={note.url} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70">
            Read the original at the source
          </a>{" "}
          <span className="text-white/50">({note.licence ?? "public domain"})</span>
        </p>
      )}
    </aside>
  );
}
