import { allSlugs, noteBySlug } from "@/library/load";
import type { SourceNote } from "@/library/schema";
import { displayModeFor, withholdMatn } from "@/library/sources";
import { NoteHeader } from "@/components/library/NoteHeader";
import { NoteBody } from "@/components/library/NoteBody";
import { StatusNotice } from "@/components/library/StatusNotice";
import { MatnWithheld } from "@/components/library/MatnWithheld";

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export default async function LibraryNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = noteBySlug(slug);
  const kind = note.meta.type === "index" ? "rule" : note.meta.type;

  // Source notes whose Arabic is uncollated show structure, never the matn.
  let body = note;
  let withheld = 0;
  if (note.meta.type === "source" && displayModeFor(note.meta as SourceNote) === "withhold-matn") {
    const stripped = withholdMatn(note.body);
    withheld = stripped.withheldLines;
    body = { ...note, body: stripped.body };
  }

  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <NoteHeader note={note} />
      <StatusNotice status={note.meta.status} kind={kind} />
      {withheld > 0 && <MatnWithheld note={note.meta as SourceNote} lines={withheld} />}
      <NoteBody note={body} />
    </main>
  );
}
