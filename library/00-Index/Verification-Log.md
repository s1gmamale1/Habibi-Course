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
| 2026-08-11 | **Arabic shaping across coloured spans — Safari / WebKit** | live render in Safari of al-Fātiḥa 1:6 and 1:7, each drawn twice: once split into coloured spans exactly as `TajweedText` emits them, once as one unbroken string | lead | **PASSES.** Letterforms are identical between the spanned and unspanned lines — the lām-alif ligature in وَلَا survives, and ٱلضَّآلِّينَ holds ضّ + آ + لّ together with a `madd_6` span sitting across it. **Splitting Arabic across `<span>` elements does not break shaping in WebKit.** With the 2026-08-10 Chrome result, both engines are now verified |
| 2026-08-11 | Span decoration styles, both engines | same render — comparing each span's `text-decoration` against what `UNDERLINE` intends | lead | **Found a live bug, since fixed.** `UNDERLINE.silent = "none"` was reaching `text-decoration-style`, where `none` is not a legal value, so the declaration was dropped and the style fell back to `solid` — drawing an underline under **647 of the course's 1,972 spans (33%)** that was explicitly meant to be absent. Visible as a dash beside every grey hamzat al-waṣl. See below |
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
| 3 | Letter / qaida audio | **~7,000** `teacher-voice` cues are silent across the published course. Exhaustive search confirmed **no openly-licensed, full-coverage set exists**, and Arabic TTS is not acceptable — it optimises for intelligibility, not makhraj, so it would teach errors. **DEFERRED by the owner** (twice); do not raise it as next work | audio drills only. Every cue renders as usable text, so nothing regresses while it waits |
| 4 | يَبْصُۜطُ — sīn or ṣād | sources genuinely differ; ṣād predominates for Hafs/Shāṭibiyyah, some regional traditions read sīn | [[Hafs-Special-Words]], held at `needs-review` until checked against a Madinah mushaf **and** a licensed teacher |
| 5 | ~~Every rule note's substance~~ | **Largely resolved 2026-08-11: 54 of 59 verified** against the vendored matns. The five left are `needs-review`, each blocked on a named artifact not in this vault — `madd_iwad` and `madd_tamkeen` need a tajwīd manual, `silent_letters` a muṣḥaf-convention source, `waqf_signs` the Madinah committee's own set, `hafs_special_words` the يَبْصُۜطُ ruling | the gate's 5 remaining warnings |

## Build state — 2026-08-11

> **This section was rewritten on 2026-08-11.** It previously described one published
> phase and 59 draft lessons — a state that no longer exists. Numbers here are the ones
> the gates actually print; if they drift again, trust the gate, not this table.

| Sub-project | State |
|---|---|
| **L** — Library | **complete** · **182 notes**, gate green |
| **B** — Qur'an pipeline | **complete** · 212 verses, 1,972 spans, 0 defects |
| **C** — Schema & renderer | **complete** · static export builds |
| **D** — Games | **complete** · 7 of 8 drills + registry wired; waqf placer blocked, see below |
| **E** — Lesson JSON | **complete** · all **74 lessons published**, none `draft` |

**417 tests · 0 lint errors · library gate 0 errors / 5 warnings · `npm run build`
succeeds (230 static pages) · `npm audit` 0 vulnerabilities.**

**`content/course.json` holds all four phases and 74 lessons are reachable.** Publishing
remains a deliberate two-step — clear `draft`, then add the phase entry, in that order —
and the test that enforces it is still what makes the order real rather than a convention.

**Rule notes: 54 of 59 verified.** The remaining five are `needs-review`, each blocked on a
named artifact that is not in this vault — not on unfinished work here.

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
2. ~~**Publishing is gated on review, not on work.**~~ **Resolved 2026-08-11.** All 74
   lessons are published and 54 of 59 rule notes are verified against the vendored matns.
   The 5 remaining warnings are the five `needs-review` rules, each with its blocker named
   in the table above.
