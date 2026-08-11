# Tajweed Course — Units 2, 3 & 4 Design

**Status:** Approved design · **Date:** 2026-08-10
**Supersedes:** the Phase 2/Phase 3 sections of `2026-07-19-tajweed-course-design.md`
**Leaves intact:** Phase 1 (shipped), the platform architecture, the PPTX export, the
`/teach` route, and the three-tier `AudioSource` model.

---

## 0. Why this document exists

Phase 1 (12 lessons, the 28 letters + forms + harakat) is built and shipping.
`docs/syllabus/phase-2-reading.md` (14 lessons) and `docs/syllabus/phase-3-tajweed.md`
(26 lessons) are fully written but have **zero content files**. This document re-plans
everything after Phase 1, incorporating a research pass over two YouTube courses, the
classical matn literature, and the open Quran-data ecosystem.

Ten research agents produced the evidence base; their full reports are the source for
every claim below. Where an agent corrected an existing repo document, that is called out.

---

## 1. Decisions taken (and what they overturn)

| # | Decision | Overturns |
|---|---|---|
| 1 | Units 2 + 3 are **one continuous tajweed track**, not two phases | the "Phase 2 / Phase 3" split framing |
| 2 | Delivery stays **live-taught, one adult student**, 3×/week | nothing — confirms the original spec |
| 3 | Rule spine follows **al-Muqaddimah al-Jazariyyah**, drills from **Tuhfat al-Atfal** | `phase-3-tajweed.md`'s Noon→Meem→Qalqalah→Madd→Lam/Rā'→Waqf order |
| 4 | Adopt Arabic101's **stage + revision + Q&A rhythm**, **one rule per lesson with explicit prerequisites**, **corrective/myth-busting voice**, and **mistakes as a separate track** | — |
| 5 | The **six Kalimas + Iman Mujmal/Mufassal** are full lessons in the spine (Unit 4) | the original out-of-scope list |
| 6 | Colour convention: **Family B (Quranly/digital) as default**, Dar al-Ma'rifah as a toggle | the 2026-07-19 "Quranly style" decision *as written* — Quranly is now pinned, and it is **not** Dar al-Ma'rifah |

### 1.1 Decision 3 in detail — why Jazariyyah

