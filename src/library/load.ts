import fs from "node:fs";
import path from "node:path";
import { inScopeNoteFiles } from "./paths";
import { parseNote } from "./frontmatter";
import { LibraryNoteSchema, type LibraryNote } from "./schema";
import { slugFor } from "./routes";

export interface LoadedNote {
  slug: string;
  basename: string;
  file: string;
  meta: LibraryNote;
  body: string;
}

/**
 * Every read is schema-validated and failures throw WITH THE FILENAME, matching
 * parseJsonFile in src/content/load.ts:7. A vault note that stops validating should
 * fail the build loudly, not degrade into a blank page.
 */
function loadNote(file: string): LoadedNote {
  try {
    const { data, body } = parseNote(fs.readFileSync(file, "utf8"));
    const basename = path.basename(file, ".md");
    return { slug: slugFor(basename), basename, file, meta: LibraryNoteSchema.parse(data), body };
  } catch (err) {
    throw new Error(`Invalid library note ${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

let cache: LoadedNote[] | null = null;

/** All in-scope notes, sorted by slug. Memoised — this runs once per page at build. */
export function allNotes(): LoadedNote[] {
  if (!cache) cache = inScopeNoteFiles().map(loadNote).sort((a, b) => a.slug.localeCompare(b.slug));
  return cache;
}

export function allSlugs(): string[] {
  return allNotes().map((n) => n.slug);
}

export function noteBySlug(slug: string): LoadedNote {
  const found = allNotes().find((n) => n.slug === slug);
  if (!found) throw new Error(`unknown library slug: ${slug}`);
  return found;
}