3. ~~**Arabic shaping — verified in Chrome, still unverified in Safari.**~~ **Resolved
   2026-08-11. Both engines verified.** Safari renders spanned and unspanned Arabic
   identically; see the human-verified table.

   > **The check was worth running for a reason it was not designed to find.** Shaping was
   > fine in both engines — but rendering the same āyah twice, spanned against plain, put a
   > stray dash next to every grey hamzat al-waṣl in plain sight. `UNDERLINE.silent = "none"`
   > was being passed to `text-decoration-style`, where `none` is not a legal value, so it
   > was **silently inert**: the declaration was dropped and the style fell back to `solid`,
   > drawing the underline it was written to remove. A third of all spans in the course,
   > wrong in both Chrome and Safari, for as long as the renderer has existed.
   >
   > Nothing would have caught it. It breaks no schema, fails no test, throws no CSS error —
   > an invalid value in an inline style is simply ignored. It was only visible because the
   > page put the correct rendering next to it. **A control is not just for the thing you
   > are testing.**

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
- ~~**The hifz lesson→surah mapping in `phase-3-tajweed.md` §2.2 was built for 26 lessons.**~~
  **Resolved 2026-08-11, and it was never a defect in shipped content.** The stale table lives
  in a **superseded planning document** — one that also drew its Arabic from quran.com's
  `text_uthmani` rather than the pinned Tanzil snapshot, so nothing in it may be copied
  forward on two independent counts. It now carries a do-not-build-from banner.
  **The live map — the `hifz:` field on each Unit 3 lesson note — was already correct.**
  Audited against the corpus: all **55 āyāt** of the eleven hifz surahs assigned, **no gaps,
  no duplicates, none spanning a surah boundary**. Now enforced by `check-library`, proved by
  dropping a range (caught) and by duplicating one (caught).

  > **Worth noting how close this came to wasted work.** The entry above said the map "must be
  > regenerated", and it was carried into the ROADMAP as a High-severity blocker on publishing
  > Unit 3. Regenerating it would have meant rewriting 37 correct `hifz:` fields from a stale
  > 26-lesson table — replacing good data with bad. **The check that cost two minutes was
  > asking whether the defect was real before acting on the record of it.**

## Unit 1 brought into the vault — 2026-08-11

**All 74 live lessons now have a library note.** Unit 1's fifteen predated the vault and were
the only reachable content outside the review process; they are now inside it.

**The direction is inverted for these fifteen, and each note says so in its own banner.**
Everywhere else the note is the source and `content/lessons/` is transcribed from it
(ADR-003). Unit 1 shipped first, so the JSON is the source and the note is a record of it —
**editing a note does not change the lesson.** A reader who assumed the usual direction would
edit the note and expect the deck to follow.

| Date | What | Method | Result |
|---|---|---|---|
| 2026-08-11 | Live-lesson coverage | every id in `content/course.json` checked against the vault's lesson notes | **74 of 74.** No live lesson is outside the review process |
| 2026-08-11 | Unit 1 example aptness | each example read back against its own `note:` claim | **6 of 45 were wrong** — see below |

### Six wrong examples, none of which the gate could have caught

The gate verifies that a quoted word occurs **verbatim in the cited āyah**. These notes are
generated by slicing the corpus at a word index, so the quotation always verifies — what was
wrong was the note's *claim about it*:

- `قُلْ` cited for "a **د** that refuses to join forward" — it has no د
- `بِسْمِ` cited for "a sukūn on the **ل**" — its sukūn is on the س
- `ٱلصِّرَٰطَ` cited for "a **fatḥa** on a heavy ص" — the ص carries a kasra
- `يَجْعَلْ` cited for "a heavy letter and a shadda" — it has neither
- `أَنْعَمْتَ` and `أَلَمْ` cited for "fatḥa and nothing else" — both carry sukūns, which
  1-10 has not taught and will not until 1-13

Each was replaced by **searching the corpus for words that actually satisfy the stated
criterion** — a mid-word non-joiner, fatḥa-only with no sukūn or shadda, kasra-and-ḍamma
together, heavy-letter-with-shadda — rather than choosing by eye and checking afterwards.

> **The rule worth keeping.** *A gate that checks a quotation is faithful does not check that
> the quotation is apt.* Verbatim-ness is mechanical and fully automated here; aptness is a
> claim about **why** the example was chosen, and it can only be checked by reading the
> example back against its own description. Two of the six were also pedagogically wrong —
> they used a mark from three lessons in the future — which no purely textual check could
> ever detect.

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
| 2026-08-11 | plain-language landing, published lessons | every lesson id in `content/course.json`, checked for a landing marker in its teaching sequence | **All 29 pass.** Unit 2 went live with 0 of 14 and now carries 27 landings across the unit. Gate proved in both directions: stripping the markers from `2-12` errors; `3-05`, unpublished and without one, stays silent |

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

### Content verification against the matn — Tuhfat chapters 1–5

**14 rule notes promoted `draft` → `verified` on 2026-08-11.** Each was checked claim by
claim against the vendored [[Tuhfat-al-Atfal]], verse by verse.

