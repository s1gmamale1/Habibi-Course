import Link from "next/link";

export const metadata = { title: "Credits & Sources — Tajweed Course" };

// The four obligations below come from four different parties. Crediting one does not cover
// another — see library/01-Sources/Source-Manifest.md, which records each obligation next to
// the action that triggers it.
export default function CreditsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-white/85">
      <Link href="/" className="text-sm text-sky-300 underline">
        ← Course map
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-white">Credits &amp; sources</h1>
      <p className="mt-3 text-white/60">
        This course is built on material published by others under open licences. Each entry
        below is a condition of use, not an acknowledgement we chose to make.
      </p>

      <section className="glass mt-8 space-y-5 rounded-2xl p-6">
        <div>
          <h2 className="font-semibold text-white">Qur&rsquo;ān text</h2>
          <p className="mt-1 text-sm">
            <a href="http://tanzil.net" className="underline" rel="noopener">
              Tanzil Project
            </a>{" "}
            — CC BY 3.0. Uthmānī text, pinned 2017 snapshot. Every Arabic string in this course
            is sliced from that snapshot programmatically and verified verbatim; none is typed
            by hand.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-white">Tajweed annotations</h2>
          <p className="mt-1 text-sm">
            <a
              href="https://github.com/cpfair/quran-tajweed"
              className="underline"
              rel="noopener"
            >
              cpfair/quran-tajweed
            </a>{" "}
            — CC BY 4.0. The rule spans behind every coloured letter.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-white">Word segmentation and recitation timings</h2>
          <p className="mt-1 text-sm">
            <a href="https://quran.com" className="underline" rel="noopener">
              Quran.com / Quran Foundation
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-white">Recitation</h2>
          <p className="mt-1 text-sm">
            Sheikh Mahmoud Khalil Al-Husary (Mu&rsquo;allim edition) and Sheikh Mohamed Siddiq
            al-Minshawi (Teacher edition), streamed via{" "}
            <a href="https://everyayah.com" className="underline" rel="noopener">
              everyayah.com
            </a>
            . Audio is linked, never re-hosted.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-white">Classical sources</h2>
          <p className="mt-1 text-sm">
            The rules taught here are verified against al-Muqaddimah al-Jazariyyah, Tuhfat
            al-Atfāl, ash-Shāṭibiyyah, as-Sajāwandī&rsquo;s <em>Kitāb al-Waqf wa&rsquo;l-Ibtidāʾ</em>,
            and Nihāyat al-Qawl al-Mufīd — all public domain.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-white">Typeface</h2>
          <p className="mt-1 text-sm">
            The King Fahd Glorious Qur&rsquo;an Printing Complex font, shipped unmodified as its
            licence requires.
          </p>
        </div>
      </section>
    </main>
  );
}
