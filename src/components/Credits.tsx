import Link from "next/link";

// Attribution is a CONDITION of the licences this course's material is used under, not a
// courtesy. The Tanzil notice requires that the source be "clearly indicated, and a link is
// made to http://tanzil.net", and that the notice be reproduced in all files containing a
// substantial portion of the text. cpfair/quran-tajweed is CC BY 4.0 on the same footing.
//
// This renders from the root layout, so it is present on every page — which is what the
// obligation actually asks for, since Qur'anic text and tajweed colouring appear throughout.
// The full obligation list, and which action triggers each one, is in
// library/01-Sources/Source-Manifest.md.
export function Credits() {
  return (
    <footer className="mt-16 border-t border-white/10 px-4 py-6 text-center text-xs text-white/40 print:hidden">
      <p>
        Qur&rsquo;an text:{" "}
        <a href="http://tanzil.net" className="underline hover:text-white/70" rel="noopener">
          Tanzil Project
        </a>{" "}
        (tanzil.net), CC BY 3.0. Tajweed annotations:{" "}
        <a
          href="https://github.com/cpfair/quran-tajweed"
          className="underline hover:text-white/70"
          rel="noopener"
        >
          cpfair/quran-tajweed
        </a>
        , CC BY 4.0.
      </p>
      <p className="mt-1">
        <Link href="/credits" className="underline hover:text-white/70">
          Full credits and sources
        </Link>
      </p>
    </footer>
  );
}
