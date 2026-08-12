import Link from "next/link";
import { categories } from "@/library/categories";

export default function LibraryPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-2 text-3xl font-bold">Library</h1>
      <p className="mb-8 text-white/65">Everything the course is built on, in one place.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {categories().map((c) => (
          <li key={c.id} className="glass rim-static rounded-2xl p-5">
            <Link href={c.href}>
              <h2 className="mb-1 font-semibold text-white/90">
                {c.label} <span className="text-white/45">({c.count})</span>
              </h2>
              <p className="text-sm text-white/65">{c.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
