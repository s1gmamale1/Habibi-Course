# Phase 2 — Reading Mechanics (14 lessons)

**Source of truth for this document:** `docs/superpowers/specs/2026-07-19-tajweed-course-design.md` (design spec) and `docs/research/verified-resources.md` (canonical resource manifest). Every audio/video URL below is copied verbatim from a VERIFIED OK row in `verified-resources.md` or from the individual research docs it consolidates. Nothing here is a new/unverified resource.

**Arabic-text provenance note (read before using this doc to build content):** short Arabic strings shown inline below (qaida-style letter/vowel drills, and the al-Fatiha verses used in the "real words → phrases → sentences" lessons) are given here **for lesson-planning legibility only**. Qaida-style letter/harakat grids and invented CV/CVC drill syllables are not Quran text and can be typed freely — they are pedagogical notation, the same way `docs/research/noorani-qaida.md` and the design spec describe them. The **al-Fatiha strings ARE Quran text**; they are reproduced here matching the exact fetched sample already verified in `docs/research/quran-text-data.md` §4 (quran.com API v4, `verses/by_key/1:1`), but per the cross-cutting build rule in `verified-resources.md` ("Never hand-type Quran text… every Arabic string must trace to Tanzil… and be copy-verified, not retyped from any research doc"), **the actual content-authoring step must re-fetch every ayah/word used below from `api.quran.com/api/v4/verses/by_key/{key}` or `api.alquran.cloud/v1/ayah/{key}/quran-uthmani` and diff it against this doc before it goes into any shipped content file.** Treat every Fatiha string below as "believed correct, not yet build-verified."

---

## Phase overview

| # | Title | New content introduced | Qaida-tradition basis (docs/research/noorani-qaida.md) | Real Quran text used? |
|---|---|---|---|---|
| 2.1 | Tanwin — the Three Nunation Marks | fathatain ً, kasratain ٍ, dammatain ٌ; the "an/in/un" sound | Ch.5 | No (grid drill) |
| 2.2 | Tanwin in Real Reading | mixed harakat + tanwin strings; tanwin at word-end fluency | Ch.6 | No (drill words) |
| 2.3 | Sukun I — Closed Syllables | sukun mark ــْـ; consonant + sukun + consonant clusters | Ch.10 | No (drill words) |
| 2.4 | Sukun II — Harder Clusters & the "Bouncing" Letters | 3-letter clusters; sound-only preview of ق ط ب ج د when sakin (qalqalah *sound*, not the rule name) | Ch.11 | No (drill words) |
| 2.5 | Shadda — the Doubling Mark | shadda ّ; doubled-consonant timing | Ch.12 | No (grid) + 1 real word (رَبَّنَا) |
| 2.6 | Shadda in Words | shadda+sukun, double-shadda words | Ch.13–15 | No (drill words) |
| 2.7 | The Three Madd Letters | long ا و ي elongation; khari harakat (standing vowels) | Ch.7–8 | No (contrast drill) |
| 2.8 | Madd Meets Shadda & Sukun; Leen Letters | madd interacting with shadda/sukun; leen (و/ي preceded by fatha) contrast | Ch.9, 16 | No (contrast drill) |
| 2.9 | Hamzatul-Wasl Basics | connecting/silent hamza; the helping-vowel rule | **No qaida precedent — genuine gap, built from general tajweed-primer sources + verified video links** | Yes — بِسْمِ ٱللَّهِ, ٱهْدِنَا (1:1, 1:6) |
| 2.10 | Real Words | first real, fully-voweled Quran words; word-by-word tap audio | Ch.17 bridge | Yes — words from 1:1–1:2 |
| 2.11 | Phrases | 2–4 word real Quran phrases; word-joining in reading | Ch.17 bridge | Yes — phrases from 1:1, 1:2, 1:4 |
| 2.12 | Fully-Voweled Sentences I | Ta'awwudh, Bismillah, al-Fatiha ayat 1–4 read (not memorized) | Mirrors Uzbek channel's Ta'awwudh→Bismillah→Fatiha order (uzbek-channel.md §5) | Yes — 1:1–1:4 |
| 2.13 | Fully-Voweled Sentences II — Fluency | al-Fatiha ayat 5–7; slow-but-correct full-surah read-through | Mirrors uzbek-channel.md §5 | Yes — 1:5–1:7 |
| 2.14 | First Mushaf Page | real mushaf page layout: line breaks, ayah-end circles, page furniture — reading only, no rules | The qaida "graduation" moment (no chapter number; noted in noorani-qaida.md §2 row 17 / §5) | Yes — mushaf page 1 (or last Juz 30 page — confirm at build time) |
| **Checkpoint 2** | **Live gate — the biggest gate in the course** | unseen fully-voweled words + sentences, read unaided | — | Yes — unseen short-surah material |

**Pacing note:** this phase is designed for 3 live sessions/week with 15–20 min daily homework, matching the spec's ~5-week Phase 2 window. Any lesson is repeatable; a weak Checkpoint 2 result triggers targeted revision of the specific lesson(s) named in the Revision Mapping at the end of this document, never a full restart.

**Color-coding note:** Phase 2 does **not** introduce tajweed rule colors (that begins Phase 3 per the spec and `verified-resources.md` §7). All Arabic in Phase 2 slides/drills is plain black text in Amiri (qaida/drill items) or KFGQPC Uthmanic (real Quran strings), full harakat, no color spans yet.

---

### Lesson 2.1 — Tanwin: the Three Nunation Marks

- **Objectives:**
  1. Student names and recognizes all three tanwin marks (fathatain ً, kasratain ٍ, dammatain ٌ) on sight.
  2. Student correctly produces the "an / in / un" nasalized final sound for each.
  3. Student reads any single letter + tanwin combination without hesitation.
- **New content:** Tanwin as "double harakat" — the same fatha/kasra/damma shapes doubled, each adding a light final "n" sound. Explicitly distinguished from a real letter ن (noon): tanwin's "n" is a property of the vowel mark, not a written letter, and only appears at the end of a word.
- **Slide outline:**
  1. Title slide — "Tanwin: doubling the vowel"
  2. Recap: fatha/kasra/damma review (tap-to-hear each, from Phase 1 Unit 1.3)
  3. Concept: what tanwin looks like (ً ٍ ٌ) — visual comparison against single harakat
  4. Concept: the sound — "an", "in", "un" — teacher models each live
  5. Guided drill: letter ب + all 3 tanwin marks, call-and-repeat
  6. Guided drill: letter ت + all 3 tanwin marks
  7. Full grid drill: 6 letters (ب ت ج د ر س, chosen to cover different makhraj zones) × 3 tanwin marks
  8. Contrast slide: fathatain (بً) vs plain fatha (بَ) — length/nasal check
  9. Common-mistake demo: over-nasalizing tanwin like a full noon-sakinah ghunnah (preview only — full ghunnah rule is Phase 3)
  10. Independent read-aloud: 8-item mixed tanwin list, no teacher model first
  11. Wrap-up: what tanwin sounds like vs. looks like
  12. Homework assignment slide
- **Drills:** Full-grid drill table (write on slide + print handout):
  ```
  بً بٍ بٌ    تً تٍ تٌ    جً جٍ جٌ
  دً دٍ دٌ    رً رٍ رٌ    سً سٍ سٌ
  ```
  Read left-to-right, each cell in isolation, then as a full row without pausing. These are pedagogical letter+mark combinations (not Quran words), matching the qaida Ch.5 drill style described in `docs/research/noorani-qaida.md` §2.
