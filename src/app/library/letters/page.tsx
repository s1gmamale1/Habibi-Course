import { allNotes } from "@/library/load";
import { MAKHRAJ_ZONES } from "@/library/schema";
import { NoteCard } from "@/components/library/NoteCard";

export default function LettersPage() {
  const letters = allNotes().filter((n) => n.meta.type === "letter");
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-6 text-3xl font-bold">The letters</h1>
      {MAKHRAJ_ZONES.map((zone) => {
        const inZone = letters.filter((n) => (n.meta as { makhraj_zone: string }).makhraj_zone === zone);
        if (inZone.length === 0) return null;
        return (
          <section key={zone} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">{zone}</h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {inZone.map((n) => <NoteCard key={n.slug} note={n} />)}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