Al-Jazariyyah (Ibn al-Jazari, d. 1429, ~107 verses) is organised on a principled split:
**ḥaqq al-ḥarf** (what a letter intrinsically is — makhraj, sifat, heaviness, rā', lam)
before **mustaḥaqq al-ḥarf** (what it becomes in context — ghunnah, idghām, ikhfā', madd).
Intrinsic before contextual.

Tuhfat al-Atfal (al-Jamzuri, 1746, 61 verses) is the standard beginner matn but is
deliberately narrow: it contains **no makharij, no sifat, no rā', no tafkhīm, no waqf**.
It supplies the drill content; Jazariyyah supplies the skeleton.

Both YouTube sources are downstream of these. Arabic101 is Tuhfah's content reordered by
frequency-of-use with Jazariyyah ch. 1–2 pulled out as a parallel track. The Uzbek course
is not matn-driven at all — it is organised around progressively reading a mushaf page,
which is why orthography and waqf fill its first 33 lessons.

**Two corrections the classical order itself needs:**

1. **Tuhfah places ghunnah (ch. 2) after the noon rules (ch. 1) that depend on it.** Most
   teachers silently fix this. We fix it explicitly: ghunnah is taught before idghām
   bi-ghunnah (lesson 3.14, before Unit 3.4).
2. **Madd 'āriḍ li's-sukūn requires waqf, but Jazariyyah puts madd (ch. 11) before waqf
   (ch. 12).** The taxonomy's §17C prescribes the fix and the Uzbek course demonstrates it:
   teach waqf **twice**. Practical stopping ("drop the final ḥarakah, ta marbūṭah becomes
   hā'") enters in **Unit 2.12–2.14**, where the student first reads full sentences and
   must breathe somewhere. Unit 3.7 formalises it.

### 1.2 Decision 6 in detail — the colour conflict

Quranly was pinned by direct observation of the app rendering **Al-Isrā' 17:1**:

| Word | Letter | Colour | Rule |
|---|---|---|---|
| سُ**بْ**حَٰنَ · بِعَ**بْ**دِهِۦ · ٱلْأَ**قْ**صَا | بْ, قْ | **red** | qalqalah |
| ٱلَّذِ**ىٓ** · ءَايَٰتِنَ**آ** | ىٓ, آ | **blue** | madd |
| لَيْلًا **مِّ**نَ | مّ | **green** | idghām ma'al ghunnah |
| بِعَبْدِهِ**ۦ** | ۦ | **light blue** | madd ṣilah |

**Red = qalqalah, blue = madd.** That is Family B (alquran.cloud / quran.com lineage),
and it directly contradicts Dar al-Ma'rifah, where **red = madd**. All 26 lessons in
`phase-3-tajweed.md` were written against Dar al-Ma'rifah, so every colour reference in
them is now wrong and must be updated.

This is cheap to support both ways because `cpfair/quran-tajweed` gives **machine-readable
rule identity** — colour is a rendering config, not a data property. Family A ships as a
toggle. A "read any legend" lesson lands before the capstone, which serves end goal 4
("knowing what each colour demands") better than memorising one palette.

**Family B palette (verified live):** `#AAAAAA` hamzat wasl / silent / lām shamsiyyah ·
`#537FFF` madd normal · `#4050FF` madd permissible · `#000EBC` madd necessary ·
`#2144C1` madd lāzim · `#DD0008` qalqalah · `#D500B7` ikhfā' shafawī · `#9400A8` ikhfā' ·
`#58B800` idghām shafawī · `#26BFFD` iqlāb · `#169777` idghām bi-ghunnah ·
`#169200` idghām bilā ghunnah · `#A1A1A1` idghām mutajānisayn/mutaqāribayn ·
`#FF7E1E` ghunnah.

**Colour must be a redundant channel, not the only one.** 14 rules cannot be encoded in
colour alone by any palette — categorical colour maxes out around 8–10 reliably
distinguishable hues, fewer under deuteranopia. On this app's `--bg-velvet: #08070d`
background, `#000EBC` scores 1.71 contrast — unreadable. Therefore ship:
per-family underline styles (`text-decoration-style`), tap-for-rule-name, an **isolate
mode** that dims everything except one rule, an always-visible legend, and family
grouping (all madd = blues, all idghām = greens, all ikhfā' = purples) so the live
discrimination load is ~5 families rather than 14 rules. Merge or separate
`#AAAAAA`/`#A1A1A1` — they are indistinguishable to everyone.

---

## 2. Course structure — 58 new lessons

Phase 1 (12 lessons) is built. Everything below is new.

### Unit 2 — Reading Mechanics (14 lessons, ids `2-01`…`2-14`)

Content as already specified in `docs/syllabus/phase-2-reading.md`, with one addition.

| id | Lesson |
|---|---|
| 2-01 | Tanwīn — the three nunation marks |
| 2-02 | Tanwīn in real reading |
| 2-03 | Sukūn I — closed syllables |
| 2-04 | Sukūn II — harder clusters & the bouncing letters |
| 2-05 | Shadda — the doubling mark |
| 2-06 | Shadda in words |
| 2-07 | The three madd letters |
| 2-08 | Madd meets shadda & sukūn; leen letters |
| 2-09 | Hamzatul-waṣl basics |
| 2-10 | Real words |
| 2-11 | Phrases |
| 2-12 | Fully-voweled sentences I — **+ practical stopping introduced** |
| 2-13 | Fully-voweled sentences II: fluency — **+ practical stopping drilled** |
| 2-14 | First mushaf page — **+ practical stopping applied** |

**Gate:** Checkpoint 2 — read unseen fully-voweled words and sentences unaided. The
original spec calls this "the biggest gate in the course."

### Unit 3 — Tajweed Rules (36 lessons, ids `3-01`…`3-36`)

> **Amended 2026-08-11 — Unit 3 is 37 lessons, ids `3-01`…`3-37`.**
>
> Reviewing the rule notes found that this table teaches four of the five ṣifāt opposite
> pairs and none of the ṣifāt without an opposite: eight rule notes described
> characteristics no lesson mentioned, even in passing. A new **`3-04` — Ṣifāt III: the
> fifth pair, and the ṣifāt with no opposite** closes that, and **everything from `3-04`
> down in the table below shifted up by one** (old `3-04` Qalqalah ṣughrā is now `3-05`,
> and so on to old `3-36` Capstone, now `3-37`).
>
> **The table below is left at its original numbering on purpose.** It is the record of
> what was approved on 2026-08-10, not a live index. For current ids read the vault:
> `library/04-Curriculum/Unit-3-Tajweed/`. The full resolution — including the three
> other gaps this review found — is in `library/00-Index/Verification-Log.md`.

**3.1 — Ḥaqq al-Ḥarf: sifat & heaviness** *(Jazariyyah ch. 1–4, 7)*

| id | Lesson |
|---|---|
| 3-01 | Makharij consolidated — 17 points, 5 zones |
| 3-02 | Sifat with opposites I — hams/jahr, shiddah/rakhāwah |
| 3-03 | Sifat with opposites II — isti'lā/istifāl, iṭbāq/infitāḥ → **خص ضغط قظ** |
| 3-04 | Qalqalah ṣughrā — as a *sifah* (**قطب جد**) |
| 3-05 | Qalqalah kubrā & kubrā jiddan |
| 3-06 | Tafkhīm/tarqīq in general; alif inherits from what precedes |
| 3-07 | **ض vs ظ** — Jazariyyah gives this its own chapter |
| 3-08 | Revision + Q&A |

**3.2 — Rā' and Lām** *(ch. 5–6)*

| id | Lesson |
|---|---|
| 3-09 | Rā' I — fatḥa/ḍamma → heavy, kasra → light |
| 3-10 | Rā' II — sākin cases + the 5-word isti'lā exception card |
| 3-11 | Lam of lafẓ al-jalālah |
| 3-12 | Lām shamsiyyah / qamariyyah + lām of the verb |
| 3-13 | Revision + Q&A |

**3.3 — Ghunnah & Meem Sākinah** *(ch. 9)*

| id | Lesson |
|---|---|
| 3-14 | **Ghunnah first** — noon & meem mushaddadatān, 2 counts |
| 3-15 | Ikhfā' shafawī |
| 3-16 | Idghām shafawī / mithlayn |
| 3-17 | Iẓhār shafawī |
| 3-18 | Revision + Q&A |

**3.4 — Noon Sākinah & Tanwīn** *(ch. 10 / Tuhfah ch. 1)*

| id | Lesson |
|---|---|
| 3-19 | Iẓhār halqī — **ء ه ع ح غ خ** |
| 3-20 | Idghām ma'al ghunnah — **ينمو** + the 4-word exception (الدُّنْيَا، بُنْيَان، صِنْوَان، قِنْوَان) |
| 3-21 | Idghām bilā ghunnah — **ل ر** |
| 3-22 | Iqlāb — **ب** only |
| 3-23 | Ikhfā' ḥaqīqī I — the 15 letters + mnemonic |
| 3-24 | Ikhfā' ḥaqīqī II — consolidation |
| 3-25 | Revision + Q&A |

**3.5 — Idghām theory** *(Tuhfah ch. 5)* — `3-26` mutamāthilayn / mutajānisayn /
mutaqāribayn. *Single-lesson stage: its revision folds into `3-25`, which already covers
the noon-sākinah idghāms it generalises.*

**3.6 — Madd** *(ch. 11 / Tuhfah ch. 6–8)*

| id | Lesson |
|---|---|
| 3-27 | Madd family intro + ṭabī'ī (2 counts) |
| 3-28 | Wājib muttaṣil (4–5) |
| 3-29 | Jā'iz munfaṣil (4–5, pinned for Husary consistency) |
| 3-30 | 'Āriḍ lis-sukūn (2/4/6, held consistent within a session) |
| 3-31 | Lāzim (6) + subtypes |
| 3-32 | Revision + Q&A |

**3.7 — Waqf, Ibtidā' & orthography** *(ch. 12–15)*

| id | Lesson |
|---|---|
| 3-33 | Waqf signs (م لا ج صلى قلى س) + waqf types |
| 3-34 | How words change when you stop; ta marbūṭah; maqṭū'/mawṣūl |
| 3-35 | Hamzat al-waṣl in full + silent letters + **read any legend** |
| 3-36 | **Capstone** — all families, all colours, mock oral quiz |

### Unit 4 — The Kalimas (8 lessons, ids `4-01`…`4-08`)

Applied recitation on text the student recites daily. Following the Uzbek tradition
(Muallimi Soniy lessons 70–77). Not Quran text, so no hifz-set conflict.

`4-01` Kalima Ṭayyiba · `4-02` Shahāda · `4-03` Tawḥīd · `4-04` Radd al-Kufr ·
`4-05` Istighfār · `4-06` Tamjīd · `4-07` Īmān Mujmal · `4-08` Īmān Mufaṣṣal

### Timeline

58 new lessons at 3×/week ≈ **19 weeks (~5 months)**, on top of the shipped Phase 1.
Calendar is suggested; **checkpoint gates decide actual advancement**. A failed checkpoint
triggers targeted revision of named weak units and a retest, never a restart.

### Build order — this spec needs six implementation plans, not one

The work below is too large for a single plan. It decomposes into six sub-projects, each
of which gets its own plan and ships independently.

| # | Sub-project | Delivers | Depends on |
|---|---|---|---|
| **L** | **The Library** *(owner decision 2026-08-10)* | An Obsidian vault at `library/`: every rule, letter, source and lesson written and **machine-verified** in markdown, before any of it becomes JSON | nothing — **this is the foundation** |
| **A** | **Unit 2 content** | 14 lessons + Checkpoint 2, on the *existing* schema — no new slide kinds needed | L |
| **B** | **Quran data pipeline** | vendored text + annotations, build-time span flattening and cluster normalisation, cached word segments, KFGQPC font | L (shares the vendored corpus) |
| **C** | **Schema + renderer** | new slide kinds, `TajweedRule` enum, prerequisites, structured `listenFor`, the coloured-span renderer with isolate mode and the Family A/B toggle | B |
| **D** | **Tajweed games** | game registry, `onResult` seam, audio-in-games, harakat-safe `arabic.ts`, then the 8 drills | C |
| **E** | **Unit 3 + Unit 4 content** | 44 lessons + Final Checkpoint | C, D, L |

**L comes first, and everything else derives from it.** The owner's requirement is that no
lesson is written into slides until its underlying rule, examples and citations exist in
markdown and survive review. Prose is cheap to correct; JSON slide decks embedded in a
running app are not.

The library is **not** a documentation folder — it is a verified content source with an
enforced schema. `npm run check:library` fails the build if a rule note is missing
frontmatter, cites a source that does not exist, links to a note that does not exist, or
quotes a Qur'anic example whose text does not byte-match the pinned Tanzil corpus at the
cited `surah:ayah`. "No one questions the source" becomes an invariant a script enforces,
not an aspiration.

---

## 3. Hifz strand

Unchanged in method, **re-mapped across 36 lessons instead of 26**.

- **Order:** al-Fātiḥa first, then an-Nās backward to al-Fīl (114 → 105). 11 items.
  Independently validated by the Uzbek channel's own "Qur'on o'qishni o'rganish" series,
  which runs exactly 114 → 96 in reverse mushaf order.
- **Pacing:** budget lesson-segments in proportion to a surah's verse/word count, not one
  surah per lesson (heuristic extracted from the same channel).
- **Cycle:** Sabaq (new) → Sabqi (recent) → Manzil (old). 20–40 total repetitions per new
  portion; **10 extra repetitions** for any caught error. Session order is always
  Manzil/Sabqi **before** new Sabaq — revision precedes new memorisation.
- **Promotion:** 3 consecutive clean recitations moves Sabqi → Manzil. *(This course's own
  default; no source gave one.)*
- Revision lessons pause new *rules* but the hifz strand keeps moving.

**Action:** the lesson→surah mapping in `phase-3-tajweed.md` §2.2 was built for 26 lessons
and must be regenerated for 36.

---

## 4. Schema changes

`src/content/schema.ts` is the single source of truth and cannot express tajweed today.

**New slide kinds** (added to `SlideSchema`'s discriminated union):

| kind | Carries |
|---|---|
| `rule` | Arabic/translit/English name, trigger condition, letter set, ḥarakāt count, colour key, mnemonic, examples, common mistakes |
| `ayah` | `surah:ayah`, Uthmani text, tajweed spans, word segments, audio, translation |
| `contrast` | minimal pairs — e.g. Quraysh 106:4's مِّن جُوعٍ (ikhfā') vs مِّنْ خَوْفٍ (iẓhār) in one ayah |
| `legend` | the active colour legend |
| `mistake` | the corrective/myth-busting framing |

**New fields:**

- `TajweedRule` enum — the 18 cpfair rules plus hand-authored `tafkhim`, `tarqiq`,
  `ra_rules`, `lam_jalalah`, `madd_badal`, `madd_iwad`, `sakt`.
- `prerequisites: lessonId[]` on `Lesson` — makes "revise these specific units" work.
- `stage: string` — for the stage/revision/Q&A rhythm.
- `listenFor` upgraded from `string[]` to the 7-field object
  (`{item, makhraj, commonMistake, whyItHappens, correctionCue, severityIfWrong, source}`)
  that `teaching-mistakes-assessment.md` §A.6 already prescribes.
- `CheckpointSchema` gains the Jali (−2) / Khafi (−1) point model and numeric thresholds.
- **`phase` max raises 1..3 → 1..4** for Unit 4. Lesson-id regex `^\d-\d{2}$` already
  accommodates `4-01`.
- Slide cap: currently `.min(8).max(24)`. Rule lessons should fit; re-check at build.

---

## 5. Games & drills

### 5.1 Blockers that must be cleared first

1. **`GamePanel.tsx:24-47` is a hardcoded array of six letter-shaped tabs**, gated by
   predicates over letter-shaped `GameData`. There is no registry and no `games:` field in
   the schema. Needs a registry keyed by an id declared per lesson, or a parallel
   `TajweedGamePanel` fed by `TajweedGameData`.
2. **No game plays audio.** `TapToHear.tsx` is the only player and lives outside `games/`.
   "Listen and identify the rule" has no precedent to build on.
3. **No game reports a result.** There is no `onResult` seam, so per-rule mastery tracking
   has nothing to attach to — and that is what checkpoint-driven revision needs.
4. **No sub-word span model.** Every game's atom is a whole glyph or whole word; tajweed
   rules apply to spans and need `{text, spanStart, spanEnd, rule}`.

**Trap:** `baseLetters`/`stripDiacritics` in `arabic.ts` destroy sukūn, shadda and tanwīn —
exactly what tajweed needs. They must never be applied to tajweed fragments. `arabic.ts`
needs harakat-preserving segmentation (letter + its marks as one unit) and letter-property
sets (qalqalah, isti'lā, throat letters, the 15 ikhfā' letters, ينمو).

**Trap:** every existing game shuffles inside an effect (the cause of the `0b09f21` crash).
New games must guard the stale frame or remount by `key`.

### 5.2 Reuse verdicts

| Component | Verdict |
|---|---|
| `Flashcards` / `CardFace` | **Reusable as-is** — `{id, front, back[]}` is content-agnostic. Needs a small render change to colour a sub-span. |
| `LetterQuiz` | **Most reusable engine here.** `Question = {prompt, choices}` covers rule MCQ verbatim. Five changes, chiefly **rule-aware distractors** (sibling rules of the same family, not `shuffled(pool).slice(0,4)`). |
| `SpotTheLetter` | **Fork it.** Matches on letter *identity*, but a qalqalah letter only qualifies **when it carries sukūn** — the target must be an index set, the text must stay voweled, and `found` must become a set with a submit step. |
| `WordBuilder` / `useBuildPuzzle` | **Steal the engine, drop the game.** Slot-and-bank + decoys + bounce-back retargets cheaply to rule-condition assembly (`pickDecoys` is glyph-specific and gets replaced). |
| `FormSwap` / `useSwapPuzzle` | Hook is generic over strings; the component is letter-only. Bucket-sort is an N-into-M assignment, which the hook's bijection cannot express — **write a bucket game**. |
| `derive.ts` | **Needs replacement** — only walks `slide.kind === "letter"`. |
| `deck.ts` | Reusable; one-line bail-out change. **Does not do spaced repetition** — SRS is net-new. |

### 5.3 New drills, in build order

1. **Rule identifier** — fragment with trigger span highlighted, pick the rule from 4.
2. **Family sorter** — assign fragments to Idghām / Ikhfā' / Iqlāb / Iẓhār buckets.
3. **Multi-select span tapper** — tap *all* letters that get tafkhīm / have qalqalah, submit.
4. **Madd count picker** — 2/4/6 ḥarakāt selector against a madd fragment.
5. **Listen-and-identify** — play a clip, pick the rule without seeing the text.
6. **Rule-condition builder** — assemble "noon sākin + ب → iqlāb, as meem with ghunnah".
7. **Waqf placement** — tap between words to mark permissible stops.
8. **Ghunnah timing hold** — hold for the ghunnah's duration, score against the count.

---

## 6. Data, media & licensing

### 6.1 The stack

| Need | Pick | Licence | Bundle |
|---|---|---|---|
| Quran text | **cpfair's pinned 2017 Tanzil snapshot** (1.38 MB) | CC BY 3.0 | **Yes** |
| Tajweed annotations | **`cpfair/quran-tajweed`** (5.58 MB, 60,057 annotations, 18 rules) | **CC BY 4.0** | **Yes** |
| Word segmentation | quran.com v4 `words[]` | Dev terms | Cache at build |
| Word timings | `api.quran.com/api/v4/recitations/12/by_chapter/{n}?fields=segments` | Dev terms | Cache at build |
| Reference audio | everyayah `Husary_Muallim_128kbps` | tolerated custom | **Link only** |
| Practice audio | everyayah `Minshawy_Teacher_128kbps` — call-and-response | tolerated custom | **Link only** |
| Quran font | KFGQPC Uthmanic Hafs (87 KB) | proprietary-free | Yes, **unmodified** |
| Drill font | Amiri (already installed) | OFL 1.1 | Yes |

### 6.2 Hard traps

- **Never mix cpfair offsets with quran.com `text_uthmani`.** They differ by inserted
  U+0640 TATWEEL before superscript alef (9,838 occurrences), waqf signs present in one and
  not the other, and basmala prefixing. Mixing mis-highlights nearly every ayah.
- **`?segments=true` silently returns nothing.** The parameter is `?fields=segments`.
- **Do not subset KFGQPC** — subsetting is modification and the licence forbids it.
- **Normalise every span boundary outward to the nearest grapheme-cluster edge.** cpfair's
  README warns annotations do not always stop on letter boundaries; this is the single most
  likely source of rendering bugs.
- **Flatten overlapping annotations before rendering** (rules nest — `hamzat_wasl` inside
  `lam_shamsiyyah` in 1:1). Sweep boundaries, emit one segment per distinct rule-set.
- **Only change `color` / `text-decoration` on a span.** Any `display`, `position`,
  `margin`, `font-size` or `font-family` forces a new formatting context and re-breaks
  Arabic shaping. Never emit whitespace between spans. **Test on real Safari.**
- Set a User-Agent on any build script — `api.quran.com` returns 403 without one.

### 6.3 The confirmed gap

**No openly-licensed, full-coverage letter/qaida audio exists.** This was searched
exhaustively and confirmed absent. ~1,493 `teacher-voice` cues remain silent placeholders.
The realistic fix, already noted in WISHLIST: **20–30 minutes of owner-recorded audio
upgrades every one of them to `qari-clip` with no schema change.** Arabic TTS is not
acceptable for any Arabic content — it optimises for intelligibility, not makhraj, so it
would teach errors the student must later unlearn.

### 6.4 Credits (required)

> Quran text: Tanzil Project (tanzil.net), CC BY 3.0. Tajweed annotations:
> cpfair/quran-tajweed, CC BY 4.0. Word segmentation and recitation timings:
> Quran.com / Quran Foundation. Recitation: Sheikh Mahmoud Khalil Al-Husary (Mu'allim) and
> Sheikh Mohamed Siddiq al-Minshawi (Teacher), streamed via everyayah.com. Quran font:
> KFGQPC Uthmanic Script HAFS. Interface Arabic: Amiri (SIL OFL 1.1). Tajweed colour
> convention follows the digital (quran.com / alquran.cloud) family; a Dar al-Ma'rifah
> mapping is available in settings.

---

## 7. Assessment

Scoring throughout: **Lahn Jali (major, −2) / Lahn Khafi (minor, −1)**; self-correction
after prompt −1; examiner has to correct −2. Errors are tracked **per letter and per rule**,
not per passage, so revision can name the specific unit.

**Final Checkpoint — 4 tests, one per end goal:**

1. **Unseen mushaf page** — plain Uthmani, no colour. Pass: zero uncorrected Jali;
   Khafi ≤5 clean, 6–10 pass-with-flag, >10 → revise and retest.
2. **Hifz recitation** — al-Fātiḥa then 114→105 unaided, with a **separate
   memorisation-fidelity axis** so "rough tajweed" is distinguishable from "doesn't have it
   memorised". >3 examiner corrections in one surah fails that surah alone.
3. **Oral rule quiz** — binary, pass ≥90%, covers all families.
4. **Colour-mushaf reading** — ≥90% colour/rule IDs correct, zero Jali on coloured spans.
   Recommended item: al-Fātiḥa 1:7 (iẓhār, madd munfaṣil, madd lāzim, lām shamsiyyah in one
   line).

Outcomes: Pass / Pass-with-homework-flag / Revise-and-retest (named units only).

---

## 8. Priority error list (drives drill design)

From `teaching-mistakes-assessment.md`, in citation-strength order. No Uzbek-L1 phonetic
study exists; these are inferred from Persian/Turkish/Urdu analogues and are **hypotheses
for the teacher to verify in lesson 1**.

1. **ح vs خ vs ه** — the single most-cited non-Arab error; no counterpart in English,
   Turkish, Uzbek, Persian or Urdu.
2. **ض** — the hardest Arabic letter for all non-natives; weak/absent istiṭālah, surfaces
   as د or z.
3. **ذ/ز/ظ/ض collapse to "z"** — documented for Persian/Turkish/Urdu speakers.
4. **ع substituted with ء**.
5. **Tafkhīm bleeding** — heaviness must carry through the whole syllable. Alif al-madd has
   **no independent** ruling; it fully inherits from the preceding letter.

Also: ق→ك (قال/كال changes meaning), ث↔ذ, ص→س, ط→ت, ظ→ذ, غ↔خ.
Rules-phase errors: ghunnah with no nasal resonance (**nose-pinch self-check**), defaulting
to iẓhār because it is easiest, and rushing or flattening madd.

---

## 9. Open items

| # | Item | Blocking |
|---|---|---|
| 1 | Regenerate the hifz lesson→surah mapping for 36 lessons | Unit 3 content |
| 2 | Update every colour reference in `phase-3-tajweed.md` from Dar al-Ma'rifah to Family B | Unit 3 content |
| 3 | Sample exact Dar al-Ma'rifah hex values from a physical copy (archive.org scan 503s) | the Family A toggle only |
| 4 | Pin the iqlāb and idghām-shafawī reference ayat (candidates 2:97, 2:5) | lessons 3-22, 3-16 |
| 5 | Waqf-sign glyph placement needs a mushaf-layout dataset | lesson 3-33 |
| 6 | Record letter/qaida audio (~20–30 min) | 1,493 silent cues |
| 7 | Verify يَبْصُۜطُ sīn-vs-ṣād against a Madinah mushaf and a teacher before publishing | any lesson citing it |
| 8 | 4 example words excluded from games (ة / standalone ء) — owner decision still open | games |
| 9 | `/teach` is obscurity-only; needs real gating before any public launch | public launch only |

**Present as "scholars differ", never as settled fact:** madd munfaṣil length (4–5 vs 2),
idghām of ي/و (naqiṣ vs kāmil), qalqalah degrees (2 vs 3), number of sakt in Hafs (4/6/7),
levels of tafkhīm (5 vs 4), ikhfā' shafawī vs iẓhār for meem+ب, and the length of a
ḥarakah. Teach the jumhūr position, name the alternative once.

---

## 10. Sources

**Classical:** al-Muqaddimah al-Jazariyyah (Ibn al-Jazari, d. 833 AH) · Tuhfat al-Atfal
(al-Jamzuri, b. 1160 AH).

**Video — English:** Arabic101 (`@Arabic101`, Drs. Islam Fekry, ijazah-holder).
30-day program `PL6TlMIZ5ylgoA27YCmZYMCQCX7EUkfyHp` · Makharij & Sifaat
`PL6TlMIZ5ylgpmlnN3EpkOec0tJ8OJZ5re` · Beginner `PL6TlMIZ5ylgqM4Uuu7iAhIeuSdF0v9yxo` ·
Common Mistakes `PL6TlMIZ5ylgo_RLmIMYXxV8vWTv3P48ru` · Advanced
`PL6TlMIZ5ylgojGi2tiWQnXa2ELsBP36C1` (**not a syllabus — unordered standalone topics**).

**Video — Uzbek:** Muallimi Soniy (`@MuallimiSoniy`, Shayx Alijon Qori). Tajvid darslari
`PLgrueUfOSy6toOuZQLtPe3N1PGhZdUsOu` — 96 videos, 22h 34m, tajweed lessons **1–82**
gap-free. *Corrects `docs/research/uzbek-channel.md`, which claims 83.*
Reading series `PLgrueUfOSy6uYsDGmnz1uEFuEv1kFALAC`.

**Both channels are Standard YouTube License — link/embed only, never re-host.**
`youtube-cue` remains restricted to single-topic videos at `startSeconds: 0`; compilation
deep-links stay disabled pending human audit.

**Data:** `github.com/cpfair/quran-tajweed` (CC BY 4.0) · tanzil.net (CC BY 3.0) ·
`api.quran.com/api/v4` · everyayah.com · QUL (`qul.tarteel.ai`).

Full research reports: ten agent findings covering the content model, app architecture,
games engine, prior docs, infrastructure, both playlists, the rule taxonomy (1,986 lines),
pedagogy, and data sources.
