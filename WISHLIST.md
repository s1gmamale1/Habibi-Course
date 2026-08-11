# WISHLIST

Capture inbox. Nothing here is scheduled — scoped work gets promoted to `ROADMAP.md`.

> **Triaged 2026-08-11.** Every item below was checked against the code rather than
> carried forward on trust. Five were already done and have been removed; four were
> stale in their details and are corrected. What is left is open as of this date.
> The removals are listed at the bottom so the history is not simply lost.

---

## Audio — the real shape of the gap

> Superseded the old *"1,493 tap targets are teacher-voice"* line, which was wrong twice
> over: the count had grown to **6,966** as Units 2–4 shipped, and counting cues rather
> than distinct sounds overstated the recording job by more than four times.

**Measured 2026-08-11 across `content/lessons/`:** 7,194 audio-bearing items — 6,966
`teacher-voice`, 182 `youtube-cue`, 46 `qari-clip`. Those 6,966 cues carry only
**1,635 distinct Arabic payloads** (4.3× repetition), which split into four groups that
need completely different solutions:

| Group | Distinct | What it is | Route |
|---|---|---|---|
| **Qurʾānic words** | **254** | exact matches to a word in the pinned corpus | Word-by-word CDN, link-only — but **blocked on a missing `ref` field**, see below |
| **Single letters** | **213** | the 29 letters across their harakat | The genuine recording gap |
| **Syllables** | **510** | 2–3 letter qāʿidah drill units | The genuine recording gap |
| **Ordinary vocabulary** | **658** | everyday MSA nouns — ثعلب، خليج، قميص، كتاب، مسجد، حصان، بخار | **Not scripture.** Open pronunciation dictionaries may cover these |

**Why this matters.** The project's standing conclusion — *"no openly-licensed,
full-coverage audio set exists"* — was reached about the course as a whole. Broken down,
it is only true of the middle two groups. **723 letter-and-syllable cues are the actual
irreducible recording job**, not 7,000, and at 4.3× reuse that is a much smaller ask than
the roadmap has been carrying.

- **[audio] Wire the 254 Qurʾānic-word cues to the word-by-word CDN.** Pattern and terms are
  already researched and confirmed live: `https://audio.qurancdn.com/wbw/{SSS}_{AAA}_{WWW}.mp3`,
  anonymous and CORS-open. **No new research is required, but this is NOT a drop-in swap —
  there is a real blocker first.**

  The CDN is addressed by surah, ayah **and word position**, and **no lesson item carries an
  ayah reference at all**: `ArabicItemSchema` (`src/content/schema.ts:32`) is
  `{arabic, name, translit, audio}`, and `"ref"` appears **zero times** across
  `content/lessons/`. Matching on the Arabic string alone cannot resolve it — a word like
  ٱلْحَمْدُ occurs many times, and the word's *index within its ayah* is needed too.

  **The refs do exist, just on the other side of the pipeline:** the library notes carry
  **207 distinct `ref:` values across 780 example entries**, and ADR-003 makes the note the
  source of record. So the work is: add an optional `ref` to `ArabicItemSchema`, carry it
  through transcription, then resolve word position against the pinned corpus. Effort: **L,
  not M**, and it touches the schema.
- **[audio] The 723 letter/syllable cues.** Either an openly-licensed qāʿidah set or the
  owner's own voice. **DEFERRED by the owner** as far as his own recording goes; the
  open-set search is the live question.
- **[audio] The 658 ordinary-vocabulary cues.** These are reading-practice nouns, not
  Qurʾānic text, so both the licensing and the religious objections that block the other
  groups are weaker or absent here. Worth checking Lingua Libre, Wiktionary and Commons
  for coverage.

### TTS assessment — 2026-08-11

Researched on the owner's request. **The answer is different per category**, which is why
the project's earlier flat rejection of "Arabic TTS" was too coarse.

**Cost is not the obstacle.** ElevenLabs' free tier is **10,000 credits/month** at 1 credit
per character (Multilingual v2). The entire distinct-payload set is roughly **7,800
credits** — 723 letters/syllables at ~3.5 chars plus 658 words at ~8 chars. **The whole
corpus fits in one free month**, about $0.78 of compute at API rates.

**Licensing is a $6 problem, and it has one trap.** Free-tier output is
**non-commercial + attribution-required**, and the licence is **fixed at generation time —
paying later does not retroactively license audio already generated**. So the correct move
is one month of the paid entry tier, generate, cancel; paid-tier rights are reported to
survive cancellation. **Never publish free-tier output.** *(The perpetuity-after-cancellation
point is UNVERIFIED — the vendor's help articles 403'd and it is not in the ToS body.
Confirm in-account before relying on it.)*

**Verdicts by category:**