- **Audio:** **Gap, flagged.** No openly-licensed qari-quality audio set exists for isolated letter+tanwin drill grids (`verified-resources.md` §4, "confirmed hard gap"). Primary: live teacher voice modeling each cell before the student repeats. Secondary/replay-at-home reference (audition first, vetted YouTube link, never downloaded): Muallimi Soniy "Tanwin letters part 1" — `https://www.youtube.com/watch?v=j52uaiDWcBY`.
- **Video:** Muallimi Soniy Tajvid darslari #7 "Tanwin letters part 1" `https://www.youtube.com/watch?v=j52uaiDWcBY` and #8 "part 2" `https://www.youtube.com/watch?v=NyznkPtRTjk` — optional student replay links, Uzbek-language, matches student's L1.
- **Teacher listen-for:**
  - Tanwin's final "n" pronounced as a full, held ghunnah nasal (that belongs to Phase 3 noon-sakinah/tanwin rules, not here) vs. correctly kept light and brief.
  - Fathatain's vowel length stretched into a madd (بً should not sound like باً).
  - Confusing kasratain (ٍ, written below the letter like kasra) with dammatain (ٌ, written above like damma) — a visual mark-position mix-up, not a sound mix-up; catch it by asking the student to point at the mark before reading it.
- **Homework:** 15–20 min: print handout of the 6-letter × 3-tanwin grid (18 cells); read the full grid aloud twice daily, then read down columns (all fathatain, then all kasratain, then all dammatain) once daily to isolate each sound.

---

### Lesson 2.2 — Tanwin in Real Reading

- **Objectives:**
  1. Student reads 2–3 letter clusters ending in tanwin at natural reading pace.
  2. Student self-corrects when a tanwin sound is dropped or over-nasalized.
  3. Student distinguishes tanwin-at-word-end from a plain letter+short-vowel mid-word.
- **New content:** Tanwin embedded inside longer drill strings (not just single letters) — the qaida's "harakat + tanwin exercises" stage (Ch.6), moving from isolated cells to short reading lines.
- **Slide outline:**
  1. Title + recap of Lesson 2.1's three marks (tap-to-hear review)
  2. Concept: tanwin only ever appears on the LAST letter of a word — orientation rule
  3. Guided drill: 2-letter strings ending in tanwin (e.g. سَبً , كَتٍ , رَتٌ)
  4. Guided drill: 3-letter strings ending in tanwin
  5. Speed round: teacher points to random cells from Lesson 2.1's grid, student reads instantly
  6. Contrast drill: same string with tanwin vs. with plain short vowel, side by side
  7. Common-mistake demo: dropping the tanwin sound entirely at word-end (reading سَبً as سَبَ)
  8. Independent read-aloud: 10-item mixed list, unaided
  9. Wrap-up: tanwin readiness check
  10. Homework assignment slide
- **Drills:** Mixed strings (invented, qaida-style, not Quran words):
  ```
  سَبً    كَتٍ    رَتٌ    مَلً    نَبٍ    دَرٌ
  بَتَنً    كَرَمٍ   سَلَمٌ
  ```
  Read each left-to-right; teacher models first 3, student reads remaining unaided.
- **Audio:** Gap, flagged — same as 2.1. Primary: live teacher voice. Secondary replay: Muallimi Soniy "Tanwin letters part 3 (the 'n' sound of tanwin)" `https://www.youtube.com/watch?v=F6Zjeo3F8tY`.
- **Video:** Same as above, `https://www.youtube.com/watch?v=F6Zjeo3F8tY`.
- **Teacher listen-for:**
  - Tanwin dropped silently at the end of a string (most common — student reads the consonant+vowel and stops before the "n").
  - Rushing the whole string and blurring the tanwin into the next drill item (no micro-pause between items).
- **Homework:** Print handout of the mixed-string list above; read the full list aloud 3x, then have the (Uzbek-speaking) student say each item's meaning-neutral sound back without looking, using the tap-audio-free "cover and recite" method (foreshadows the Sabaq/Sabqi repetition habit used later in hifz, per `docs/research/teaching-mistakes-assessment.md` §C.2).

---

### Lesson 2.3 — Sukun I: Closed Syllables

- **Objectives:**
  1. Student recognizes the sukun mark (ــْـ) and explains it means "no vowel, full stop of the consonant sound."
  2. Student reads a consonant-vowel-consonant(sukun) syllable cleanly, without inserting an extra vowel.
  3. Student distinguishes a sakin letter from a letter carrying a short vowel.
- **New content:** Sukun as the qaida's Ch.10 "jazm" mark; the concept of a genuinely closed/consonant-ending syllable, which does not exist in isolation in most beginner reading up to this point (Phase 1 only taught open CV syllables).
- **Slide outline:**
  1. Title — "Sukun: the sound that stops"
  2. Recap: open syllables (CV) from Phase 1
  3. Concept: the sukun mark, what "no vowel" means physically (full consonant closure, no vowel release)
  4. Guided drill: single letter + sukun in isolation (بْ تْ جْ) — teacher models the "clipped" sound
  5. Guided drill: CV + C(sukun) — e.g. بَبْ، تَتْ، كَكْ
  6. Guided drill: two different letters, CVC(sukun) — e.g. بَتْ، كَتْ، سَرْ
  7. Common-mistake demo: inserting a hidden extra vowel after the sakin letter (بَتْ mispronounced as "bati")
  8. Contrast slide: same string with and without sukun
  9. Independent read-aloud: 10-item CVC list
  10. Wrap-up + readiness check
  11. Homework assignment slide
- **Drills:**
  ```
  بَبْ   تَتْ   كَكْ   سَسْ
  بَتْ   كَتْ   سَرْ   مَنْ   لَبْ   دَمْ
  ```
  (Invented qaida-style syllables; note مَنْ and دَمْ happen to be real Arabic words too — flag to student only as a fun aside, not a vocabulary lesson.)
- **Audio:** Gap, flagged. Primary: live teacher voice, deliberately over-articulating the stop consonant so the closed sound is unambiguous. Secondary replay: Muallimi Soniy "Arab tilida yozish va o'qish, Lesson 6 — Sukun" `https://www.youtube.com/watch?v=z2FoR46yb6U`, and the 4-hour compilation's two dedicated sukun chapters, `https://youtu.be/VhRHKdPcNPA` at timestamps 10:48 ("Sukun lesson 1") and 14:44 ("Sukun lesson 2").
- **Video:** Arabic101 — "Read ANY difficult word in the Quran using THIS 'Sukoon method'" `https://www.youtube.com/watch?v=kYti7Fa6Azc`.
- **Teacher listen-for:**
  - The classic beginner error: adding a phantom short vowel after a sakin consonant (turning a closed syllable back into an open one) — this is the single mistake this lesson exists to eliminate.
  - Over-correcting into an unnaturally long, held stop on the sakin letter (should be clipped, not dragged).
- **Homework:** Print handout of the CVC list; read aloud 3x/day, paying attention to stopping the sakin consonant cleanly with no vowel tail.

---

### Lesson 2.4 — Sukun II: Harder Clusters & the "Bouncing" Letters

- **Objectives:**
  1. Student reads 3-letter clusters containing two sukun letters.
  2. Student notices (by ear, not by rule-name) that five specific letters (ق ط ب ج د) have an extra "bounce"/echo when sakin.
  3. Student reads increasingly complex consonant clusters at a controlled pace.
- **New content:** Longer/harder sukun clusters (qaida Ch.11); an ear-training preview of the qalqalah letters' distinctive echo when sakin — sound only, the rule name "qalqalah" and its formal teaching is reserved for Phase 3 per the spec's rules strand.
- **Slide outline:**
  1. Title + recap of Lesson 2.3
  2. Concept: harder clusters — sakin letter followed immediately by another consonant+vowel
  3. Guided drill: 3-letter CVC-CV clusters (e.g. بَتْبَ، كَتْكَ)
  4. Ear-training slide: the 5 "bouncing" letters ق ط ب ج د — teacher demonstrates the same letter sakin vs. non-bouncing sakin letters (تْ سْ) side by side, no rule name given yet, just "listen for the extra echo"
  5. Guided drill: sakin ق ط ب ج د in different positions
  6. Independent read-aloud: mixed harder-cluster list
  7. Common-mistake demo: flattening the bounce entirely on ق ط ب ج د vs. adding it to letters that shouldn't have it
  8. Speed round: random cluster flashcards
  9. Wrap-up: "what did your ear catch today?"
  10. Homework assignment slide
