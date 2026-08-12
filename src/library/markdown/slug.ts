/**
 * Heading → anchor id.
 *
 * Vault headings carry ⚠, em-dashes, Arabic script and combining marks — e.g.
 * `## ⚠ The count is disputed`, `## ط → ت is nāqiṣ`, `## بَابُ الْمَدِّ وَالْقَصْر`.
 * A naive [^a-z0-9]+ strip collapses the Arabic ones to the empty string and makes
 * distinct headings collide, so we keep any Unicode letter or number and only strip
 * punctuation and symbols. `\p{L}`, `\p{N}` and `\p{M}` need the `u` flag.
 *
 * NFC-then-strip-marks does exactly the right thing in both scripts, and the asymmetry
 * is the point:
 *   - Arabic has no precomposed letter+harakah characters, so NFC leaves the harakat as
 *     separate `\p{M}` marks and they are removed. Without this, every harakah becomes a
 *     hyphen: `بَابُ الْمَدِّ وَالْقَصْر` slugs to `ب-اب-ال-م-د-و-ال-ق-ص-ر` and the word
 *     boundaries are destroyed. With it: `باب-المد-والقصر`.
 *   - Latin transliteration diacritics ARE precomposed by NFC (ẓ is U+1E93), so
 *     mark-stripping never sees them and they survive. That matters: ẓ is not z, it is
 *     ظ rather than ز. `iẓhār muṭlaq` stays `iẓhār-muṭlaq`.
 * Measured over all 840 headings in the 101 in-scope notes: 0 collisions between
 * distinct headings, 0 fallbacks to "section".
 *
 * `slugifyHeading` is PURE. `createHeadingSlugger` adds per-document dedup on top.
 * They are separate on purpose — see the Interfaces block for this task. Link
 * resolution walks only the links, in link order, so it must not dedupe; heading
 * rendering walks every heading in document order, so it must.
 */
export function slugifyHeading(text: string): string {
  return (
    text
      .normalize("NFC")
      .trim()
      .toLowerCase()
      .replace(/\p{M}+/gu, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

/** Stateful, per-document: ids must be unique within one page. */
export function createHeadingSlugger(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base = slugifyHeading(text);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}