- **254 Qurʾānic words — TTS inappropriate.** Not contested. The CDN supplies real qurrāʾ.
- **723 letters and syllables — REJECT**, and on a better argument than makhraj. **A bare
  one-to-three-character input is out-of-distribution for every TTS system on the market** —
  they are trained on running speech. Two predicted failures: the model may pronounce the
  letter's *name* (*ṣād*) rather than its sound /sˤ/, and Arabic TTS front-ends work by
  **predicting diacritics from context**, of which a single character has none. This
  argument's virtue is that it **survives a listening test**: a ص inside a sentence may
  sound fine, while a bare one fails audibly.
- **658 ordinary MSA words — CONDITIONAL, gated on a cheap test.** In their favour: these
  are in-distribution for MSA TTS, the religious objection does not apply to non-scripture,
  and the correct articulation of each letter is **established elsewhere** — by the time a
  student meets قميص, ص was taught with human audio, so TTS reinforces an existing model
  rather than being the source of truth. Against: MSA newsreader register **systematically
  flattens tafkhīm**, and a beginner cannot tell shallow-ص from correct-ص — she will simply
  internalise the shallow one, which *contradicts* the drill she just finished. **Decide it
  with a ~20-word probe** loaded with contested letters (قميص، حصان، بخار, plus ض/د، ط/ت،
  ق/ك contrasts) — ~160 credits, judged by someone with tajwīd training.
- **English instructional narration — unobjectionable.** Zero makhraj exposure, no religious
  question. **This was never the contested case and should not have been caught by the
  original Arabic-focused rejection.**

**One claim from the research that this repo contradicts.** The assessment argued the
syllable cues are "largely madd drills (بَا/بِي/بُو) where the duration IS the pedagogical
content." **Checked against the content: it is not so.** Of 606 distinct two-to-three-letter
payloads only **127** contain a madd letter at all, and several of those are ordinary words
(بيت، عين، فيل). The actual set is **letter-joining drills** — بت، تب، كل، لك، من، نم. The
rejection stands regardless, and arguably harder: nonsense joining pairs are *further*
out-of-distribution than madd syllables.

**On the evidence base, stated plainly:** no published evaluation of TTS *output* on the
emphatic contrasts appears to exist. The case rests on inference from adjacent evidence —
notably that **Arabic TTS is scored by MOS and PESQ, none of which measure articulation-point
correctness**, so a system can top every leaderboard while producing س for ص. The
durational features (madd counted in ḥarakāt, ghunnah, qalqalah) are the **more durable**
objection than the emphatics, because no system attempts them and no metric rewards them.

**Religious positions found — more permissive than expected, and not independently verified
by me.** The research reports IslamQA 512399 permitting synthesised recitation subject to
the voice owner's permission; IslamWeb 510187 setting the operative test as expert
endorsement that a teaching program is *free from errors*; and notes that Al-Azhar's
Sept 2024 statement concerned **musical accompaniment, not AI synthesis**, so it should not
be cited against TTS. **Verify these before relying on any of them.** The practical upshot:
the rulings do not forbid TTS — they set an expert-verification bar no vendor currently
claims to clear.

**Also unverified:** whether a per-request minimum credit charge exists (1,381 tiny requests
could cost far more than the character math implies — this is the one number that could
break the estimate); and whether an unmonetised educational site counts as "non-commercial",
which the terms nowhere define.

---

## Content and pedagogy

- **Per-letter makhraj diagrams instead of 5 zone diagrams.** 18 tongue letters still share
  one `lisan.jpg` with the same highlight, so ت (tip), ض (side) and ك (back) look identical.
  The owner asked for diagrams so the student "wouldn't have to guess"; for tongue letters
  she still does. Needs ~10 more images (tongue sub-zones) plus a per-letter mapping.
- **Frame-by-frame makhraj animations** (owner request, 2026-07-22). The owner wants actual
  MOVEMENT per letter — tongue and lip motion during pronunciation. Options when picked up:
  (a) deep-link licensed/embeddable animated makharij videos per zone, (b) coherent
  multi-frame or video generation when available, (c) CSS/SVG micro-animations over the
  annotated stills. The annotated raster stills are the current baseline.
- **4 example words silently excluded from all games** — the word filter admits only fully
  taught base letters, so words containing ة or standalone ء never qualify: ضَوْء، لُغَة،
  بَقَرَة، وَرْدَة. Correct per spec but silent. **Owner decision needed:** mapping ة→ه/ء
  would be linguistically dubious; the alternatives are teaching those letterforms or
  dropping the words. `src/games/derive.ts` + `src/games/arabic.ts` `BASE_MAP`.
- **"Unit 1.1" vocabulary appears in student-facing text** (confirmed still present in
  `content/lessons/1-01`, `1-04`, `1-06`) but the app never shows unit boundaries — the
  student sees a slide headed "Lesson 1.1" whose body refers to "Unit 1.1". Either surface
  units in the course map or drop the term from student text.