| Rule | Verses | What was checked |
|---|---|---|
| [[Izhar-Halqi]] | 7–8 | six throat letters, and their order |
| [[Idgham-Maal-Ghunnah]] | 9–11 | يَنْمُو, **and the same-word exception** — the matn names دنيا and صنوان; the note carries the full four |
| [[Idgham-Bila-Ghunnah]] | 12 | ل and ر |
| [[Iqlab]] | 13 | ب only; converted to meem **with ghunnah and concealment**, all three parts |
| [[Ikhfa-Haqiqi]] | 14–16 | fifteen letters, derived from the mnemonic's word-initials |
| [[Ghunnah]] | 17 | meem and noon mushaddadatān |
| [[Ikhfa-Shafawi]] | 20 | before ب; the name *shafawī* |
| [[Idgham-Shafawi]] | 21 | meem into meem; the name *idghām ṣaghīr* |
| [[Izhar-Shafawi]] | 22–23 | the remaining letters, **and the wāw/fāʾ warning** — the one detail of this chapter most often dropped |
| [[Lam-Qamariyyah]] | 24–25, 28 | fourteen letters |
| [[Lam-Shamsiyyah]] | 26–28 | fourteen letters |
| [[Idgham-Mutamathilayn]] | 30 | same makhraj **and** same ṣifāt |
| [[Idgham-Mutajanisayn]] | 32–33 | same makhraj, **different** ṣifāt |
| [[Idgham-Mutaqaribayn]] | 31–32 | makhārij merely close |

**The last three are the ones worth having checked.** Mutajānisayn and mutaqāribayn are
routinely stated the wrong way round; all three notes match the matn.

**Derived versus read — and the distinction matters.** A letter set counts as *derived* only
when a script can pull it out of the verse text itself: يَنْمُو, whose letters are the set;
the ikhfāʾ line, whose word-initials are; the two lām mnemonics. Where the matn names its
letters in words — *"hamza, then hāʾ, then ʿayn…"* (v.8), *"into lām and rāʾ"* (v.12),
*"before the bāʾ"* (v.13) — no script can extract them without the answer being encoded
first, which would compare the note against the checker's belief instead of the source.
Those three were read by eye against the quoted verse and are labelled as such.

> **A first pass of this check was itself wrong, in exactly the way this log keeps warning
> about.** The verse lookup matched against the whole file, and the commentary at the top of
> the source note contains a *Chapter structure* table whose rows are also numbered 1–8 — so
> `verse(8)` silently returned a chapter heading. Worse, four of the five letter sets were
> typed into the checker by hand, so those comparisons tested the notes against my own
> recollection and would have passed whatever the matn said. Only the ikhfāʾ check was real.
> Both faults were visible only because the script printed the verse it had matched. **Print
> the source you actually read, not just the verdict.**

**Chain of custody, stated plainly.** [[Tuhfat-al-Atfal]] is itself `status: needs-review`:
its retrieved Arabic carries documented vocalisation defects. That does not block this pass —
the source note records the text as sound for *structure, chapter order and mnemonics*, which
is precisely what a rule's letters and conditions are — but **no note here is verified beyond
the reliability of that transcription.** Collating the matn against a printed critical edition
remains open, and would upgrade rather than overturn these fourteen.

**A divergence worth recording, not fixing.** The mnemonics in the rule notes differ from the
vendored matn in vocalisation only — the note has رُحْمًا where the retrieved text has
رَحِماً, ظَنٍّ against ظَنٍ, ابْغِ against إِبْغِ. Consonantal skeletons are identical, so no
rule is affected, and in at least the first case the **note appears to carry the better
reading** while the matn shows one of its own documented defects. Neither was changed. This is
what the printed critical edition is needed to settle.

### The rest of the matn — Jazariyyah, and the final tally

**51 of 59 rules are `verified`.** The ṣifāt went through the same derive-from-the-verse
treatment as the ikhfāʾ mnemonic: al-Jazariyyah v.20–26 encodes each set as a phrase whose
*letters are the set*, so the phrase is pulled from the verse, stripped of diacritics, and its
letters are the answer. All seven multi-letter sets agree; the six single- and double-letter
ṣifāt are named outright in v.23–26.

Two independent cross-checks, both clean:

- **Every opposed pair exhausts the 29-letter inventory.** v.20 defines five of the ten sets
  only as *"and for the rest, say the opposite"*, so a wrong count anywhere leaves a pair that
  does not sum. None does.
- **The two matns overlap on ghunnah and the meem sākinah** — Jazariyyah v.62–64 against
  Tuhfat v.17–23, including the wāw/fāʾ warning in both. They agree with each other and with
  the notes.

Also verified from Jazariyyah: qalqalah's two degrees (v.39), the rāʾ rulings with both
conditions on tarqīq (v.41–42), the *firq* disagreement (v.43), lām al-jalālah (v.44), waqf
types (v.74–78), hamzat al-waṣl (v.101–103), the open tāʾ (v.94–100) and rawm/ishmām
(v.104–105).

