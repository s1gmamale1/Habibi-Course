/**
 * Section landing segments. A note basename that lowercased to one of these would
 * shadow its index page, so `allSlugs()` is asserted against this list.
 */
export const RESERVED_SEGMENTS = ["rules", "letters", "sources"] as const;

/**
 * Route slug for a note.
 *
 * Resolution is by BARE BASENAME ignoring directory, matching the gate
 * (scripts/check-library.mjs:62) — a flat route space is what makes every wikilink
 * resolve without a path lookup. All 183 vault basenames are unique and already
 * URL-safe; lowercasing is purely cosmetic and is asserted not to collide.
 */
export function slugFor(basename: string): string {
  return basename.toLowerCase();
}
