# Research: Existing Free/Open-Source Quran-Reading & Tajweed Courses

**Date:** 2026-07-19
**Scope:** Survey of existing courses, GitHub repos, APIs, fonts, and PDFs for Quran reading / tajweed instruction, with license verification, for reuse in the Tajweed Course project (see `docs/superpowers/specs/2026-07-19-tajweed-course-design.md`).

**Method note:** All findings below are from live web search/fetch on 2026-07-19. Where a page could not be fetched directly (e.g. 404, connection reset), that is noted and the finding is flagged as "search-summary only, re-verify before build."

**Legend used throughout:**
- 🟢 **CAN EMBED** — license explicitly permits redistribution/embedding of the actual content (text, audio bytes, code) in our repo/build.
- 🟡 **CAN ONLY LINK** — content is freely accessible online but license is unclear, restrictive, all-rights-reserved, or is third-party media (e.g. YouTube) — link to it, never copy it into our repo.
- 🔴 **AVOID** — unclear/no license, likely non-free, or explicitly non-commercial/no-derivatives in a way that conflicts with our use, or dead/unreliable.

---

## 1. Quran Text Sources

### 1.1 Tanzil Project — 🟡 CAN ONLY LINK / limited embed
- Site: https://tanzil.net/
- Download page: https://tanzil.net/download/
- License page: https://tanzil.net/docs/text_license
- **License:** Creative Commons Attribution 3.0 (CC BY 3.0), but with an explicit **no-changes clause layered on top**: "Permission is granted to copy and distribute verbatim copies of this text, but CHANGING IT IS NOT ALLOWED." Effectively CC BY-ND in practice, despite being labeled CC BY. Must display "Tanzil Project" attribution and link to tanzil.net; usage in apps requires the source to be clearly identified.
- **What's reusable:** The full verified Uthmani Quran text (with full harakat), plain text, XML, SQL, JSON exports. This is the standard reference text used by nearly every other Quran project (Quran.com, everyayah, QUL, cpfair/quran-tajweed all key off Tanzil's Uthmani text or a byte-identical derivative).
- **Verdict for us:** Use Tanzil Uthmani text as the canonical Quran text source (never hand-type). Verbatim copy is allowed with attribution + link to tanzil.net — this satisfies "Quran text never hand-typed." Do not modify characters; if we need per-character tajweed color spans, wrap the untouched Tanzil codepoints in HTML spans (wrapping ≠ changing the text) and keep attribution in a footer/about page.