- **Drills:**
  ```
  بَتْبَ   كَتْكَ   سَرْسَ   مَنْتَ
  أَبْ   أَطْ   أَقْ   أَجْ   أَدْ   (isolated bounce-letter demo, sakin)
  أَتْ   أَسْ   أَلْ   (non-bounce comparison)
  ```
- **Audio:** Gap, flagged. Primary: live teacher voice (this lesson specifically depends on the teacher's own ear-training demonstration, per the spec's design that the teacher's live voice + documented references carry Phase 1–2's qaida-style content). Secondary reference for teacher self-prep: Arabic101 Sifaat Lesson 2, "THAT's why Qalqalah exists" `https://www.youtube.com/watch?v=LeWwxpm_Lzw`, and Sifaat Lesson 7, "practical Exercise... transform your Qalqalah" `https://www.youtube.com/watch?v=ph9AB2CQbVo` — for the teacher's own confidence before demonstrating live; do not name "qalqalah" to the student yet.
- **Video:** Same two Arabic101 links above — teacher-prep only this lesson, not shown to the student (keeps rule-naming in Phase 3 as designed).
- **Teacher listen-for:**
  - No audible difference between a bouncing letter (ق ط ب ج د) and a non-bouncing letter (ت س ل) when sakin — the ear-training goal of this lesson not yet landing.
  - Adding an artificial bounce to non-qalqalah letters by overcorrection.
- **Homework:** Print handout with the isolated bounce-letter list and the comparison list; read each list daily, and note (informally, no writing required) which letters "echo" more than others — a listening journal, not a writing task, consistent with the spec's "no writing requirement" stance.

---

### Lesson 2.5 — Shadda: the Doubling Mark

- **Objectives:**
  1. Student recognizes the shadda mark (ّ) and explains it means "this letter is pronounced twice — once closed, once with its vowel."
  2. Student reads a shadda letter with an audible doubling/hold, not a single quick consonant.
  3. Student reads the first real Quran word containing a shadda correctly (رَبَّنَا).
- **New content:** Shadda (tashdeed) — qaida Ch.12; the "hold the consonant" timing concept, directly parallel to sukun (a shadda letter is really a sakin + voweled repetition of the same letter fused together).
- **Slide outline:**
  1. Title — "Shadda: say it twice, but as one"
  2. Recap: sukun (Lessons 2.3–2.4) as a bridge concept — shadda = sakin-letter + voweled-letter of the same sound, fused
  3. Concept slide: the shadda mark, how it sits on top of a letter
  4. Guided drill: single letter + shadda + each of the 3 short vowels (بَّ بِّ بُّ)
  5. Guided drill: shadda letter inside a short string (كَبَّ، سَدَّ)
  6. Real-word slide: رَبَّنَا (Rabbanā, "our Lord") — tap-to-hear, teacher models the held بّ
  7. Common-mistake demo: pronouncing the shadda letter only once (dropping the doubling — "even some Arabs make this mistake," per Arabic101)
  8. Contrast drill: with shadda vs. without (كَبَّ vs. كَبَ)
  9. Independent read-aloud: 8-item shadda list
  10. Wrap-up + readiness check
  11. Homework assignment slide
- **Drills:**
  ```
  بَّ بِّ بُّ    تَّ تِّ تُّ    كَبَّ    سَدَّ
  ```
  Real word: رَبَّنَا (word 1 of many Quranic occurrences, e.g. Surah al-Baqarah 2:127 — cite exact ayah at build time; used here only as a single-word pronunciation example, not for memorization).
