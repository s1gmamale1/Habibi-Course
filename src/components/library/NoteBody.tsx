import type { LoadedNote } from "@/library/load";
import { lexNote, renderTokens } from "@/library/markdown/render";
import { createHeadingSlugger } from "@/library/markdown/slug";
import { resolveWikilinks, buildResolver } from "@/library/markdown/wikilinks";

/**
 * A note's markdown body, rendered.
 *
 * Wikilinks are rewritten to real routes BEFORE lexing, so `marked` never meets `[[`
 * — whose bracket nesting it would otherwise try to read as a reference link.
 *
 * The two slug paths are deliberately asymmetric. `resolveWikilinks` uses the PURE
 * `slugifyHeading` because it walks only the links; `renderTokens` gets a fresh
 * DEDUPING `createHeadingSlugger` because it walks every heading in document order and
 * ids must be unique within the page. Making either one match the other breaks anchors.
 */
export function NoteBody({ note }: { note: LoadedNote }) {
  const markdown = resolveWikilinks(note.body, buildResolver());
  return <div className="library-prose">{renderTokens(lexNote(markdown), createHeadingSlugger())}</div>;
}