### 1.2 QUL — Quranic Universal Library (Tarteel AI) — 🟡 mixed (code green, data license unclear per-resource)
- Site: https://qul.tarteel.ai/
- Resources/download page: https://qul.tarteel.ai/resources
- GitHub (platform code): https://github.com/TarteelAI/quranic-universal-library — **MIT license** (this covers the Rails/Active Admin *platform codebase*, not necessarily the underlying Quranic datasets it hosts).
- **What's there:** Quran text in Uthmani/IndoPak/Madani scripts, 128 audio recitation sets (71 unsegmented, 57 with word timestamps), 217 translations, 115 tafsirs, ~20 approved mushaf-page layouts (for faithful printed-page recreation — useful for our "real mushaf page" milestone in Phase 2/3), Quranic fonts, morphology/grammar data (77,432 entries), tajweed rule annotations.
- **Licensing caveat (important):** The QUL homepage states data "comes from external sources and may contain errors" and offers no blanket data license — each dataset is sourced from its own upstream (Tanzil, individual reciters' estates, font foundries, etc.) and QUL is a redistribution hub, not the original rights-holder. **Before embedding any specific QUL dataset, check that specific resource's own license/source attribution on its resource page** — do not assume MIT extends to the Quran text/audio/fonts themselves.
- **Verdict for us:** Excellent as a *sourcing index* — use it to find/cross-check mushaf layouts and word-timing data — but treat every individual download as needing its own license check (most will trace back to Tanzil text license + individual reciter terms, both handled elsewhere in this doc).

### 1.3 AlQuran Cloud API — 🟡 CAN ONLY LINK (API dependency, not embed)
- Site/API docs: https://alquran.cloud/api
- Base URL: `https://api.alquran.cloud/v1`
- Example endpoints: `/surah/{number}/{edition}`, `/ayah/{reference}/{edition}`, `/juz/{juz}/{edition}`
- Free, no auth, no published rate limit; run by Islamic Network ("© Islamic Network and contributors since 2014").
- Terms: https://alquran.cloud/terms-and-conditions (not fully retrievable via fetch in this session — **re-verify commercial/redistribution terms before relying on this for production**, since it's a third-party hosted API, not content we own).
- **Verdict for us:** Fine as a *convenience API* for prototyping (e.g., quickly pulling ayah text/translations at build time), but since our hard constraint is "Quran text never hand-typed" + "never re-host qari media we don't have rights to," prefer pulling text directly from Tanzil (clear, verified CC BY license) rather than proxying through a third-party API whose own terms are less clear. Do not depend on this API at runtime in the shipped app (no backend in v1 anyway) — at most use it as a build-time text-fetch script, cross-checked against Tanzil.

### 1.4 Quran.com / Quran Foundation API — 🟡 CAN ONLY LINK
- API docs: https://api-docs.quran.foundation/
- Developer Terms: https://api-docs.quran.foundation/legal/developer-terms/
- **License:** Non-exclusive, revocable, non-transferable, non-sublicensable license to *access and use the API* to build apps with "beneficial Quranic experiences." Explicitly: **any commercial redistribution or raw-data re-hosting requires a separate written commercial license.**
- Quran.com also ships a "Tajweed Mushaf" — a color-unified Quran font with tajweed rules baked into glyph coloring (selectable under Settings → Quran Font). Reference: https://quran.com/en/product-updates/introducing-the-new-tajweed-mushaf
- **Verdict for us:** Do not re-host Quran Foundation's API data. Useful only as (a) a reference implementation to look at for how a tajweed-colored mushaf should look, and (b) potentially a live link for the student to browse ("read this page on Quran.com") — never bundle their font/data into our build without a commercial agreement.

---

## 2. Verse/Word Audio (Qari Recitation)

### 2.1 everyayah.com / VerseByVerseQuran.com — 🟡 CAN LINK / stream, embedding legally ambiguous
- Reciter index: https://everyayah.com/recitations_pages.html
- Disclaimer: https://everyayah.com/data/timings_files/000_disclaimer.txt — requires "link back to our site from your product and website to use these timings"; full license referenced at http://versebyversequran.com/site/license (this URL returned **404 at time of research** — treat as broken/unverifiable, re-check before depending on it).
- **License consensus (from community discussion, not an official statement):** In a public GitHub issue (https://github.com/quran/quran_android/issues/434) a contributor to the well-known Quran Android app states everyayah.com content is effectively **CC BY-NC** ("because it is Quran too") — i.e., non-commercial only, attribution required. This is a second-hand characterization, not everyayah's own published license page (which 404s), so **treat as CAN-ONLY-LINK, not embeddable**, until/unless a live license page is found confirming otherwise.
- **Husary Muallim (our primary qari) — confirmed present:**
  - Directory: https://everyayah.com/data/Husary_Muallim_128kbps/
  - Page-level (mushaf-page) files: `https://everyayah.com/data/Husary_Muallim_128kbps/PageMp3s/Page001.mp3` through `Page604.mp3` (search results flagged this specific PageMp3s subfolder as possibly incomplete/missing for this reciter — **verify file-by-file before depending on full 604-page coverage**).
  - Per-ayah files follow everyayah's standard convention: `https://everyayah.com/data/Husary_Muallim_128kbps/SSSAAA.mp3` (3-digit surah + 3-digit ayah, e.g. `001001.mp3` for Fatiha 1:1) — this is the pattern used across all everyayah reciter folders; confirm exact filename zero-padding for the Muallim set specifically before wiring up tap-to-hear.
  - Also on Internet Archive: https://archive.org/details/Husari_Muallim ("Muallim style recitation by Mahmud Khalil al-Husari") and a bulk everyayah mirror at https://archive.org/details/quran-every-ayah — Internet Archive items are frequently under more permissive/public-domain-style terms than the source site; **check this Archive.org item's own rights statement**, as it may be a cleaner path to the same audio with clearer licensing.
- **Verdict for us:** Given the spec's hard constraint ("every resource must be free and openly licensed, or merely linked, never re-hosted"), and given the license trail here is second-hand/broken, **treat Husary Muallim audio as tap-to-hear via direct `<audio src>` pointing at everyayah.com's live URLs (streaming, not re-hosting/bundling the mp3s in our repo)**. This satisfies "never re-host." Do not download-and-commit these mp3s into the Next.js repo. Cross-check the Internet Archive mirror's license before treating it as an alternate embeddable source.

### 2.2 QUL audio resources — 🟡 CAN ONLY LINK (per above, unclear blanket license) — see §1.2.

### 2.3 cpfair/quran-align — 🟢 CAN EMBED (timing data only, not audio)
- Repo: https://github.com/cpfair/quran-align
- **What it is:** A speech-recognition-based aligner producing word-level millisecond timestamps for Qur'anic audio (surah/ayah/word boundaries + start/end ms + alignment-quality stats).
- **License:** Code = MIT. Timing-data JSON files = **CC BY 4.0**.
- Releases page has pre-generated word-by-word timing files for multiple reciters (exact reciter list not retrievable from the fetched page — check the Releases tab directly: https://github.com/cpfair/quran-align/releases).
- **Verdict for us:** Very useful if we want word-highlighting during audio playback in later drills (Phase 2–3 word-by-word slides). The **timing JSON is embeddable** (CC BY 4.0, just cite); it still points at externally-hosted audio (we'd stream from everyayah/QUL, not bundle audio). Check whether Husary Muallim specifically has a released alignment file — if not, this is a "nice to have later," not v1-critical.

### 2.4 cpfair/quran-tajweed — 🟢 CAN EMBED (annotation data only)
- Repo: https://github.com/cpfair/quran-tajweed
- **What it is:** Character-level tajweed rule annotations (19 rules: Ghunnah, Idghaam variants, Ikhfa, Iqlab, Madd variants, Qalqalah, Hamzat al-Wasl, etc.) as a JSON file (`output/tajweed.hafs.uthmani-pause-sajdah.json`) with Unicode-codepoint start/end indices into the **Tanzil.net Uthmani text**.
- **License:** Annotation data = **CC BY 4.0 International**. Underlying Quran text remains under Tanzil's own terms (§1.1).
- **Status:** Repo author states it is "not actively maintained" and suggests using the Quran.com API instead (which is not freely re-hostable per §1.4).
- **Verdict for us:** **This is a strong, direct match for our color-mushaf feature (end goal 4).** The index-based annotation format is exactly what we need to wrap Tanzil-text spans with tajweed-rule CSS classes for automatic color-coding, without hand-annotating anything ourselves. Recommend: pull this JSON, cross-map its rule taxonomy to the "standard color-mushaf convention" referenced in the spec (see §5 below for the color legend itself), and generate our spans at build time. Verify codepoint-offset alignment against the exact Tanzil Uthmani version we use (text versions can drift between Tanzil releases) before trusting it wholesale — a scripted check (the spec already calls for "every Quran string matches the verified source text") should also validate this alignment.

---

## 3. Tajweed Rule / Color-Coding Software & Data

### 3.1 quran/tajweed (JS) — 🟡 reference only, verify license
- Repo: https://github.com/quran/tajweed
- "Tajweed Highlighting Experiments" — algorithms to color-code tajweed rules, with modes for standard Madani tajweed mushaf and naskh tajweed mushaf.
- License not confirmed in this pass — **check repo's LICENSE file directly before use.**
- **Verdict:** Reference implementation for how the official "quran" GitHub org (behind Quran.com) approaches rule-highlighting logic. Useful as a design reference even if code isn't reused verbatim.

### 3.2 kodepandai/colorful-quran — 🟢 CAN EMBED (code), 🟡 data needs check
- Repo: https://github.com/kodepandai/colorful-quran
- **License: MIT** (confirmed).
- Stack: SvelteKit + Tailwind, static site, deployed to Cloudflare Pages.
- Quran data source: Indonesian Ministry of Religious Affairs (Kemenag) database — **not Tanzil**; if reused, its own text-license chain would need separate verification (Indonesian government Quran data has historically had its own terms).
- **Verdict for us:** Useful as an implementation reference (a working, MIT-licensed static tajweed-color site) but not as a text source, since it doesn't use Tanzil.

### 3.3 GreentechApps/Al-Quran — 🔴 AVOID for reuse (no explicit license)
- Repo: https://github.com/GreentechApps/Al-Quran
- Android app with color-coded tajweed ("same color implementation as iQuran"), word-by-word, multiple tafsirs/translations, downloadable qari audio.
- **No license file found in this pass.** Also Kotlin/Android — not directly portable to our Next.js stack anyway.
- **Verdict:** Reference only for UX/feature ideas (their tajweed color legend may be worth cross-checking against ours), but do not pull code or data — no license clarity, wrong platform.

### 3.4 vipafattal/TajweedParser — 🟡 reference only
- Repo: https://github.com/vipafattal/TajweedParser
- Kotlin tajweed parser built on top of the alquran.cloud API (§1.3). Same caveats as that API apply (not verified as freely redistributable data).

### 3.5 Color-coding legend (the "standard tajweed mushaf" convention) — 🟡 multiple partially-consistent sources, none is a single authority
- GatewayToQuran color legend (https://gatewaytoquran.com/color-coded-quran/): Red = Ghunnah (nasal sound), Green = heavy letters (tafkheem), Blue = Qalqalah, Pink = Ikhfa (per their user guide). Page copyright: "Gatewaytoquran - Copyright 2021. Designed by Ehtisham" — no explicit content license; treat the *PDF/images* as link-only, but the *color scheme itself* (which is a widely-used de facto industry convention, not GatewayToQuran's invention) is fair to adopt as a design reference.
- Quran.com's own "Tajweed Mushaf" (https://quran.com/en/product-updates/introducing-the-new-tajweed-mushaf) implements a similar but not necessarily identical color-per-rule mapping via a custom font — useful cross-check, not licensed for reuse (§1.4).
- Several color-coded Quran PDFs exist on Internet Archive with Public-Domain-style listings, e.g. https://archive.org/details/QuranWithColourCodedTajweed_201303 (Darul Tahqiq) and https://archive.org/details/ColourCodedQuranJuz30 (GatewayToQuran, Juz 30 only) — **each Archive.org item's individual rights statement must be checked**; Archive.org hosting does not itself imply public domain.
- **Verdict for us:** There is no single canonical, freely-licensed "standard" tajweed-color specification to embed wholesale — the *convention* (red=ghunnah, green=qalqalah or heavy letters depending on source, etc. — sources disagree on exact color↔rule mapping in places) is common knowledge/practice, so we should **document our own explicit color legend in the course (a design decision, not a copyrighted asset)**, cross-checked against 2–3 of these sources for consistency, then apply it ourselves via CSS spans over Tanzil text + cpfair/quran-tajweed indices (§2.4). Do not copy any single site's color-coded PDF images.

---

## 4. Fonts

### 4.1 KFGQPC Uthmanic Script (Hafs) — 🟡 CAN LINK/USE, NOT freely redistributable in the OFL sense
- Publisher: King Fahd Glorious Quran Printing Complex (KFGQPC), Al-Madinah Al-Munawwarah, Saudi Arabia.
- **License terms (from the font's own bundled license, as summarized in third-party font-catalog pages — no official KFGQPC license URL was retrievable in this pass, re-verify against the actual font file's embedded license before shipping):** Free of cost to use, copy, distribute — **but explicitly prohibits selling, modifying, altering, translating, reverse-engineering, decompiling, or disassembling the font.** KFGQPC retains all IP rights; font provided "AS IS," no warranty.
- **Verdict for us:** This is **usable** (free, distributable, and the spec explicitly names it as the primary Quran-text font) but it is **not an open-source license** (no modification rights) — treat it like a proprietary freeware font: bundle the unmodified font file with proper attribution, do not subset/modify the font file itself (subsetting could count as "altering"), and keep a copy of its license text in the repo/credits page. Source a copy directly from an official KFGQPC/QuranComplex distribution channel (the direct fonts.qurancomplex.gov.sa endpoint failed to connect during this research pass — retry, or obtain via QUL's font resources §1.2, or via the Tanzil download page which also offers Quran fonts) rather than third-party mirror sites, to avoid a tampered file.

### 4.2 Amiri — 🟢 CAN EMBED
- License: **SIL Open Font License 1.1** (https://scripts.sil.org/OFL) — confirmed via multiple sources.
- Naskh revival typeface based on the 1924 Cairo Quran edition's press type; extensive OpenType support for Arabic positioning, ligatures, verse numbers.
- **Verdict for us:** Fully embeddable, modifiable, redistributable (OFL only restricts re-selling under a different license name). Use for Qaida/drill Arabic text as the spec specifies.

### 4.3 Noto Naskh Arabic — 🟢 CAN EMBED
- Google Noto fonts family; **SIL OFL 1.1** (industry standard for Noto; not independently re-verified in this pass but this is Google's universally documented license for the whole Noto family — low risk).
- **Verdict for us:** Safe to embed per spec.

---

## 5. Existing Structured Courses (Curriculum / Pedagogy Reference)

### 5.1 Understand Al-Qur'an Academy (understandquran.com) — 🟡 CAN ONLY LINK (all-rights-reserved)
- Site: https://understandquran.com/ , course listing: https://understandquran.com/courses/ , "Learn Tajweed the Easy Way": https://understandquran.com/courses/learn-tajweed-the-easy-way/ , tajweed resources: https://understandquran.com/resources/tajweed/
- Free downloadable PDFs found: `Tajweed_Rules.pdf` (https://download.understandquran.com/fileadmin/user_upload/extras/tajweed/Tajweed_Rules.pdf), `Learn_Tajweed.pdf` (https://download.understandquran.com/fileadmin/user_upload/ebooks/english/Learn_Tajweed.pdf), Book 5 textbook (https://download.understandquran.com/fileadmin/user_upload/TRC/Eng/Book5/Eng-Book-5%20Textbook.pdf), 125-Words course booklet (https://download.understandquran.com/fileadmin/user_upload/courses/short/English_2020/C-1_125_Words_English.pdf).
- **License: explicit all-rights-reserved.** Copyright held by "Edusuite Solutions Private Limited"; their standard notice states no part may be "reproduced, stored in a retrieval system, or transmitted in any form... without prior permission."
- **Verdict for us:** Excellent **pedagogical reference** (their tajweed rule sequencing, "125 words" vocabulary-first method, and pacing are worth studying for our Phase 3 rules-strand ordering) — **but 🔴 AVOID copying/embedding any of their PDF content, text, or images.** Free videos on their site/YouTube can be linked (not embedded/downloaded) if directly relevant, same as the Arabic101/Uzbek-channel pattern the spec already uses.

### 5.2 Bayyinah / Bayyinah TV / Dream Program — 🟡 CAN ONLY LINK, mostly paid
- Site: https://bayyinah.com/ ; free intro: https://bayyinah-dream-big.lovable.app/ ("Dream Big," 10-day free Quranic-Arabic-vocabulary micro-course, "free forever" per its own marketing); full Bayyinah TV is subscription (7-day trial only).
- **Verdict for us:** Not directly reusable content (subscription product; the free "Dream Big" teaches Arabic grammar/vocabulary, not tajweed/qaida reading mechanics — out of scope for our course anyway per spec, which explicitly excludes advanced Arabic grammar). Not a fit; no action needed beyond noting it exists as a possible *link* for a highly motivated student wanting deeper Arabic later (post-course, out of v1 scope).

### 5.3 Noorani Qaida (the curriculum backbone itself) — 🟢 PDF facsimiles are public-domain-marked; content structure is generic/traditional
- Multiple Internet Archive items marked "Public Domain Mark 1.0":
  - https://archive.org/details/NooraniQaida_201701
  - https://archive.org/details/noorani-qaida_202012
  - https://archive.org/details/noorani-qaida_202104
  - English edition: https://ia601702.us.archive.org/18/items/norani-qaida-english_201901/norani-qaida-english.pdf (direct PDF)
- Also on Internet Archive but from named modern publishers (check individually before assuming PD): "Idara Sadaat" edition (https://archive.org/details/noorani-qaida-download), Markaz Al Furqan / Sheikh Noor Muhammad Haqqani edition (https://archive.org/details/qaida-noorania-sheikh-noor-muhammad-haqqani-markaz-al-furqan-taleem-ul-quran), Dawateislami's "Madani Qaida" (https://archive.org/details/MadaniQaidapdf) — these publisher-branded editions are less likely to be PD than the older/anonymous ones; verify each item's own rights field.
- **Verdict for us:** The **Noorani Qaida pedagogical sequence itself** (letter shapes → joining → vowels → tanwin → sukun → madd → practice sentences) is a centuries-old, un-owned traditional curriculum structure — exactly what the spec already adopts as "Phase 1–2 backbone." This is fine to use as a *structural/pedagogical reference* freely (it's a teaching method, not copyrightable content). For any *specific PDF scan* we might want to link to (e.g., as a supplementary handout link for the student), prefer the PD-marked Internet Archive items (201701/202012/202104/English) over publisher-branded ones, and still treat it as **link-only** (do not re-host the PDF file itself in our repo) unless we independently confirm PD status of that exact file.

### 5.4 GitHub curriculum-shaped repos
- **KamranAzeem/learn-arabic-quran-qaida** — https://github.com/KamranAzeem/learn-arabic-quran-qaida — Companion files for a Qaida video series, organized lesson-01 through lesson-09 (lesson-04 missing); explicit stated goal "to make an open-source Qaida for Quran." **No license file found** — small project (3 stars, 1 fork), low activity. 🟡 Worth checking individual lesson files for reusable structure/ideas (it's a rare *English-language, open* Qaida attempt), but treat content as 🔴 avoid-embedding until a license is added or the author is asked directly.
- **awesome-islamic-open-source-apps** (curated list) — https://github.com/tarekeldeeb/awesome-islamic-open-source-apps — a maintained index of open-source Islamic software. Notable Quran-learning-adjacent entries surfaced: `cpfair/quran-tajweed` (Python, ⭐157, covered above §2.4/3 — note: the list describes it as "learning Quranic Tajweed rules" though the repo itself is really an annotation dataset), `quran/tajweed` (JS, ⭐72, §3.1), `vipafattal/TajweedParser` (Kotlin, ⭐26, §3.4), `Waqar144/quran_memorization_helper` (Dart, ⭐27, hifz tracking — relevant to our Phase 3 hifz strand for progress-tracking UX ideas), `oaokm/AL-Khatma` (Python, ⭐14, Quranic flashcards), `sahibul-nf/hiQuran` (Dart, ⭐63, "interactive web app for reading/learning Quran"), `galacticwarrior9/Iqra` (Kotlin, ⭐11, Quran learning platform with progress tracking). **Each entry needs its own license check before any code/data reuse** — this list itself is just a discovery index (repo's own license applies to the list content, not the linked projects).
- **Verdict for us:** Good discovery surface for feature/UX ideas (especially memorization-tracking patterns for the hifz strand and localStorage-based progress patterns matching our own "no backend" approach), not a source of directly embeddable assets.

---

## 6. Curriculum References Already Named in the Spec (verification pass)

- **Arabic101 playlists** — https://www.youtube.com/@Arabic101/playlists — YouTube channel; 🟡 link/embed-the-player only (standard YouTube terms — never download/re-host their video or audio). Confirmed reachable as a channel handle.
- **Uzbek reference channel sentence-reading video** — https://youtu.be/VhRHKdPcNPA — 🟡 same treatment: link or embed via YouTube's own player, never re-host the audio/video file.
- **Arabic101 also sells a "Colored Mushaf of Tajweed" ebook** (https://arabic101.org/product/colored-mushaf-of-tajweed-ebook-2/) — 🔴 paid product, avoid; not license-checked further since it's explicitly commercial.

---

## 7. Concrete Recommendations for This Course

**Text:** Use Tanzil Uthmani text (CC BY 3.0 + no-changes-to-the-text-itself clause) as the single source of truth for every Quran string in slides/drills. Attribute "Tanzil Project" + link to tanzil.net site-wide (e.g., footer/credits page). Script the "every Quran string matches the verified source text" check called for in the spec against a pinned Tanzil release/version.

**Tajweed color-coding (end goal 4):** Combine (a) Tanzil text, (b) cpfair/quran-tajweed's CC BY 4.0 index-based rule annotations, and (c) our own documented color legend (cross-checked against GatewayToQuran/Quran.com Tajweed Mushaf conventions but written in our own words as a design decision, not copied) to auto-generate colored spans at build time. This avoids hand-annotating tajweed rules and avoids copying anyone's copyrighted color-coded PDF/images.

**Audio (tap-to-hear):** Stream (never bundle) Husary Muallim mp3s directly from everyayah.com (`https://everyayah.com/data/Husary_Muallim_128kbps/...`), since this satisfies "never re-host qari media." Before final build, (1) re-verify the exact per-ayah filename convention specifically for the Muallim set by listing the live directory, (2) re-attempt to load the actual license page at versebyversequran.com/site/license (it 404'd in this pass) or find an alternate authoritative statement, since currently the only license evidence is a second-hand community claim of CC BY-NC. If everyayah's terms turn out to be genuinely NC-only, that is still compatible with our non-commercial, free-to-student course, but would matter if the course ever "scales into a public/global course" commercially as the spec's future-proofing intends — flag this for re-check at that time. Consider cpfair/quran-align (CC BY 4.0 timing JSON) for future word-highlighting, contingent on Husary Muallim having a released alignment file.

**Fonts:** KFGQPC Uthmanic Hafs for Quran text (freeware-with-no-modification-rights — bundle unmodified, keep license text in repo, source from an official channel, retry the direct qurancomplex.gov.sa/QUL/Tanzil download since the direct fonts subdomain didn't resolve in this pass). Amiri and Noto Naskh Arabic for qaida/drill text (both SIL OFL 1.1, fully embeddable/modifiable).

**Curriculum structure:** Noorani Qaida's traditional progression (freely usable as a teaching method) remains the right Phase 1–2 backbone, as the spec already decided; Understand Quran Academy's rule sequencing and "125 words" vocabulary-first pacing are useful *pedagogical* cross-checks (read/study only, never copy their PDFs/text) for ordering Phase 3's rules strand. Arabic101 and the Uzbek channel stay link/embed-only via YouTube's own player.

**Code/UX patterns worth studying (not copying without a license check):** kodepandai/colorful-quran (MIT, working SvelteKit tajweed-color static site — good architecture reference even though it doesn't use our Next.js stack or Tanzil text), Waqar144/quran_memorization_helper and galacticwarrior9/Iqra (hifz/progress-tracking UX ideas relevant to Phase 3 and the localStorage-only progress model).

**Explicitly avoid embedding:** GreentechApps/Al-Quran (no license), any understandquran.com PDF/text, any single site's color-coded Quran PDF images, KamranAzeem/learn-arabic-quran-qaida content (no license), Arabic101's paid ebook, and any QUL dataset whose specific resource page hasn't been individually license-checked.

---

## 8. Open Items to Re-Verify Before Build

1. everyayah.com / versebyversequran.com's actual license page 404'd — find a working copy (try web.archive.org for `versebyversequran.com/site/license`) or get a direct statement.
2. Confirm exact zero-padded filename convention for Husary_Muallim_128kbps per-ayah files by listing the live directory (e.g. via `curl` directory listing or a HEAD request against a guessed `001001.mp3`).
3. Confirm KFGQPC Uthmanic font's official/current download source and the exact license text bundled with the current font release (the direct fonts.qurancomplex.gov.sa endpoint failed to connect in this session).
4. Verify codepoint alignment between cpfair/quran-tajweed's annotation offsets and whichever exact Tanzil text release/version we pin.
5. Check individual Internet Archive Noorani Qaida items' rights statements before treating any specific file as safely linkable/embeddable (Public Domain Mark on the Archive.org page is Archive.org's own tagging, not a guarantee — especially for publisher-branded editions).
6. Re-check alquran.cloud and Quran Foundation API terms in full (both had fetch issues in this pass) before deciding whether to use either even as a build-time convenience layer.
