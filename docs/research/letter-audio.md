# Research: Individual Letter & Qaida Drill Audio (the hardest sourcing gap)

**Date:** 2026-07-19
**Scope:** Audio for isolated Arabic letters — names, sounds in isolation, letter × fatha/kasra/damma grid, and 2–3-syllable qaida combinations — needed for Phase 1 (Letters & Sounds, 12 lessons) and parts of Phase 2. This is distinct from the verse/word-level Quran audio (Husary Mu'allim via everyayah.com/QUL), which is already well-sourced and NOT re-litigated here except where it's relevant as a fallback.

**Headline finding, stated up front:** After an extensive search across open datasets (Hugging Face, GitHub, OpenSLR), Islamic-audio archives (QUL/Tarteel, everyayah, QuranicAudio), Wikimedia Commons, Internet Archive, and commercial qaida apps/sites, **no openly-licensed, full-coverage (28 letters × 3 short harakat + syllable combinations), qari-quality audio set exists.** This confirms the spec's own framing of this as the hardest gap. Nothing found gets even close to "one license covers the whole Phase 1 drill grid." The realistic plan is a **hybrid**: (1) a very small amount of open-licensed audio can supplement isolated letter *names*, (2) YouTube linking (never re-hosting) covers makhraj instruction and full qaida-grid demonstration by qualified teachers, (3) real Quranic word audio (already sourced) covers Phase 2 once real words appear, and (4) the teacher's own live voice is the primary "audio" for the Phase 1 drill grid itself, which is defensible pedagogically since Phase 1 is taught live 3x/week with immediate correction — the platform's job is to supply the *authoritative reference* the teacher checks against and the *student's at-home repetition cue*, not to be the sole voice of tajweed.

---

## 1. What "full coverage" would require

To have one clean, licensable audio set for Phase 1–2 qaida drills, you'd need:

- 28 letters, isolated pronunciation (name + sound) — Unit 1.1
- 28 letters × initial/medial/final/isolated shapes read aloud in context — Unit 1.2
- 28 letters × 3 harakat (fatha/kasra/damma) = 84 syllables — Unit 1.3 full grid
- 2–3 letter combinations (the qaida "joining" drills)
- Later: tanwin, sukun clusters, shadda, madd letters — Phase 2

No source below delivers more than a fragment of this list under a verifiable open license.

---

## 2. Open datasets (Hugging Face / GitHub / OpenSLR) — evaluated and rejected as primary source

### 2.1 Aziz-snoubra/Abjad-Kids (Hugging Face)
- URL: https://huggingface.co/datasets/Aziz-snoubra/Abjad-Kids
- **License: MIT** (explicit, verified on dataset card).
- Content: 40,646 WAV audio files (~2.61 GB) of **children** speaking Arabic alphabet **letter names** (e.g., "Alif," "Ba," "Ta"), plus separate numbers and colors sets. Distributed as `alphabet.csv` / `numbers.csv` / `colors.csv` with `audio` (path) and `label` columns, loadable via the HF `datasets` library.
- **Coverage gap:** letter *names* only — no evidence of a fatha/kasra/damma harakat grid, no makhraj-quality adult/qari pronunciation, no syllable combinations. Built for ASR/audio-classification research on child speech, not for teaching correct tajweed articulation.
- **Verdict:** Usable only as a *very minor* supplementary "hear a kid say the letter name" novelty for engagement (e.g., a matching game), never as the authoritative pronunciation reference the spec requires ("materials...encode authoritative references"). Do not use for makhraj teaching. License is clean if used, but purpose mismatch is the real blocker.

### 2.2 Other Hugging Face Arabic speech datasets surveyed
- `tunis-ai/arabic_speech_corpus`, `halabi2016/arabic_speech_corpus` — mirrors of the University of Southampton Arabic Speech Corpus (Levantine-accented MSA, phoneme-level labels) — sentence/word level, not letter-isolated qaida drills. Not fit for purpose.
- `Falah/classification_arabic_dialects` — CC BY-SA 4.0, dialect classification clips, irrelevant content (dialect speech, not letters).
- `atlasia/DODa-audio-dataset` — MIT license, Moroccan Darija parallel speech — wrong language variety and content (colloquial vocabulary, not letters/tajweed).
- `MBZUAI/ArVoice` — MSA speech-synthesis corpus, diacritized sentences — sentence-level TTS training data, not letter drills.
- `Salama1429/tarteel-ai-everyayah-Quran`, `tarteel-ai/everyayah` — these are HF mirrors of the **everyayah.com verse-by-verse Quran recitation corpus**, already the spec's planned source for verse/word audio. Confirmed present on HF but this is ayah-level Quran recitation, not letter/qaida audio. Useful confirmation that everyayah content is accessible via HF too, not a new find for this specific gap.
- **Arabic Corpus of Isolated Words** (University of Stirling, referenced via GitHub `Anwarvic/Arabic-Speech-Recognition`) — ~10,000 utterances of **20 whole words**, 50 male speakers, 44.1kHz/16-bit WAV. Isolated-word corpus, not letters; and license/redistribution terms need individual verification (research corpus, not obviously CC).
- **OpenSLR** — searched broadly; no OpenSLR corpus specifically targets isolated Arabic letters or qaida drills. OpenSLR Quran-related entries are recitation/ASR corpora (verse level), not letter level.

**Conclusion for section 2:** the open-dataset/ML-research world produces *sentence-level* or *whole-word* Arabic speech corpora (for ASR/TTS research) and, in one case (Abjad-Kids), *letter-name-only* child speech — never a tajweed-grade letter+harakat drill set. This gap makes sense: qaida audio is a niche religious-education need that ML dataset builders haven't targeted.

---

## 3. Wikimedia Commons — has word pronunciations, not a letter/harakat drill set

- Category: https://commons.wikimedia.org/wiki/Category:Arabic_pronunciation (1,855+ files, most under CC-BY-SA or CC0/public domain per Commons policy) and https://commons.wikimedia.org/wiki/Category:Audio_files_in_Arabic.
- Verified via the Commons API (`action=query&list=categorymembers&cmtitle=Category:Arabic_pronunciation`) that this category is populated with files like `Ar-Abdelaziz_Bouteflika.ogg`, `Al_arabic.ogg`, `Alarabia.ogg`, `Ar_'ajnabi.ogg` — i.e., **pronunciations of specific Arabic words** (place names, people, common nouns) recorded for Wiktionary/Wikipedia entries, in the `Ar-<word>.ogg` naming convention used by the Wiktionary pronunciation-bot pipeline.
- Checked the letter-specific category `Category:ء` (hamza): **19 files, all visual (SVG/PNG/GIF/PDF) — zero audio files.** No per-letter pronunciation recordings were found for the individual Arabic letters as letters (only as they appear inside recorded whole words).
- **Conclusion:** Commons/Wiktionary's Arabic audio corpus is real, large, and genuinely CC-licensed, but organized around *word* pronunciation, not an alphabet/harakat teaching grid. Not usable for Unit 1.1–1.3 letter/vowel drills. It *could* theoretically be mined later for isolated real-word audio once Phase 2 introduces vocabulary, as a supplement to QUL word-by-word audio, but that's outside this gap's scope and QUL already covers it better for Quranic words specifically.

---

## 4. Internet Archive — several qaida/letter items exist, but licensing is unverifiable and likely NOT open

Search turned up multiple plausible-sounding items:
- https://archive.org/details/ArabicAlphabetAudio — "The Arabic Alphabet Audio & Video," uploader credited as "Nurul Huda Publications." Tagged in the "opensource" community collection.
- https://archive.org/details/RuleForAlifWithoutHamza — titled on-page "Sounds of The Arabic Letters and Syllables," attributed to the Tajweed Institution of Florida.
- https://archive.org/details/noorani-qaida-with-audio-free-download — an uploaded APK of a commercial "Noorani Qaida With Audio" Android app (Qalam Pro Studio branding), not raw redistributable audio.
- https://archive.org/details/arabic-letters-makhraj-animated — "Tajweed With Me" branded animated makhraj video.
- https://archive.org/details/06AlifBaaIntroductionToArabicLettersAndSounds, https://archive.org/details/ArabicLetters, https://archive.org/details/TheArabicAlphabet, https://archive.org/details/arabic_alphabet, https://archive.org/details/alif_ba_en

**Important caveat — could not verify licenses directly this session.** archive.org was unreachable during this research pass: both direct `curl` (connection timed out against 207.241.224.2:443) and the WebFetch tool (consistent HTTP 503 across repeated attempts, on both `/details/...` pages and the `/metadata/...` JSON API) failed for every archive.org URL tried. This is very likely a transient outage/rate-limit rather than a permanent block, but it means **none of these items' license/rights metadata could be confirmed as part of this report** — I did not assert or use anything from them beyond what indexed search-snippet text showed.

**What this matters for:** Internet Archive's "opensource" *community* collection tag is **not** a rights declaration — it is a self-selected upload category commonly used for re-uploads of copyrighted commercial media (app APKs, publisher-branded courses, named Islamic institutions' proprietary content) with no real license clearance. The item names above (Nurul Huda Publications, Tajweed Institution of Florida, Qalam Pro Studio's app, "Tajweed With Me") all read as branded, likely-commercial or institutional content uploaded by third parties, not self-published open-licensed works. **Do not treat these as openly licensed without a manual, item-by-item rights check** (look for an explicit `licenseurl` such as a `creativecommons.org/licenses/...` URL in the item's metadata, not just the "opensource" collection badge). Given the hard constraint that content must be free AND openly licensed (or merely linked), the safest legally-clean use of any Internet Archive item that turns out to lack a real open license is the same as the YouTube fallback: **link to the archive.org detail page, do not download/rehost the file**, and only do so after a human confirms the item isn't a straightforward piracy re-upload (linking to clearly infringing re-uploads is still reputationally/legally risky even if "just a link").