- **Audio:** Grid/drill items — gap, flagged, live teacher voice primary. Real word رَبَّنَا — **use word-by-word audio once the exact verse/word index is confirmed at build time** via `https://api.quran.com/api/v4/verses/by_key/{key}?words=true&word_fields=audio_url`, resolving to `https://audio.qurancdn.com/wbw/{SSS}_{AAA}_{WWW}.mp3` (VERIFIED OK pattern, `verified-resources.md` §3).
- **Video:** Muallimi Soniy Tajvid darslari #5 "Shaddah letters part 1" `https://www.youtube.com/watch?v=9CZ4d1rOHgk` and #6 "part 2" `https://www.youtube.com/watch?v=BiHMiHFA37Y`. Arabic101 — "How to pronounce words starting with 'shaddah'" `https://www.youtube.com/watch?v=ftB68_7QRz4`.
- **Teacher listen-for:**
  - Shadda pronounced as a single, un-doubled consonant (the single most common shadda error, cross-referenced in Arabic101's "Even some Arabs make THIS mistake in ج" pattern and general shadda documentation).
  - No audible timing gap/hold at all versus an unnaturally long, exaggerated hold — aim for a clean, brief doubling, not a stutter.
- **Homework:** Print handout of the grid + رَبَّنَا; read the grid 3x/day; practice رَبَّنَا specifically using tap-to-hear-then-repeat, 10 repetitions per the concrete number from `docs/research/teaching-mistakes-assessment.md` §C.2 ("recite the corrected portion at least 10 times").

---

### Lesson 2.6 — Shadda in Words

- **Objectives:**
  1. Student reads words combining shadda with a following sukun letter.
  2. Student reads words with two separate shadda letters.
  3. Student maintains correct doubling timing inside longer strings, not just isolated cells.
- **New content:** Shadda+sukun combinations and double-shadda words (qaida Ch.13–15) — the combinatorial complexity step before moving to madd.
- **Slide outline:**
  1. Title + recap of Lesson 2.5
  2. Concept: shadda immediately followed by a sakin letter in the same word
  3. Guided drill: shadda+sukun strings (e.g. كَبَّرْ، سَدَّتْ)
  4. Concept: two shaddas in one word
  5. Guided drill: double-shadda strings (e.g. كَبَّرَّ — invented drill form, not necessarily a real word, purely for timing practice)
  6. Common-mistake demo: collapsing one of the two shaddas when there are two in a row
  7. Speed round: flashcards mixing single-shadda, shadda+sukun, and double-shadda items
  8. Independent read-aloud: 8-item mixed list
  9. Wrap-up: shadda mastery check (this closes the shadda arc before madd letters)
  10. Homework assignment slide
- **Drills:**
  ```
  كَبَّرْ   سَدَّتْ   مَدَّتْ   رَبَّتْ
  (double-shadda timing drill, invented, not real words:)
  كَبَّرَّ   سَدَّدَّ
  ```
- **Audio:** Gap, flagged — live teacher voice primary, same as prior shadda lesson.
- **Video:** Arabic101 — "How to stop at a word with shaddah PROPERLY" `https://www.youtube.com/watch?v=_344AVeWcQI` (relevant since this is also where the student first practices stopping mid-cluster). Muallimi Soniy "Tanwin + Shaddah combined" `https://www.youtube.com/watch?v=42BjGwPYmYI` for a closely related combinatorial-drill model.
- **Teacher listen-for:**
  - When two shaddas appear in one word, the second one silently dropped or under-articulated (attention fatigue on the second doubling).
  - Shadda+sukun sequences rushed so the sukun's "closed stop" and the shadda's "doubled hold" blur into one indistinct sound — listen for both timing events separately.
- **Homework:** Print handout of the mixed list; daily read-aloud 3x, explicitly counting "1-2" under the breath for each shadda occurrence to internalize the doubling beat (a concrete, teachable counting cue).

---

### Lesson 2.7 — The Three Madd Letters

- **Objectives:**
  1. Student names the three madd letters (ا و ي, each preceded by its matching short vowel — fatha+ا, damma+و, kasra+ي) and explains "long vowel."
  2. Student holds a madd letter for a clearly longer duration than a plain short vowel.
  3. Student recognizes the standing-vowel marks (khari harakat) as an alternate, unwritten way to show the same long vowel.
- **New content:** Madd letters proper (qaida Ch.8) plus khari harakat/standing vowels (Ch.7) as one combined concept: any time a long "aa/oo/ee" sound is heard, it is either a full written madd letter or an implied one shown by a small superscript mark.
- **Slide outline:**
  1. Title — "Three letters that stretch the sound"
  2. Recap: short vowels (fatha/kasra/damma) — the building blocks being extended
  3. Concept: alif preceded by fatha = long "aa" (با)
  4. Concept: waw preceded by damma = long "oo" (بُو)
  5. Concept: ya preceded by kasra = long "ee" (بِي)
  6. Contrast drill: short vs. long, all three vowels side by side (بَ/با، بُ/بُو، بِ/بِي)
  7. Concept: khari harakat — the small superscript alif/damma/ya mark that means the same long sound without a full extra letter (show 1–2 examples)
  8. Guided drill: reading strings that mix short and long vowels
  9. Common-mistake demo: rushing through a madd letter or clipping it to short-vowel length ("one of the most common and audible mistakes in beginner recitation," per `docs/research/teaching-mistakes-assessment.md` §A.5)
  10. Independent read-aloud: 8-item contrast list
  11. Wrap-up + readiness check
  12. Homework assignment slide
- **Drills:**
  ```
  بَ / با     بُ / بُو     بِ / بِي
  كَتَبَ / كَتَابَ    سَلَمَ / سَلَامَ
  ```
  (Invented contrast pairs, qaida-style, isolating the short-vs-long distinction.)
- **Audio:** Gap, flagged for the invented contrast strings — live teacher voice primary, with the elongation held audibly and consistently on each pass so the student has a stable model to imitate.
- **Video:** Muallimi Soniy Tajvid darslari #2 "Madd Tabi'i (natural elongation)" `https://www.youtube.com/watch?v=zXlHApBpo9s`, #3 "part 2" `https://www.youtube.com/watch?v=BS7q7IIYBmY`, #4 "part 3" `https://www.youtube.com/watch?v=FWrBHIoQwvI`; and #14/#15 "Elongation markers part 1/2" `https://www.youtube.com/watch?v=WIcfficCdMk` / `https://www.youtube.com/watch?v=znGlTbfqA9Q` (khari harakat). Arabic101 — "Madd (مد) in Quran MADE EASY" `https://www.youtube.com/watch?v=Q737ZCSbC_g`.
- **Teacher listen-for:**
  - Madd letters clipped to roughly short-vowel length (the #1 documented madd error across sources) — the elongation must be clearly, audibly longer, even before Phase 3 assigns it an exact vowel-count.
  - Adding elongation to a plain short vowel that has no madd letter at all (over-correction in the other direction).
- **Homework:** Print handout of the contrast pairs; read each pair aloud, holding the long form for roughly double the short form's length, 3x/day.

---

### Lesson 2.8 — Madd Meets Shadda & Sukun; Leen Letters

- **Objectives:**
  1. Student reads a madd letter followed immediately by a shadda or sukun letter without shortening the madd.
  2. Student distinguishes a "leen" و/ي (waw/ya preceded by fatha, a soft diphthong, not a long vowel) from a true madd و/ي.
  3. Student completes the full arc from Lesson 2.1 through this lesson with all core qaida marks now covered.
- **New content:** Combined tanwin/madd/leen exercise (qaida Ch.9) and the shadda+madd interaction (Ch.16) — the qaida's own final consolidation step before sukun/shadda mechanics are considered "done."
- **Slide outline:**
  1. Title + recap of all marks covered so far (tanwin, sukun, shadda, madd) — a checklist slide
  2. Concept: madd letter immediately followed by a shadda letter — the madd must still be held in full
  3. Guided drill: madd+shadda strings (e.g. جَابَّ — invented drill form)
  4. Concept: leen letters — waw/ya preceded by FATHA (not damma/kasra) — a soft "aw/ay" diphthong, shorter than true madd
  5. Contrast drill: madd و (بُو) vs. leen و (بَوْ), madd ي (بِي) vs. leen ي (بَيْ)
  6. Guided drill: mixed madd/leen/shadda/sukun string reading
  7. Common-mistake demo: treating leen as if it were a full madd (over-elongating بَوْ/بَيْ)
  8. Independent read-aloud: 10-item mixed list — the hardest reading challenge in Phase 2 so far
  9. Wrap-up: "you now know every core qaida mark" milestone moment
  10. Homework assignment slide
- **Drills:**
  ```
  جَابَّ   تَابَّ   (madd + shadda)
  بَوْ   بَيْ   (leen, contrast against بُو / بِي from Lesson 2.7)
  كَوْنَبْ   بَيْتَنْ   (mixed leen + sukun, invented)
  ```
- **Audio:** Gap, flagged — live teacher voice primary.
- **Video:** Muallimi Soniy #16 "Alif/Ya letters that behave like elongated alif" `https://www.youtube.com/watch?v=V-KdtB8Pno8`; #30 "Non-elongation of elongation letters, part 1" `https://www.youtube.com/watch?v=2fnNTaiOWwc` and #31 "part 2" `https://www.youtube.com/watch?v=rhEaMJsXync` (directly relevant to the leen-vs-madd distinction). Arabic101 — "You will ALWAYS get your madd length correct" `https://www.youtube.com/watch?v=oZ5IjrW555c`.
- **Teacher listen-for:**
  - Shortening a madd letter when it's immediately followed by shadda (a compounding of the Lesson 2.7 madd-clipping error under added complexity).
  - Leen و/ي over-elongated into a full madd — the reverse error, equally important to catch since it changes the intended rhythm.
- **Homework:** Print handout of all three drill sets; 15–20 min daily split three ways (5–7 min each): madd+shadda strings, leen contrast pairs, mixed list — this is the last pure-qaida-mechanics homework before Lesson 2.9 introduces new (non-qaida) content.

---

### Lesson 2.9 — Hamzatul-Wasl Basics

- **Objectives:**
  1. Student explains that hamzat-ul-wasl is a "connecting" hamza: pronounced only when starting fresh at that word, silent/skipped when continuing from the previous word.
  2. Student correctly supplies the helping vowel (usually kasra, sometimes damma) when starting a sentence or phrase at a word carrying hamzat-ul-wasl.
  3. Student reads بِسْمِ ٱللَّهِ and ٱهْدِنَا correctly in both "starting fresh" and "continuing" contexts.
- **New content:** **This is the one confirmed genuine gap versus the Noorani Qaida tradition** — `docs/research/noorani-qaida.md` §5 states plainly that no surveyed qaida system (Noorani, Madani, Baghdadi) teaches hamzat-ul-wasl as a discrete lesson. This lesson is built from general tajweed-primer principles (the alquran.cloud tajweed legend's own "Hamzat ul Wasl" entry, `verified-resources.md` §3, color #AAAAAA / "silent hamza at word beginning") plus the two channels' own dedicated coverage of the exact same topic — both the Muallimi Soniy Tajvid darslari playlist and Arabic101 have multiple videos specifically on this, which is how the gap is closed for a beginner course without inventing untested pedagogy.
- **Slide outline:**
  1. Title — "The hamza that disappears"
  2. Recap: what a normal hamza (ء) sounds like — a full glottal stop
  3. Concept: hamzat-ul-wasl looks like a plain alif (sometimes marked ٱ) but is NOT always pronounced
  4. Concept: "starting fresh" rule — when you begin reading/speaking AT that word, you pronounce a short helping vowel
  5. Concept: "continuing" rule — when the previous word's sound flows into it, the hamzat-ul-wasl is skipped entirely, and the two words connect smoothly
  6. Worked example: بِسْمِ ٱللَّهِ — say ٱللَّهِ alone (helping vowel "a" for laam-shamsiyyah context is handled next lesson; here the point is بِسْمِ + ٱللَّهِ connect with no glottal stop between them at all)
  7. Worked example: ٱهْدِنَا (al-Fatiha 1:6) — read this word standalone (starting fresh: light connecting vowel, no hard glottal stop) vs. inside the full ayah صِرَٰطَ...ٱهْدِنَا (continuing: fully silent, glides straight through)
  8. Common-mistake demo: pronouncing hamzat-ul-wasl as a full hard hamza every time (the single most common error here, per Arabic101's Hamza Wasl vs Hamza Qat' video)
  9. Guided drill: student reads بِسْمِ ٱللَّهِ and ٱهْدِنَا both ways (isolated / connected) with teacher modeling first
  10. Independent read-aloud: same two items, unaided
  11. Wrap-up + preview: "this connects to something bigger in Phase 3 (izhar/idgham) — for now, just connect smoothly"
  12. Homework assignment slide
- **Drills:** Real Quran strings only (no invented drill items for this lesson, since the whole point is a genuine reading behavior, not a shape):
  - بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ (al-Fatiha 1:1) — read as one connected breath group.
  - ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ (al-Fatiha 1:6) — read as one connected breath group, noting ٱهْدِنَا's own initial ٱ only gets a helping vowel if this is where the student *starts* reading.
  - *(Re-verify both strings against `api.quran.com/api/v4/verses/by_key/1:1` and `1:6` at build time, per the provenance note at the top of this document.)*
- **Audio:** Real Quran ayahs — use the VERIFIED everyayah.com Husary Muallim pattern: `https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3` (1:1) and `https://everyayah.com/data/Husary_Muallim_128kbps/001006.mp3` (1:6).
- **Video:** Arabic101 — "How to pronounce Hamza Wasl (همزة وصل) VS. Hamza Qat' (همزة قطع)" `https://www.youtube.com/watch?v=iS31xI9JF2k`. Muallimi Soniy Tajvid darslari #12 "Alif and Hamzah — 9 states" `https://www.youtube.com/watch?v=NWcM83CfdH8`, #22 "Hamzatul-Wasl at word start, part 1 ('u' reading)" `https://www.youtube.com/watch?v=O-NMjdqef4s`, #23 "part 2 ('i' reading)" `https://www.youtube.com/watch?v=ch5ZpUIBuAA`, #24 "part 3 (with shaddah)" `https://www.youtube.com/watch?v=6Cyd-Mxn7hI`.
- **Teacher listen-for:**
  - Full hard glottal stop on every hamzat-ul-wasl regardless of context — the defining error this lesson targets (Arabic101 iS31xI9JF2k names this directly).
  - Wrong helping vowel choice when starting fresh (this lesson only requires recognizing that a helping vowel exists and roughly matching it by ear/modeling; the full rule set for which helping vowel is Phase 3 territory — do not over-teach here).
  - Failure to connect smoothly across the word boundary when continuing (an audible gap/stutter where the hamza should be silent).
- **Homework:** Practice بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ and ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ daily, tap-to-hear then shadow the Husary Muallim audio 10x each (per the 10-repetition correction standard in `docs/research/teaching-mistakes-assessment.md` §C.2), listening specifically for where the reciter connects vs. pauses.

---

### Lesson 2.10 — Real Words

- **Objectives:**
  1. Student reads standalone, fully-voweled real Quran words correctly and confidently.
  2. Student uses tap-to-hear word audio to self-check pronunciation before reading aloud.
  3. Student transitions from "decoding qaida drill shapes" to "decoding real vocabulary" without a drop in accuracy.
- **New content:** First lesson built entirely on real Quran words rather than invented drill syllables — the qaida tradition's own "graduation" step (noorani-qaida.md §5: "Ch.17 ... validates our spec's plan to move straight from qaida mechanics into al-Fatiha/short-surah reading").
- **Slide outline:**
  1. Title — "Your first real words"
  2. Recap: every mark learned so far (harakat, tanwin, sukun, shadda, madd, hamzat-ul-wasl) — framed as "you already have every tool you need"
  3. Word 1: بِسْمِ (1:1, word 1) — tap-to-hear, teacher models, student repeats
  4. Word 2: ٱللَّهِ (1:1, word 2) — tap-to-hear, note the laam-shamsiyyah doubling sound (full rule name deferred to Phase 3, just read it as heard)
  5. Word 3: ٱلرَّحْمَـٰنِ (1:1, word 3) — tap-to-hear, note the khari-harakat small alif (from Lesson 2.7)
  6. Word 4: ٱلرَّحِيمِ (1:1, word 4) — tap-to-hear
  7. Word 5: ٱلْحَمْدُ (1:2, word 1) — tap-to-hear, note the sukun cluster from Lesson 2.3
  8. Word 6: رَبِّ (1:2, word 3) — tap-to-hear, note the shadda from Lesson 2.5
  9. Guided drill: teacher says a word's meaning-neutral sound, student finds/reads it on the slide
  10. Independent read-aloud: all 6 words in sequence, unaided
  11. Common-mistake demo: rushing a multi-syllable real word the way one might rush a 2-letter drill cell — real words need the same careful mark-by-mark reading habit
  12. Wrap-up + readiness check
  13. Homework assignment slide
- **Drills:** Six real words, each independently tap-to-hear:
  | Word | Source | Word audio |
  |---|---|---|
  | بِسْمِ | 1:1, word 1 | `https://audio.qurancdn.com/wbw/001_001_001.mp3` |
  | ٱللَّهِ | 1:1, word 2 | `https://audio.qurancdn.com/wbw/001_001_002.mp3` |
  | ٱلرَّحْمَـٰنِ | 1:1, word 3 | `https://audio.qurancdn.com/wbw/001_001_003.mp3` |
  | ٱلرَّحِيمِ | 1:1, word 4 | `https://audio.qurancdn.com/wbw/001_001_004.mp3` |
  | ٱلْحَمْدُ | 1:2, word 1 | `https://audio.qurancdn.com/wbw/001_002_001.mp3` |
  | رَبِّ | 1:2, word 3 | `https://audio.qurancdn.com/wbw/001_002_003.mp3` |
  *(Filenames follow the VERIFIED `{SSS}_{AAA}_{WWW}.mp3` pattern from `verified-resources.md` §3; re-derive word positions from a fresh `verses/by_key` fetch at build time to confirm indices before wiring.)*
- **Audio:** `https://audio.qurancdn.com/wbw/{SSS}_{AAA}_{WWW}.mp3` — VERIFIED OK, primary word-by-word source.
- **Video:** Arabic101 — "Letter FUSION in the Holy Quran" `https://www.youtube.com/watch?v=NOCKyEcgW7U` (relevant preview of how real words sound different from isolated drill cells).
- **Teacher listen-for:**
  - Reverting to letter-by-letter, halting decoding on a real word after having read faster drill strings — a confidence issue, not a decoding-skill issue; encourage, don't just correct.
  - Any Phase-1-era makhraj slips resurfacing now that attention is split between decoding and a "real word" — this is exactly the moment Checkpoint 1's letter accuracy gets re-tested under load; note any regression for the teacher's own tracking.
- **Homework:** Print handout of the 6 words with tap-audio QR/links (teacher notes carry the exact URLs above); read all 6 daily, tap-to-hear each once before reading aloud, 3 full passes.

---

### Lesson 2.11 — Phrases

- **Objectives:**
  1. Student reads 2–4 word real Quran phrases as connected units, not word-by-word islands.
  2. Student applies the hamzat-ul-wasl "connecting" behavior from Lesson 2.9 inside a real phrase.
  3. Student maintains correct pace — not too slow (word-by-word), not too fast (blurring words together).
- **New content:** Word-joining/liaison in real connected reading (qaida's Ch.17 bridge step) — the step between isolated real words (2.10) and full sentences (2.12–2.13).
- **Slide outline:**
  1. Title — "Words that travel together"
  2. Recap: the 6 words from Lesson 2.10
  3. Phrase 1: بِسْمِ ٱللَّهِ (1:1, words 1–2) — tap-to-hear as a phrase, teacher demonstrates the connected hamzat-ul-wasl glide from Lesson 2.9
  4. Phrase 2: ٱلْحَمْدُ لِلَّهِ (1:2, words 1–2) — tap-to-hear, note the sukun-into-lam connection
  5. Phrase 3: رَبِّ ٱلْعَٰلَمِينَ (1:2, words 3–4) — tap-to-hear, note the shadda + khari-harakat combination
  6. Phrase 4: مَـٰلِكِ يَوْمِ ٱلدِّينِ (1:4, full ayah, 3 words) — tap-to-hear, first 3-word phrase
  7. Concept: reading pace — a phrase should sound like one breath group with natural micro-joins, not 2–4 separate stamped-out words
  8. Common-mistake demo: full stop/glottal catch between every word in a phrase (treating each word like an isolated drill cell)
  9. Guided drill: all 4 phrases, teacher-then-student
  10. Independent read-aloud: all 4 phrases unaided
  11. Wrap-up + readiness check
  12. Homework assignment slide
- **Drills:**
  | Phrase | Source | Notes |
  |---|---|---|
  | بِسْمِ ٱللَّهِ | 1:1, words 1–2 | hamzat-ul-wasl connection (Lesson 2.9) |
  | ٱلْحَمْدُ لِلَّهِ | 1:2, words 1–2 | sukun-to-laam connection (Lesson 2.3) |
  | رَبِّ ٱلْعَٰلَمِينَ | 1:2, words 3–4 | shadda (2.5) + khari harakat (2.7) |
  | مَـٰلِكِ يَوْمِ ٱلدِّينِ | 1:4, full ayah | full 3-word phrase, first ayah-level unit |
- **Audio:** Word-by-word audio (`https://audio.qurancdn.com/wbw/{SSS}_{AAA}_{WWW}.mp3`) for building each phrase up word-by-word, PLUS the phrase-level ayah audio for the natural connected version: `https://everyayah.com/data/Husary_Muallim_128kbps/001004.mp3` for phrase 4 (1:4 is a complete ayah). For phrases 1–3 (partial ayahs), play the relevant word-audio files back-to-back rather than clipping a sub-section of ayah audio.
- **Video:** Muallimi Soniy Tajvid darslari #32 "Joining words when reading, part 1" `https://www.youtube.com/watch?v=q1-fE0jUjLc` and #33 "part 2 (with tanwin)" `https://www.youtube.com/watch?v=vsirACsLNPk` — directly matches this lesson's core skill.
- **Teacher listen-for:**
  - A hard stop/reset between every word in a phrase (the phrase-level version of the drill-cell habit) — this is the primary target error.
  - Over-correcting into slurring word boundaries so individual words become unclear — connection should preserve each word's clarity.
  - Any recurrence of hamzat-ul-wasl mishandling from Lesson 2.9, now inside a full phrase rather than an isolated pair.
- **Homework:** Print handout of the 4 phrases; daily read-aloud 3x, tap-to-hear each phrase's word-audio in sequence first, then read the phrase as one connected unit aloud.

---

### Lesson 2.12 — Fully-Voweled Sentences I

- **Objectives:**
  1. Student reads Ta'awwudh and Bismillah as complete formulaic sentences.
  2. Student reads al-Fatiha ayat 1–4 correctly, at a controlled slow pace, as reading practice (explicitly NOT a memorization requirement — hifz begins formally in Phase 3).
  3. Student applies every Phase 2 skill (tanwin, sukun, shadda, madd, hamzat-ul-wasl, word-joining) inside continuous sentence reading.
- **New content:** First full-sentence reading, directly mirroring the sequencing the Uzbek reference channel itself uses for a beginner's first connected-Quran-text reading: Ta'awwudh → Bismillah → al-Fatiha (`docs/research/uzbek-channel.md` §5, "Confirmed progression: Ta'awwudh → Bismillah → al-Fatiha").
- **Slide outline:**
  1. Title — "Your first full sentences"
  2. Framing: "this is reading practice, not memorization yet — memorization with tajweed starts in Phase 3"
  3. Ta'awwudh: أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَٰنِ ٱلرَّجِيمِ — tap-to-hear, teacher models phrase-by-phrase then full
  4. Bismillah: بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ (1:1) — tap-to-hear, student already knows this fully from Lessons 2.9–2.11
  5. Ayah 1:2 — ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ — tap-to-hear, builds directly on Lesson 2.11's phrase 2–3
  6. Ayah 1:3 — ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ — tap-to-hear (repeats 1:1's words 3–4, an easy win)
  7. Ayah 1:4 — مَـٰلِكِ يَوْمِ ٱلدِّينِ — tap-to-hear (already read as phrase 4 in Lesson 2.11)
  8. Guided read-through: Ta'awwudh + Bismillah + ayat 1–4 as one continuous slow read, teacher then student
  9. Common-mistake demo: rushing pace once several familiar phrases appear in a row (false confidence) — slow-but-correct is the explicit goal named in the spec, not speed
  10. Independent read-aloud: full sequence, unaided, slow pace enforced
  11. Wrap-up + readiness check
  12. Homework assignment slide
- **Drills:** Continuous read-through text (all previously introduced except Ta'awwudh, which is new this lesson):
  - أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَٰنِ ٱلرَّجِيمِ (Ta'awwudh — standard recitation-opening formula)
  - بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ (1:1)
  - ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ (1:2)
  - ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ (1:3)
  - مَـٰلِكِ يَوْمِ ٱلدِّينِ (1:4)
- **Audio:** Ta'awwudh — no single VERIFIED per-ayah mp3 pattern exists for this formula (it is not a numbered ayah); use live teacher voice as primary and the Muallimi Soniy reading-lesson video as a vetted student reference: "Qur'on o'qishni o'rganish 1-dars | A'uzuni o'rganamiz" (Learning Ta'awwudh) `https://www.youtube.com/watch?v=R3PpaKSp09g`. Bismillah + ayat 1–4 — VERIFIED everyayah.com Husary Muallim pattern: `https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3` through `.../001004.mp3`.
- **Video:** Muallimi Soniy "Qur'on o'qishni o'rganish" playlist, lesson 2 "Bismillahni o'rganamiz" (Learning Bismillah) `https://www.youtube.com/watch?v=_wDzCWhTFpA`, lesson 3 "Fatiha surasi matni 1-qism" (al-Fatiha text, part 1) `https://www.youtube.com/watch?v=cmAe5ftLz0M`.
- **Teacher listen-for:**
  - Speed creeping up because several phrases are already familiar from Lessons 2.9–2.11 — actively slow the student back down; "slow but correct" is a named end-of-Phase-2 goal in the spec, not a stepping-stone to be abandoned early.
  - Any of the specific per-mark errors from Lessons 2.1–2.9 resurfacing under the new cognitive load of continuous sentence reading (tanwin dropped, madd clipped, shadda un-doubled, hamzat-ul-wasl over-glottalized) — this lesson is the first real stress-test of everything taught so far.
- **Homework:** Print handout of the full Ta'awwudh + Bismillah + 1:1–1:4 sequence; daily read-aloud 3x at a deliberately slow, word-clear pace, tap-to-hear each ayah first.

---

### Lesson 2.13 — Fully-Voweled Sentences II: Fluency

- **Objectives:**
  1. Student reads al-Fatiha ayat 5–7 correctly.
  2. Student reads the complete surah (Ta'awwudh through ayah 7) start to finish at a controlled, slow-but-correct pace.
  3. Student demonstrates readiness for Checkpoint 2 on sentence-level material.
- **New content:** Completes al-Fatiha as reading material (ayat 5–7); shifts focus from "can you decode this" to "can you read the whole thing fluently and correctly, unaided" — directly named in the spec as Phase 2's closing skill ("slow-but-correct sentence reading").
- **Slide outline:**
  1. Title — "Finishing the surah"
  2. Recap: Ta'awwudh + 1:1–1:4 read-through (Lesson 2.12)
  3. Ayah 1:5 — إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ — tap-to-hear, note the shadda in إِيَّاكَ (repeats twice in this ayah)
  4. Ayah 1:6 — ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ — tap-to-hear (ٱهْدِنَا already read in Lesson 2.9)
  5. Ayah 1:7 — صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ — tap-to-hear, the longest ayah in the surah, taught in two half-lines
  6. Guided read-through: full surah Ta'awwudh + 1:1–1:7, teacher-paced
  7. Independent read-through: full surah, unaided, timed informally (not for a "speed" score — to give the teacher a pace baseline for Checkpoint 2)
  8. Common-mistake demo: breath-management — running out of air mid-ayah on 1:7 and rushing the second half to compensate
  9. Guided drill: pausing options — where it's acceptable to take a breath mid-ayah in 1:7 if needed (practical, not a formal waqf-rule lesson — waqf/stopping rules are Phase 3)
  10. Independent read-aloud: full surah again, unaided, this time self-paced with a breath-pause if needed
  11. Wrap-up: "you can now read a full surah, slowly and correctly" milestone moment
  12. Homework assignment slide
- **Drills:** Full surah text, ayat 5–7 new this lesson:
  - إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ (1:5)
  - ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ (1:6)
  - صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ (1:7)
- **Audio:** VERIFIED everyayah.com Husary Muallim pattern: `https://everyayah.com/data/Husary_Muallim_128kbps/001005.mp3`, `.../001006.mp3`, `.../001007.mp3`. For "listen to the whole surah" review: `https://download.quranicaudio.com/qdc/khalil_al_husary/muallim/1.mp3` (VERIFIED OK, whole-chapter Husary Muallim, `verified-resources.md` §2).
- **Video:** Muallimi Soniy "Qur'on o'qishni o'rganish" lesson 4, "Fatiha surah tajweed" (tajweed applied) `https://www.youtube.com/watch?v=K6d8X2pFUWA`. Arabic101 — "❗IMPORTANT❗How to achieve (Itqaan) in Surah Al-Fatihah" `https://www.youtube.com/watch?v=td40V6Qi4Cc` and "MOST COMMON mistake in Al-fatiha" `https://www.youtube.com/watch?v=cvUQ3xQTa_Y` (teacher-prep reference for this specific surah).
- **Teacher listen-for:**
  - Breath-related rushing on the long ayah 1:7 — listen for pace acceleration in the second half as the student runs low on air, rather than a clean, planned breath-pause.
  - The specific repeated shadda in إِيَّاكَ (twice in 1:5) — confirm both instances are doubled, not just the first (attention-fatigue pattern already flagged in Lesson 2.6).
  - Overall fluency regression compared to Lesson 2.12 now that surah length has roughly doubled — a normal, expected dip; note it but don't treat it as a new distinct error.
- **Homework:** Print handout of the full surah (Ta'awwudh through 1:7); daily read-aloud 3x at slow-but-correct pace, tap-to-hear each ayah before reading; this is the last homework before Checkpoint 2 review begins.

---

### Lesson 2.14 — First Mushaf Page

- **Objectives:**
  1. Student reads a real mushaf page layout (not a slide-isolated ayah) for the first time, recognizing line breaks, ayah-end circles, and surah headers as page furniture, not content to sound out.
  2. Student maintains reading accuracy when text wraps across lines mid-ayah.
  3. Student completes a full practice run of the Checkpoint 2 format before the live gate.
- **New content:** "Reading only, no rules" mushaf-page exposure, explicitly named as Phase 2's closing milestone in the spec. This is the qaida tradition's own unnamed "graduation moment" (`docs/research/noorani-qaida.md` §5: "no qaida chapter number maps here specifically, it's the intended outcome of finishing the primer").
- **Slide outline:**
  1. Title — "Reading from a real page"
  2. Concept: what a mushaf page looks like — right-to-left lines, ayah-end circles (۝-style marks) marking verse boundaries, surah-name headers, juz/hizb markers in the margin — page furniture only, no tajweed color yet
  3. Concept: a line break mid-ayah is not a stop — reading continues across the line exactly as if it were one continuous line
  4. Display: the chosen mushaf page (page 1, containing al-Fatiha in full mushaf layout — confirm exact page number/layout via `quran.com` API `verses/by_page` or a QUL-approved mushaf layout dataset at build time, `verified-resources.md` §1/§5) in the KFGQPC Uthmanic font per the spec's font choice
  5. Guided read-through: teacher reads the full page aloud first, pointing at the page furniture as it's passed (not sounded out)
  6. Guided drill: student reads the page line by line, teacher confirms each line-wrap is handled smoothly
  7. Common-mistake demo: pausing/stopping because a word wraps to the next line, mistaking the line-break for a stopping point
  8. Common-mistake demo: attempting to sound out a surah-header title or margin marker as if it were recitable text
  9. Independent read-aloud: the full page, unaided, slow-but-correct pace (mirrors Lesson 2.13's pacing goal)
  10. Wrap-up: "you can now open any mushaf page and read it" — the Phase 2 finish line
  11. Checkpoint 2 briefing slide: what to expect, what's being tested, how it's scored (see Checkpoint 2 Kit below)
  12. Homework assignment slide
- **Drills:** The full mushaf page itself (already-known al-Fatiha content, now in authentic page layout rather than slide-isolated ayahs) — no new Arabic content, purely a layout/format exposure exercise. If the platform's font/layout pipeline is not ready by this lesson, a printed reproduction of a public-domain-equivalent mushaf page layout (via the QUL-approved mushaf layout data, `verified-resources.md` §1) is an acceptable substitute, never a hand-typed approximation.
- **Audio:** VERIFIED everyayah.com Husary Muallim per-ayah files for the whole page (`001001.mp3` through `001007.mp3`), played in sequence to model a full-page read-through.
- **Video:** Arabic101 — "Understanding Mushaf Differences – A Beginner's Guide" `https://www.youtube.com/watch?v=h5JZIkzG3Hw` (useful if the student later encounters an Indo-Pak or other mushaf layout informally, e.g. via the Uzbek-language community); "What do the symbols in Quran mean?" `https://www.youtube.com/watch?v=meQsEM3V2m8` (page-furniture orientation, general symbols — not the tajweed-color symbols, which are Phase 3).
- **Teacher listen-for:**
  - A full stop or hesitation at every line wrap — the specific new-format error this lesson exists to catch and eliminate before Checkpoint 2.
  - Any attempt to read a surah-name header or marginal juz/hizb marker aloud as if it were Quran text.
  - General accuracy/pace regression when text is presented in authentic page format for the first time versus the slide format used in every prior lesson — expected to some degree; the goal is a quick recovery within the same session, not zero dip.
- **Homework:** Read the same mushaf page aloud daily, 3x, at slow-but-correct pace; this is also the final consolidation homework before Checkpoint 2 — remind the student that Checkpoint 2 uses **unseen** material, so the goal of this homework is comfort with the page format itself, not memorizing this specific page's content.

---

## Checkpoint 2 Kit — "the biggest gate in the course"

Per the spec: Checkpoint 2 tests **unseen** fully-voweled words and sentences, read correctly and unaided. This is the single highest-stakes gate in the 52-lesson course (spec: "Checkpoint 2 ... The biggest gate in the course").

### Test structure

**Part A — Unseen words (5 items).** Real, fully-voweled Quran words the student has not encountered in any Phase 2 lesson (all Phase 2 lesson content above is drawn only from al-Fatiha; therefore any words from short surahs not yet formally read — e.g. al-Ikhlas 112, al-Kawthar 108, an-Nasr 110, al-'Asr 103 — are genuinely unseen at this point, since Phase 3 hifz work on those surahs has not started). At build time, select 5 individual words spanning: one tanwin word, one sukun-cluster word, one shadda word, one madd-letter word, one hamzat-ul-wasl word — mirroring the 5 core Phase 2 mechanics. Source and verify each word via `api.quran.com/api/v4/verses/by_key/{key}?words=true&word_fields=audio_url`, never hand-typed.

**Part B — Unseen sentences (3 items).** 3 short, complete, unseen ayat (e.g. from al-Kawthar 108:1–3 or an-Nasr 110:1–3 — very short surahs, each ayah nearly a "sentence" in the same sense al-Fatiha's ayat were used in Lessons 2.12–2.13). Student reads each cold, tap-to-hear available only as a post-attempt self-check, not before the first read.

**Part C — Mushaf-page read (1 page).** A different, unseen mushaf page (not page 1) read at slow-but-correct pace, testing the Lesson 2.14 skill under fresh material.

### Rubric (adapted from `docs/research/teaching-mistakes-assessment.md` Part B, the Lahn Jali/Khafi scoring system used in live qiraat/tajweed assessment)

| Error type | Definition (this checkpoint's scope) | Deduction |
|---|---|---|
| **Lahn Jali (major)** | Wrong letter sound entirely (makhraj miss), a dropped/added letter, a fully wrong vowel (fatha read as kasra, etc.), tanwin/shadda/madd/sukun feature omitted entirely (e.g. shadda not doubled at all, madd not elongated at all, tanwin's "n" fully dropped) | **−2 per instance** |
| **Lahn Khafi (minor)** | Feature present but imperfect in degree — madd held slightly short/long, tafkheem/tarqeeq quality slightly off (full formal teaching is Phase 3, but Phase 1 letter quality can already show minor decay under reading load), pace unevenness | **−1 per instance** |
| **Self-correction after a prompt** | Student catches and fixes the error once alerted (a bell/tap cue, not a full correction from the teacher) | **−1 per instance** (do not also count the original error twice) |
| **Examiner has to supply the correction** | Student cannot self-correct even after a prompt | **−2 per instance** |
| **Hesitation/non-fluency** | Long pause, false start, but eventually correct unaided | **−0.5 per instance** |

**Pass threshold (adapted from the spec's "unseen words and sentences read correctly, unaided" gate, calibrated against `teaching-mistakes-assessment.md` §B.2's illustrative 70% ijazah-track threshold and §B.3's competition failure-threshold pattern):**
- **Hard fail condition:** any Lahn Jali error that the student cannot self-correct even after a prompt, on **more than 2** of the 9 total test items (5 words + 3 sentences + 1 page) — mirrors the competition rulebook's "more than 3/4 examiner-corrected mistakes fails the section" pattern, scaled down to this checkpoint's smaller item count.
- **Numeric pass line:** total score ≥ 70% of maximum possible points across all three parts (maximum = 0 deductions; compute the percentage as `(max_possible − total_deductions) / max_possible`).
- **Pass with homework flag:** student passes the hard-fail and numeric conditions but accumulated ≥3 Lahn Khafi deductions — advance to Phase 3, but assign the specific revision homework named below alongside the first Phase 3 lessons.
- **Fail → targeted revision, never a full restart:** per the spec's explicit policy ("a failed checkpoint triggers targeted revision of weak units + retest, never a restart"), use the Revision Mapping below to assign only the specific Phase 2 lesson(s) tied to each error pattern observed, then retest Parts A/B/C only (not the whole checkpoint from scratch) once revision homework is done.

### Revision mapping

| Observed error pattern at Checkpoint 2 | Revisit this lesson |
|---|---|
| Tanwin's final "n" dropped, over-nasalized, or mark-position confused (kasratain/dammatain) | 2.1, 2.2 |
| Sukun letter given a phantom extra vowel; consonant clusters not closed cleanly | 2.3, 2.4 |
| Bouncing letters (ق ط ب ج د) flattened or over-bounced when sakin | 2.4 |
| Shadda not doubled at all, or one of two shaddas in a word dropped | 2.5, 2.6 |
| Madd letter clipped to short-vowel length, or a plain short vowel over-elongated | 2.7, 2.8 |
| Leen (و/ي after fatha) confused with true madd (over- or under-elongated) | 2.8 |
| Hamzat-ul-wasl pronounced as a full hard glottal stop in every context, or wrong/absent helping vowel when starting fresh | 2.9 |
| Real word decoding reverts to halting letter-by-letter sounding-out | 2.10 |
| Hard stop/reset between every word in a phrase instead of a natural connected read | 2.11 |
| Pace rushes once material feels familiar; per-mark errors resurface under sentence-length cognitive load | 2.12, 2.13 |
| Breath-management rushing on longer ayat | 2.13 |
| Stopping/hesitating at a line-wrap; attempting to sound out page furniture (headers, margin marks) | 2.14 |
| Phase-1-era makhraj slips resurfacing under any of the above (e.g. ح/خ/ه or ذ/ز/ظ/ض collapse) | Return to the relevant Phase 1 Unit 1.1 shape-family lesson, not a Phase 2 lesson — flag this explicitly to the teacher since it indicates a Phase 1 checkpoint gap resurfacing, not a Phase 2 gap |

### Space to note results (print/live-use page)

```
Student: ______________________   Date: ______________

Part A — Unseen words (5 items)
1. ____________  Jali: __  Khafi: __  Self-corr: __  Examiner-corr: __
2. ____________  Jali: __  Khafi: __  Self-corr: __  Examiner-corr: __
3. ____________  Jali: __  Khafi: __  Self-corr: __  Examiner-corr: __
4. ____________  Jali: __  Khafi: __  Self-corr: __  Examiner-corr: __
5. ____________  Jali: __  Khafi: __  Self-corr: __  Examiner-corr: __

Part B — Unseen sentences (3 items)
1. ____________  Jali: __  Khafi: __  Self-corr: __  Examiner-corr: __
2. ____________  Jali: __  Khafi: __  Self-corr: __  Examiner-corr: __
3. ____________  Jali: __  Khafi: __  Self-corr: __  Examiner-corr: __

Part C — Mushaf page read
Page # ____   Jali: __  Khafi: __  Self-corr: __  Examiner-corr: __   Line-wrap hesitations: __

Total deductions: ____   Max possible: ____   Score %: ____
Result:  [ ] PASS   [ ] PASS with homework flag   [ ] FAIL — targeted revision assigned below

Revision units assigned: ______________________________________
Retest date: ______________
```

---

## Cross-cutting compliance notes for this document

1. Every audio URL pattern above is copied from a row marked **VERIFIED OK** in `docs/research/verified-resources.md` (§2 everyayah.com Husary Muallim, §3 audio.qurancdn.com word-by-word, §2 download.quranicaudio.com whole-chapter). Where no verified resource exists (all qaida-style invented-syllable drills), this is explicitly marked **"Gap, flagged"** with live teacher voice as the primary source, per `verified-resources.md` §4's own recommendation.
2. Every video URL is copied verbatim from `docs/research/uzbek-channel.md` or `docs/research/arabic101.md`; both channels are Standard YouTube License (link/embed only, never re-hosted), per `verified-resources.md` §6.
3. All Fatiha/Ta'awwudh Arabic text must be re-fetched and diff-checked against Tanzil/quran.com at content-authoring time before shipping — see the provenance note at the top of this document. Nothing here should be copy-pasted directly into a shipped content file without that verification pass.
4. No tajweed rule names or colors are taught in Phase 2 (laam-shamsiyyah's doubling sound, the qalqalah "bounce," and the hamzat-ul-wasl "connecting" behavior are all taught as things the student can *hear and do*, without the formal rule name or color — those are explicitly reserved for Phase 3 per the spec).
