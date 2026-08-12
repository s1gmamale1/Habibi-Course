import { allNotes } from "@/library/load";
import { NoteCard } from "@/components/library/NoteCard";

/**
 * Index of every `type: "index"` note — currently Glossary and Sifat.
 *
 * This is the box's real index page, not the Glossary note's own detail page. Before
 * this route existed, the "Glossary & reference" card on `/library` linked straight to
 * `/library/glossary` (the Glossary note itself), so Sifat — also `type: "index"` and
 * counted in that card's total — was reachable only from body wikilinks in other notes.
 */
export default function ReferencePage() {
  const notes = allNotes().filter((n) => n.meta.type === "index");
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-6 text-3xl font-bold">Glossary & reference</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {notes.map((n) => <NoteCard key={n.slug} note={n} />)}
      </ul>
    </main>
  );
}
