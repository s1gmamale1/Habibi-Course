import Link from "next/link";
import { allNotes } from "@/library/load";

export default function LibraryPage() {
  const notes = allNotes();
  const count = (t: string) => notes.filter((n) => n.meta.type === t).length;
  const sections = [
    { href: "/library/rules", title: "Tajweed rules", n: count("rule"), blurb: "Every rule the course teaches, with its sources and worked examples." },
    { href: "/library/letters", title: "The letters", n: count("letter"), blurb: "All 29 letters — makhraj, sifat, and what each is confused with." },
    { href: "/library/sources", title: "Sources", n: count("source"), blurb: "The classical matns and data sets this course is built on." },
    { href: "/library/glossary", title: "Glossary", n: 1, blurb: "Uzbek · Arabic · English, in the forms this course uses." },
  ];

  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-2 text-3xl font-bold">Library</h1>
      <p className="mb-8 text-white/65">Everything the course is built on, in one place.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.href} className="glass rim-static rounded-2xl p-5">
            <Link href={s.href}>
              <h2 className="mb-1 font-semibold text-white/90">{s.title} <span className="text-white/45">({s.n})</span></h2>
              <p className="text-sm text-white/65">{s.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
