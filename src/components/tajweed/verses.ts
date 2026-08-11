import type { Span } from "./TajweedText";

import s1 from "@/generated/verses/1.json";
import s105 from "@/generated/verses/105.json";
import s106 from "@/generated/verses/106.json";
import s107 from "@/generated/verses/107.json";
import s108 from "@/generated/verses/108.json";
import s109 from "@/generated/verses/109.json";
import s110 from "@/generated/verses/110.json";
import s111 from "@/generated/verses/111.json";
import s112 from "@/generated/verses/112.json";
import s113 from "@/generated/verses/113.json";
import s114 from "@/generated/verses/114.json";

export type Verse = { ayah: number; text: string; spans: Span[] };

/**
 * The verses an `ayah` slide can paint, bundled at build time.
 *
 * **Why static imports and not a fetch or a dynamic import.** The app is
 * `output: "export"` — there is no server to ask for a verse at request time.
 * A computed `import(\`@/generated/verses/${surah}.json\`)` would compile, but
 * the bundler cannot know which surah is requested, so it emits *all 70*
 * generated files (~344 KB of JSON) into the client build whether or not any
 * slide cites them. Naming each file in a plain `import` keeps the bundle to
 * exactly what the course teaches.
 *
 * **Why only these eleven.** This is the Phase 3 hifz set — al-Fātiḥah plus
 * the last ten surahs (105–114) — the only texts the course recites in full.
 * The other 59 generated files exist to back rule examples in the library, not
 * slides. When an `ayah` slide cites a surah outside this set, add one `import`
 * and one entry below; until then `lookupVerse` returns `undefined` and the
 * ayah slide degrades to its reference and translation rather than crashing.
 */
const VERSES: Record<number, Verse[]> = {
  1: s1,
  105: s105,
  106: s106,
  107: s107,
  108: s108,
  109: s109,
  110: s110,
  111: s111,
  112: s112,
  113: s113,
  114: s114,
};

/** The generated verse for `surah:ayah`, or `undefined` if it is not bundled. */
export function lookupVerse(surah: number, ayah: number): Verse | undefined {
  return VERSES[surah]?.find((v) => v.ayah === ayah);
}