- **`docs/research/intro-motivation.md` hadith were verified via sunnah.com mirrors**, not
  sunnah.com itself (Cloudflare blocks automated fetches). Worth one human pass over the 8
  citations in a real browser.

## Access and infrastructure

- **`/teach/<id>` is obscurity-only** and ships in the same static bundle as student pages.
  Fine for one student; needs real gating before any public or commercial launch.
- **`api.quran.com` v4 is a legacy endpoint**, used at `scripts/fetch-word-timings.mjs:11`.
  Quran Foundation may sunset it. The mitigation is already designed and written down —
  precompute filenames at build time rather than calling the API at runtime
  (`docs/research/recitation-audio.md` §4.2) — but not executed.

## Accessibility — partially done, narrowed

The newer tajweed games (`ListenIdentify`, `RuleIdentifier`) now carry `aria-live="polite"`.
What remains:

- **Tap popovers have no `role="dialog"`/`aria-modal`** and no outside-click dismissal.
  (`SlideDeck.tsx:223` handles Escape, but for navigation, not popover dismissal.)
- **Locked/solved game tiles remain tabbable click-no-ops** in `FormSwap.tsx` and
  `LetterQuiz.tsx` — neither sets `disabled`/`aria-disabled`. `WordBuilder.tsx` does.
- **Lesson-row links share identical accessible names** ("Lesson"/"Practice") across rows;
  `CourseMap.tsx` sets no `aria-label`.
- **`ExportPptxButton.tsx` announces status only via the button label** — needs
  `aria-live="polite"`/`role="status"`.

## PPTX export

- **Recap columns fill left-to-right.** Multi-column recap slides put the first items in the
  *leftmost* column while the deck is otherwise RTL-honouring, and an Arabic-reading teacher
  scans right-to-left. `src/export/lessonToPptx.ts:151` — fix:
  `x: 0.5 + (colCount - 1 - col) * (9 / colCount)`. Effort: S.
- **Latent overflow hairline at exactly 14 recap items.** `recapFontSize` at
  `lessonToPptx.ts:134` still returns 20pt single-column for `<= 14`, which would end ~0.3"
  past the canvas. Unreachable in current content (largest real single-column recap is 13).
  Fix: lower the threshold to `<= 12`. Effort: S.

## Code hygiene

- **Tighten drill inner rows to `.min(1)`.** `src/content/schema.ts:79` and `:133` guard the
  *outer* array only, so an empty inner row (`[[]]`) still validates and `drillTableRows`
  would render a 0-column table. Build-time validation keeps it latent. Effort: S.
- **`useSwapPuzzle` value-equality check duplicated ×4** — `values[order[slot]] === values[slot]`
  and its variants appear at `useSwapPuzzle.ts:18, 46, 50, 63`. Extract
  `isCorrect(values, order, slot)`. Effort: S.
- **`FormSwap` re-declares a local `FormKey`** (`FormSwap.tsx:7`) structurally identical to
  the export at `src/games/derive.ts:5` — import it instead. Effort: S.
- **`Flashcards` back-face uses line text as its React key** (`Flashcards.tsx:80`) — a
  duplicate back line in future content would trigger key warnings. Index-suffix it. Effort: S.
- **Games coverage gaps** (behaviourally corroborated but unasserted): duplicate-letter word
  in WordBuilder/useSwapPuzzle; Next-word/Next-question round-advance clicks; SpotTheLetter
  fallback-to-glyph when a pool item lacks `name`; empty-pool guards; empty-string and
  single-letter `contextualGlyphs`. One test-sweep pass. Effort: M.
- **`allLessons()` re-parses all lesson JSON for every page at build** — O(N²) in lesson
  count. **The old note called this "negligible at N=12"; it is now 74 lessons and 230 static
  pages.** Still fast enough, but the premise has changed. `src/content/load.ts`. Effort: S.

---

## Removed 2026-08-11 — verified already done

- **Makhraj SVGs are dark-theme only** — moot. There are no makhraj SVGs left; all seven are
  raster `.jpg` under `public/images/makhraj/`.
- **`overview.svg` head outline is two subpaths** — same reason; it is `overview.jpg` now.
- **Regenerate all makhraj visuals as raster via codex imagine** (was blocked on a quota
  resetting 2026-07-25) — done. All seven exist as annotated rasters.
- **Dar al-Maʿrifah vs Quranly colour legend** — decided and shipped. ADR-002 pins Family B
  (red = qalqalah) as the default. The one live remnant, sampling Dar al-Maʿrifah's exact hex
  values from print, is tracked in `ROADMAP.md` Phase 6, not here.
- **`useSwapPuzzle` / games items assumed stale** — re-checked and genuinely still open, so
  they stayed above. Recorded here only to note they were verified, not assumed.
