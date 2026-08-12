import Link from "next/link";
import type { LoadedNote } from "@/library/load";

/** One row in a section index. Status is shown here so arrival is never a surprise. */
export function NoteCard({ note }: { note: LoadedNote }) {
  const m = note.meta;
  // Narrow on the DISCRIMINANT, never on `"key" in m`. SourceNoteSchema is
  // `.passthrough()`, which gives SourceNote a string index signature — so every
  // `in` check is true on the source branch and the union collapses to `unknown`.
  const title =
    m.type === "rule" ? m.english
    : m.type === "letter" ? m.name
    : m.type === "source" && m.title ? m.title
    : note.basename;
  return (
    <li className="glass rim-static rounded-2xl p-4">
      <Link href={`/library/${note.slug}`} className="block">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-white/90">{title}</span>
          {(m.type === "rule" || m.type === "letter") && <span className="arabic text-xl text-white/80" dir="rtl" lang="ar">{m.arabic}</span>}
        </span>
        {/* The formal citation title (e.g. "Hirz al-Amani wa Wajh at-Tahani...") often
            doesn't contain the short name the rest of the app cites by — the vault
            filename, e.g. "Shatibiyyah" — so show it as a subtitle when it differs. */}
        {m.type === "source" && m.title && <span className="mt-0.5 block text-xs text-white/45">{note.basename}</span>}
        {m.status === "needs-review" && <span className="mt-1 block text-xs text-amber-200/80">Needs review</span>}
        {m.status === "draft" && <span className="mt-1 block text-xs text-white/45">Not yet reviewed</span>}
      </Link>
    </li>
  );
}