**Action item for the user/teacher:** re-check these seven URLs manually when archive.org is reachable, specifically opening each item's "About This Item" panel for a rights/license line, before deciding whether to link them at all.

---

## 5. Commercial qaida apps & sites — good coverage, but no open license (link-only candidates at best)

These have exactly the content shape needed (full letter+harakat audio grid) but are ordinary commercial/dawah products with implicit all-rights-reserved status; none published an open license we could find.

- **Madinah Arabic** interactive alphabet chart: https://www.madinaharabic.com/arabic-reading-course/lessons/L000_001.html — confirmed via page fetch to have tap-to-play audio per letter, URL pattern `https://www.madinaharabic.com/Audios/L000/L000_004.mp3` (Baa), `.../L000_005.mp3` (Alif), sequentially numbered per letter within the `L000` lesson folder. No license statement found on the page or footer; site states it has run "paid and not paid" Arabic courses since 2003 — ordinary copyrighted material. **Do not download/rehost these mp3s.** Could be considered for a plain hyperlink (not embed, not fetch) only with explicit permission from the site owner; otherwise omit.
- **eQuranSchool.com** Noorani Qaida pages (e.g., https://www.equranschool.com/qaida/06.htm, https://www.equranschool.com/online-noorani-qaida-for-kids/02.htm) — full qaida lesson pages; audio presence/URL pattern and license could not be confirmed from the fetched excerpt (footer not captured). Treat as unlicensed commercial content; link-only if used at all, after manual confirmation of what's actually playable.
- **Noorani Qaida With Audio** (Android app, various publishers e.g. Qalam Pro Studio, "Noorani Qaida Arabic Alphabets" on Google Play) — commercial apps, no open license, cannot be used as a course asset (can't distribute their audio; app itself isn't a web asset anyway).
- **Primary Ilm** (https://primaryilm.com/resources/qaida/), **Q Read** (Qfatima.com PDF) — worksheet/PDF resources, not audio; and PDFs are typically copyrighted teaching materials from Islamic educational nonprofits — check individually if wanted for print drills, but out of scope for *audio*.

**Conclusion for section 5:** the commercial/dawah-org qaida ecosystem is exactly where full-coverage letter+harakat audio actually lives — which is precisely why this is a hard gap: it's abundant but locked up under ordinary copyright, not open licenses.

---

## 6. QUL (Quranic Universal Library) / Tarteel — confirmed no letter/qaida audio product

- https://qul.tarteel.ai/ and https://github.com/TarteelAI/quranic-universal-library — confirmed via search and the project's own materials that QUL's audio offering is Quran **recitations with ayah/surah-level and word-by-word timestamp data**, not an isolated-letter or qaida-grid audio resource. This directly confirms the spec's existing plan (QUL for verse/word audio in Phase 2–3) is the right and only use of QUL — it doesn't extend to Phase 1 letter drills. No new letter-audio resource found here; documented as a deliberate dead-end so it isn't re-searched later.

---

## 7. YouTube fallback — concretely evaluated, this is the strongest practical option for Unit 1.1/1.2 (makhraj instruction) and grid demonstration

Per the spec's own sourcing plan ("gaps covered by linking timestamps in Arabic101 videos and the Uzbek reference channel"), YouTube linking/embedding (never downloading) is explicitly sanctioned. Candidates found and worth building the Phase 1 lesson decks around:

- **Arabic101 channel** (https://www.youtube.com/@Arabic101, playlists at https://www.youtube.com/@Arabic101/playlists) — has a dedicated **Makharij & Sifaat** lesson series, individually numbered:
  - Lesson 1 (general intro): https://www.youtube.com/watch?v=-YrfRpwFMe8
  - Lesson 2 (ء + هـ): https://www.youtube.com/watch?v=Bzz_wo6skWA
  - Lesson 3 (ع + ح): https://www.youtube.com/watch?v=-oA0HfNUezI
  - Lesson 12 (ص): https://www.youtube.com/watch?v=yhIFJiPqVqA
  - Alphabet intro: https://www.youtube.com/watch?v=c-7SVieC_04
  - A dedicated makharij-of-the-Arabic-letters playlist: https://www.youtube.com/playlist?list=PLwQ9f3zC02mEjGWBEvZS1uZ92Af3hy9Ct
  This channel is already referenced in the spec as a curriculum cross-check, so using its per-letter makhraj videos for tap-through links in Unit 1.1/1.2 slides is consistent and low-effort — build a small per-letter timestamp map (letter → video URL → start-second) as a content file.
- **Standalone makhraj-per-letter series** e.g. "Makhraj No 4/17 - Makhraj of Qaaf": https://www.youtube.com/watch?v=Ofq57gASCgY (part of a 17-part per-letter series — worth locating parts 1–17 and timestamping) and "1 - Articulation Point (Makhraj) of 'Alif": https://www.youtube.com/watch?v=gKFilC3gt6Q.
- **Full Noorani Qaida video courses** covering the harakat grid directly (letter × fatha/kasra/damma read aloud in sequence, matching Unit 1.3 exactly):
  - https://www.youtube.com/watch?v=yRRuVRT6Kao ("Alif Baa Taa | Qaida Noorania lesson 1")
  - https://www.youtube.com/watch?v=3uonJK7HikM ("Noorani Qaida Full Course")
  - Playlist: https://www.youtube.com/playlist?list=PL2vX1cVCMJVXT53sBXgn8o0EMUOY-NZcm
  These are exactly the harakat-grid content Unit 1.3 needs, presented by a live teacher voice — but reciter credentials/accuracy are unverified and vary by channel; **the teacher must audition each candidate video for correct makhraj/tajweed before linking it into a lesson**, since the spec explicitly warns the teacher's own accuracy is 80–90% and materials must not encode uncorrected mistakes.
- **Uzbek reference channel** (already in spec, https://youtu.be/VhRHKdPcNPA for sentence-reading sequence) — worth checking whether the same channel also has an alphabet/qaida playlist for style consistency with the sentence-reading sequence already adopted; not separately confirmed in this pass — recommend the user check that channel's own playlist tab directly.

**Mechanics:** embedding via the standard YouTube iframe embed (`https://www.youtube.com/embed/<id>?start=<seconds>`) is "linking," not "re-hosting" — fits the hard constraint. Store `{videoId, startSeconds, letter, note}` per drill item in the lesson content file so the renderer can build a tap-to-jump UI identical in spirit to the tap-to-hear qari audio player, just pointing at an embedded YouTube player instead of an mp3.

---

## 8. Word-level Quranic audio as a partial substitute (fallback b from the brief)

For Unit 1.3 (letter × harakat) and Phase 2 syllable/word drills, once real Quranic words are introduced, the already-sourced Husary Mu'allim / QUL word-by-word audio (verified elsewhere in this project's sourcing) is a strong, unambiguously-licensed substitute — but it is a *substitute for isolated letter+harakat drilling*, not equivalent to it:

- It cannot supply a **letter in total isolation** (a bare "بَ" sound with nothing before/after) — Quranic audio is always word/verse-embedded.
- It **can** supply real, correctly-recited instances of a target letter+harakat *inside* a short, carefully chosen word, which is pedagogically valid for Unit 1.3's tail end and directly useful for Phase 2 (real words, phrases). E.g., select short 2–3-letter Quranic words that isolate a specific consonant+harakat combination as their first syllable, and use the existing QUL/everyayah word-audio pipeline to fetch those clips — no new licensing work needed since this route reuses the sourcing pipeline the spec already establishes for verse/word audio.
- Recommend building this word list as part of the Phase 1/2 syllabus-writing pass (a separate research/content task), not as part of this audio-sourcing task.

---

## 9. Fallback (c): record later

The spec explicitly puts "recording original audio" out of scope for v1. Given everything above, that exclusion is worth revisiting narrowly: this is the one gap where a from-scratch recording would have outsized leverage — a single ~20–30 minute recording session (teacher or a vetted qari) covering all 28 letters × 3 harakat + a handful of 2–3-letter syllable combinations would fully close this gap forever, at low cost, and could be self-licensed (CC-BY or outright course-owned) with no ambiguity. This is a recommendation to reconsider for v1.1, not a v1 requirement — the YouTube-link + live-teacher-voice hybrid is sufficient to launch Phase 1 without blocking on it.

---

## 10. Concrete recommendation for this course

1. **Do not search further for a single "perfect" open letter-audio dataset — none exists.** Stop treating this as an unsolved sourcing problem and adopt the hybrid below as final for v1.
2. **Unit 1.1 (letter names/sounds) and 1.2 (joining):** build a per-letter YouTube timestamp map from the Arabic101 makharij series (§7) and any per-letter 17-part makhraj series located; embed via `youtube.com/embed/<id>?start=<s>`. Teacher auditions every linked video once before it goes live (a lightweight QA task, not a research task).
3. **Unit 1.3 (harakat grid):** primary "audio" is the live teacher voice during the 3x/week lesson (already the delivery model); secondarily link one vetted full-alphabet Noorani Qaida harakat-grid video (§7) per lesson slide so the student can replay the same grid at home between lessons. Do not attempt to source per-cell tap-audio for the 84-cell grid — no licensed source exists for that granularity.
4. **Do not use** Internet Archive qaida/letter items (§4) unless a human manually re-checks each item's rights metadata when the site is reachable again, and even then prefer link-only, never download/rehost.
5. **Do not use** Madinah Arabic, eQuranSchool, or any commercial qaida app/site's audio files directly (§5) — no open license found; if ever linked, link only to the page, never fetch/embed the mp3 files directly (their URL pattern was discovered incidentally, not sanctioned for use).
6. **Optional, low-priority supplement:** Abjad-Kids (MIT-licensed, §2.1) could back a lightweight "match the letter name" mini-game for engagement, clearly separated from the authoritative makhraj-teaching content — not a substitute for qari/teacher voice.
7. **Phase 2 onward:** lean entirely on the already-sourced QUL/everyayah Husary Mu'allim word-by-word pipeline (§8) — this gap effectively disappears once real words start, because that audio pipeline is both open enough (linked, never rehosted, per existing project convention) and qari-quality.
8. **Reconsider recording original qaida audio (§9)** as a fast, low-cost v1.1 upgrade that would fully retire this gap; flag to the course owner as an option, not a blocker.

---

## 11. Full URL list (for the scripted "every audio reference resolves" check later)

| # | URL | Status / use |
|---|---|---|
| 1 | https://huggingface.co/datasets/Aziz-snoubra/Abjad-Kids | MIT license, verified; optional minor supplement only |
| 2 | https://commons.wikimedia.org/wiki/Category:Arabic_pronunciation | CC-licensed word audio; not letter/harakat grid |
| 3 | https://commons.wikimedia.org/wiki/Category:Audio_files_in_Arabic | same as above |
| 4 | https://commons.wikimedia.org/wiki/Category:%D8%A1 | checked (hamza) — 19 files, zero audio |
| 5 | https://qul.tarteel.ai/ | confirmed: no letter/qaida audio product |
| 6 | https://github.com/TarteelAI/quranic-universal-library | same |
| 7 | https://archive.org/details/ArabicAlphabetAudio | UNVERIFIED (503/timeout) — manual re-check required |
| 8 | https://archive.org/details/RuleForAlifWithoutHamza | UNVERIFIED — manual re-check required |
| 9 | https://archive.org/details/noorani-qaida-with-audio-free-download | UNVERIFIED — likely commercial APK reupload, avoid |
| 10 | https://archive.org/details/arabic-letters-makhraj-animated | UNVERIFIED — manual re-check required |
| 11 | https://www.madinaharabic.com/arabic-reading-course/lessons/L000_001.html | commercial, no license; link-only if ever used |
| 12 | https://www.madinaharabic.com/Audios/L000/L000_004.mp3 | example mp3 URL found in page source — do NOT fetch/embed without permission |
| 13 | https://www.equranschool.com/qaida/06.htm | commercial, license unconfirmed |
| 14 | https://www.youtube.com/@Arabic101/playlists | recommended link source (already in spec) |
| 15 | https://www.youtube.com/playlist?list=PLwQ9f3zC02mEjGWBEvZS1uZ92Af3hy9Ct | Arabic101 makharij playlist — recommended |
| 16 | https://www.youtube.com/watch?v=-YrfRpwFMe8 | Arabic101 Makharij & Sifaat Lesson 1 |
| 17 | https://www.youtube.com/watch?v=Bzz_wo6skWA | Arabic101 Lesson 2 (ء + هـ) |
| 18 | https://www.youtube.com/watch?v=-oA0HfNUezI | Arabic101 Lesson 3 (ع + ح) |
| 19 | https://www.youtube.com/watch?v=yhIFJiPqVqA | Arabic101 Lesson 12 (ص) |
| 20 | https://www.youtube.com/watch?v=c-7SVieC_04 | Arabic101 alphabet intro |
| 21 | https://www.youtube.com/watch?v=gKFilC3gt6Q | "Articulation Point of Alif" per-letter series pt.1 |
| 22 | https://www.youtube.com/watch?v=Ofq57gASCgY | "Makhraj of Qaaf" per-letter series pt.4/17 |
| 23 | https://www.youtube.com/watch?v=yRRuVRT6Kao | Noorani Qaida Lesson 1 (harakat grid) |
| 24 | https://www.youtube.com/watch?v=3uonJK7HikM | Noorani Qaida Full Course |
| 25 | https://www.youtube.com/playlist?list=PL2vX1cVCMJVXT53sBXgn8o0EMUOY-NZcm | Noorani Qaida full playlist |
| 26 | https://youtu.be/VhRHKdPcNPA | Uzbek reference channel (already in spec) — check its playlist tab for an alphabet series |

---

## 12. Explicit statement per the task brief

**If nothing openly licensed has full coverage, say so explicitly:** confirmed — nothing found in this research pass is both (a) openly licensed/verifiable and (b) full-coverage across 28 letters × 3 harakat + syllable combinations at qari/makhraj quality. The nearest thing to full coverage (Noorani Qaida YouTube videos, Madinah Arabic's per-letter mp3 grid, various qaida apps) is commercially/institutionally copyrighted with no open license found. The nearest thing to an open license (Abjad-Kids, MIT) has only fragment coverage (letter names, child voices, no harakat grid) and is pedagogically unsuited to be the authoritative reference. The recommended path is the hybrid in §10: live teacher voice + vetted YouTube links (never rehosted) for Phase 1, falling through to the already-solid QUL/everyayah word-audio pipeline as soon as Phase 2 introduces real words.
