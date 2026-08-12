import { allNotes } from "@/library/load";
import { RULE_FAMILIES } from "@/library/schema";
import { NoteCard } from "@/components/library/NoteCard";

export default function RulesPage() {
  const rules = allNotes().filter((n) => n.meta.type === "rule");
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-6 text-3xl font-bold">Tajweed rules</h1>
      {RULE_FAMILIES.map((family) => {
        const inFamily = rules.filter((n) => (n.meta as { family: string }).family === family);
        if (inFamily.length === 0) return null;
        return (
          <section key={family} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">{family}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {inFamily.map((n) => <NoteCard key={n.slug} note={n} />)}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
