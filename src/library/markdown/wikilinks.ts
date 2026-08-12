import { allNotes } from "../load";
import { slugifyHeading } from "./slug";

/**
 * Obsidian wikilink, in every form the vault uses.
 *
 *   [[Target]]  [[Target|alias]]  [[Target#heading]]  [[#heading]]
 *
 * Two departures from the gate's regex (scripts/check-library.mjs:9), both deliberate:
 *
 * 1. The target may be EMPTY. The gate requires one non-# character before the
 *    fragment, which is why `[[#The four-word exception — iẓhār muṭlaq]]` at
 *    library/02-Rules/Idgham-Maal-Ghunnah.md:65 slips past it. That link is a
 *    same-note anchor and must render as one.
 * 2. The alias matches [\s\S] rather than [^\]]. A wikilink WRAPS A LINE at
 *    library/02-Rules/Ikhfa-Shafawi.md:46 — `[[Izhar-Shafawi|iẓhār\nshafawī]]`.
 *    A line-oriented pattern misses it and emits literal `[[Izhar-Shafawi|iẓhār`
 *    to the student, which is precisely the defect WISHLIST:146 calls most likely.
 */
// Exported so tests can enumerate every wikilink target in a note body without
// re-implementing this pattern — see wikilinks.test.ts, "the set is link-closed".
export const WIKILINK = /\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|([\s\S]*?))?\]\]/g;

/** Frontmatter `sources:` values are wikilink strings, not plain names. */
export function stripWikilink(value: string): string {
  const m = /^\[\[([^\]|#]+)/.exec(value.trim());
  return m ? m[1] : value.trim();
}

/**
 * Rewrite every wikilink to a markdown link, or to plain text when unresolvable.
 *
 * This runs on RAW MARKDOWN before the lexer, so `marked` never has to deal with
 * `[[`, whose bracket nesting it would otherwise try to read as a reference link.
 * That is safe only while no `[[` appears inside a code span or fence — a
 * precondition asserted by test "PRECONDITION" in wikilinks.test.ts.
 */
export function resolveWikilinks(
  markdown: string,
  resolve: (basename: string) => string | null,
): string {
  // slugifyHeading, NOT createHeadingSlugger. Link resolution walks only the links,
  // in link order — a shorter and different sequence than the headings. A deduping
  // slugger here would send a note's SECOND `[[#Sources]]` link to `#sources-2`,
  // silently landing it on the wrong heading.
  const anchorFor = (heading: string) => slugifyHeading(heading);

  return markdown.replace(WIKILINK, (_all, rawTarget: string, rawHeading?: string, rawAlias?: string) => {
    const target = (rawTarget ?? "").trim();
    const heading = rawHeading?.trim();
    const alias = rawAlias?.trim();
    const display = alias || target || heading || "";

    // Empty target — an anchor inside this same note.
    if (!target) {
      return heading ? `[${display}](#${anchorFor(heading)})` : display;
    }

    const href = resolve(target);
    if (!href) return display; // never leak brackets
    return `[${display}](${heading ? `${href}#${anchorFor(heading)}` : href})`;
  });
}

/** basename → route, over every in-scope note. */
export function buildResolver(): (basename: string) => string | null {
  const map = new Map(allNotes().map((n) => [n.basename, `/library/${n.slug}`]));
  return (basename: string) => map.get(basename) ?? null;
}
