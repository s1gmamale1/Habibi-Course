---
type: index
id: verification-log
status: verified
---

# Verification Log

`npm run check:library` proves what a script can prove: schema shape, resolvable links,
and that every quoted Qur'anic example occurs verbatim in the pinned corpus. **It cannot
prove that a rule is described correctly.** That is what this log is for — the human half.

A note is `status: verified` only when a person has checked it against its cited source
and recorded that here.

## Machine-verified

| Date | What | Method | Result |
|---|---|---|---|
| 2026-08-10 | Pinned corpus integrity | byte size + line count on download | `quran-uthmani.txt` 1,376,504 bytes, 6,266 lines, 6,236 ayahs — matches upstream exactly |
| 2026-08-10 | Annotation set integrity | byte size + record count | `tajweed.hafs.json` 5,578,730 bytes, 6,236 records, 7 annotations on 1:1 |
| 2026-08-10 | The 18 cpfair rule keys | counted every `ann.rule` in the 5.58 MB dataset and diffed against `scripts/lib/rules.mjs` | **identical in both directions**, 60,057 annotations. No invented keys |
| 2026-08-10 | Syllabus example words | 12 words from `phase-3-tajweed.md` checked against the pinned corpus | **12/12 verbatim.** Confirms that syllabus's claim its Arabic was pulled programmatically, never hand-typed |
| 2026-08-10 | The gate bites | authored a note citing `وَتَبَّ` at 112:1 (it is 111:1) | exits 1 and names the mismatch; removing it returns exit 0 |
| 2026-08-10 | Rule dependency graph | every rule's `prerequisites` resolved against existing rule notes | **all 59 resolve.** The graph the Jazariyyah ordering exists to fix is sound |
| 2026-08-10 | Lesson id format | `taught_in` / `id` checked against `/^\d-\d{2}$/` | caught two real violations — [[Qalqalah-Sughra]] and [[Qalqalah-Kubra]] wrote `"3-6"`/`"3-7"`, which the content schema would silently fail to match. Fixed, and the gate now rejects it |

## Human-verified

| Date | What | Against | By | Result |
|---|---|---|---|---|
| 2026-08-10 | Quranly colour palette | direct observation of the app rendering al-Isrāʾ 17:1 | owner | **Family B.** Red = qalqalah (بْ in سُبْحَٰنَ and بِعَبْدِهِ, قْ in ٱلْأَقْصَا), blue = madd (ٱلَّذِىٓ, ءَايَٰتِنَآ), green = idghām maʿal ghunnah (لَيْلًا مِّنَ). **Contradicts Dar al-Maʿrifah, where red = madd** |
| 2026-08-10 | Uzbek series length | re-scraped the playlist | agent | **82 lessons, gap-free.** `docs/research/uzbek-channel.md`'s claim of 83 is wrong |
| 2026-08-10 | Qalqalah letter split | قطب جد against the two letter-note batches | agent | Corrected an error in the dispatch brief: ج was assigned to the wrong batch |
| 2026-08-10 | **Arabic shaping across coloured spans** | live render in Chrome, lessons `3-01` and `3-03` | lead | **PASSES.** al-Fātiḥa 1:2 and 1:7 render fully joined with rule spans applied. `ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ` keeps its lām-alif ligature and holds ض+shadda / آ maddah / لّ+shadda together with a `madd_6` span sitting on top. 7 spans, 5 rules, `whitespaceBetweenSpans: false` in the real DOM. Isolate mode dims correctly without breaking joining. **Safari still untested** |
| 2026-08-10 | The 5 rā' isti'lā exception words | pinned corpus | agent + lead | **Resolved.** `phase-3-tajweed.md:18` asked for these to be "verified against Tanzil before use" and `:715` listed them without refs. Now pinned and verified: قِرْطَاسٍ **6:7** · إِرْصَادًا **9:107** · فِرْقَةٍ **9:122** · مِرْصَادًا **78:21** · لَبِٱلْمِرْصَادِ **89:14**. See [[Ra-Tafkhim]] |
| 2026-08-10 | Which rules lack an in-hifz-set example | counted every annotation in surahs 1 + 105–114 | lead | **Corrected a standing assumption.** Only **iqlāb (0)** and **idghām mutaqāribayn (0)** genuinely lack one. **[[Idgham-Shafawi]] has 2**, both in Quraysh 106:4, so it does *not* need the "outside your memorized surahs" label. [[Ikhfa-Shafawi]] has 1 (105:4), idghām mutajānisayn 1 (109:4), [[Madd-Lazim]] 1 (1:7) |

> **Quraysh 106:4 is the single best teaching ayah in the course.** It carries **four rules
> in one line** — two idghām shafawī (أَطْعَمَهُم مِّن، وَءَامَنَهُم مِّنْ), one ikhfāʾ
> (مِّن جُوعٍ, ج), one iẓhār (مِّنْ خَوْفٍ, خ). It exercises the entire meem trio and the noon
> quartet simultaneously, and it is inside her memorised surahs.

