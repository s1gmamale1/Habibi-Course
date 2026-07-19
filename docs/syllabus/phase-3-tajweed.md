# Phase 3 — Tajweed & Quran (26 Lessons)

**Source spec:** `docs/superpowers/specs/2026-07-19-tajweed-course-design.md`
**Source research:** `docs/research/verified-resources.md` (canonical resource manifest), `tajweed-rules-colors.md`, `quran-text-data.md`, `recitation-audio.md`, `teaching-mistakes-assessment.md`, `arabic101.md`.
**Status:** Master blueprint for Phase 3 content build. Every Arabic string below was pulled programmatically from `api.quran.com/api/v4` (`text_uthmani` / `words[].text_uthmani` fields, which mirror Tanzil's Uthmani text — see `quran-text-data.md` §4) on 2026-07-19 and is **not hand-typed**; word positions were read directly from the same API response so per-word audio URLs below are exact, not guessed. Re-run the same fetch at content-build time per the spec's scripted QA check before shipping.

---

## 0. How this document is organized

Every lesson interleaves **two strands**, per the spec:

- **Rules strand** — taught in this fixed order: noon sakinah & tanwin quartet → meem sakinah → qalqalah → madd family → lam of Allah & ra → waqf basics. Each rule is mapped to its color the day it is taught (§1).
- **Hifz strand** — al-Fatiha first, then an-Nas backward through al-Fil (surahs 114→105), using the Sabaq (new) → Sabqi (recent review) → Manzil (old review) cycle from `teaching-mistakes-assessment.md` Part C, with revision-before-new-material ordering inside each homework session.

**Revision lessons** (3.6, 3.11, 3.16, 3.20, 3.24, 3.26) pause new *rules* content to consolidate, but the *hifz* strand keeps moving (or deliberately pauses for a Sabqi/Manzil-only week) — the two strands are revised independently, not forced to freeze together. This mirrors the research's "revision before new memorization" principle without stalling the whole lesson.

**Rule examples are drawn from the hifz surahs wherever a clean instance exists** (confirmed programmatically for nearly every rule in this syllabus — a stronger result than the original research pass found, see §6). Where no clean in-set instance exists (iqlab; idgham shafawi/mithlayn; the 5 rā' isti'lā exception words), the example is explicitly labeled **"reference example — outside your memorized surahs, verify against Tanzil before use."**

**Audio URL patterns used throughout** (all VERIFIED in `verified-resources.md`):
- Ayah (Husary Mu'allim, primary qari): `https://everyayah.com/data/Husary_Muallim_128kbps/{SSS}{AAA}.mp3` (3-digit surah + 3-digit ayah, zero-padded, no separator).
- Whole surah (Husary Mu'allim, for "listen to the full surah" hifz review): `https://download.quranicaudio.com/qdc/khalil_al_husary/muallim/{chapter}.mp3`.
- Single word (isolating a rule's trigger word): `https://audio.qurancdn.com/wbw/{SSS}_{AAA}_{WWW}.mp3` (3-digit surah_ayah_word, underscore-separated).

**Video links** are Arabic101 (standard YouTube license — link/embed only, never download, per `arabic101.md`) and the Uzbek reference channel Muallimi Soniy where genuinely relevant (native-language cross-check, per spec).

---

## 1. Canonical tajweed color legend — the course's documented choice

Per `verified-resources.md` §7 and `tajweed-rules-colors.md` §8, two candidate color schemes disagree (alquran.cloud's 16-color fine-grained legend vs. Dar Al-Maarifah's 5-broad-color scheme used in real printed color-coded mushafs). **This course adopts the Dar Al-Maarifah 5-color scheme as canonical** (end-goal 4 explicitly targets "a standard color-coded tajweed mushaf," and Dar Al-Maarifah is the most widely distributed such physical product), cross-referencing alquran.cloud's finer hex-level legend in teacher notes only.

| Color | Rule category | First taught | Rules covered |
|---|---|---|---|
| **Gray** | Silent letters | **Lesson 3.1** (Phase 2 review — hamzat-ul-wasl and laam shamsiyyah are already known, so this color is "activated" immediately) | Hamzat-ul-wasl, laam shamsiyyah (assimilated lam), silent alif after the verb-final wow |
| *(no color / plain black)* | Clear, unmodified pronunciation | **Lesson 3.1** | Izhar Halqi, Izhar Shafawi, Idgham Bila Ghunnah, Tarqeeq (light rā'/lām) — the course documents explicitly that "no color" is itself a meaningful signal: nothing here changes the letter's basic sound |
| **Green** | Ghunnah (nasalization) | **Lesson 3.2** | Idgham Ma'al Ghunnah, Ikhfa Haqiqi, Iqlab, Ikhfa Shafawi, Idgham Shafawi/Mithlayn |
| **Light blue** | Qalqalah | **Lesson 3.12** | Qalqalah sughra, kubra, kubra jiddan |
| **Red** | Madd (elongation) | **Lesson 3.14** | Madd Tabee'i, Muttasil, Munfasil, 'Aarid Lis-Sukun, Lazim (all one red family in the Dar Al-Maarifah scheme; teacher-note cross-reference: alquran.cloud distinguishes these with 4 different blue/red hex shades — `#537FFF` normal, `#4050FF` permissible, `#000EBC` necessary, `#2144C1` lazim — worth mentioning to an inquisitive student but not required) |
| **Dark blue** | Tafkheem (heavy/emphatic) | **Lesson 3.21** | Lam of Allah (tafkheem condition), heavy rā' (fatha/damma conditions, sakin-rā' heavy conditions), the isti'la letters generally |

**Verification gap carried forward from research:** the Internet Archive scan of the actual Dar Al-Maarifah printed color legend (`archive.org/details/quran-with-colour-coded-tajweed`) returned 503 in every check pass. This mapping is built from the majority-converged secondary-source description (`alquranonline.com` cross-checked against `easyquran.com`'s independent description before its 403). **Action item before shipping Phase 3 color spans:** re-attempt the Internet Archive scan, or photograph a physical Dar Al-Maarifah copy, to confirm the 5-color mapping visually before it goes in front of the student.

---

## 2. Hifz methodology recap (see `teaching-mistakes-assessment.md` Part C for full sourcing)

- **Sabaq** (new): read new lines 3× from the (harakat-full, color-coded) text with the qari audio → recite from memory, audio available to re-check → repeat until correct → **20–40 total repetitions** logged via a tally the student taps.
- **Error-correction:** any caught mistake gets its line repeated **10 additional times** before returning to the full passage.
- **Sabqi** (recent, days 1–7 after finishing a surah): resurfaces automatically every homework session until "promoted."
- **Promotion rule** (this course's chosen default, since no source gave one): **3 consecutive clean recitations** moves a surah from Sabqi to Manzil.
- **Manzil** (old): once the full 11-item hifz set (al-Fatiha + 10 surahs) is complete, rotate **2 surahs/day** on a ~5–6 day cycle for full weekly coverage.
- **Session order, always:** Manzil/Sabqi review **before** new Sabaq material (per C.2's "revision happens before new memorization" principle) — stated explicitly in every lesson's homework below.

---

## 3. Phase overview table

| # | Rules strand (+ color) | Hifz strand |
|---|---|---|
| 3.1 | Noon Sakinah & Tanwin intro + **Izhar Halqi** (plain) + color-legend orientation (gray activated) | Al-Fatiha 1:1–1:4 — **Sabaq (new)** |
| 3.2 | **Idgham Ma'al Ghunnah** (green activated) | Al-Fatiha 1:5–1:7 — **Sabaq (new, completes)** |
| 3.3 | **Idgham Bila Ghunnah** (plain) + the 4-word exception | Al-Fatiha full — **Sabqi** (recitation polish) |
| 3.4 | **Iqlab** (green) | An-Nas 114:1–114:3 — **Sabaq (new)** |
| 3.5 | **Ikhfa Haqiqi**, part 1 (green) | An-Nas 114:4–114:6 — **Sabaq (new, completes)** |
| 3.6 | **REVISION 1** — full Noon Sakinah/Tanwin quartet drill | Al-Fatiha + An-Nas — **Sabqi/Manzil** |
| 3.7 | **Ikhfa Haqiqi**, part 2 (consolidation, remaining letters) | Al-Falaq 113:1–113:3 — **Sabaq (new)** |
| 3.8 | Meem Sakinah intro + **Ikhfa Shafawi** (green) | Al-Falaq 113:4–113:5 — **Sabaq (new, completes)** |
| 3.9 | **Idgham Shafawi / Mithlayn** (green) | Al-Ikhlas 112:1–112:2 — **Sabaq (new)** |
| 3.10 | **Izhar Shafawi** (plain) | Al-Ikhlas 112:3–112:4 — **Sabaq (new, completes)** |
| 3.11 | **REVISION 2** — Meem Sakinah trio + Noon-vs-Meem comparison drill | Fatiha/An-Nas/Al-Falaq/Al-Ikhlas — **Sabqi/Manzil rotation** |
| 3.12 | **Qalqalah Sughra** (light blue activated) | Al-Masad 111:1–111:3 — **Sabaq (new)** |
| 3.13 | **Qalqalah Kubra & Kubra Jiddan** (light blue) | Al-Masad 111:4–111:5 — **Sabaq (new, completes)** |
| 3.14 | Madd family intro + **Madd Tabee'i** (red activated) | An-Nasr 110:1–110:3 — **Sabaq (new, completes — 3 ayat)** |
| 3.15 | **Madd Wajib Muttasil** (red) | Al-Kafirun 109:1–109:3 — **Sabaq (new)** |
| 3.16 | **REVISION 3** — Qalqalah + Madd Tabee'i/Muttasil drill | Al-Masad/An-Nasr — **Sabqi/Manzil** |
| 3.17 | **Madd Ja'iz Munfasil** (red) | Al-Kafirun 109:4–109:6 — **Sabaq (new, completes)** |
| 3.18 | **Madd 'Aarid Lis-Sukun** (red) | Al-Kawthar 108:1–108:3 — **Sabaq (new, completes — 3 ayat)** |
| 3.19 | **Madd Lazim** (red) | Sabqi/Manzil consolidation — **no new hifz lines** (breathing room before the capstone) |
| 3.20 | **REVISION 4 — Madd Family Capstone** (all 5 types, one drill sheet) | Al-Ma'un 107:1–107:4 — **Sabaq (new)** |
| 3.21 | Lam of Allah — **Tafkheem/Tarqeeq** (dark blue activated) | Al-Ma'un 107:5–107:7 — **Sabaq (new, completes)** |
| 3.22 | Rā' rules, part 1 (fatha/damma → heavy; kasrah → light) (dark blue) | Quraysh 106:1–106:4 — **Sabaq (new, completes — 4 ayat)** |
| 3.23 | Rā' rules, part 2 (sakin-rā' cases + 5-word exception reference card) (dark blue) | Al-Fil 105:1–105:3 — **Sabaq (new)** |
| 3.24 | **REVISION 5** — Lam of Allah + Rā' oral-quiz practice (Final Checkpoint Test 3 rehearsal) | Al-Fil 105:4–105:5 — **Sabaq (new, completes — hifz set now complete: 11/11 items)** |
| 3.25 | **Waqf Basics** (stop signs) + full silent-letters/gray consolidation + full 5-color legend recap | Full Manzil rotation across all 11 items |
| 3.26 | **REVISION 6 / Capstone** — full rules recap (all 6 rule families + all 5 colors) + mock oral quiz | Full hifz rehearsal: al-Fatiha then al-Fil→an-Nas in mushaf-reverse order, unaided |

**→ Final Checkpoint Kit follows §26 (see end of document).**

---

## 4. Lessons

### Lesson 3.1 — Noon Sakinah & Tanwin: Izhar Halqi + Color-Mushaf Orientation
- **Objectives:**
  1. Student names all 6 izhar-halqi trigger letters (ء ه ع ح غ خ) from memory.
  2. Student correctly reads noon-sakinah/tanwin + throat-letter combinations with no nasalization change.
  3. Student can describe the course's 5-color mushaf system at a "which color = which family" level (not yet applying green/red/etc., since only gray + plain are active today).
  4. Student recites al-Fatiha 1:1–1:4 from the page with correct makhraj on every letter (new memorization, not yet unaided).
- **New content:** Noon sakinah (نْ) and tanwin (ـً ـٍ ـٌ) are governed by the same 4 rules depending on the following letter; today's rule is izhar halqi (clear, unmodified pronunciation when a throat letter follows). Also: the course's color-mushaf convention is introduced in full (all 5 colors previewed; only gray + "no color" are live today since hamzat-ul-wasl/laam shamsiyyah were already met in Phase 2).
- **Slide outline:**
  1. Title: "Phase 3 begins — Tajweed rules + memorizing al-Fatiha and the last 10 surahs."
  2. Recap: Phase 2 checkpoint passed — you can already read unseen voweled sentences.
  3. Concept: what is noon sakinah? What is tanwin? (visual: نْ vs ـً/ـٍ/ـٌ)
  4. Concept: the 4-rule branching diagram (izhar / idgham / iqlab / ikhfa) — today = izhar only, others "coming soon."
  5. Concept: izhar halqi — the 6 throat letters, why "clear" (no throat modification needed since the noon is already made in roughly the same zone).
  6. Color-mushaf orientation: show the 5-color legend table (§1) as a poster slide — "you'll build this over the next 9 weeks."
  7. Guided drill: read أَنْعَمْتَ (1:7), عَنْهُ (111:2), مِنْ خَوْفٍ (106:4) aloud with the teacher, tap-to-hear each.
  8. Guided drill: student reads 5 fresh izhar-halqi combinations cold (teacher-supplied list, letters ء ه ع ح غ خ each paired with a noon-sakinah word).
  9. Hifz: introduce al-Fatiha 1:1–1:4 — tap-to-hear each ayah, read along 3×.
  10. Hifz drill: student attempts 1:1–1:4 from memory once, teacher corrects.
  11. Wrap-up: what's live in the color system today (gray, plain) vs. coming (green next lesson).
  12. Homework assignment recap.
- **Drills:**
  - Izhar halqi minimal-set: أَنْعَمْتَ (Al-Fatiha 1:7, noon sakinah + ع), عَنْهُ (Al-Masad 111:2, noon sakinah + ه), غَاسِقٍ إِذَا (Al-Falaq 113:3, tanwin + ء), حَاسِدٍ إِذَا (Al-Falaq 113:5, tanwin + ء), مِنْ خَوْفٍ (Quraysh 106:4, noon sakinah + خ — note: same ayah also contains the ikhfa example مِّن جُوعٍ, save that contrast for Lesson 3.5/3.7).
  - Gray/silent preview drill: point out the hamzat-ul-wasl alif in ٱللَّهِ, ٱلرَّحْمَـٰنِ, ٱلْحَمْدُ, ٱلْعَـٰلَمِينَ (all from 1:1–1:2, already being memorized this lesson) — "these small alifs are silent when reciting connected; gray in the color mushaf."
- **Audio:**
  - Ayah audio: `https://everyayah.com/data/Husary_Muallim_128kbps/001007.mp3` (1:7), `https://everyayah.com/data/Husary_Muallim_128kbps/111002.mp3` (111:2), `https://everyayah.com/data/Husary_Muallim_128kbps/113003.mp3` (113:3), `https://everyayah.com/data/Husary_Muallim_128kbps/113005.mp3` (113:5), `https://everyayah.com/data/Husary_Muallim_128kbps/106004.mp3` (106:4).
  - Hifz new material: `https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3` through `.../001004.mp3`.
  - Word-isolated: `https://audio.qurancdn.com/wbw/106_004_006.mp3` (مِنْ) + `.../106_004_007.mp3` (خَوْفٍۭ) for the izhar pair.
- **Video:** Arabic101 — "Learn the Quranic Noon Sakinah in 10 MINUTES" `https://www.youtube.com/watch?v=hy8V7CsxaQk` (assign as homework primer, watch before Lesson 3.2). Uzbek cross-check: Muallimi Soniy Tajvid darslari playlist `https://www.youtube.com/playlist?list=PLgrueUfOSy6toOuZQLtPe3N1PGhZdUsOu` (teacher pre-lesson prep only).
- **Teacher listen-for:**
  - ح vs خ vs ه three-way collapse (the single most-cited non-Arab error) — check on أَنْعَمْتَ's ع and any throat letter drilled today.
  - ع substituted with a plain hamza (glottal stop) — the throat-squeeze musculature isn't habituated yet; expect this on day 1.
  - Any unwanted nasalization creeping into the noon before the throat letter — izhar must stay perfectly clear, no ghunnah bleed.
- **Homework:** 15–20 min: (1) tap-hear + shadow the 5 izhar-halqi drill words 10× each; (2) Sabaq cycle on al-Fatiha 1:1–1:4 — read 3× from page with audio, then attempt from memory, repeat until correct, log repetitions (target 20–40 total); (3) watch the Arabic101 noon-sakinah video once.

---

### Lesson 3.2 — Noon Sakinah & Tanwin: Idgham Ma'al Ghunnah
- **Objectives:**
  1. Student names the 4 idgham-with-ghunnah letters (ي ن م و, mnemonic "يَنْمُو") and holds the ghunnah for 2 counts.
  2. Student distinguishes idgham (merge) from izhar (clear) by ear.
  3. Student completes al-Fatiha memorization (1:5–1:7) and recites the full surah from the page.
- **New content:** Idgham ma'al ghunnah — noon sakinah/tanwin is dropped and merged into a following ي ن م و **across a word boundary**, held 2 counts with nasal resonance. Green is now live in the color system.
- **Slide outline:**
  1. Title + recap of izhar halqi (quick oral check, 2 words).
  2. Concept: idgham = "merging"; why only across word boundaries (the 4-word same-word exception previewed, taught fully next lesson).
  3. Concept: the "يَنْمُو" mnemonic, 4 letters.
  4. Concept: ghunnah — the nasal hum; teacher demo: pinch your nose, if the sound changes, ghunnah is present.
  5. Color activation: green = ghunnah family, first entry in the legend.
  6. Guided drill: عَابِدٌ مَّا (Al-Kafirun 109:4, tanwin + م) and مِّن مَّسَدٍ (Al-Masad 111:5, noon sakinah + م), tap-hear + shadow.
  7. Contrast drill: izhar (أَنْعَمْتَ) vs idgham (عَابِدٌ مَّا) — teacher says one, student names the rule.
  8. Hifz: al-Fatiha 1:5–1:7 new lines — tap-hear, read along 3×.
  9. Hifz: full-surah first attempt (1:1–1:7) from memory with teacher prompting.
  10. Nasal-check drill: student pinches nose reciting عَابِدٌ مَّا — confirms the buzz.
  11. Wrap-up + homework.
- **Drills:**
  - عَابِدٌ مَّا (109:4, tanwin + م) — teacher-supplied written form with the assimilation shown.
  - مِّن مَّسَدٍ (111:5, noon sakinah + م — note: in-set text shows the merge already marked with the doubled م in مَّسَدٍ, useful for showing the student what the merge looks like in the actual mushaf).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/109004.mp3`, `https://everyayah.com/data/Husary_Muallim_128kbps/111005.mp3`. Hifz new: `.../001005.mp3` through `.../001007.mp3`. Word-isolated: `https://audio.qurancdn.com/wbw/111_005_004.mp3` (مِّن) + `.../111_005_005.mp3` (مَّسَدٍۭ).
- **Video:** none new this lesson (reuse 3.1's noon-sakinah video as reference); teacher-prep only: Arabic101 Sifaat Lesson 1 (hams/jahr) `https://www.youtube.com/watch?v=ZwgM-1M_J7o` for ghunnah's voiced-nasal framing.
- **Teacher listen-for:**
  - Ghunnah held too short (<2 counts) or entirely dropped, collapsing idgham toward izhar.
  - Ghunnah held through the *wrong* letter (nasalizing the noon itself instead of the merged-into letter).
  - Al-Fatiha memory slips at the 1:5–1:7 boundary (new/old material seam) — common on lesson 2 of any new surah.
- **Homework:** (1) idgham drill words 10× each with nose-pinch self-check; (2) Sabaq on 1:5–1:7 (3 reads + memory attempts, 20–40 reps); (3) Sabqi: full al-Fatiha recited once daily from memory, audio available to self-correct.

---

### Lesson 3.3 — Noon Sakinah & Tanwin: Idgham Bila Ghunnah
- **Objectives:**
  1. Student names the 2 idgham-without-ghunnah letters (ل ر) and explains why no ghunnah applies (full merge, no nasal residue).
  2. Student states the 4-word same-word exception rule (idgham never applies within a single word, except الدُّنْيَا, بُنْيَان, صِنْوَان, قِنْوَان — those stay izhar mutlaq).
  3. Student recites al-Fatiha fluently and unaided from memory (first full-surah milestone).
- **New content:** Idgham bila ghunnah — full merge into a doubled ل or ر, **no** nasal hold (this stays "plain," uncolored, since no ghunnah occurs — an explicit, documented design choice per §1). The same-word exception (izhar mutlaq) is the "trap" case students must recognize.
- **Slide outline:**
  1. Title + recap: idgham ma'al ghunnah (green) vs today's idgham bila ghunnah (plain).
  2. Concept: ل ر — the 2 no-ghunnah letters.
  3. Concept: why plain, not green — the merge is total, nothing left to nasalize.
  4. Concept: the 4-word same-word exception (show all 4 words: الدُّنْيَا, بُنْيَان, صِنْوَان, قِنْوَان) — "these look like idgham triggers but are izhar mutlaq because noon+letter sit in one word."
  5. Guided drill: يَكُن لَّهُ (Al-Ikhlas 112:4, noon sakinah + ل) and فَوَيْلٌ لِّلْمُصَلِّينَ (Al-Ma'un 107:4, tanwin + ل).
  6. 3-way contrast drill: izhar / idgham-with-ghunnah / idgham-without-ghunnah, teacher plays 6 mixed examples, student names each.
  7. Hifz: no new lines today — full Sabqi session, al-Fatiha polish.
  8. Hifz milestone check: student recites al-Fatiha fully from memory, unaided, teacher scores using the Jali/Khafi rubric (see §5) as an early practice run.
  9. Wrap-up: "Fatiha is your first completed surah — it now enters Manzil rotation once it earns 3 clean days."
  10. Homework.
- **Drills:**
  - يَكُن لَّهُ (Al-Ikhlas 112:4) — this word is not yet memorized (Al-Ikhlas starts Lesson 3.9) so present it as a standalone rule-example card, not a hifz item yet.
  - فَوَيْلٌ لِّلْمُصَلِّينَ (Al-Ma'un 107:4) — same, standalone card (Al-Ma'un hifz starts Lesson 3.20).
  - Same-word exception flashcards: الدُّنْيَا / بُنْيَان / صِنْوَان / قِنْوَان, read aloud, no merge.
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/112004.mp3`, `https://everyayah.com/data/Husary_Muallim_128kbps/107004.mp3`. Full-surah review: `https://download.quranicaudio.com/qdc/khalil_al_husary/muallim/1.mp3`.
- **Video:** none new.
- **Teacher listen-for:**
  - Ghunnah incorrectly added on ل/ر merges (over-correcting from last lesson).
  - The 4 exception words misread as idgham — this is the classic "trap" beginners fall into once they've just learned the rule.
  - Al-Fatiha fluency: any word-order slip, omission, or hesitation at ayah boundaries — log per-ayah for the Manzil-promotion tracking.
- **Homework:** (1) idgham bila ghunnah + exception-word flashcards, 10 reps each; (2) daily full al-Fatiha recitation from memory (Sabqi — this is now the "recent" item being tracked toward 3 clean days); (3) no new Sabaq today, rest the memorization muscle per the research's explicit "revision, not just endless new material" principle.

---

### Lesson 3.4 — Noon Sakinah & Tanwin: Iqlab
- **Objectives:**
  1. Student names the single iqlab trigger letter (ب) and explains the conversion (noon/tanwin → light meem sound + ghunnah).
  2. Student recognizes the small meem sign (ﻣ) printed above the noon in the mushaf as iqlab's visual marker.
  3. Student begins an-Nas memorization (114:1–114:3).
- **New content:** Iqlab — noon sakinah/tanwin converts to a meem-like sound (lips lightly closed) whenever ب follows, held 2 counts of ghunnah. **No clean iqlab example exists inside al-Fatiha or surahs 105–114** (confirmed by both the original research pass and this pass's programmatic re-check of all 11 hifz surahs' text) — the classroom example is sourced from elsewhere and explicitly labeled.
- **Slide outline:**
  1. Title + recap: 3 of 4 noon-sakinah rules done (izhar, idgham×2); today = the 4th, iqlab.
  2. Concept: iqlab = "flip/convert" — the only rule where the noon's *identity* changes, not just its treatment.
  3. Concept: the small meem sign in the mushaf (show an image/description; this is a page-glyph feature, flag for the platform's mushaf renderer).
  4. **Explicit label slide:** "This example is NOT from your memorized surahs — sourced from elsewhere in the Quran, verify against Tanzil before use in any drill sheet." Present the standard textbook instance (noon sakinah + ب) — **content-build action item:** confirm and pin the exact ayah (candidates from research: Al-Baqarah 2:97 أَنۢبِئْهُم) against the live Tanzil/quran.com text before this slide ships; do not retype from any secondary blog.
  5. Guided drill: teacher recites the pinned example, student shadows, focusing on lips-closed-not-shut technique.
  6. Contrast drill: iqlab (meem-like, lips light) vs idgham-with-ghunnah into م (full merge) — these can sound similar to a beginner; teacher demonstrates the difference (iqlab keeps a trace of the noon's original position, idgham fully vanishes into the merged letter).
  7. Hifz: an-Nas 114:1–114:3, tap-hear, read along 3×.
  8. Hifz drill: recall attempt, teacher corrects.
  9. Wrap-up + homework.
- **Drills:** Iqlab reference card (pinned ayah, see action item above) — 10 shadow-reps. An-Nas 114:1–114:3 new-line drill per Sabaq method.
- **Audio:** Hifz new: `https://everyayah.com/data/Husary_Muallim_128kbps/114001.mp3` through `.../114003.mp3`. Iqlab reference ayah audio: to be pinned once the exact ayah is confirmed (candidate `https://everyayah.com/data/Husary_Muallim_128kbps/002097.mp3` for Al-Baqarah 2:97 — **verify this resolves and the text matches before use**).
- **Video:** Arabic101 — "Doing Iqlaab? Gap or no Gap?" `https://www.youtube.com/watch?v=W2VlWnotH1w` (directly on-topic, common-mistakes series). Bonus: "Every Quran learner should master THIS skill - iltiqa sakinain - Noon Qutni" `https://www.youtube.com/watch?v=mqvT07npi_M` (30-day program bonus, teacher-prep/advanced-curious-student optional).
- **Teacher listen-for:**
  - Full lip closure (making it a real meem stop) instead of light/soft closure — iqlab should sound like a meem passing through, not a hard meem.
  - Confusing iqlab with idgham (student merges instead of converting).
  - An-Nas: first-lesson memorization errors — check letter-by-letter against the makhraj work from Phase 1 (a good early re-check that Phase 1 foundations held).
- **Homework:** (1) iqlab reference word, 10 shadow-reps with the "light lips" cue; (2) Sabaq on an-Nas 114:1–114:3; (3) continue daily al-Fatiha Sabqi recitation, log toward 3 clean days.

---

### Lesson 3.5 — Noon Sakinah & Tanwin: Ikhfa Haqiqi (Part 1)
- **Objectives:**
  1. Student names at least 8 of the 15 ikhfa trigger letters and recites the mnemonic sentence.
  2. Student produces the "in-between" ikhfa sound (neither fully clear nor fully merged), held 2 counts, no shaddah on the following letter.
  3. Student completes an-Nas memorization (114:4–114:6).
- **New content:** Ikhfa Haqiqi — the tongue approaches (without touching) the following letter's articulation point; the noon/tanwin is nasalized but not merged. 15 trigger letters (ص ذ ث ك ج ش ق س د ط ز ف ت ض ظ), mnemonic "صِفْ ذَا ثَنَا كَمْ جَادَ شَخْصٌ قَدْ سَمَا دَامَ طَيِّبًا زِدْ فِي تُقَى ضَعْ ظَالِمًا." Part 1 covers the letters with clean in-set examples; Part 2 (Lesson 3.7) consolidates the rest.
- **Slide outline:**
  1. Title + recap: all 4 rules now introduced (izhar, idgham×2, iqlab); today completes the set with ikhfa.
  2. Concept: ikhfa = "hiding" — the middle ground between izhar and idgham.
  3. Concept: the mnemonic sentence, broken into 3 chunks of 5 letters for easier memorization.
  4. Guided drill: مِن شَرِّ (An-Nas 114:4, noon sakinah + ش) — this is today's new hifz material, so the rule and the memorization reinforce each other directly.
  5. Guided drill: مِن شَرِّ (Al-Falaq 113:2, noon sakinah + ش — same trigger letter, different surah, previews next week's hifz).
  6. Contrast drill vs iqlab: "ikhfa nasalizes toward the *next* letter's zone; iqlab converts fully to meem" — teacher demonstrates both back to back.
  7. Full noon-sakinah quartet recap chart (all 4 rules, one slide, in preparation for Lesson 3.6's revision).
  8. Hifz: an-Nas 114:4–114:6, tap-hear, read along 3× (this completes an-Nas — the second full surah).
  9. Hifz drill: full an-Nas from memory, teacher corrects.
  10. Wrap-up + homework.
- **Drills:**
  - مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ (An-Nas 114:4, noon sakinah + ش) — today's hifz line doubles as the rule example.
  - مِن شَرِّ مَا خَلَقَ (Al-Falaq 113:2, noon sakinah + ش) — preview/reference, not yet memorized.
- **Audio:** Hifz new: `https://everyayah.com/data/Husary_Muallim_128kbps/114004.mp3` through `.../114006.mp3`. Rule example: `https://everyayah.com/data/Husary_Muallim_128kbps/113002.mp3`. Word-isolated: `https://audio.qurancdn.com/wbw/114_004_001.mp3` (مِن) + `.../114_004_002.mp3` (شَرِّ).
- **Video:** none new; reuse Arabic101 noon-sakinah video from 3.1 as the consolidated reference for homework review.
- **Teacher listen-for:**
  - Ikhfa collapsing to full izhar (the most commonly cited default error — "beginners tend to default to izhar because it's easiest," per `teaching-mistakes-assessment.md` A.5).
  - Ikhfa collapsing to full idgham (over-merging).
  - Shaddah accidentally added to the following letter (ikhfa must stay light, no doubling).
  - An-Nas completion accuracy — first full second-surah checkpoint.
- **Homework:** (1) ikhfa mnemonic recitation + the two drill words, 10 reps each, nose-pinch check for the nasal component; (2) Sabaq on an-Nas 114:4–114:6; (3) Sabqi: al-Fatiha + an-Nas daily, tracking toward 3 clean days each.

---

### Lesson 3.6 — REVISION 1: Noon Sakinah & Tanwin Quartet Full Drill
- **Objectives:**
  1. Student correctly identifies which of the 4 rules applies to any noon-sakinah/tanwin word shown cold, across all trigger-letter categories.
  2. Student explains all 4 rules in their own words (rehearsal for Final Checkpoint Test 3).
  3. Al-Fatiha and an-Nas both reach or approach "3 consecutive clean days" Manzil-promotion criteria.
- **New content:** No new rule — full consolidation of Lessons 3.1–3.5.
- **Slide outline:**
  1. Title: "Revision Lesson — Noon Sakinah & Tanwin."
  2. Recap chart: all 4 rules, their letters, their colors (green / green / green / plain), side by side.
  3. Mixed-drill round 1: 8 words/ayahs (from lessons 3.1–3.5's example bank), teacher reads, student names the rule.
  4. Mixed-drill round 2: same 8 items, student reads aloud, applying the rule correctly (not just naming it).
  5. Oral-quiz rehearsal: "explain izhar halqi to me as if I've never heard of tajweed" — practicing Final Checkpoint Test 3's format early.
  6. Error-pattern review: teacher shares which specific letters/rules this student personally struggles with (per the Jali/Khafi tracking method, `teaching-mistakes-assessment.md` B.3).
  7. Hifz: full Sabqi/Manzil session — al-Fatiha and an-Nas, both recited fully from memory, scored.
  8. Promotion check: if 3 consecutive clean days are logged for either surah, mark it "Manzil" in the tracker.
  9. Wrap-up: "next week, a brand-new rule family — meem sakinah."
  10. Homework.
- **Drills:** The 8-item mixed bank: أَنْعَمْتَ / عَنْهُ / عَابِدٌ مَّا / مِّن مَّسَدٍ / يَكُن لَّهُ / فَوَيْلٌ لِّلْمُصَلِّينَ / (pinned iqlab reference) / مِن شَرِّ (An-Nas 114:4).
- **Audio:** Re-use all URLs from Lessons 3.1–3.5 (see above) as one consolidated playlist for this lesson's drill slides.
- **Video:** Arabic101 — "TOO MANY Tajweed Rules? Here's the ultimate solution" `https://www.youtube.com/watch?v=kklrHE85hHE` (good "why does this system exist" framing for a consolidation lesson).
- **Teacher listen-for:** Whichever specific letter/rule pairing has recurred as an error across 3.1–3.5 (check the running per-student error log, per B.3's recommended workflow) — name it explicitly as this lesson's targeted revision item, not a generic re-teach.
- **Homework:** (1) mixed 8-item drill, 5 reps each, self-graded against audio; (2) daily al-Fatiha + an-Nas recitation, logging toward/maintaining 3 clean days; (3) rest — no new rule content to pre-study this week.

---

### Lesson 3.7 — Noon Sakinah & Tanwin: Ikhfa Haqiqi (Part 2 — Consolidation)
- **Objectives:**
  1. Student can produce ikhfa correctly across the remaining trigger letters not yet drilled (ص ذ ث ك ج ق س د ط ز ف ت ض ظ minus ش already covered).
  2. Student explains why خ in مِنْ خَوْفٍ is izhar (not ikhfa) despite superficial similarity to ج in مِّن جُوعٍ within the *same ayah* — a documented correction target from the research (`tajweed-rules-colors.md` §9).
  3. Student begins al-Falaq memorization (113:1–113:3).
- **New content:** Remaining ikhfa letters, using the same-ayah contrast pair discovered in Quraysh 106:4.
- **Slide outline:**
  1. Title + recap: ikhfa part 1 (ش-letter examples).
  2. **Contrast slide (high value):** Quraysh 106:4 in full — ٱلَّذِىٓ أَطْعَمَهُم مِّن جُوعٍ وَءَامَنَهُم مِّنْ خَوْفٍۭ — one ayah, two rules: مِّن جُوعٍ (noon sakinah + ج = ikhfa, green) and مِّنْ خَوْفٍ (noon sakinah + خ = izhar, plain). This directly fixes the exact confusion flagged in the research doc.
  3. Guided drill: عَن صَلَاتِهِمْ (Al-Ma'un 107:5, noon sakinah + ص — reference/preview, Al-Ma'un hifz starts Lesson 3.20).
  4. Guided drill: student reads 5 more ikhfa words covering ك ت ف د letters (teacher-supplied list, standard textbook words, verify against Tanzil before the slide ships).
  5. Full mnemonic recitation, all 15 letters, timed.
  6. Hifz: al-Falaq 113:1–113:3, tap-hear, read along 3×.
  7. Hifz drill: recall attempt.
  8. Wrap-up + homework.
- **Drills:** مِّن جُوعٍ vs مِّنْ خَوْفٍ (Quraysh 106:4, both halves) — read side by side, tap each independently. عَن صَلَاتِهِمْ (Al-Ma'un 107:5, reference).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/106004.mp3` (full ayah, both examples), word-isolated `https://audio.qurancdn.com/wbw/106_004_003.mp3` (مِّن) + `.../106_004_004.mp3` (جُوعٍۢ) + `.../106_004_006.mp3` (مِّنْ) + `.../106_004_007.mp3` (خَوْفٍۭ). Reference: `https://everyayah.com/data/Husary_Muallim_128kbps/107005.mp3`. Hifz new: `.../113001.mp3`–`.../113003.mp3`.
- **Video:** none new.
- **Teacher listen-for:**
  - The exact خ/ج confusion this lesson is built to fix — confirm the student can now tell them apart consistently, not just in this one ayah.
  - Any regression on previously-solid izhar-halqi letters while focus is on ikhfa.
- **Homework:** (1) Quraysh 106:4 contrast pair, 10 reps, alternating between the two halves; (2) Sabaq on al-Falaq 113:1–113:3; (3) Sabqi: an-Nas + al-Fatiha continued daily.

---

### Lesson 3.8 — Meem Sakinah: Intro + Ikhfa Shafawi
- **Objectives:**
  1. Student explains why meem sakinah has only 3 rules (vs. noon's 4) and names the single ikhfa-shafawi trigger letter (ب).
  2. Student produces ikhfa shafawi correctly (lips lightly together, ghunnah ~2 counts).
  3. Student completes al-Falaq memorization (113:4–113:5).
- **New content:** Meem sakinah (مْ) — pronunciation depends on the following letter, 3 rules total. Today: ikhfa shafawi.
- **Slide outline:**
  1. Title: "New rule family — Meem Sakinah" + recap of the completed noon-sakinah quartet.
  2. Concept: meem sakinah's 3-rule structure (ikhfa shafawi / idgham shafawi / izhar shafawi), branching diagram.
  3. Concept: ikhfa shafawi — labial (lips), not throat; lips brush together lightly, don't fully close.
  4. Guided drill: تَرْمِيهِم بِحِجَارَةٍ (Al-Fil 105:4, meem sakinah + ب) — this is a rule example the student will meet again when Al-Fil hifz begins (Lesson 3.23), a nice forward-link.
  5. Contrast: noon-sakinah ikhfa (tongue-based, throat-adjacent letters) vs meem-sakinah ikhfa shafawi (lips-based, only ب) — "same *word* 'ikhfa,' different body part."
  6. Green color re-confirmed: ikhfa shafawi is also green (ghunnah family) despite being a different articulation mechanism.
  7. Hifz: al-Falaq 113:4–113:5, tap-hear, read along 3× (completes al-Falaq — third full surah).
  8. Hifz drill: full al-Falaq recall.
  9. Wrap-up + homework.
- **Drills:** تَرْمِيهِم بِحِجَارَةٍ (Al-Fil 105:4) — standalone reference card (Al-Fil hifz starts Lesson 3.23, so this is a preview, not yet a memorization item).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/105004.mp3`, word-isolated `https://audio.qurancdn.com/wbw/105_004_001.mp3` (تَرْمِيهِم) + `.../105_004_002.mp3` (بِحِجَارَةٍۢ). Hifz new: `.../113004.mp3`–`.../113005.mp3`.
- **Video:** Arabic101 — "How to PROPERLY pronounce Meem (م) sakinah in the holy Quran?" `https://www.youtube.com/watch?v=MAvDrZgWRTs` (directly on-topic, assign as homework primer).
- **Teacher listen-for:**
  - Full lip closure (making it sound like plain izhar shafawi or a hard meem) instead of the light labial contact ikhfa shafawi requires.
  - Ghunnah duration — same 2-count check as noon-sakinah ghunnah rules; student should already have the "count" habit from Lessons 3.2–3.5.
  - Al-Falaq completion accuracy (third full surah — check retention isn't degrading with volume).
- **Homework:** (1) تَرْمِيهِم بِحِجَارَةٍ, 10 reps, lips-light cue; (2) Sabaq on al-Falaq 113:4–113:5; (3) Sabqi: an-Nas + al-Fatiha; watch the Arabic101 meem-sakinah video.

---

### Lesson 3.9 — Meem Sakinah: Idgham Shafawi / Mithlayn
- **Objectives:**
  1. Student names the idgham-shafawi trigger (a second meem) and explains the full merge + ghunnah.
  2. Student recognizes that, unlike idgham bila ghunnah, this labial merge always keeps its ghunnah.
  3. Student begins al-Ikhlas memorization (112:1–112:2).
- **New content:** Idgham shafawi/mithlayn — meem sakinah followed by another meem, full merge with shaddah, ~2 counts ghunnah. **No clean in-set example exists** (confirmed by this pass's programmatic scan of all 11 surahs, matching the original research finding) — sourced from elsewhere, explicitly labeled.
- **Slide outline:**
  1. Title + recap: ikhfa shafawi (lips light, ب only).
  2. Concept: idgham shafawi — same letter meets itself (meem+meem), full merge, shaddah, ghunnah retained.
  3. Concept: why this differs from idgham bila ghunnah (ل ر merge with NO ghunnah) — meem-meem merge always keeps the nasal hum since meem is inherently nasal.
  4. **Explicit label slide:** "Reference example — outside your memorized surahs, verify against Tanzil before use." Present the standard textbook instance (candidate: Al-Baqarah 2:5 عَلَيْهِم مِّنْ — **content-build action item: confirm exact text against live API before shipping this slide**).
  5. Guided drill: shadow the pinned example, focusing on full lip closure + held ghunnah (contrast with last lesson's *light* ikhfa-shafawi lip contact).
  6. Meem-sakinah 3-rule chart update: 2 of 3 done.
  7. Hifz: al-Ikhlas 112:1–112:2, tap-hear, read along 3×.
  8. Hifz drill: recall attempt.
  9. Wrap-up + homework.
- **Drills:** Idgham-shafawi reference card (pinned ayah, action item above), 10 shadow-reps.
- **Audio:** Hifz new: `https://everyayah.com/data/Husary_Muallim_128kbps/112001.mp3`–`.../112002.mp3`. Reference ayah: to be pinned per action item above.
- **Video:** none directly on-topic found in the research; reuse the meem-sakinah video from 3.8 as general reference.
- **Teacher listen-for:**
  - Lip closure too light (confusing this with ikhfa shafawi from last lesson) — this rule needs a *full* merge, not a brush.
  - Ghunnah dropped entirely (confusing this with izhar shafawi, next lesson's rule).
  - Al-Ikhlas: watch for the shahada-like density of this short surah — students sometimes rush short surahs; enforce the same 3-read-then-recall discipline as longer ones.
- **Homework:** (1) idgham-shafawi reference word, 10 reps; (2) Sabaq on al-Ikhlas 112:1–112:2; (3) Sabqi: al-Falaq + an-Nas + al-Fatiha rotation.

---

### Lesson 3.10 — Meem Sakinah: Izhar Shafawi
- **Objectives:**
  1. Student names all 26 izhar-shafawi trigger letters (everything except ب and م) and explains the extra care needed before و and ف specifically.
  2. Student completes the full meem-sakinah 3-rule set.
  3. Student completes al-Ikhlas memorization (112:3–112:4).
- **New content:** Izhar shafawi — meem sakinah pronounced clearly and briefly before any of the remaining 26 letters; traditionally flagged as needing special care before و and ف (risk of unwanted ikhfa-like blending since both are made near the lips).
- **Slide outline:**
  1. Title + recap: ikhfa shafawi + idgham shafawi (both green); today completes the trio with izhar shafawi (plain).
  2. Concept: izhar shafawi — the "default" case, 26 letters, no color needed (plain).
  3. Concept: the و/ف danger zone — why these two need conscious care despite being "izhar."
  4. Guided drill: لَكُمْ دِينُكُمْ (Al-Kafirun 109:6, meem sakinah + د) and لَمْ يَلِدْ (Al-Ikhlas 112:3, meem sakinah + ي — today's new hifz line, direct reinforcement).
  5. Full meem-sakinah trio recap chart (ikhfa shafawi / idgham shafawi / izhar shafawi, all 3, colors shown).
  6. Contrast drill: noon-sakinah quartet vs meem-sakinah trio, side by side — "why does meem need one fewer rule than noon?" (because meem has no equivalent of iqlab — nothing converts into it the way noon converts into meem).
  7. Hifz: al-Ikhlas 112:3–112:4, tap-hear, read along 3× (completes al-Ikhlas — fourth full surah).
  8. Hifz drill: full al-Ikhlas recall.
  9. Wrap-up + homework.
- **Drills:** لَكُمْ دِينُكُمْ (Al-Kafirun 109:6, reference — Al-Kafirun hifz starts Lesson 3.15). لَمْ يَلِدْ وَلَمْ يُولَدْ (Al-Ikhlas 112:3, today's hifz line, doubles as rule example — meem sakinah + ي twice).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/109006.mp3`, word-isolated `https://audio.qurancdn.com/wbw/112_003_001.mp3`–`.../112_003_004.mp3` for the full لَمْ يَلِدْ وَلَمْ يُولَدْ phrase. Hifz new: `.../112003.mp3`–`.../112004.mp3`.
- **Video:** none new.
- **Teacher listen-for:**
  - Unwanted ikhfa-like blending before و/ف specifically (the documented danger zone).
  - Al-Ikhlas completion accuracy — fourth full surah, a good general retention check.
- **Homework:** (1) لَكُمْ دِينُكُمْ and لَمْ يَلِدْ وَلَمْ يُولَدْ, 10 reps each; (2) Sabaq on al-Ikhlas 112:3–112:4; (3) Sabqi: al-Falaq, an-Nas, al-Fatiha, all daily.

---

### Lesson 3.11 — REVISION 2: Meem Sakinah Trio + Noon-vs-Meem Comparison
- **Objectives:**
  1. Student correctly applies all 3 meem-sakinah rules cold, across mixed examples.
  2. Student compares/contrasts the noon-sakinah quartet and meem-sakinah trio in one unified oral explanation (Final Checkpoint Test 3 rehearsal).
  3. All 4 completed surahs (Fatiha, an-Nas, al-Falaq, al-Ikhlas) rotate through a combined Sabqi/Manzil review.
- **New content:** No new rule — consolidation.
- **Slide outline:**
  1. Title: "Revision Lesson — Meem Sakinah + full noon/meem comparison."
  2. Combined chart: noon-sakinah quartet + meem-sakinah trio, side by side, all colors shown.
  3. Mixed-drill round 1: 6 items (2 per meem-sakinah rule), teacher reads, student names rule + color.
  4. Mixed-drill round 2: same 6 items, student reads aloud correctly.
  5. Oral-quiz rehearsal: "what's the difference between noon sakinah and meem sakinah, and why does one have an extra rule?"
  6. Error-pattern review (per-student, from the running Jali/Khafi log).
  7. Hifz: all 4 completed surahs, full recitation + Manzil-promotion check.
  8. Wrap-up: "next week — a completely different kind of rule: qalqalah (a sound characteristic, not a merge/hide/convert rule)."
  9. Homework.
- **Drills:** The 6-item meem-sakinah bank: تَرْمِيهِم بِحِجَارَةٍ / (idgham-shafawi reference) / لَكُمْ دِينُكُمْ / لَمْ يَلِدْ / وَلَمْ يُولَدْ / a fresh cold-read izhar-shafawi word.
- **Audio:** Re-use all URLs from Lessons 3.8–3.10.
- **Video:** none new.
- **Teacher listen-for:** the specific meem-sakinah rule (of the 3) that's weakest for this student, named explicitly per the error log — likely candidate per research: idgham shafawi's full-lip-closure requirement, since it has no in-set example to over-practice naturally.
- **Homework:** (1) 6-item mixed drill, 5 reps each; (2) daily rotation of all 4 completed surahs; (3) rest week for new rule content.

---

### Lesson 3.12 — Qalqalah: Sughra (Minor)
- **Objectives:**
  1. Student names the 5 qalqalah letters (ق ط ب ج د, mnemonic "قُطْبُ جَدٍّ") and explains the "bounce/echo" quality.
  2. Student produces qalqalah sughra correctly on a mid-word sakin qalqalah letter.
  3. Student begins al-Masad memorization (111:1–111:3).
- **New content:** Qalqalah — a distinct plosive bounce on ق ط ب ج د when sākin. Sughra = mid-utterance sukun (not a stop); light, brief bounce. Light blue is now live in the color system.
- **Slide outline:**
  1. Title: "New rule — Qalqalah" + recap: noon/meem sakinah families both complete.
  2. Concept: qalqalah as a *sifah* (characteristic), not a noon/meem-specific rule — it applies to any of these 5 letters, anywhere, whenever sakin.
  3. Concept: the "قُطْبُ جَدٍّ" mnemonic.
  4. Concept: sughra vs kubra preview (today = sughra only; kubra next lesson).
  5. Guided drill: يَجْعَلْ (Al-Fil 105:2, ج sākin mid-word — light blue color live).
  6. Guided drill: يَدْخُلُونَ (An-Nasr 110:2, د sākin mid-word — preview, An-Nasr hifz starts Lesson 3.14).
  7. Guided drill: يَلِدْ (Al-Ikhlas 112:3, د sākin — already memorized! Direct callback: "you've been saying this correctly by ear since Lesson 3.10 — now you know *why* it bounces.")
  8. Color activation: light blue = qalqalah, added to the legend.
  9. Hifz: al-Masad 111:1–111:3, tap-hear, read along 3×.
  10. Hifz drill: recall attempt.
  11. Wrap-up + homework.
- **Drills:** يَجْعَلْ (Al-Fil 105:2, reference — preview of Al-Fil), يَدْخُلُونَ (An-Nasr 110:2, reference — preview of An-Nasr), يَلِدْ (Al-Ikhlas 112:3, already-memorized callback — best classroom demo since the student already recites it correctly).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/105002.mp3`, word-isolated `https://audio.qurancdn.com/wbw/105_002_002.mp3` (يَجْعَلْ). `https://everyayah.com/data/Husary_Muallim_128kbps/110002.mp3`, word-isolated `https://audio.qurancdn.com/wbw/110_002_003.mp3` (يَدْخُلُونَ). `https://everyayah.com/data/Husary_Muallim_128kbps/112003.mp3`, word-isolated `https://audio.qurancdn.com/wbw/112_003_002.mp3` (يَلِدْ). Hifz new: `.../111001.mp3`–`.../111003.mp3`.
- **Video:** Arabic101 — "Quranic Qalqala (Echoing sounds) Explained - القلقلة" `https://www.youtube.com/watch?v=thu6eZ-AeOA` (assign as homework primer). Also Sifaat Lesson 2 "THAT's why Qalqalah exists" `https://www.youtube.com/watch?v=LeWwxpm_Lzw` and Sifaat Lesson 7 "practical Exercise" `https://www.youtube.com/watch?v=ph9AB2CQbVo` for teacher-prep depth.
- **Teacher listen-for:**
  - No bounce at all (flattening the qalqalah letter into a plain sakin consonant) — the most likely default error for a beginner.
  - Over-bouncing (adding a full extra vowel sound, turning قُطْبُ into something like "qutubu") — qalqalah is a bounce, not a vowel insertion.
  - Confusing qalqalah letters with non-qalqalah sakin letters (e.g. treating a sakin ل or ر the same way).
- **Homework:** (1) the 3 qalqalah-sughra drill words, 10 reps each; (2) Sabaq on al-Masad 111:1–111:3; (3) Sabqi rotation continues; watch the Arabic101 qalqalah video.

---

### Lesson 3.13 — Qalqalah: Kubra & Kubra Jiddan (Major)
- **Objectives:**
  1. Student produces qalqalah kubra (stronger bounce when stopping on a qalqalah letter) correctly.
  2. Student recognizes qalqalah kubra jiddan/akbar (the strongest level — stopping on a qalqalah letter carrying shaddah).
  3. Student completes al-Masad memorization (111:4–111:5).
- **New content:** Kubra — the reciter stops on a qalqalah letter, making the bounce stronger/more pronounced than sughra. Kubra jiddan (some schools' strongest tier) — stop occurs on a qalqalah letter with shaddah, giving the most pronounced bounce of all.
- **Slide outline:**
  1. Title + recap: qalqalah sughra (mid-word, light).
  2. Concept: kubra — same 5 letters, but now sākin *because you stopped there* (waqf), not because it's naturally sakin.
  3. Concept: kubra jiddan — the shaddah case, strongest bounce.
  4. Guided drill: ٱلْفَلَقِ (Al-Falaq 113:1, ق — when stopped at the end of this ayah, already memorized since Lesson 3.7 — another strong callback).
  5. Guided drill: يُولَدْ (Al-Ikhlas 112:3, د — ayah-final, already memorized, kubra when stopped vs sughra mid-recitation contrast with 3.12's يَلِدْ).
  6. Guided drill (kubra jiddan): وَتَبَّ (Al-Masad 111:1, ب with shaddah — today's new hifz line! Direct, immediate reinforcement of the strongest qalqalah tier).
  7. 3-tier comparison chart: sughra / kubra / kubra jiddan, one slide, with all 4 example words.
  8. Hifz: al-Masad 111:4–111:5, tap-hear, read along 3× (completes al-Masad — fifth full surah).
  9. Hifz drill: full al-Masad recall, paying attention to the وَتَبَّ qalqalah-kubra-jiddan bounce at the very first ayah.
  10. Wrap-up + homework.
- **Drills:** ٱلْفَلَقِ (Al-Falaq 113:1, stopped), يُولَدْ (Al-Ikhlas 112:3, stopped), وَتَبَّ (Al-Masad 111:1, stopped, shaddah — kubra jiddan).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/113001.mp3`, word-isolated `https://audio.qurancdn.com/wbw/113_001_004.mp3` (ٱلْفَلَقِ). `https://everyayah.com/data/Husary_Muallim_128kbps/112003.mp3`, word-isolated `https://audio.qurancdn.com/wbw/112_003_004.mp3` (يُولَدْ). `https://everyayah.com/data/Husary_Muallim_128kbps/111001.mp3`, word-isolated `https://audio.qurancdn.com/wbw/111_001_005.mp3` (وَتَبَّ). Hifz new: `.../111004.mp3`–`.../111005.mp3`.
- **Video:** Arabic101 — "Applying qalqalah (MORE EXAMPLES)" `https://www.youtube.com/watch?v=DBLv2R4THbE` and "When Qalqalah is not needed" `https://www.youtube.com/watch?v=7nFXTdBhR9k` (both from the Common-Mistakes series, directly relevant).
- **Teacher listen-for:**
  - Kubra bounce not noticeably stronger than sughra (student treats all qalqalah the same regardless of stop/no-stop).
  - Kubra jiddan on وَتَبَّ specifically missing the extra shaddah-driven intensity — this is the single strongest qalqalah instance the student will encounter in the whole hifz set, worth extra drilling.
  - Al-Masad completion accuracy (fifth full surah).
- **Homework:** (1) the 3 kubra-tier drill words, 10 reps each, explicitly practicing the "stop here" version; (2) Sabaq on al-Masad 111:4–111:5; (3) Sabqi rotation: Fatiha, an-Nas, al-Falaq, al-Ikhlas.

---

### Lesson 3.14 — Madd Family Intro + Madd Tabee'i
- **Objectives:**
  1. Student defines "madd" (elongation) and the baseline unit (1 harakah = 1 short vowel's duration).
  2. Student identifies the 3 madd letters (ا و ي, each with its required preceding vowel) and produces madd tabee'i at exactly 2 counts.
  3. Student completes an-Nasr memorization (110:1–110:3 — only 3 ayat, full surah in one lesson).
- **New content:** The madd family (5 types total, taught across Lessons 3.14–3.19): today, madd tabee'i — a madd letter with no hamza and no sukun following, the baseline 2-count elongation. Red is now live in the color system.
- **Slide outline:**
  1. Title: "New rule family — Madd (elongation)" + recap: qalqalah complete.
  2. Concept: the harakah unit — count on your fingers, 1 count = 1 short vowel.
  3. Concept: the 3 madd letters and their required preceding vowel (ا after fatha, و after damma, ي after kasra).
  4. Concept: madd tabee'i = no hamza, no sukun after → always exactly 2 counts.
  5. Color activation: red = madd family (all 5 types share this color in the course's chosen scheme).
  6. Guided drill: مَـٰلِكِ (Al-Fatiha 1:4, alif madd — already memorized since Lesson 3.1, another callback).
  7. Guided drill: ٱلرَّحِيمِ mid-recitation (Al-Fatiha 1:2/1:3, ya madd — already memorized).
  8. Madd-family roadmap slide: "5 types total — today's the simplest; the other 4 build on it over the next 5 lessons."
  9. Hifz: an-Nasr 110:1–110:3, tap-hear, read along 3× (all 3 ayat — full surah in one sitting, it's short).
  10. Hifz drill: full an-Nasr recall (sixth full surah, first single-lesson completion).
  11. Wrap-up + homework.
- **Drills:** مَـٰلِكِ (1:4), ٱلرَّحِيمِ (1:2, mid-recitation, non-stopped form — contrast with the 'aarid stopped form to come in Lesson 3.18).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/001004.mp3`, `https://everyayah.com/data/Husary_Muallim_128kbps/001002.mp3`. Hifz new: `.../110001.mp3`–`.../110003.mp3`.
- **Video:** Arabic101 — "Madd (مد) in Quran MADE EASY" `https://www.youtube.com/watch?v=Q737ZCSbC_g` (assign as homework primer for the whole madd-family unit, Lessons 3.14–3.19).
- **Teacher listen-for:**
  - Rushing through madd or not elongating at all — flagged in research as "one of the most common and audible mistakes in beginner recitation."
  - Inconsistent counting (2 counts one time, 3 the next) — the count must be a stable, repeatable habit from day one of the madd family.
  - An-Nasr full-surah accuracy (only 3 ayat, but a new rhythm/melody to internalize).
- **Homework:** (1) madd-tabee'i drill words, 10 reps each, counting aloud "1-2" while elongating; (2) Sabaq on an-Nasr 110:1–110:3 (full surah); (3) Sabqi rotation continues; watch the Arabic101 madd video.

---

### Lesson 3.15 — Madd: Wajib Muttasil (Connected/Obligatory)
- **Objectives:**
  1. Student defines madd muttasil (a madd letter followed by hamza within the same word) and produces it at 4–5 counts.
  2. Student explains why muttasil is "obligatory" (wajib) — no reciter skips it.
  3. Student begins al-Kafirun memorization (109:1–109:3).
- **New content:** Madd wajib muttasil — 4–5 counts (this course's working default per the research, matching Husary's practice; confirm against the actual qari recording used).
- **Slide outline:**
  1. Title + recap: madd tabee'i (2 counts, baseline).
  2. Concept: muttasil = "connected" — hamza appears in the *same word* as the madd letter, forcing extra length.
  3. Concept: why 4–5 (some riwayat go to 6) — "count more, but stay consistent within one sitting."
  4. Guided drill: جَآءَ (An-Nasr 110:1, alif madd + hamza, same word — already memorized since last lesson, direct callback).
  5. Guided drill: ٱلشِّتَآءِ (Quraysh 106:2, alif madd + hamza, same word — preview, Quraysh hifz starts Lesson 3.22).
  6. Contrast drill: tabee'i (2 counts, جَآءَ's madd if hypothetically no hamza followed) vs muttasil (4–5 counts, جَآءَ as it actually is) — side by side.
  7. Hifz: al-Kafirun 109:1–109:3, tap-hear, read along 3×.
  8. Hifz drill: recall attempt.
  9. Wrap-up + homework.
- **Drills:** جَآءَ (An-Nasr 110:1, already-memorized callback), ٱلشِّتَآءِ (Quraysh 106:2, preview reference).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/110001.mp3`, word-isolated `https://audio.qurancdn.com/wbw/110_001_002.mp3` (جَآءَ). `https://everyayah.com/data/Husary_Muallim_128kbps/106002.mp3`, word-isolated `https://audio.qurancdn.com/wbw/106_002_003.mp3` (ٱلشِّتَآءِ). Hifz new: `.../109001.mp3`–`.../109003.mp3`.
- **Video:** none new (reuse 3.14's Madd MADE EASY video); teacher-prep: "You will ALWAYS get your madd length correct" `https://www.youtube.com/watch?v=oZ5IjrW555c` (Advanced Tajweed Course).
- **Teacher listen-for:**
  - Under-counting muttasil back down to tabee'i's 2 counts (the most likely regression, since tabee'i was just learned).
  - Inconsistent count within the same recitation session (4 one time, 6 the next) — must pick one and stay consistent per the research's explicit note.
  - Al-Kafirun: its repeated لَآ أَعْبُدُ / أَعْبُدُ phrasing is a common memorization-order trap — watch for verse-order slips (109:3 and 109:5 are near-identical, easy to conflate).
- **Homework:** (1) جَآءَ and ٱلشِّتَآءِ, 10 reps each, counting 4 aloud; (2) Sabaq on al-Kafirun 109:1–109:3; (3) Sabqi rotation.

---

### Lesson 3.16 — REVISION 3: Qalqalah + Madd Tabee'i/Muttasil
- **Objectives:**
  1. Student correctly distinguishes qalqalah sughra/kubra/kubra-jiddan and madd tabee'i/muttasil across mixed cold-read examples.
  2. Student explains both rule families aloud (checkpoint rehearsal).
  3. Al-Masad and an-Nasr both progress toward Manzil promotion.
- **New content:** No new rule — consolidation.
- **Slide outline:**
  1. Title: "Revision Lesson — Qalqalah + Madd (so far)."
  2. Combined chart: qalqalah's 3 tiers + madd's first 2 types, colors shown (light blue, red).
  3. Mixed-drill round 1: 6 items, teacher reads, student names rule + tier/type.
  4. Mixed-drill round 2: same 6, student reads aloud with correct bounce/count.
  5. Oral-quiz rehearsal covering both families.
  6. Error-pattern review.
  7. Hifz: al-Masad + an-Nasr full recitation + Manzil-promotion check; light Sabqi touch on the earlier 4 surahs.
  8. Wrap-up: "3 more madd types ahead — munfasil, 'aarid, lazim."
  9. Homework.
- **Drills:** The 6-item bank: يَجْعَلْ / وَتَبَّ / ٱلْفَلَقِ (qalqalah tiers) / مَـٰلِكِ / جَآءَ / ٱلشِّتَآءِ (madd types).
- **Audio:** Re-use URLs from 3.12–3.15.
- **Video:** none new.
- **Teacher listen-for:** whichever of the 5 items is weakest per the running log; likely candidate per research pattern — madd count consistency (documented as one of the most common beginner errors generally).
- **Homework:** (1) 6-item drill, 5 reps each; (2) daily rotation of all 6 completed surahs; (3) rest week for new content.

---

### Lesson 3.17 — Madd: Ja'iz Munfasil (Separated/Permissible)
- **Objectives:**
  1. Student defines madd munfasil (madd letter ends one word, hamza starts the next) and produces it at 4–5 counts (matching this course's muttasil default for consistency).
  2. Student explains why munfasil is "permissible" (ja'iz) rather than "obligatory," and why some riwayat/qira'at shorten it — but this course, following its chosen qari, treats it consistently at 4–5.
  3. Student completes al-Kafirun memorization (109:4–109:6).
- **New content:** Madd ja'iz munfasil.
- **Slide outline:**
  1. Title + recap: madd muttasil (hamza inside the same word).
  2. Concept: munfasil = "separated" — hamza is the *first letter of the next word*, a word-boundary case.
  3. Concept: why "permissible" — practice varies more here across riwayat than muttasil; this course follows Husary's practice consistently.
  4. Guided drill: ٱلَّذِينَ أَنْعَمْتَ (Al-Fatiha 1:7, yaa madd at the end of ٱلَّذِينَ + hamza starting أَنْعَمْتَ — already memorized since Lesson 3.1/3.2, strong callback; this is also the very word that hosted the izhar-halqi example in Lesson 3.1, giving a nice "two rules, one phrase" recap).
  5. Contrast: muttasil (hamza inside the word) vs munfasil (hamza starts the next word) — side by side, both counted the same in this course's practice.
  6. Hifz: al-Kafirun 109:4–109:6, tap-hear, read along 3× (completes al-Kafirun — seventh full surah).
  7. Hifz drill: full al-Kafirun recall, careful attention to the 109:3/109:5 near-repeat structure flagged last lesson.
  8. Wrap-up + homework.
- **Drills:** ٱلَّذِينَ أَنْعَمْتَ (Al-Fatiha 1:7, already-memorized callback, doubles as the noon-sakinah izhar-halqi example from Lesson 3.1 — genuinely useful "full circle" teaching moment).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/001007.mp3`, word-isolated `https://audio.qurancdn.com/wbw/001_007_002.mp3` (ٱلَّذِينَ) + `.../001_007_003.mp3` (أَنْعَمْتَ). Hifz new: `.../109004.mp3`–`.../109006.mp3`.
- **Video:** none new.
- **Teacher listen-for:**
  - Munfasil shortened toward tabee'i's 2 counts because the word boundary makes it feel less "connected" and less urgent than muttasil — this is the most common regression at this stage.
  - Al-Kafirun completion accuracy, specifically the 109:3/109:5 repetition (وَلَآ أَنتُمْ عَـٰبِدُونَ مَآ أَعْبُدُ appears twice, identical) — verify the student hasn't merged them into one recited line or dropped a repeat.
- **Homework:** (1) ٱلَّذِينَ أَنْعَمْتَ, 10 reps, counting 4 aloud; (2) Sabaq on al-Kafirun 109:4–109:6; (3) Sabqi rotation across all 7 completed items.

---

### Lesson 3.18 — Madd: 'Aarid Lis-Sukun (Incidental, Due to Stopping)
- **Objectives:**
  1. Student defines madd 'aarid lis-sukun (a madd letter before a word's final letter, which becomes sakin only because the reciter stops there) and produces it flexibly at 2, 4, or 6 counts (reciter's choice, held consistent within one sitting).
  2. Student explains why the *same word* can be tabee'i (2 counts, mid-recitation) or 'aarid (2/4/6, when stopped) depending only on whether the reciter pauses.
  3. Student completes al-Kawthar memorization (108:1–108:3 — only 3 ayat, full surah in one lesson).
- **New content:** Madd 'aarid lis-sukun.
- **Slide outline:**
  1. Title + recap: muttasil + munfasil (both word-boundary/hamza-driven); today is stop-driven instead.
  2. Concept: 'aarid = "incidental" — the sukun only exists because you chose to stop; if you don't stop, the word reverts to ordinary tabee'i.
  3. Guided drill: ٱلرَّحِيمِ (Al-Fatiha 1:3, stopped — direct contrast with Lesson 3.14's non-stopped tabee'i reading of the same word).
  4. Guided drill: نَسْتَعِينُ (Al-Fatiha 1:5, stopped — same principle, new example).
  5. Guided drill: ٱلنَّاسِ (An-Nas 114:1, stopped — already memorized since Lesson 3.4/3.5).
  6. The reciter's-choice slide: "pick 2, 4, or 6 — but stay consistent for the whole session," teacher demonstrates all 3 lengths on one word.
  7. Hifz: al-Kawthar 108:1–108:3, tap-hear, read along 3× (all 3 ayat, full surah in one sitting).
  8. Hifz drill: full al-Kawthar recall (eighth full surah).
  9. Wrap-up + homework.
- **Drills:** ٱلرَّحِيمِ (1:3, stopped vs 3.14's non-stopped reading), نَسْتَعِينُ (1:5, stopped), ٱلنَّاسِ (114:1, stopped).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/001003.mp3`, `https://everyayah.com/data/Husary_Muallim_128kbps/001005.mp3`, `https://everyayah.com/data/Husary_Muallim_128kbps/114001.mp3`. Hifz new: `.../108001.mp3`–`.../108003.mp3`.
- **Video:** Arabic101 — "How to STOP at a 'madd' Properly" `https://www.youtube.com/watch?v=vW1k3cEr-8w` (Advanced Tajweed Course, directly on-topic).
- **Teacher listen-for:**
  - Applying a fixed count regardless of stopping/not-stopping — the core concept this lesson teaches is that the *same word* changes length based on context, not that 'aarid has one fixed count.
  - Inconsistency within a single sitting (2 counts on one word, 6 on the next, no stated reason) — the choice is free but must be *consistent*.
  - Al-Kawthar full-surah accuracy (eighth surah, only 3 ayat but a distinct rhythm).
- **Homework:** (1) the 3 'aarid drill words, practiced at all 3 lengths (2/4/6) to build flexibility, then settling on one consistent choice; (2) Sabaq on al-Kawthar (full surah); (3) Sabqi rotation across all 8 completed items.

---

### Lesson 3.19 — Madd: Lazim (Necessary/Obligatory)
- **Objectives:**
  1. Student defines madd lazim (a madd letter followed by a *permanent* sukun or shaddah, same word, in all recitation states) and produces it at a uniform 6 counts.
  2. Student explains why lazim is the one madd type with no scholarly disagreement on count.
  3. No new hifz lines today — full Sabqi/Manzil consolidation, deliberately, before next lesson's madd-family capstone revision.
- **New content:** Madd lazim (kalimi muthaqqal — madd letter + shaddah, same word; the kalimi mukhaffaf and harfi subtypes are noted as "seen but not drilled," per research, since they don't occur in this course's hifz set or muqatta'at-opening surahs).
- **Slide outline:**
  1. Title + recap: 'aarid (stop-dependent, flexible count).
  2. Concept: lazim = "necessary" — the sukun/shaddah is permanent, not context-dependent; always 6 counts, connected or stopped.
  3. Concept: the 2 subtypes (kalimi muthaqqal = + shaddah; kalimi mukhaffaf = + plain sukun, extremely rare, only in Surah Yunus 10:51/10:91 — "seen but not drilled" in this course).
  4. Guided drill: ٱلضَّآلِّينَ (Al-Fatiha 1:7, alif + doubled lam/shaddah — already memorized since Lesson 3.1/3.2; the textbook example cited across every source cross-checked in the research).
  5. Full madd-family roadmap check: "5 of 5 types now introduced — next lesson is the capstone revision."
  6. Extended-count demo: teacher recites ٱلضَّآلِّينَ at 6 full counts, exaggerated, so the student hears the difference from tabee'i's 2 and muttasil/munfasil's 4–5.
  7. Hifz: no new lines — full Sabqi/Manzil session instead, deliberately resting new memorization this week (revision-before-new-material principle).
  8. Hifz: all 8 completed items reviewed, Manzil-promotion checks for any newly-eligible surahs.
  9. Wrap-up + homework.
- **Drills:** ٱلضَّآلِّينَ (Al-Fatiha 1:7) — the single required example, drilled at length since it's the clearest, most-cited madd-lazim instance in any source.
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/001007.mp3`, word-isolated `https://audio.qurancdn.com/wbw/001_007_009.mp3` (ٱلضَّآلِّينَ).
- **Video:** none new.
- **Teacher listen-for:**
  - Under-counting lazim toward muttasil's 4–5 (the most likely regression, since it's the longest count the student has met).
  - General retention check across all 8 completed surahs during this consolidation-only week — this is the lesson to catch any quietly-accumulating drift before the Lesson 3.20 capstone.
- **Homework:** (1) ٱلضَّآلِّينَ, 15 reps, counting 6 aloud each time; (2) no new Sabaq — full daily rotation of all 8 completed surahs instead; (3) prepare mentally for next lesson's full madd-family recap.

---

### Lesson 3.20 — REVISION 4: Madd Family Capstone (All 5 Types)
- **Objectives:**
  1. Student correctly identifies and produces all 5 madd types (tabee'i, muttasil, munfasil, 'aarid, lazim) across mixed cold-read examples, each at its correct count.
  2. Student explains the full madd family as one coherent system (checkpoint rehearsal).
  3. Student begins al-Ma'un memorization (107:1–107:4).
- **New content:** No new rule — full-family consolidation.
- **Slide outline:**
  1. Title: "Revision Lesson — The Full Madd Family."
  2. One master chart: all 5 types, their trigger condition, their count, their example word, all in red.
  3. Mixed-drill round 1: 5 items (one per type), teacher reads, student names the type + count.
  4. Mixed-drill round 2: same 5, student reads aloud at the correct count for each.
  5. "Which type is this?" speed round: 8 more cold-read words/phrases (fresh, teacher-supplied, verify against Tanzil before the slide ships).
  6. Oral-quiz rehearsal: "explain the difference between muttasil and munfasil, and between tabee'i and 'aarid."
  7. Error-pattern review.
  8. Hifz: al-Ma'un 107:1–107:4, tap-hear, read along 3× (new material resumes after last lesson's rest week).
  9. Hifz drill: recall attempt.
  10. Wrap-up + homework.
- **Drills:** The 5-type master bank: مَـٰلِكِ (tabee'i) / جَآءَ (muttasil) / ٱلَّذِينَ أَنْعَمْتَ (munfasil) / ٱلرَّحِيمِ-stopped (aarid) / ٱلضَّآلِّينَ (lazim).
- **Audio:** Re-use URLs from 3.14, 3.15, 3.17, 3.18, 3.19. Hifz new: `.../107001.mp3`–`.../107004.mp3`.
- **Video:** Arabic101 — "Practice 95% of tajweed rules with ONE SINGLE Aya" `https://www.youtube.com/watch?v=BfsRbY3F7IE` (Advanced Tajweed Course — good capstone-lesson framing, teacher-prep or ambitious-student optional watch).
- **Teacher listen-for:** whichever madd type is weakest per the running log — the research flags "rushing through madd, or not elongating at all" as one of the most common and audible beginner mistakes overall, so treat any madd shortfall here as high-priority before the checkpoint.
- **Homework:** (1) 5-item master drill, 5 reps each, deliberately counting aloud; (2) Sabaq on al-Ma'un 107:1–107:4; (3) Sabqi/Manzil rotation across all 8 completed surahs.

---

### Lesson 3.21 — Lam of Allah: Tafkheem/Tarqeeq
- **Objectives:**
  1. Student states the rule: the lam in ٱللَّه (and derivatives) is heavy (tafkheem) after fatha/damma, light (tarqeeq) after kasrah — every other lam in the Quran is always light.
  2. Student correctly pronounces both conditions using in-set examples.
  3. Student completes al-Ma'un memorization (107:5–107:7).
- **New content:** Lam of Allah — the first tafkheem/tarqeeq rule taught. Dark blue is now live in the color system.
- **Slide outline:**
  1. Title: "New rule family — Tafkheem & Tarqeeq, starting with the Lam of Allah" + recap: full madd family complete.
  2. Concept: tafkheem = heavy/full-mouth; tarqeeq = light/thin — introduce the general concept before narrowing to lam specifically.
  3. Concept: the lam-of-Allah-specific rule — heavy after fatha/damma, light after kasrah; every *other* lam in the Quran is always light regardless of context (a useful simplifying fact).
  4. Color activation: dark blue = tafkheem family, added to the legend (lam-of-Allah heavy condition only — tarqeeq itself stays uncolored/plain, consistent with the course's "plain = unmodified" convention).
  5. Guided drill (tafkheem, damma before): نَصْرُ ٱللَّهِ (An-Nasr 110:1, ر with damma before the lam of Allah — already memorized since Lesson 3.14, direct callback).
  6. Guided drill (tafkheem, damma before, second instance): قُلْ هُوَ ٱللَّهُ أَحَدٌ (Al-Ikhlas 112:1, و with damma before — already memorized since Lesson 3.9/3.10).
  7. Guided drill (tarqeeq, kasrah before): ٱلْحَمْدُ لِلَّهِ (Al-Fatiha 1:2, ل with kasrah before the lam of Allah — already memorized since Lesson 3.1, another callback; note the *first* lam here is a separate word "li-" carrying the kasrah, not itself the lam of Allah).
  8. Contrast drill: all 3 examples read back to back, tafkheem/tafkheem/tarqeeq.
  9. Hifz: al-Ma'un 107:5–107:7, tap-hear, read along 3× (completes al-Ma'un — ninth full surah).
  10. Hifz drill: full al-Ma'un recall.
  11. Wrap-up + homework.
- **Drills:** نَصْرُ ٱللَّهِ (110:1), قُلْ هُوَ ٱللَّهُ أَحَدٌ (112:1), ٱلْحَمْدُ لِلَّهِ (1:2) — all 3 already-memorized callbacks, an efficient lesson since no new Arabic strings need introducing for the rule itself.
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/110001.mp3`, word-isolated `https://audio.qurancdn.com/wbw/110_001_003.mp3` (نَصْرُ) + `.../110_001_004.mp3` (ٱللَّهِ). `https://everyayah.com/data/Husary_Muallim_128kbps/112001.mp3`. `https://everyayah.com/data/Husary_Muallim_128kbps/001002.mp3`. Hifz new: `.../107005.mp3`–`.../107007.mp3`.
- **Video:** Arabic101 — "How to PROPERLY pronounce the word (Allah) in the Holy Quran" `https://www.youtube.com/watch?v=0paH22-NvzU` (directly on-topic, assign as homework primer).
- **Teacher listen-for:**
  - Tafkheem applied inconsistently — heavy on one instance of ٱللَّه, light on another, without regard to the preceding vowel.
  - The reverse error: defaulting to tarqeeq everywhere because ٱلْحَمْدُ لِلَّهِ (an extremely frequent phrase from day one) anchors tarqeeq too strongly.
  - Al-Ma'un completion accuracy (ninth full surah, and its longest ayah count so far at 7 — watch for fatigue-driven slips near the end).
- **Homework:** (1) the 3 lam-of-Allah drill phrases, 10 reps each, explicitly alternating heavy/light; (2) Sabaq on al-Ma'un 107:5–107:7; (3) Sabqi/Manzil rotation; watch the Arabic101 "Allah" pronunciation video.

---

### Lesson 3.22 — Rā' Rules, Part 1 (Fatha/Damma → Heavy; Kasrah → Light)
- **Objectives:**
  1. Student states the two baseline rā' rules: fatha or damma on the rā' itself → heavy (tafkheem); kasrah on the rā' itself → light (tarqeeq).
  2. Student correctly pronounces both conditions using in-set examples, including a same-surah minimal pair.
  3. Student completes Quraysh memorization (106:1–106:4 — only 4 ayat, full surah in one lesson).
- **New content:** Rā' tafkheem/tarqeeq — the most condition-heavy rule in tajweed and a Final Checkpoint Test 3 staple, per the research. This lesson covers only the two baseline (rā'-carries-the-vowel-itself) conditions; sakin-rā' cases and the 5-word exception list follow in Lesson 3.23.
- **Slide outline:**
  1. Title: "Rā' rules, Part 1" + recap: lam of Allah tafkheem/tarqeeq.
  2. Concept: unlike lam (which is only special in one word), rā' changes thickness in *every* word it appears in, based on its own vowel or context — "the busiest letter in tajweed."
  3. Concept: baseline rule 1 — rā' + fatha/damma → heavy.
  4. Guided drill (fatha): ٱلرَّحْمَـٰنِ (Al-Fatiha 1:1, already memorized since Lesson 3.1).
  5. Guided drill (fatha): رَبِّ ٱلْعَـٰلَمِينَ (Al-Fatiha 1:2, already memorized).
  6. Guided drill (damma): نَصْرُ ٱللَّهِ (An-Nasr 110:1, رَ... wait — the rā' here carries damma: نَصْرُ — already memorized, direct callback, doubles as last lesson's lam-of-Allah example).
  7. Concept: baseline rule 2 — rā' + kasrah → light.
  8. Guided drill (kasrah, today's new hifz line): رِحْلَةَ (Quraysh 106:2 — a genuine in-set light-rā' example, found directly in today's new memorization material).
  9. Minimal-pair contrast slide: هُوَ ٱللَّهُ / نَصْرُ ٱللَّهِ (heavy rā') vs رِحْلَةَ (light rā') — read back to back.
  10. Hifz: Quraysh 106:1–106:4, tap-hear, read along 3× (all 4 ayat, full surah in one sitting).
  11. Hifz drill: full Quraysh recall (tenth full surah).
  12. Wrap-up + homework.
- **Drills:** ٱلرَّحْمَـٰنِ (1:1), رَبِّ (1:2), نَصْرُ (110:1) — all heavy; رِحْلَةَ (106:2) — light, today's new material.
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3`, `https://everyayah.com/data/Husary_Muallim_128kbps/001002.mp3`, `https://everyayah.com/data/Husary_Muallim_128kbps/110001.mp3`, `https://everyayah.com/data/Husary_Muallim_128kbps/106002.mp3`, word-isolated `https://audio.qurancdn.com/wbw/106_002_002.mp3` (رِحْلَةَ). Hifz new: `.../106001.mp3`–`.../106004.mp3`.
- **Video:** Arabic101 — "Rules of (ر) in the Holy Quran - made simple" `https://www.youtube.com/watch?v=-Uc5vkrTYnU` (assign as homework primer for the whole rā' unit, Lessons 3.22–3.23). Also Sifaat Lesson 6 "90% of 'RA' mistakes, happen HERE" `https://www.youtube.com/watch?v=TBBMuGVy4mc`.
- **Teacher listen-for:**
  - Heavy rā' pronounced too lightly (losing the full-mouth quality) — the most commonly cited rā' error per research ("90% of RA mistakes happen here," per the Arabic101 title itself).
  - Light rā' pronounced with residual heaviness bleeding in from the more frequent heavy instances the student has met so far (recency/frequency bias toward tafkheem).
  - Quraysh completion accuracy — its unusual sentence structure (لِإِيلَـٰفِ قُرَيْشٍ has no verb in the first ayah) sometimes causes hesitation; reassure this is normal for this specific surah's grammar, not a memorization fault.
- **Homework:** (1) the 4 rā' drill words, 10 reps each, explicitly alternating heavy/light; (2) Sabaq on Quraysh (full surah); (3) Sabqi/Manzil rotation across all 9 completed items; watch the Arabic101 rā' video.

---

### Lesson 3.23 — Rā' Rules, Part 2 (Sakin Rā' Cases + Exception Reference Card)
- **Objectives:**
  1. Student produces sakin-rā' correctly under both the heavy condition (preceded by fatha/damma) and the light condition (preceded by original kasrah, no isti'la letter following).
  2. Student is aware of (not required to recite from memory) the 5-word isti'la exception list, as advanced/reference-only content.
  3. Student begins al-Fil memorization (105:1–105:3).
- **New content:** Sakin rā' — the third and fourth baseline conditions (sakin, preceded by fatha/damma → heavy; sakin, preceded by original kasrah with no isti'la letter following → light). The 5-word isti'la exception list is presented as a labeled reference card, explicitly "beyond your memorized surahs," per the research's own recommendation.
- **Slide outline:**
  1. Title + recap: rā' baseline rules (rā' carrying its own vowel).
  2. Concept: what changes when rā' itself is sakin — now the *preceding* letter's vowel decides heavy/light.
  3. Guided drill (sakin rā', heavy — preceded by fatha): وَأَرْسَلَ (Al-Fil 105:3 — today's new hifz material, direct reinforcement).
  4. Guided drill (sakin rā', heavy — preceded by fatha, second instance): تَرْمِيهِم (Al-Fil 105:4 — preview, completes next lesson; also this surah's meem-sakinah ikhfa-shafawi example from Lesson 3.8, a nice double callback).
  5. Guided drill (sakin rā', light — preceded by original kasrah, no isti'la after): وَٱسْتَغْفِرْهُ (An-Nasr 110:3 — already memorized since Lesson 3.14, direct callback: "غْفِرْ has رِ preceded by kasrah on ف, and no isti'la letter follows, so it stays light").
  6. **Reference-card slide (advanced awareness only, per Final Checkpoint Test 3's "explain rules" scope, not full recitation):** the 5 isti'la-exception words (قِرْطَاسٍ, إِرْصَادًا, فِرْقَةٍ, مِرْصَادًا, لَبِالْمِرْصَادِ) — none occur in the hifz set; label explicitly "beyond your memorized surahs," present for oral-quiz awareness only.
  7. Hifz: al-Fil 105:1–105:3, tap-hear, read along 3×.
  8. Hifz drill: recall attempt.
  9. Wrap-up + homework.
- **Drills:** وَأَرْسَلَ (105:3, today's new line), وَٱسْتَغْفِرْهُ (110:3, already-memorized callback).
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/105003.mp3`, word-isolated `https://audio.qurancdn.com/wbw/105_003_001.mp3` (وَأَرْسَلَ). `https://everyayah.com/data/Husary_Muallim_128kbps/110003.mp3`, word-isolated `https://audio.qurancdn.com/wbw/110_003_004.mp3` (وَٱسْتَغْفِرْهُ). Hifz new: `.../105001.mp3`–`.../105003.mp3`.
- **Video:** Arabic101 — "You'll NEVER Forget the rules of ر, After learning THIS ONE RULE" `https://www.youtube.com/watch?v=G8ZGHfCCjgc`; "Do You Pronounce Shaddah on Raa Wrong?" `https://www.youtube.com/watch?v=sUkp2XivuvM` (Common Mistakes series); "Should you apply takrir (تكرير) to your ر" `https://www.youtube.com/watch?v=xBn2qym9cZQ` (Common Mistakes #3).
- **Teacher listen-for:**
  - Sakin-rā' heavy/light confusion — this is the densest sub-rule of the densest letter in tajweed; expect this lesson to need the most repetition of the whole rules strand.
  - "Takrir" (trilling/rolling the rā' excessively) — flagged in the Arabic101 common-mistakes video as a widespread error worth an explicit caution regardless of L1 background.
  - Al-Fil: first 3 ayat accuracy, and correct qalqalah-sughra bounce on يَجْعَلْ-style material recalled from Lesson 3.12 (a good cross-check that the qalqalah rule generalizes to fresh material).
- **Homework:** (1) the 2 sakin-rā' drill words, 10 reps each; (2) Sabaq on al-Fil 105:1–105:3; (3) Sabqi/Manzil rotation across all 10 completed items.

---

### Lesson 3.24 — REVISION 5: Lam of Allah + Rā' Oral-Quiz Practice
- **Objectives:**
  1. Student explains and demonstrates every lam-of-Allah and rā' condition covered so far, in oral-quiz format (direct Final Checkpoint Test 3 rehearsal).
  2. Student completes al-Fil memorization (105:4–105:5) — **the full 11-item hifz set (al-Fatiha + all 10 surahs) is now complete.**
  3. Student self-assesses readiness for the Final Checkpoint using the rubric in §5.
- **New content:** No new rule — full tafkheem/tarqeeq-family consolidation, framed explicitly as checkpoint-test rehearsal.
- **Slide outline:**
  1. Title: "Revision Lesson — Lam of Allah + Rā', full oral-quiz rehearsal."
  2. Combined chart: lam-of-Allah conditions + all 4 rā' conditions, dark blue throughout.
  3. Oral-quiz round 1 (Final Checkpoint Test 3 format): teacher asks "name and explain" for each condition, student answers without a script.
  4. Oral-quiz round 2: mixed cold-read words, student identifies heavy/light and produces it correctly.
  5. The 5-word isti'la exception list — recognition check only (can the student recall that this list exists and why, not recite the words from memory).
  6. Error-pattern review — final pre-checkpoint pass on this rule family specifically.
  7. Hifz: al-Fil 105:4–105:5, tap-hear, read along 3× (completes al-Fil — **eleventh and final item, full hifz set complete**).
  8. **Milestone slide:** "You now hold al-Fatiha and all 10 last surahs in memory. From here, it's rehearsal and refinement, not new material."
  9. Hifz drill: full al-Fil recall, plus a spot-check recitation of 2 other completed surahs chosen by the teacher.
  10. Wrap-up + homework.
- **Drills:** Full lam-of-Allah + rā' example bank (all items from 3.21–3.23), used as a single oral-quiz script.
- **Audio:** Re-use URLs from 3.21–3.23. Hifz new: `.../105004.mp3`–`.../105005.mp3`. Word-isolated (meem-sakinah callback): `https://audio.qurancdn.com/wbw/105_004_001.mp3` (تَرْمِيهِم).
- **Video:** none new.
- **Teacher listen-for:** treat this lesson as a genuine dry run of Final Checkpoint Test 3 (§5) — score it with the same rubric, and note any rule that would currently fail the checkpoint threshold so Lesson 3.26 can target it specifically.
- **Homework:** (1) full oral-quiz self-rehearsal using the lam-of-Allah + rā' bank; (2) Sabaq on al-Fil 105:4–105:5; (3) begin full 11-item Manzil rotation (2 surahs/day, ~5–6 day cycle) now that the complete hifz set exists.

---

### Lesson 3.25 — Waqf Basics + Silent Letters + Full Color Legend Recap
- **Objectives:**
  1. Student names and explains the 6 basic waqf signs (meem, lā, jeem, ṣād-lām, qāf-lām, sakta).
  2. Student identifies hamzat-ul-wasl and laam shamsiyyah as gray/silent throughout the hifz set (Phase 2 review, formally closed out under the color system).
  3. Student can explain all 5 colors of the course's color-mushaf legend, matching Final Checkpoint Test 4's format.
- **New content:** Waqf (stopping) signs — the basic set only, per the spec's explicit scope limit (no mu'anaqah, no qad qeela). Silent letters formally consolidated as the gray color's full teaching content (started informally in Lesson 3.1).
- **Slide outline:**
  1. Title: "Waqf basics + closing out the color-mushaf system."
  2. Concept: why waqf matters — stopping in the wrong place can obscure or distort meaning.
  3. Concept table: م (must stop) / لا (must not stop) / ج (optional) / صلى (prefer continuing) / قلى (prefer stopping) / س or سكتة (brief pause, no breath).
  4. Guided practice: identify natural waqf-tam (complete-meaning) stopping points at the end of each ayah across 2–3 already-memorized surahs — every ayah-end in these short surahs is a valid, safe stop.
  5. **Gap-flagged slide:** exact waqf-sign glyph placement *within* specific hifz ayat requires the mushaf-layout dataset (QUL) at content-build time — this lesson teaches the sign meanings generically; pin the specific in-app glyphs before shipping the platform's Phase 3 pages (see §6).
  6. Silent letters — full consolidation: hamzat-ul-wasl (ٱ, present in nearly every ayah of the hifz set), laam shamsiyyah (ٱلرَّحْمَـٰنِ, ٱلنَّاسِ, ٱلصَّمَدُ, and dozens more — the ل assimilates into the following sun letter), silent alif after the verb-final wow (فَلْيَعْبُدُوا۟, Quraysh 106:3 — already memorized).
  7. **Full 5-color legend recap, one master slide:** gray / plain / green / light blue / red / dark blue, each with its rule list and a representative in-set example.
  8. Guided drill: teacher shows an un-narrated color-coded verse (e.g. Al-Fatiha 1:7, which alone contains izhar, idgham, madd munfasil, madd lazim, and laam shamsiyyah), student names every colored (and uncolored) span.
  9. Hifz: no new lines — full Manzil rotation across all 11 items (2 surahs/day pattern established last lesson).
  10. Wrap-up + homework: final lesson before the capstone revision.
- **Drills:** Waqf-sign recognition table (flashcards); silent-letter spotting drill across 5 already-memorized ayat; the full-color-legend "name every span" drill on Al-Fatiha 1:7.
- **Audio:** `https://everyayah.com/data/Husary_Muallim_128kbps/001007.mp3` (the master multi-rule ayah), `https://everyayah.com/data/Husary_Muallim_128kbps/106003.mp3` (silent-alif example).
- **Video:** Arabic101 — "What do the symbols in Quran mean?" `https://www.youtube.com/watch?v=meQsEM3V2m8` and Part II (Advanced) `https://www.youtube.com/watch?v=IOXzx2H5cT8`; "How to PROPERLY stop/resume in longer Aya's in the Holy Quran" `https://www.youtube.com/watch?v=j3AR6-BThPU`; "NEVER start reciting after this word in the Quran" `https://www.youtube.com/watch?v=MaKZ3ZAE6gU`.
- **Teacher listen-for:**
  - Stopping mid-phrase in a way that changes or obscures meaning, even within these short, mostly-independent-ayah surahs.
  - Any residual confusion about *why* a given letter is uncolored (plain) vs gray — the two "no special sound change" categories (plain = izhar/tarqeeq-family; gray = genuinely silent) are conceptually different and worth a clean final distinction before the checkpoint.
- **Homework:** (1) waqf-sign flashcards, review only (recognition, not production drilling); (2) full 11-item Manzil rotation continues; (3) self-rehearse naming every color on 2 more already-memorized ayat of the student's choosing, in preparation for Final Checkpoint Test 4.

---

### Lesson 3.26 — REVISION 6 / CAPSTONE: Full Rules Recap + Full Hifz Rehearsal
- **Objectives:**
  1. Student demonstrates all 6 rule families (noon sakinah/tanwin, meem sakinah, qalqalah, madd, lam of Allah/rā', waqf) and all 5 colors in one consolidated session.
  2. Student recites the full 11-item hifz set (al-Fatiha, then an-Nas backward through al-Fil, i.e. in mushaf-reverse order) unaided.
  3. Teacher completes a full mock run of all 4 Final Checkpoint tests (§5) and identifies any remaining weak units for targeted revision before the real checkpoint.
- **New content:** No new rule or hifz material — full capstone rehearsal.
- **Slide outline:**
  1. Title: "Capstone Lesson — everything, together."
  2. Master rules chart: all 6 families, all 5 colors, one poster slide.
  3. Mock Final Checkpoint Test 1 (unseen page): teacher presents an unseen, unfamiliar mushaf page/passage; student reads aloud, teacher scores with the Jali/Khafi rubric (§5).
  4. Mock Final Checkpoint Test 2 (hifz recitation): student recites al-Fatiha, then an-Nas → al-Falaq → al-Ikhlas → al-Masad → an-Nasr → al-Kafirun → al-Kawthar → al-Ma'un → Quraysh → al-Fil, unaided, teacher scores.
  5. Mock Final Checkpoint Test 3 (oral rule quiz): teacher asks the student to name/explain 6–8 rules at random from the full set.
  6. Mock Final Checkpoint Test 4 (color-mushaf reading): teacher presents a color-coded passage; student names each color and the rule it signals.
  7. Combined scoring review: which of the 4 tests would currently pass vs. need more work.
  8. Targeted revision plan: teacher and student agree on the specific weak units (not a blanket redo) to focus on before the real Final Checkpoint.
  9. Logistics slide: scheduling the actual Final Checkpoint session.
  10. Wrap-up: congratulate the completion of the taught curriculum; frame the checkpoint as confirmation, not a new hurdle.
- **Drills:** The complete example bank from Lessons 3.1–3.25, used as the mock-checkpoint script; full 11-item hifz recitation.
- **Audio:** Full-surah playlist for hifz rehearsal: `https://download.quranicaudio.com/qdc/khalil_al_husary/muallim/1.mp3` (al-Fatiha), then `.../114.mp3`, `.../113.mp3`, `.../112.mp3`, `.../111.mp3`, `.../110.mp3`, `.../109.mp3`, `.../108.mp3`, `.../107.mp3`, `.../106.mp3`, `.../105.mp3` (an-Nas through al-Fil, mushaf-reverse order).
- **Video:** Arabic101 — "❗How to achieve (Itqaan) in Surah Al-Fatihah" `https://www.youtube.com/watch?v=td40V6Qi4Cc` and "MOST COMMON mistake in Al-fatiha" `https://www.youtube.com/watch?v=cvUQ3xQTa_Y` (assign as final polish material for the surah carrying the most checkpoint weight).
- **Teacher listen-for:** everything — this lesson's explicit purpose is a comprehensive listen-for pass across all 6 rule families and all 11 hifz items, logged against the same rubric the real Final Checkpoint will use, so nothing is a surprise on test day.
- **Homework:** (1) full self-rehearsal of the 11-item hifz set, unaided, once daily; (2) review any rule flagged weak in today's mock-scoring, using that rule's original lesson's drill materials; (3) rest the day immediately before the scheduled Final Checkpoint.

---

## 5. Final Checkpoint Kit

Live session, matching the spec's four end goals exactly. Run all 4 tests in one extended session (or split across 2 sittings if needed) after Lesson 3.26. Scoring throughout uses the **Lahn Jali (major, −2) / Lahn Khafi (minor, −1)** framework from `teaching-mistakes-assessment.md` Part B — Jali = wrong makhraj or a meaning-changing error, obvious to any listener; Khafi = a situational-characteristic slip (madd length, ghunnah duration, tafkheem degree) that doesn't change meaning but degrades quality.

### Test 1 — Unseen Mushaf Page (end goal 1: "read any page of the mushaf with clean tajweed, unaided")
- **What to ask:** present one full, previously-unseen mushaf page (teacher's choice, outside the memorized hifz set) in plain Uthmani script (no color coding — that's Test 4). Student reads the entire page aloud, unaided, at a natural pace.
- **Reading passage:** any page the student has never drilled; rotate pages between attempts if a retest is needed. Endurance matters — a full page, not one line, mirroring the ijazah-exam endurance criterion from research B.2.
- **Rubric:**
  - Every Jali error (wrong makhraj, wrong sifah lazima, meaning-changing mistake): **−2**.
  - Every Khafi error (madd length off, ghunnah duration off, tafkheem degree off): **−1**.
  - Self-correction after a prompt: **−1**. Examiner has to correct: **−2**.
  - **Pass threshold:** zero uncorrected Jali errors surviving to the end of the page; Khafi errors capped at ≤5 for a clean pass, 6–10 triggers "pass with homework flag" (targeted revision named per-rule, not a full retest), >10 or any uncorrected Jali error triggers "revise-these-units and retest."
  - Log every deduction against the specific rule/letter it belongs to (per B.3's explicit workflow) so any retest targets exact weak units.

### Test 2 — Hifz Recitation (end goal 2: "memorize al-Fatiha + the last 10 surahs, recited with tajweed")
- **What to ask:** student recites, unaided and without the text visible, in this exact order: al-Fatiha, then an-Nas, al-Falaq, al-Ikhlas, al-Masad, an-Nasr, al-Kafirun, al-Kawthar, al-Ma'un, Quraysh, al-Fil (mushaf-reverse order, matching how they were memorized).
- **Reading passage:** all 11 items, full text, no skipping.
- **Rubric:**
  - Same Jali (−2) / Khafi (−1) scale as Test 1, applied to tajweed quality.
  - **Memorization-fidelity axis (additional):** any omitted, added, or substituted word is itself a Jali-tier error (per B.3's own note that this is a meaning-changing category), scored separately from tajweed-quality Jali errors so the teacher can tell "knows it but recites it with rough tajweed" apart from "doesn't actually have it memorized."
  - **Pass threshold:** zero memorization-fidelity errors (every word present, in order, in every surah); tajweed-quality Jali errors zero; Khafi errors capped at ≤5 total across all 11 items for a clean pass.
  - **Failure threshold (per research B.3's competition-rulebook convergence):** more than 3 examiner-corrected mistakes in any single surah fails that surah specifically — revise and retest that surah alone, not the whole set.

### Test 3 — Oral Rule Quiz (end goal 3: "know the tajweed rules by name and explain them")
- **What to ask:** teacher names a rule (or shows a trigger letter/example word) at random from the full taught set; student names the rule, explains its trigger condition, states its duration/count if applicable, and states its color. Cover all 6 rule families across the session: noon sakinah/tanwin (4 sub-rules), meem sakinah (3 sub-rules), qalqalah (3 tiers), madd (5 types), lam of Allah + rā' (baseline conditions minimum; the 5-word rā' exception list and sakin-rā' edge cases are "aware of, not required to recite," per the research's explicit checkpoint-scope note), waqf (6 basic signs).
- **Reading passage:** none required — this is a knowledge/explanation test, not a reading test. Optionally use example words from the lesson bank (§4) as prompts.
- **Rubric:** simple correct/incorrect per rule item (not the Jali/Khafi scale, per B.4's explicit recommendation that knowledge checks use a binary score). **Pass threshold:** correctly names and explains at least 90% of items asked (a missed color-name counts as a partial miss, not a full miss, if the rule itself was explained correctly).

### Test 4 — Color-Mushaf Reading (end goal 4: "read from a standard color-coded tajweed mushaf, knowing what each color demands")
- **What to ask:** present a color-coded passage (any already-memorized hifz ayah works well, or an unseen color-coded page if available in the platform). For each colored (or deliberately uncolored) span, student names the color, the rule family it signals, and reads it applying that rule correctly.
- **Reading passage:** recommend Al-Fatiha 1:7 as a rich single-ayah test item (contains izhar, idgham munfasil-adjacent madd, madd lazim, and laam shamsiyyah in one line — see Lesson 3.25's guided drill), plus 1–2 additional unseen color-coded lines if the platform has them ready.
- **Rubric:** correct/incorrect per color-to-rule identification (binary, per B.4), combined with the Jali/Khafi scale for the actual reading-aloud portion. **Pass threshold:** correctly identifies ≥90% of colors/rules shown, and reads with zero Jali errors on the colored spans specifically (the whole point of this test is that color recognition translates into correct sound).

### Overall Final Checkpoint outcome
- **Pass (all 4 tests):** course-complete per all four spec end goals.
- **Pass with homework flag:** any single test in the "pass with homework flag" band — course is functionally complete, teacher assigns a short targeted homework block on the flagged rule/surah, no formal retest required unless the teacher judges it necessary.
- **Revise-and-retest:** any test below its pass threshold — teacher names the exact weak unit(s) (specific rule, specific surah, specific letter) per the per-item logging done throughout Phase 3, assigns targeted revision (reusing that unit's original lesson drills from §4), and retests only that test, not the whole checkpoint. This mirrors the spec's explicit "never a restart" policy for failed checkpoints.

---

## 6. Sourcing notes, corrections, and gaps carried into the content-build phase

- **All Arabic text in this document was fetched programmatically from `api.quran.com/api/v4`** (`text_uthmani` and `words[].text_uthmani` fields, verified live 2026-07-19, mirroring Tanzil per `quran-text-data.md` §4) — not retyped from the research docs or any secondary source. This resolved several examples the original research flagged as uncertain:
  - **Qalqalah:** the original research struggled to find clean in-set examples. This pass found five confirmed instances directly in the hifz text: يَجْعَلْ (105:2, sughra), يَدْخُلُونَ (110:2, sughra — matches the research's own tentative suggestion), ٱلْفَلَقِ (113:1, kubra when stopped — also matches the research's tentative suggestion), يَلِدْ/يُولَدْ (112:3, sughra/kubra pair), and وَتَبَّ (111:1, kubra jiddan/akbar — a new find not in the original research, since it carries shaddah).
  - **Rā' rules:** found genuine in-set examples for every baseline and sakin condition taught in Lessons 3.22–3.23 (رِحْلَةَ for kasrah/light, نَصْرُ ٱللَّهِ for damma/heavy, وَأَرْسَلَ and تَرْمِيهِم for sakin-heavy, وَٱسْتَغْفِرْهُ for sakin-light), where the original research had explicitly given up and recommended pulling examples from outside the hifz set.
  - **Quraysh 106:4 ikhfa/izhar correction:** confirmed the research's own correction — the ayah reads ...مِّن جُوعٍ وَءَامَنَهُم مِّنْ خَوْفٍۭ, giving a clean same-ayah ikhfa (ج) / izhar (خ) contrast pair, used directly in Lesson 3.7.
- **Still unresolved, carried forward as explicit build-time action items:**
  - **Iqlab** — no clean in-set example exists (confirmed again in this pass). Lesson 3.4 flags the exact ayah to pin (candidate: Al-Baqarah 2:97) as a to-do, not a final answer — fetch and verify against the live API before that slide ships.
  - **Idgham shafawi/mithlayn** — same situation, flagged in Lesson 3.9 (candidate: Al-Baqarah 2:5).
  - **The 5 rā' isti'la-exception words** and the **madd lazim kalimi mukhaffaf** pair (Yunus 10:51/10:91) are correctly out-of-scope for recitation (per the spec and research) and are presented as reference-only cards in Lessons 3.19 and 3.23.
- **Color legend visual verification gap (inherited, unresolved):** the Internet Archive scan of the actual printed Dar Al-Maarifah color-coded mushaf (`archive.org/details/quran-with-colour-coded-tajweed`) returned 503 in every check pass to date (both the original research and `verified-resources.md`'s independent re-check). The 5-color mapping used throughout §1 and every lesson is built from converged secondary-source description, not the primary artwork. **This must be re-attempted (or a physical copy sourced) before the platform ships any color-span rendering**, per the cross-cutting build rule in `verified-resources.md`.
- **Waqf-sign placement gap:** Lesson 3.25 teaches the 6 basic waqf-sign meanings generically; the exact glyph placement within the specific hifz-set ayat (which sign appears where, in an actual printed mushaf) was not sourced in this pass — it requires a mushaf-layout dataset (QUL's "20 approved Mushaf layouts," per `quran-text-data.md` §2) at content-build time.
- **Minshawi (alternate qari) per-ayah folder name** is still unconfirmed for the hifz-set ayat specifically (`verified-resources.md` flags the everyayah folder name as UNVERIFIED) — every audio URL in this document uses Husary Mu'allim exclusively; do not wire a Minshawi fallback without independently confirming the folder name first.
- **Reciter identity for `audio.qurancdn.com`'s word-by-word audio** was never confirmed by name in the research (`recitation-audio.md` §4.3, open question) — the word-audio URLs given throughout this document are structurally correct and confirmed reachable, but the pace/style suitability for isolating single rule-example words (as opposed to full Phase 2 word drills) should be spot-checked by the teacher before relying on them live in a lesson.
- **Every Arabic string in this document must still be re-verified against a live Tanzil/quran.com fetch at the actual content-build step**, per the spec's own scripted QA requirement — this pass's fetch is a snapshot from 2026-07-19, not a permanent guarantee.