### Three source attributions that do not hold

Checking notes against their *cited* source — rather than against the claim — turned up three
citations that cannot support what they are attached to. **None is a content error; every
statement involved is standard.** What is missing is a source in this vault that says so.

| Note | Cited | What the source actually contains |
|---|---|---|
| [[Hamzat-Wasl]] | Tuhfat **and** Jazariyyah | Tuhfat has **zero** mentions of hamzat al-waṣl, and its own v.3 scopes the poem to *"the noon, the tanwīn, and the madds"*. Jazariyyah v.101–103 does cover it. **Fixed** — the Tuhfat citation was dropped and the note is verified on Jazariyyah alone |
| [[Silent-Letters]] | Jazariyyah | Supports §1 (hamzat al-waṣl) only. الصفر / المستدير / المستطيل — the two zeros of §2 and §3 — occur **nowhere** in the matn. They are modern Uthmānī *printing* convention. **Now `needs-review`** |
| [[Waqf-Signs]] | Jazariyyah | **Zero** of م، لا، ج، صلى، قلى، س appear in it. Jazariyyah ch. 13 gives the waqf *types*, which is a different note. ~~Ibn al-Jazarī died 833 AH, about five centuries before this sign set.~~ **That clause was wrong — see the correction below.** Source now supplied: [[Sajawandi-Waqf]] |

> **This is the check that a claim-by-claim pass misses.** Each of these three notes states
> things that are true, so reading them against what you already know produces a clean bill.
> The defect only appears when you ask the narrower question — *does the document named in
> `sources` contain this?* — and grep for the terms in the cited file. Two of the three were
> caught by a `grep -c` returning 0.

### Correction — the waqf signs are older than this log claimed

**Recorded 2026-08-11, correcting an entry written the same day.**

[[Waqf-Signs]] and lesson `3-34` both attributed the sign set to "Shaykh Muḥammad ibn ʿAlī
Khalaf al-Ḥusaynī *al-Hamadhānī* (d. 1357 AH)". I did not verify that attribution. I
**reasoned from it** — if the signs are 1357 AH and Ibn al-Jazarī died 833 AH, the signs
must postdate him by about five centuries — and wrote that inference into this log and into
the ROADMAP hotlist as though it were a finding.

**It is backwards.** The signs come from **[[Sajawandi-Waqf|as-Sajāwandī]], d. 560 AH**, who
assigned م ط ج ز ص لا to the degrees of stopping. That is **273 years *before*** Ibn
al-Jazarī. The system is older than al-Jazariyyah, not newer.

Two further things fell out of checking it:

- The 1357 AH figure appears to belong to **al-Ḥaddād al-Ḥusaynī** (1865–1939 CE), who wrote
  out the 1924 Cairo muṣḥaf by hand and standardised modern printed usage — a real role, but
  not devising the symbols. Whether "al-Hamadhānī" is a garbled form of his name is **not
  established**; it is flagged as unverified rather than silently corrected.
- Lesson `3-34` presented **ط ز ص** as "the Indo-Pak variant". They are **al-Sajāwandī's
  originals**; the Madinah set's صلى and قلى are the adaptation. The lesson had the
  relationship inverted, and taught it that way on the board. Now fixed, and the inversion is
  now the interesting part of the section rather than an error in it.

> **The lesson, stated plainly because it is the third time this log has recorded it.** An
> unverified attribution sitting in a note is inert. The damage happens when you *reason from
> it* — the conclusion inherits none of the original's uncertainty and reads like a finding.
> Both earlier instances were someone else's summary; this one was mine, written into the same
> paragraph that warns against it. **Check the premise before you build on it, especially when
> the inference feels tidy.**

### What remains, and why each one is stuck

| Rule | Status | Blocker |
|---|---|---|
| `sakt` | draft | In neither matn. Ḥafṣ-specific, transmitted via ash-Shāṭibiyyah, which is not vendored |
| `madd_iwad` · `madd_silah` · `madd_tamkeen` · `madd_farq` | draft | Tuhfat's madd chapters do not name them; Jazariyyah gives madd four verses (v.69–72) and covers only lāzim, wājib and jāʾiz. A fuller madd source is needed |
| `silent_letters` · `waqf_signs` | needs-review | No vendored source for muṣḥaf marking conventions — see the table above |
| `hafs_special_words` | needs-review | يَبْصُۜطُ (2:245) and بَصْۜطَةً (7:69): sources genuinely differ on ṣād against sīn. Open item 4 |

**All eight need a source this vault does not have.** They are not blocked on effort, and no
amount of re-reading the two vendored matns will settle them — which is the useful thing to
know about them.
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
