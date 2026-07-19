# Research: Arabic Web Typography & Per-Letter Tajweed Coloring

Date: 2026-07-19
Scope: font sourcing/licensing for Quranic + drill typography, and the technical
problem of coloring individual letters/rules inside a shaped Arabic word in a
browser without breaking contextual letter joining.

Method note: primary sources fetched directly (official font sites, license
pages, live font-file HTTP responses, and the actual source code of
`quran/quran.com-frontend-next` pulled via `gh api`, not paraphrase). All URLs
below were checked or are quoted from a fetched page; a few (Amiri
COLR/CPAL claim, Tanzil font list) come from a single secondary source and are
flagged as such.

---

## Part A — Fonts

### A.1 KFGQPC Uthmanic Script HAFS (a.k.a. "Uthmanic Hafs")

- **Official publisher:** King Fahd Glorious Qur'an Printing Complex (KFGQPC),
  Madinah.
- **Official download URL:** `http://fonts.qurancomplex.gov.sa/` (listed as the
  canonical source by Tanzil's font documentation page,
  https://tanzil.net/docs/quranic_fonts). This domain did not respond over
  HTTPS during this research session (`connect ECONNREFUSED` on
  `fonts.qurancomplex.gov.sa:443`) — treat as unreliable/intermittent; do not
  hot-link it. Use QUL or Tanzil-hosted copies instead (see below).
- **Reliable current mirrors/downloads (recommended for this project):**
  - QUL (Quranic Universal Library) fonts section:
    `https://qul.tarteel.ai/resources/font` — "QPC Hafs font" entry:
    `https://qul.tarteel.ai/resources/font/245` (offers a "font pack", TTF,
    WOFF2).
  - Quran Foundation CDN (used live in production by Quran.com, verified
    reachable — see below): a Unicode (non-glyph-based) build is served at
    `https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2`
    (HTTP 200, `font/woff2`, confirmed via `curl` in this session) and
    `.../UthmanicHafs1Ver18.ttf`.
  - GitHub mirrors of the raw font files exist (community-maintained, not
    official): `github.com/nuqayah/qpc-fonts`, `github.com/quranwbw/qpc-fonts`,
    `github.com/thetruetruth/quran-data-kfgqpc`.
- **License (verbatim, per ScanCode LicenseDB,
  https://scancode-licensedb.aboutcode.org/kfgqpc-uthmanic-script-hafs.html):**
  > "This Font is the property of King Fahd Glorious Quran Printing Complex,
  > and may not be reproduced, modified without the express written approval
  > of King Fahd Glorious Quran Printing Complex."
  - ScanCode classifies it as **"Proprietary Free"** — not OSI-approved,
    **modification is prohibited without written permission**, but the font is
    distributed at no cost for use. In practice this is exactly the license
    virtually every Quran app/website (Quran.com, QUL, Tanzil-linked tools)
    relies on to display Uthmani Quran text — **using it unmodified, for free,
    including embedding as a webfont, is the de facto accepted use**;
    redistributing a *modified* version (e.g. re-hinted, subsetted per page,
    recolored) technically requires KFGQPC's blessing, which is why QUL's
    "glyph-based" per-page variants are official KFGQPC/QPC-derived builds
    licensed through the Quran Foundation/QUL pipeline rather than something a
    third party is meant to re-derive itself.
  - **Recommendation for this course:** link/embed the **unmodified** Unicode
    KFGQPC Uthmanic Hafs webfont (the `UthmanicHafs1Ver18.woff2` file above, or
    the QUL-hosted "QPC Hafs" pack) as-is for all Quran-text slides. Do not
    subset, re-hint, or bundle a locally modified copy — fetch/self-host the
    original file verbatim (self-hosting the *unmodified* binary is fine and
    is exactly what Quran.com itself does from its own CDN).
- **Harakat & annotation marks:** Yes — this is *the* Uthmani Mushaf font;
  it is explicitly designed to carry full tashkeel (fatha/kasra/damma/sukun/
  shadda/tanwin) plus all Qur'an-specific Unicode annotation signs (small
  high marks for madd/silent letters, sajda marker, rub-el-hizb, etc., the
  U+06D6–U+06ED block) and renders them correctly in modern browsers as a
  standard OpenType/Unicode font (the non-glyph-based Unicode build; the
  glyph-based QPC V1/V2/V4 builds encode whole *words* as single glyphs
  instead — see Part B).

### A.2 QUL (Quranic Universal Library) fonts section

- URL: **https://qul.tarteel.ai/resources/font** (built/maintained by Tarteel/
  Quran Foundation as the successor to quran.com's internal tooling).
- Fetched font inventory (confirmed live on the page at research time):
  Arabic Sign Language font, Juz name font, Surah name font v1/v2/v4, Surah
  header font, KFGQPC Nastaleeq, Digital Khatt Indopak/V1/V2, Indopak
  Nastaleeq, **QPC Hafs font** (`/resources/font/245`), Me Quran Font,
  **QPC V1 Font**, **QPC V2 Font** (`/resources/font/249` is "QPC V2 Font -
  font (Page by Page)"), V4 Surah Name Color Font, **QPC V4 Tajweed Font**
  (`/resources/font/240`), each offering combinations of woff/woff2/ttf/
  (some also a `.json` glyph map and "Ligatures" file).
- **This is the single most important resource for this project's Quran-text
  rendering** because it is the only place the *glyph-based, per-page,
  color-baked-in* QPC V4 Tajweed font is officially distributed alongside its
  companion word-by-word glyph-code dataset ("V4 Glyphs (With Tajweed)" —
  `https://qul.tarteel.ai/resources/quran-script/47`). See Part B for how this
  is actually used.
- **Docs:** https://qul.tarteel.ai/docs/glyph-based explains the general
  glyph-based font concept (each *word*, not each letter, maps to one
  handcrafted glyph; fonts are per-Mushaf-page, ~604 files for full coverage);
  https://qul.tarteel.ai/docs/qpc collects QPC-tag resources.
- **License:** QUL requires free registration/attribution terms for use of
  its resource bundles (check the specific resource's terms on qul.tarteel.ai
  at download time — the site gates fonts behind sign-in but is free); the
  underlying KFGQPC copyright/proprietary-free terms above still apply to the
  Hafs/QPC family since QUL is redistributing the same Quran Foundation/KFGQPC
  assets, not a new license.

### A.3 Amiri

- **Home:** https://aliftype.com/amiri/english.html · Google Fonts listing:
  https://fonts.google.com/specimen/Amiri · Wikipedia:
  https://en.wikipedia.org/wiki/Amiri_(typeface)
- **License: SIL Open Font License (OFL) 1.1** — fully free: use, embed,
  modify, redistribute (including commercially and even sell products
  containing it), the only restriction is you can't sell the font file on its
  own under the same name. This is the license this course should lean on
  most, since it needs no special permission and permits any web-embedding
  technique including subsetting.
- **Variants relevant here:** plain **Amiri** (general Naskh text), **Amiri
  Quran** (a companion cut specifically tuned for Qur'anic typesetting; also
  Google Fonts / Adobe Fonts hosted: https://fonts.google.com/specimen/Amiri%2BQuran,
  https://fonts.adobe.com/fonts/amiri-quran), and **Amiri Quran Colored** — a
  variant that reportedly uses **COLR/CPAL and SVG color-font tables** to bake
  in coloring (per aliftype/Wikipedia description; not independently verified
  by fetching the actual font binary in this session — flag as
  secondary-source and re-verify before depending on it for tajweed coloring).
- **Harakat/Quranic annotation marks:** Amiri explicitly targets "broad Arabic
  Unicode coverage including Quranic notation" and full Unicode 6.0 Qur'anic
  annotation marks; per the font's own release notes, mark-positioning
  refinement in fully-vocalized (harakat-dense) text such as the Qur'an is
  called out as an ongoing area of improvement, i.e. it is good but not
  pixel-perfect compared to the handcrafted KFGQPC Mushaf font. **Recommended
  use for this course: Qaida/drill slides, isolated-letter tables, and any
  non-Mushaf Arabic text — not as the primary Quran-verse font** (use KFGQPC
  Uthmanic Hafs for actual ayat, per the spec).

### A.4 Noto Naskh Arabic

- **Home:** https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic
- **License: SIL Open Font License 1.1** (fully free/embeddable, same terms
  class as Amiri).
- **Known rendering bugs relevant to this course** (documented on
  `notofonts/arabic` and `google/fonts` GitHub issue trackers):
  - Text can visually break apart around Alef-with-Hamza (أ/إ) followed by a
    ligature + trailing space, reproduced on macOS
    (https://github.com/googlefonts/noto-fonts/issues/730 /
    notofonts/arabic#50).
  - Lam-Lam-Heh (لله) ligature fails to form when combined with Shadda +
    superscript-Alef diacritics stacked together
    (notofonts/arabic#192) — this exact combination appears constantly in
    Qur'anic text (e.g. "Allāh" with shadda+dagger alif), so this is a direct
    risk for this course if Noto Naskh were ever used for Quran verses.
  - Final/isolate ج (jeem) glyph reported missing in Medium/Semi-bold/Bold
    weights (google/fonts#3971) — a regular-weight-only concern, less
    relevant since drills should stay at Regular weight.
  - **Conclusion:** Noto Naskh Arabic is solid for general UI Arabic text
    (menus, labels, transliteration captions) but has *documented,
    reproducible* diacritic-stacking bugs that make it a risk for
    heavily-voweled Qaida/Quran content. **Recommendation: prefer Amiri over
    Noto Naskh Arabic for anything with harakat**, per the spec's own
    fallback ordering ("Amiri or Noto Naskh" — pick Amiri first).

### A.5 Scheherazade New

- **Home:** https://software.sil.org/scheherazade/ · download:
  https://software.sil.org/scheherazade/download/ · Google Fonts:
  https://fonts.google.com/specimen/Scheherazade+New
- **Publisher:** SIL International.
- **License: SIL Open Font License** — free to use, modify, redistribute,
  embed.
- **Harakat/Quranic support:** SIL explicitly positions this as *the* font
  family to reach for "when you need Qur'anic text support, multilingual
  Arabic-script coverage, and a text-oriented reading feel" — strong tashkeel
  and scholarly-notation coverage, with Graphite + OpenType shaping for
  dynamic diacritic stacking/positioning.
- **Caveat:** SIL's own docs note that words with multiple stacked diacritics
  need noticeably looser line-height, and tight leading causes visible
  clipping of stacked marks — a CSS/layout concern (set generous
  `line-height` wherever Scheherazade renders fully-voweled text), not a
  licensing or joining concern.
- **Recommendation:** a solid open alternative/backup to Amiri for
  Qaida/drill text if a different visual style is wanted later; not needed as
  primary given Amiri already covers this role and the spec already commits
  to Amiri/Noto.

### Font summary table

| Font | License | Free web-embed? | Full harakat + Quran annotation marks | Best role in this course |
|---|---|---|---|---|
| KFGQPC Uthmanic Script HAFS (Unicode build) | Proprietary-free (KFGQPC) | Yes, unmodified only | Yes — reference Mushaf font | Primary Quran-verse text |
| QPC V1/V2/V4 (glyph-based, via QUL) | Same KFGQPC lineage, distributed via QUL/Quran Foundation | Yes, via QUL/Quran Foundation CDN | Yes, pixel-identical to print Mushaf, tajweed color baked in for V4 | Tajweed-colored Mushaf view (Phase 3 / end-goal 4) |
| Amiri / Amiri Quran | SIL OFL 1.1 | Yes, fully | Good, actively improving | Qaida grids, drills, isolated letters |
| Noto Naskh Arabic | SIL OFL 1.1 | Yes, fully | Has documented diacritic-stacking bugs | UI/labels only, avoid for voweled Quran/Qaida text |
| Scheherazade New | SIL OFL | Yes, fully | Very good, needs loose line-height | Backup option, not required |

---

## Part B — THE tajweed-coloring problem: how to color letters inside shaped Arabic words

### B.1 Why naive span-splitting is dangerous

Arabic script is cursive: each letter has up to four contextual shapes
(isolated/initial/medial/final) determined by its neighbors, and the browser's
text-shaping engine (HarfBuzz on most platforms) decides which shape/ligature
to draw based on the *whole run of text* it sees. If you split a word's
Unicode string into multiple `<span>` elements to color individual letters,
each span becomes a separate shaping "run" in older/broken layout engines: the
browser may shape each character or fragment as if it were isolated (losing
the correct medial/final joined form, and losing letter-specific ligatures
like lām-alif). This is the exact bug referenced by AlQuran.cloud's own
tooling docs: "Webkit has a known bug that breaks Arabic with inline tags" —
inserting `<tajweed>`/`<span>` tags mid-word can cause visible disconnection
of letters in Safari/older WebKit, motivating an "experimental fix ... using
Zero Width Joiner" that the maintainers themselves describe as incomplete
("ZWJ is not smart enough to parse all the characters and join them
properly"), and note the underlying Chrome bug was largely fixed by Chrome
~77 (2019) with a new layout implementation — i.e. **modern Blink/WebKit
generally re-shape correctly across span boundaries today, but older WebKit
and some edge cases still do not**, so span-splitting remains a fragile,
version-dependent approach rather than a reliably correct one.

### B.2 alquran.cloud's tajweed-edition tag format (what it *asks* the client to do)

The `quran-tajweed` edition of the AlQuran.cloud API embeds inline markup
directly in the ayah text using a compact bracket syntax, e.g.
`[h:9421[ٱ]` for a hamzat-ul-wasl occurrence. Official/community parsers
(`islamic-network`'s `alquran-tools` PHP library, and the community
`tajweed-ts` npm package for JS/TS — https://www.jsdelivr.com/package/npm/tajweed-ts)
convert that into HTML like:

```html
<tajweed class="ham_wasl" data-type="hamza-wasl" data-description="Hamzat ul Wasl" data-tajweed=":9421">ٱ</tajweed>
```

i.e. it is meant to be rendered by **wrapping each tagged tajweed-rule
substring in its own inline element** (custom `<tajweed>` tag or a `<span>`)
and coloring via `class`. This is exactly the span-splitting technique in
§B.1, and the same source material documents the WebKit joining bug and the
partial/incomplete ZWJ workaround as a known, unresolved limitation of this
approach. **Conclusion: the alquran.cloud tajweed-tag format is usable and is
the simplest to integrate (just parse text + wrap spans), but it is not the
most robust rendering technique — treat it as a fallback, not the primary
plan**, and mitigate joining risk (see §B.4) if it's used.

### B.3 How Quran.com actually implements it (verified from live source, `quran/quran.com-frontend-next`)

This is the proven, production answer, pulled directly from the repo via
`gh api` (not from documentation paraphrase):

**Core idea: don't color individual letters in HTML/CSS at all — bake the
tajweed colors into the *font itself*, at the granularity of a whole Mushaf
*word* (one word = one pre-shaped glyph), and let the browser's native color-font
support paint it.** This sidesteps the joining problem entirely because no
DOM text node is ever split — each word is a single character/glyph string
rendered by a single `<span>` with `dangerouslySetInnerHTML`.

Concretely:

1. **Data model — glyph-based Quran fonts (QCF).** Quran.com maintains three
   "QCF" (Quran Complex Font) variants: `QuranFont.MadaniV1`, `MadaniV2`, and
   `QuranFont.TajweedV4` (`src/utils/fontFaceHelper.ts`, constant
   `QCFFontCodes = [MadaniV1, MadaniV2, TajweedV4]`, helper
   `isQCFFont()`). Each Quran *word* returned by the Quran Foundation Content
   API carries a `code_v1`/`code_v2` (and, for V4, a tajweed-aware code)
   field — a short string of Unicode Private-Use-Area characters that, when
   rendered in the matching custom font, displays as that exact pre-shaped
   word glyph exactly as it appears on a specific printed Mushaf page.
2. **Per-page font loading.** Because each of the 604 Mushaf pages was
   hand-typeset, the glyph→shape mapping is page-specific, so a *separate
   font file is loaded per page* (`getQCFFontFaceSource()` in
   `fontFaceHelper.ts` builds a `local(...), url(...) format('woff2'), ...`
   `@font-face src` list from a path template
   `/fonts/quran/hafs/{version}/{format}/p{pageNumber}.{ext}` — e.g. Madani V2
   page 1 pulls `/fonts/quran/hafs/v2/woff2/p1.woff2`). The font-family name
   itself is page-specific: `getFontFaceNameForPage()` returns
   `p{pageNumber}-{version}` (e.g. `p1-v4`), so each page's word glyphs are
   painted using that page's own `@font-face`.
3. **Rendering a word (`GlyphWord.tsx`):** the word's glyph-code string is
   injected via
   `<span dangerouslySetInnerHTML={{ __html: getWordText(...) }} style={{ fontFamily: getFontFaceNameForPage(font, pageNumber) }} />`
   — i.e. **the entire word is one opaque pre-shaped string rendered through
   `innerHTML`, styled only via `font-family` and CSS `class`, never split
   into per-letter spans.** A plain Unicode fallback (`qpcUthmaniHafs`) is
   shown while the custom font-face is still loading (`isFontLoaded` flag),
   which is why `dangerouslySetInnerHTML` (not `textContent`) is required —
   the PUA glyph codes must be interpreted as literal characters, not
   HTML-escaped text.
4. **Tajweed coloring specifically (`QuranFont.TajweedV4` = "QPC V4 Tajweed
   Font"):** this is a **glyph-based + color-font** font: individual glyphs in
   the font file are pre-colored per tajweed rule using modern **color-font
   technology** — Quran.com's own font-loading code
   (`getFontPath()` in `fontFaceHelper.ts`) branches the font file path by
   format: `colrv1` (COLRv1 — used for desktop/mobile everywhere except
   Firefox dark mode) versus `ot-svg/{theme}` (OT-SVG, used specifically for
   Firefox because Firefox's COLRv1 support/behavior differs) — confirming
   the two production color-font formats used are **COLRv1** and **OT-SVG**.
   Live font files (theme-agnostic, single page) — confirmed reachable via
   direct HTTP fetch in this session:
   - `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p1.woff2`
     → HTTP 200, `font/woff2`, 27,432 bytes.
   - `https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p1.woff2`
     (non-tajweed Madani V1, page 1) → HTTP 200, `font/woff2`, 15,328 bytes.
5. **Theme-aware coloring without re-downloading the font** (for COLRv1
   builds): a single COLRv1 font file embeds **multiple named color palettes**
   (light/dark/sepia), and the app switches between them purely with CSS,
   using the `@font-palette-values` at-rule and the `font-palette` property —
   verified directly in `src/components/Verse/TajweedFontPalettes.tsx`:
   ```css
   @font-palette-values --Sepia { font-family: 'p1-v4'; base-palette: 2; }
   @font-palette-values --Dark  { font-family: 'p1-v4'; base-palette: 1; }
   @font-palette-values --Light { font-family: 'p1-v4'; base-palette: 0; }
   ```
   then applying `.quran-text { font-palette: --Dark; }` etc. Firefox (which
   historically lags on COLRv1 palette switching) instead gets three
   completely separate pre-baked font files, one per theme:
   `.../v4/ot-svg/light/woff2/p{PAGE}.woff2`,
   `.../v4/ot-svg/dark/woff2/p{PAGE}.woff2`,
   `.../v4/ot-svg/sepia/woff2/p{PAGE}.woff2` (all confirmed present in the
   fetched Quran Foundation docs and matching the app's own
   `isFirefoxDarkMode` branch in `getFontPath()`).
6. **Named tajweed-rule categories** actually used in Quran.com's UI legend
   (`src/components/QuranReader/TajweedBar/TajweedBar.tsx`, constant
   `TAJWEED_RULES`): `edgham` (idgham), `mad-2`, `mad-2-4-6`, `mad-4-5`,
   `mad-6` (the madd-length family), `ekhfa` (ikhfa), `qalqala`, `tafkhim` —
   a useful, already-battle-tested taxonomy this course's own tajweed-color
   legend (end-goal 4) could mirror or reference.
7. **Audio-highlighting is layered on top separately** — when a word is
   currently being recited, Quran.com toggles a *whole-word* highlight CSS
   class (`styles.tajweedTextHighlighted`) rather than touching any
   individual letter — reinforcing that the word-as-atomic-glyph model is
   used everywhere, not just for static tajweed color.
8. **Official integration guide** (Quran Foundation's own developer docs,
   fetched directly, https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/):
   confirms the same architecture from the API-consumer side — request
   `words=true&word_fields=code_v2,text_qpc_hafs` (and `mushaf=19` for the
   tajweed-annotated Mushaf layout) against
   `https://apis.quran.foundation/content/api/v4/verses/by_chapter/{chapter}`,
   render `code_v2` via `innerHTML`/`dangerouslySetInnerHTML` with
   `text_qpc_hafs` as the plain-Unicode fallback, load fonts from
   `https://verses.quran.foundation/fonts/quran/...`, and — importantly —
   **"Always load fonts and data directly from the CDN at runtime"** rather
   than vendoring/caching a local copy, since QUL periodically issues Mushaf
   corrections that must propagate.

### B.4 Recommended implementation for THIS course

**Primary approach — adopt Quran.com's proven glyph-based + COLRv1/OT-SVG
model, sourced from QUL, rather than inventing per-letter span logic:**

1. Pull the **"QPC V4 Tajweed Font"** + its companion **"V4 Glyphs (With
   Tajweed)"** word-by-word script data from QUL
   (https://qul.tarteel.ai/resources/font/240 and
   https://qul.tarteel.ai/resources/quran-script/47), or, more simply, fetch
   the equivalent files straight from the live Quran Foundation CDN pattern
   already reverse-engineered above:
   `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p{PAGE}.woff2`
   (COLRv1, all modern browsers) with
   `https://verses.quran.foundation/fonts/quran/hafs/v4/ot-svg/{light|dark|sepia}/woff2/p{PAGE}.woff2`
   as the Firefox-dark-mode-specific fallback family — mirroring
   `getFontPath()` above.
2. For each word on a page, render its pre-encoded glyph-code string
   (`code_v2`/tajweed code, obtainable from the Quran Foundation Content API
   or from QUL's downloadable word-by-word script export) inside a `<span>`
   whose `font-family` is that page's `p{PAGE}-v4` face — via `innerHTML`,
   never split into per-letter DOM nodes. Because the color is a property of
   the glyph itself (baked in by KFGQPC/QUL's typesetters), **no CSS
   letter-coloring logic is needed at all** — this deletes the entire
   "don't break letter joining" problem, since joining/shaping happened once,
   offline, when the font was built.
3. Handle theme (light/dark/sepia if desired) via `@font-palette-values` +
   `font-palette` for COLRv1 browsers, and swap to the separate OT-SVG font
   files only for Firefox, exactly per Quran.com's `TajweedFontPalettes.tsx`
   and `fontFaceHelper.ts` logic quoted above (small, self-contained,
   copyable pattern — MIT-ish permissive per Quran.com's own OSS repo; verify
   the repo's `LICENSE` file before lifting code verbatim, but the *technique*
   itself is free to replicate regardless).
4. Use the plain-Unicode `text_qpc_hafs`/KFGQPC Uthmanic Hafs string
   (Part A.1) as the **fallback rendering** while the page's glyph font is
   still loading, and as the copy/search/accessible text underlying the
   glyph span (screen readers and text-selection should see real Arabic
   Unicode, not PUA glyph codes) — this mirrors Quran.com's own
   `isFontLoaded` fallback branch.

**Fallback approach — if the QUL/Quran Foundation glyph-font pipeline is too
heavy for this course's scope (static Next.js, one student, no backend) and a
lighter option is wanted for Phase 3 drill slides that only need a handful of
tajweed-highlighted example words (not full Mushaf pages):**

- Use the **alquran.cloud tajweed-edition markup + a span-per-rule renderer**
  (per §B.2), but **mitigate the WebKit joining bug** with two concrete,
  low-risk techniques instead of relying on the incomplete ZWJ patch:
  1. **CSS `unicode-bidi: isolate` / avoid `display` changes on the spans** —
     keep every tajweed `<span>` as plain inline elements with only a `color`
     property changed (no `display:inline-block`, no `position`, no
     transforms) — these are the presentational properties least likely to
     force a fresh shaping run in modern engines.
  2. **Test explicitly in current Safari/WebKit** before shipping any span-
     split word; if disconnection is observed, insert the same font at a CSS
     `font-feature-settings` level rather than per-letter recoloring, or fall
     back further to word-level (not letter-level) coloring granularity for
     that specific rule, since Quran.com's own experience (Chrome ~77+ fixed
     it, but they still avoid span-splitting altogether in production)
     suggests the safest universal answer is: **never color below the
     word/rule-span level that the source markup already gives you**, and
     never programmatically re-split a word further than the tags already
     supplied.
  3. Given this course is a **static Next.js app for one student** (not a
     high-traffic public site), the operationally simplest and most robust
     choice is realistically: **use the QUL/Quran Foundation COLRv1 glyph-font
     approach for the small, curated set of ayat needed (al-Fatiha + the last
     10 surahs + Phase 3 rule-example verses) rather than for the whole
     604-page Mushaf**, since the course's Quran content need is a bounded,
     known verse list (hifz set + rule examples), not full-Mushaf reading —
     this makes per-page font loading trivial (fetch only the handful of
     pages actually used) and avoids needing the alquran.cloud span-fallback
     at all for anything graded (end-goal 4's "read from a standard
     color-coded tajweed mushaf").

---

## Sources consulted (primary unless noted)

- Font licensing / downloads:
  - https://scancode-licensedb.aboutcode.org/kfgqpc-uthmanic-script-hafs.html (verbatim KFGQPC license text + classification)
  - https://tanzil.net/docs/quranic_fonts (font source list incl. KFGQPC, Scheherazade)
  - https://qul.tarteel.ai/resources/font (QUL font inventory)
  - https://qul.tarteel.ai/resources/font/245 (QPC Hafs font)
  - https://qul.tarteel.ai/resources/font/240 (QPC V4 Tajweed Font)
  - https://qul.tarteel.ai/resources/font/249 (QPC V2 Font)
  - https://qul.tarteel.ai/resources/quran-script/47 (V4 Glyphs With Tajweed word-by-word data)
  - https://qul.tarteel.ai/docs/glyph-based (glyph-based font concept doc)
  - https://qul.tarteel.ai/docs/qpc
  - https://aliftype.com/amiri/english.html, https://fonts.google.com/specimen/Amiri, https://en.wikipedia.org/wiki/Amiri_(typeface) (Amiri/OFL/Amiri Quran Colored)
  - https://fonts.google.com/specimen/Amiri%2BQuran, https://fonts.adobe.com/fonts/amiri-quran
  - https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic
  - https://github.com/googlefonts/noto-fonts/issues/730 (Noto Naskh macOS rendering bug)
  - https://github.com/notofonts/arabic/issues/192 (لله ligature + diacritics bug)
  - https://github.com/google/fonts/issues/3971 (missing ج glyph)
  - https://software.sil.org/scheherazade/, https://software.sil.org/scheherazade/download/, https://fonts.google.com/specimen/Scheherazade+New
- Tajweed rendering technique / production implementation:
  - https://github.com/quran/quran.com-frontend-next (source of truth; files fetched directly via `gh api`: `src/utils/fontFaceHelper.ts`, `src/components/dls/QuranWord/GlyphWord.tsx`, `src/components/dls/QuranWord/QuranWord.tsx`, `src/components/Verse/TajweedFontPalettes.tsx`, `src/components/QuranReader/TajweedBar/TajweedBar.tsx`)
  - https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/ (official integration guide; confirmed against raw HTML fetch, font URLs verified live)
  - https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p1.woff2 (live COLRv1 tajweed font file, HTTP 200 confirmed)
  - https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p1.woff2 (live non-tajweed glyph font, HTTP 200 confirmed)
  - https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2 (live Unicode Uthmanic Hafs font, HTTP 200 confirmed)
  - https://alquran.cloud/tajweed-guide (tajweed color legend/reference)
  - https://github.com/islamic-network/alquran-tools (tajweed tag parser; specific file 404'd at research time, details corroborated via search-result excerpts only — secondary source, re-verify path before relying on it)
  - https://www.jsdelivr.com/package/npm/tajweed-ts (JS/TS parser for alquran.cloud tajweed tags)
  - https://github.com/cpfair/quran-tajweed (tajweed rule dataset, explicitly marked "not actively maintained", recommends Quran.com API instead)
  - https://github.com/GlobalQuran/lab/blob/master/tajweed/index.html (early tajweed-highlighting experiment, found via search, not independently fetched)
  - https://github.com/quran/tajweed ("Tajweed Highlighting Experiments" repo)

## Gaps / things to double check before implementation

- The Amiri **"Amiri Quran Colored"** COLR/CPAL claim came from one secondary
  source (a font-directory site) and Wikipedia's summary — not from fetching
  the actual font binary or aliftype's own release notes text. Verify by
  downloading the font and inspecting its tables (e.g. via fonttools
  `ttx -t COLR -t CPAL`) before depending on it for anything.
- `fonts.qurancomplex.gov.sa` (the nominal "official" KFGQPC download host)
  was unreachable (connection refused) during this session — confirm current
  status before citing it as a live link in any course-facing page; use the
  QUL/Quran Foundation mirrors instead, which were confirmed live.
- The `islamic-network/alquran-tools` GitHub repo and its
  `Tajweed.php` file path returned 404 both via `gh api` and via raw
  `githubusercontent.com` fetch in this session (possibly renamed, moved to a
  different owner, or made private since being indexed by search) — the ZWJ/
  WebKit-bug description in §B.2/B.3 rests on search-engine excerpts of that
  file, not a direct fetch; re-locate and re-verify the current repo (try
  `meezaan/alquran-tools` under different casing, or check
  https://packagist.org/packages/alquran/tools for the current canonical
  source) if the fallback approach is actually implemented.
- Quran.com's own `LICENSE` for `quran.com-frontend-next` was not checked in
  this session — confirm terms before copying code verbatim (the *technique*
  described is not proprietary and is safe to reimplement independently
  regardless of that repo's license, but literal code copy should be
  license-checked first).
