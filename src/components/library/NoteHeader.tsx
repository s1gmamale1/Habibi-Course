import Link from "next/link";
import type { LoadedNote } from "@/library/load";
import { stripWikilink } from "@/library/markdown/wikilinks";
import { slugFor } from "@/library/routes";

const ZONE_IMAGE: Record<string, string> = {
  jawf: "/images/makhraj/jawf.jpg",
  halq: "/images/makhraj/halq.jpg",
  lisan: "/images/makhraj/lisan.jpg",
  shafatan: "/images/makhraj/shafatan.jpg",
};

/** Title block plus the frontmatter facts worth showing above the prose. */
export function NoteHeader({ note }: { note: LoadedNote }) {
  const m = note.meta;
  // `m.type === ...` rather than `"key" in m`: SourceNoteSchema is `.passthrough()`,
  // which gives SourceNote a string index signature. That makes every "key" in m
  // check true for the source branch too, and widens every field it guards to
  // `unknown` across the union. Narrowing on the discriminant avoids that.
  const sources = m.type === "rule" || m.type === "letter" ? m.sources : [];
  const taughtIn = m.type === "rule" || m.type === "letter" ? m.taught_in : undefined;
  const title =
    m.type === "rule" ? m.english : m.type === "letter" ? m.name : m.type === "source" && m.title ? m.title : note.basename;

  return (
    <header className="mb-6">
      <h1 className="gradient-text mb-2 text-3xl font-bold">{title}</h1>

      {(m.type === "rule" || m.type === "letter") && (
        <p className="arabic quran mb-3 text-3xl" dir="rtl" lang="ar">{m.arabic}</p>
      )}

      {m.type === "letter" && (
        <>
          <p className="text-sm text-white/60">Makhraj — {m.makhraj}</p>
          {ZONE_IMAGE[m.makhraj_zone] && (
            // eslint-disable-next-line @next/next/no-img-element -- output: "export"; the app uses raw <img> throughout
            <img src={ZONE_IMAGE[m.makhraj_zone]} alt={`Makhraj zone: ${m.makhraj_zone}`} className="my-4 w-full rounded-xl" />
          )}
        </>
      )}

      {taughtIn && (
        <p className="mt-2 text-sm">
          <Link href={`/lesson/${taughtIn}`} className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70">
            Taught in lesson {taughtIn}
          </Link>
        </p>
      )}

      {sources.length > 0 && (
        <p className="mt-2 text-sm text-white/60">
          Sources:{" "}
          {sources.map((s, i) => {
            const name = stripWikilink(s);
            return (
              <span key={name}>
                {i > 0 && ", "}
                <Link href={`/library/${slugFor(name)}`} className="underline decoration-white/30 underline-offset-2">{name}</Link>
              </span>
            );
          })}
        </p>
      )}
    </header>
  );
}