> **A caution recorded from tonight.** An early research agent's *summary* of
> `phase-3-tajweed.md` attributed ayah refs (9:47, 9:25) to that document which do not
> appear anywhere in it. The refs were plausible and wrong. Nothing downstream was
> affected — the gate rejects unverifiable examples, and the rā' agent independently
> found the correct ones — but it is a reminder that **a summary of a source is not the
> source.** Prefer `grep` on the file over an agent's recollection of it.

## Open — a script cannot settle these

| # | Item | Why it is stuck | Blocks |
|---|---|---|---|
| 1 | Exact Dar al-Maʿrifah hex values | the archive.org scan 503s in every attempt; needs a photographed physical copy | the Family A palette toggle only — Family B is the default and is pinned |
| 2 | Waqf-sign positions per ayah | **neither vendored dataset carries them.** The pinned Tanzil text omits waqf signs by design, and cpfair does not annotate them | the waqf-placement drill, and any in-mushaf sign rendering |
| 3 | Letter / qaida audio | ~1,493 `teacher-voice` cues are silent. Exhaustive search confirmed **no openly-licensed, full-coverage set exists**. Arabic TTS is not acceptable — it optimises for intelligibility, not makhraj, so it would teach errors | audio drills; ~20–30 min of owner-recorded audio fixes all of it with no schema change |
| 4 | يَبْصُۜطُ — sīn or ṣād | sources genuinely differ; ṣād predominates for Hafs/Shāṭibiyyah, some regional traditions read sīn | [[Hafs-Special-Words]], held at `needs-review` until checked against a Madinah mushaf **and** a licensed teacher |
| 5 | Every rule note's substance | 59 notes were authored from the research corpus and are `status: draft` | **nothing may be transcribed into a lesson until its rule note is `verified`.** The validator warns on this |

## Build state — 2026-08-10

| Sub-project | State |
|---|---|
| **L** — Library | **complete** · 164 notes, gate green |
| **B** — Qur'an pipeline | **complete** · 212 verses, 1,972 spans, 0 defects |
| **C** — Schema & renderer | **complete** · static export builds |
| **D** — Games | **complete** · 7 of 8 drills + registry wired; waqf placer blocked, see below |
| **E** — Lesson JSON | **complete** · all 59 lessons transcribed, every one `draft: true` |

411 tests · 0 lint errors · library gate green · `npm run build` succeeds.

`content/course.json` still holds exactly one phase, so none of the 59 new lesson files
is reachable by a learner. Publishing is a deliberate act: clear `draft`, then add the
phase entry — in that order, and there is a test enforcing it.

**Unit 3 is 37 lessons, not 36, as of 2026-08-11.** `3-04` is new and everything after it
shifted by one. The renumber was a single pass with a callback over library/ and content/
— 1,118 tokens across 134 files — deliberately excluding `src/` (synthetic schema
fixtures), `scripts/` (the string `"e.g. 3-06"` inside an error message) and `docs/` (the
approved spec, which is a record of what was agreed and is amended rather than rewritten).
Nothing published moved: no `3-xx` id appears in `course.json`.

### What blocks the rest, precisely

