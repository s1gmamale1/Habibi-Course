import { allNotes } from "@/library/load";
import { NoteCard } from "@/components/library/NoteCard";

/**
 * The index is generated FROM THE NOTES, never rendered from Source-Manifest.md.
 *
 * The manifest lists 7 of the 11 sources — Shatibiyyah, Sajawandi-Waqf and Nihayat are
 * absent — and it is `status: verified`, so nothing flags the omission. Rendering it as
 * the index would silently vanish three of the five classical sources.
 */
const GROUPS = [
  { label: "Classical", match: (f: string) => f.includes("/Classical/") },
  { label: "Data", match: (f: string) => f.includes("/Data/") },
  { label: "Video", match: (f: string) => f.includes("/Video/") },
  { label: "Manifest", match: (f: string) => f.endsWith("Source-Manifest.md") },
];

export default function SourcesPage() {
  const sources = allNotes().filter((n) => n.meta.type === "source");
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-6 text-3xl font-bold">Sources</h1>
      {GROUPS.map((g) => {
        const inGroup = sources.filter((n) => g.match(n.file));
        if (inGroup.length === 0) return null;
        return (
          <section key={g.label} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">{g.label}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {inGroup.map((n) => <NoteCard key={n.slug} note={n} />)}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