1. **Waqf-placement drill — blocked on data, not effort.** It needs per-ayah
   waqf-sign positions. The pinned Tanzil text **omits waqf signs by design** (one of the
   documented differences from quran.com's text) and cpfair does not annotate them.
   Sourcing that dataset is unresolved. Inventing it would be worse than omitting the drill.
2. **Publishing is gated on review, not on work.** All 58 lesson files exist and validate,
   but all 59 rule notes are still `status: draft` — nothing has been checked by a human
   against its sources. The 42 warnings are that backlog. The `draft` flag on every lesson
   is what lets the content exist without reaching a learner.
3. **Arabic shaping — verified in Chrome, still unverified in Safari.** jsdom does not shape
   text, so this needed a real browser. Chrome renders correctly (see the human-verified
   table above). Safari uses a different engine and remains untested; check it before any
   public launch.

## Carried forward

- **`taught_in` is now reconciled and enforced.** 32 of 59 rule notes disagreed with the
  lesson that teaches them; all were rewritten from the lesson's own `teaches[]`, and the
  gate now rejects any future drift. *(Resolved 2026-08-10.)*
- ~~**18 rules are taught by no lesson's `teaches[]`.**~~ **Resolved 2026-08-11 — and the
  assumption recorded here was false.** This entry used to say those rules were "covered
  inside broader lessons but never named, mostly the unopposed ṣifāt, which `3-02`/`3-03`
  cover as a group." **They do not cover them.** Grepping both lesson bodies found no
  mention of the fifth opposite pair or of any unopposed ṣifah — not in a heading, a drill,
  or an aside. All 18 `taught_in` values pointed at a lesson that did not teach the rule.
  What was filed as metadata drift was a **curriculum gap**. See the resolution below.
- **The hifz lesson→surah mapping in `phase-3-tajweed.md` §2.2 was built for 26 lessons.**
  Unit 3 now has **37**. It must be regenerated, not copied.

## Rule-note review — 2026-08-11

Reviewing the 59 draft rule notes started with a mechanical sweep of their frontmatter. Two
structural facts came out clean and are worth recording as verified:

| Date | What | Method | Result |
|---|---|---|---|
| 2026-08-11 | cpfair key coverage | every `cpfair_key` in the 59 rule notes diffed against `CPFAIR_KEYS` both ways | **18/18 claimed, 0 bogus.** No rule note invents a key, no dataset key is unowned |
| 2026-08-11 | ṣifah set partitions | counted the letters in each opposed pair | Every pair sums to **29**, the course's letter inventory: istiʿlāʾ 7 + istifāl 22, iṭbāq 4 + infitāḥ 25, hams 10 + jahr 19, shiddah 8 + rakhāwah 16 + tawassuṭ 5, idhlāq 6 + iṣmāt 23 |
| 2026-08-11 | noon quartet partitions | counted the letters of the four noon-sākinah rules | iẓhār 6 + idghām 4 + idghām bilā ghunnah 2 + iqlāb 1 + ikhfāʾ 15 = **28 exactly**, no letter in two rules and none missing |
| 2026-08-11 | dangling back-references | every wikilinked rule followed by "from N-NN" in a lesson body, checked against that lesson's `teaches[]` and body | **One found.** `3-33` told the student that sakt came "from 3-24", twice; `3-24` contained no mention of sakt. Fixed by teaching it — see below |
| 2026-08-11 | lesson heading vs id | every `# Lesson N` compared numerically to its frontmatter `id` | **10 mismatches.** The Unit 3 renumber matched the hyphenated `3-27`; these were written `Lesson 3.27` and survived it, leaving files whose heading and id named different lessons. Now a gate check |

### How the 18 were resolved

| Verdict | Rules | Action |
|---|---|---|
| **Genuinely taught, only undeclared** | `istitalah` (3-08) · `leen` (2-08) · `madd_leen` (3-31) · `madd_iwad` (3-35) | Added to the lesson's `teaches[]`. Each was already an objective, a drill or a table row |
| **Not taught anywhere — new lesson** | `idhlaq` · `ismat` · `safir` · `inhiraf` · `takrir` · `tafashshi` · `qalqalah-sifah` · `ghunnah-sifah` | **New lesson `3-04`.** Unit 3 renumbered 3-04…3-36 → 3-05…3-37 to free the slot |
| **Not taught, and falsely back-referenced** | `sakt` | New §3 in `3-34`, taught from nothing. The "from 3-24" claim is gone |
| **Named but deliberately not drilled** | `madd_badal` · `madd_silah` · `madd_tamkeen` · `madd_farq` | Appendix in `3-28`, with the departure from Tuhfat's farʿī list stated in the student's hearing |
| **Orientation only** | `hafs_special_words` | New §7 in `3-36` — the four one-word-only phenomena plus the ṣād/sīn words |

**Result: all 59 rules are claimed by a lesson, and no `taught_in` points at a lesson that
does not teach it.** Both conditions are now checked.

> **The methodological point, and it is the same one this log recorded on 2026-08-10.** The
> false entry above was not a research failure — it was an *inference* about what the lessons
> contained, written down next to verified facts and then read later as though it were one.
> A summary of a source is not the source, and that includes summaries of your own work.
> Every claim in the resolution table above came from grepping the lesson bodies.
## Unit 2 scope reconciliation — 2026-08-10

Checked against Phase 1 as shipped at commit `c385ad0` (15 lessons; Unit 1.4 =
`1-13`…`1-15`). Phase 1 went further than the Unit 2 plan assumed:

| Already taught in Phase 1 | Where | Consequence for Unit 2 |
|---|---|---|
| Sukūn as a closed syllable | `1-13` | `2-03`/`2-04` **extend** to multi-sukūn clusters; do not introduce |
| The five qalqalah letters, named and bounced | `1-13` | Unit 3.4 **revisits as a rule**, not as new letters |
| Hamza in all five seats; waṣl vs qaṭʿ at beginner level | `1-13` | `2-09` teaches the **full waṣl vowelling rules**, framed as "you met this in 1-13" |
| Tafkhīm sustained through the letter, **heard in the neighbouring vowel** | `1-14` | Unit 3.6 formalises the *ṣifah* behind a cue already given |
| ط bounces vs ظ is held | `1-14` | qalqalah/istiṭālah contrast already primed |
| ٱلضَّآلِّينَ with a held shadda and a six-count madd | `1-14` | shadda and madd lāzim are **previewed**; `2-05`–`2-08` systematise them |

**What remains genuinely new to Unit 2:** tanwīn (`2-01`, `2-02`) · shadda as a system
(`2-05`, `2-06`) · the three madd letters and leen (`2-07`, `2-08`) · full hamzat al-waṣl
vowelling (`2-09`) · and the application ladder — words → phrases → sentences → first
mushaf page (`2-10`–`2-14`), which is where **practical stopping** enters.

**Re-run this check if Phase 1 grows again.** It has grown once already, mid-plan.
