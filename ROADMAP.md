# Habibi Course — Roadmap

A self-paced Arabic reading and tajweed course: **74 lessons live across four phases**, from the alphabet to the tajweed rules to the Kalimas. Content is written twice — as a reviewable markdown note in `library/04-Curriculum/`, then transcribed to JSON in `content/lessons/` — and every Qurʾānic string is sliced from a pinned Tanzil snapshot rather than typed.

This ROADMAP is the single source of truth for what to build next. The detailed evidence behind every claim here lives in `library/00-Index/Verification-Log.md`.

**Built state — 2026-08-12**

| | |
|---|---|
| Live to a learner | **All four phases — 74 lessons.** 1 *Letters & Sounds* (15) · 2 *Reading Mechanics* (14) · 3 *Tajweed* (37) · 4 *The Kalimas* (8) |
| Authored but unreachable | **None.** No lesson file is `draft` anywhere in the repo |
| Library | **183 notes** — every one of the 74 live lessons has a reviewable note |
| Rule notes | 59 total — **56 verified** against vendored sources, 3 `needs-review`, each naming the specific artifact still needed |
| Gates | 900 tests · 0 lint errors · library 0 errors / 3 warnings · **CI green on GitHub Actions** |

> **Phases 1–4, 7 and 8 are complete, and Phase 5 is closed by decision.** The course is fully reachable, the drills now remember, and every tongue letter has its own makhraj diagram. Phases 1–4 were *content*; Phase 8 (2026-08-12) shipped the practice engine — ledger, FSRS scheduling, session assembly, and a session screen a learner can actually reach — and Phase 7 closed the last fixable gaps. **Phase 5 (audio) is skipped, not parked:** the owner decided on 2026-08-12 not to do the recording work, so every qāʿidah cue stays as written text and `TapToHear`'s "practice live with your teacher" is the permanent answer rather than a placeholder. **The hotlist is clear.** What remains is Phase 6's two outside-world items — both blocked on artifacts that may never exist — and two owner requirements in `WISHLIST.md`: the mandatory end-of-lesson check and sound effects.

---

## How to read this

- **Phases are ordered by value/effort**, with cross-phase prerequisites called out.
- **Effort** is S (≤½ day), M (1–2 days), L (3–5 days), XL (>1 week).
- Confirmed defects are fixed before new feature phases.
- "Blocked on the world" means no amount of work in this repo resolves it — a source, a recording or a dataset has to come from outside. **Use it only after going to look.** On 2026-08-11 two rules recorded under this heading turned out to need a public-domain manual that had been freely readable the whole time; the true statement had been the much narrower *"the sources we happen to have vendored do not cover this."* Those are not the same claim, and only one of them is a reason to stop.

---

## Confirmed defects to fix first (hotlist)

| # | Sev | Defect | Where | Effort |
|---|-----|--------|-------|--------|
| 1 | ~~High~~ | ✅ **CLOSED 2026-08-11 — never a live defect.** The stale 26-lesson table is in a **superseded planning doc**, now banner-marked; the live hifz map is the `hifz:` field on each lesson note and was **already correct**. Audited against the corpus: all **55 āyāt** of the eleven hifz surahs assigned, **no gaps, no duplicates, none spanning a surah**. Now gate-enforced, proved in both directions. | `docs/syllabus/phase-3-tajweed.md` (superseded) · `scripts/check-library.mjs:151` | — |
| 2 | Med | ~~`silent_letters` and `waqf_signs` cite Jazariyyah for content it does not contain.~~ **`waqf_signs` resolved 2026-08-11** — sourced to [[Sajawandi-Waqf]] (d. 560 AH). The "~5 centuries after Ibn al-Jazarī" clause in this row was **my own unverified inference and was wrong by 273 years in the other direction**; see the Verification-Log correction. `silent_letters` still unsourced, **but the blocker is now a named public-domain book rather than a void** *(narrowed 2026-08-11)*: the zeros belong to **ḍabṭ**, not tajwīd, and the classical line was located in al-Kharrāz (d. 718 AH) — see the Phase 2 addendum. | `library/02-Rules/Silent-Letters.md` | S (needs a legible scan of متن الذيل في ضبط القرآن) |
| 3 | ~~Med~~ | ✅ **CLOSED 2026-08-11.** All **74 live lessons** now have a library note — nothing reachable sits outside the review process. Unit 1 notes are *reconstructed from* the shipped JSON, the inverse of ADR-003, and each says so: editing the note does not change the lesson until Unit 1 is re-authored note-first. | `library/04-Curriculum/Unit-1-Letters/` | — |
| 4 | ~~Low~~ | ✅ **CLOSED 2026-08-11.** Safari verified — spanned and unspanned Arabic render identically, ligatures intact. **The check also surfaced a live rendering bug it was not looking for:** `UNDERLINE.silent = "none"` reached `text-decoration-style`, where `none` is illegal, so it fell back to `solid` and underlined **647 of 1,972 spans (33%)** in both engines. Fixed, test-first. | `src/components/tajweed/TajweedText.tsx` | — |

---

## Phase 1 — Land the jargon in every lesson a student can reach ✅ **DONE 2026-08-11**

> **Delivered.** 27 landings across the 14 Unit 2 notes; 2 added to lesson JSON where a slide genuinely trailed off. The gate is scoped to lessons listed in `content/course.json` and proved in both directions. Two decisions worth carrying into Phase 3: the check requires **one landing per lesson, not per teaching point** — a per-point counter forces filler into the procedural lessons — and the JSON was **not** mechanically mirrored from the notes, because it was already authored student-facing and most slides already ended on a plain line.

**Goal.** No live lesson leaves a beginner holding an Arabic technical term she was never given in ordinary words.

**Deliverables.**
- A plain-language landing in all 14 Unit 2 library notes and their transcribed JSON
- A `check-library` rule that fails a non-`draft` lesson whose teaching sequence has no landing
- The rule's evidence line added to `library/00-Index/Verification-Log.md`

**Why now.** Unit 2 went live today with **0 of 14** lessons carrying a landing — they were authored before the rule existed. Phase 3 is 4 of 37. This is the only item on the list that degrades content a student is reading *right now*, and it is cheap.

**Scope.**
- Read `.claude/skills/writing-tajweed-lessons/SKILL.md` — the landing is a fixed three-part shape and its placement after the examples is load-bearing, not stylistic
- For each of `library/04-Curriculum/Unit-2-Reading-Mechanics/2-01`…`2-14`, add 1–2 lines after the examples of each teaching point
- Re-transcribe the affected `content/lessons/2-*.json` `slides[].body` entries from the notes
- Add the gate check next to the heading/id check at `scripts/check-library.mjs:87`
- Prove the check bites by removing one landing and watching it fail, per the log's standing practice

**Findings + recommendation.** The rule was micro-tested before being trusted: with the skill removed from disk, 0 of 3 agents produced a landing at full technical depth; with it present, 3 of 3 did. It does not emerge on its own. The first control round was invalid because the skill's own description matched the task and the "controls" loaded it — park the directory before any future baseline.

**Risks.** Backfilling 14 lessons at once invites formulaic landings that restate the technical account instead of translating it. Mitigation: the skill's own failure table names this ("landing that runs to a paragraph → the technical layer above is unclear; fix that instead"). Review a sample of 3 against it before doing the remaining 11.

**Definition of done.** `npm run check:library` exits 0 with the new rule active; every non-draft lesson note contains a landing marker; a deliberately removed landing turns the gate red.

---

## Phase 2 — Source the eight rules the vendored matns cannot settle ✅ **DONE 2026-08-11, as far as sources allow**

> **Delivered.** Ash-Shāṭibiyyah vendored in part (public domain, d. 590 AH); `sakt`, `madd_farq` and `madd_silah` verified from it; **54 of 59** rules now verified. Two counts in those notes turned out **not** to be in the matn and now say so — v.830 calls the sakt only *"a light one"*, and v.192 gives no number for farq, whose 6 is derived rather than transmitted.
>
> **Reopened and carried further on 2026-08-11 — see the addendum below.** The five left at the end of the first pass were recorded as blocked on the outside world. Two of them were not.

### Phase 2 addendum — a fourth source, and a lesson about the word "blocked"

> **Delivered.** [[Nihayat-al-Qawl-al-Mufid]] vendored as **excerpts** — al-Juraysī, d. c. 1322 AH / 1902 CE, public domain, a prose encyclopedia compiled from twenty-four earlier works and carrying a **twenty-item enumerated madd taxonomy**. `madd_iwad` and `madd_tamkeen` are now **verified**, and `madd_farq`'s 6 counts move from *derived* to *transmitted*. **56 of 59 rules verified**, gate warnings 5 → 3.
>
> **Three findings worth carrying forward.**
>
> **1. The blocker was mis-stated, and that cost time.** Phase 2 recorded these two as needing *"a tajwīd manual that states it as a rule"* — then filed them under blocked-on-the-world. Such a manual was public domain, scanned, and one search away. The accurate claim had always been the narrower *"the three matns we vendored do not cover this."* The roadmap's own definition of "blocked on the world" now says: go and look first.
>
> **2. A rule name can mean two different things.** The source's own heading **مد العوض** is *not* this course's madd al-ʿiwaḍ — it is the hāʾ al-kināyah compensating a yāʾ deleted by a jussive (يُؤَدِّهِۦٓ إِلَيْكَ). Our rule is attested on a different page, under no name at all. Citing the heading would have looked correct and been wrong.
>
> **3. OCR locates; only the scan verifies.** The Internet Archive text layer made the passages findable, and it is visibly corrupt inside those very passages — `كتاية` for `كناية`, `الد` for `المد`. **Every citation was read off the page image before it was written down**, which is also how the page number for one of them was caught as a guess and then confirmed. Same discipline as the Shāṭibiyyah checker that matched chapter headings.
>
> **The three that remain** were each re-checked in this pass rather than carried forward on assumption:
>
> - **`silent_letters` — the shelf was wrong, and the right one is named.** Al-Juraysī was searched directly and does not treat the zeros at all: marking the muṣḥaf is **ḍabṭ**, a different discipline from tajwīd. The classical ancestor was located in **al-Kharrāz** (d. 718 AH, public domain) — a circle, *dārah*, for a letter written but added — **but only in degraded OCR of a modern in-copyright commentary**, and the one full scan reachable was OCR'd with a Latin-alphabet model and holds zero Arabic characters. Needs a legible **متن الذيل في ضبط القرآن**.
> - **`waqf_signs` — confirmed unsettleable by any classical source, which is the point.** Nothing credits صلى and قلى to anyone, because they are an editorial decision of a particular printing rather than a transmitted ruling. Its honest end state is a correct citation to the muṣḥaf's own legend with no vendored text, once the target edition is fixed.
> - **`hafs_special_words` — unchanged.** A lead surfaced showing both readings are transmitted, which the note already says; it does not say which Ḥafṣ reads. Still needs a physical Madinah muṣḥaf and a licensed teacher.

**Goal.** Every rule taught by a lesson is verified against a source in this vault, or is explicitly and visibly reference-only.

**Deliverables.**
- A vendored, licence-checked source covering the Ḥafṣ specialities (`sakt`) and the secondary madds
- A cited source for muṣḥaf marking conventions — the two zeros, and the waqf sign set
- `sakt`, `madd_iwad`, `madd_silah`, `madd_tamkeen`, `madd_farq` promoted to `verified`
- A resolution or a recorded standing disagreement for يَبْصُۜطُ

**Why now.** These eight are the entire remaining gap between 51/59 and 59/59, and **four Unit 3 lessons teach them** — `3-28`, `3-34`, `3-35`, `3-36`. Phase 3 cannot publish cleanly until they are settled, so this gates the largest block of content in the project.

**Scope.**
- Ash-Shāṭibiyyah (*Ḥirz al-Amānī*) covers sakt and the fuller madd taxonomy; confirm public-domain status and vendor it as `library/01-Sources/Classical/Shatibiyyah.md`, following the provenance table format already used in `Tuhfat-al-Atfal.md:32`
- For muṣḥaf conventions, the King Fahd Complex's own published legend is the primary source; a vendored citation note may be all that is licensable
- Verify each rule claim-by-claim against the new source and print the verse actually matched — see the log's warning about a checker that returned chapter headings
- يَبْصُۜطُ needs a Madinah muṣḥaf **and** a licensed teacher; if unresolved, keep it `needs-review` and leave the lesson's "do not settle this at the whiteboard" instruction in place

**Findings + recommendation.** Neither vendored matn covers these. Tuhfat scopes itself in its own v.3 to *"the noon, the tanwīn, and the madds"*; al-Jazariyyah gives madd four verses (v.69–72) covering only lāzim, wājib and jāʾiz. Re-reading either will not help — this is acquisition work, not analysis. **Recommend Shāṭibiyyah first**: it settles five of the eight in one source.

**Risks.** The muṣḥaf-convention source may not be licensable for vendoring. Mitigation: a citation-only note with no vendored text is acceptable — that is already the policy for in-copyright works — and moves both rules from "wrong citation" to "correct citation, no full text".

**Definition of done.** `npm run check:library` reports **0 warnings**; every rule note is `verified` or carries a `needs-review` block naming the specific external artifact required.

---

## Phase 3 — Publish Unit 3, the tajweed spine ✅ **DONE 2026-08-11**

> **Delivered.** 66 lessons reachable, up from 29. `checkpoint-3.json` transcribed; 66 landings across all 37 notes; the hifz prerequisite closed as a non-defect (see hotlist #1). Two gate holes found and closed on the way: the landing check only read `## Teaching sequence`, so the Part A/B revision lessons slipped past it, and it caught a landing of mine that had been inserted into the wrong section at publish time.
>
> **Carried into Phase 4:** Unit 4 has **no checkpoint note** — `Checkpoint-2.md` and `Final-Checkpoint.md` exist, nothing for the Kalimas. The phase schema requires one, and the course-map test now enforces that it resolves to a file, so Phase 4 must author it or reuse `checkpoint-3`.

**Goal.** A learner who passes Checkpoint 2 can walk the whole tajweed syllabus without leaving the app.

**Deliverables.**
- `content/checkpoints/checkpoint-3.json`, transcribed from `library/04-Curriculum/Unit-3-Tajweed/Final-Checkpoint.md`
- A regenerated hifz map for 37 lessons (hotlist #1)
- `draft` cleared on `content/lessons/3-*.json`, then the phase 3 entry in `content/course.json`
- Landings in all 33 Unit 3 notes still missing one

**Why now.** It is the largest authored-but-unreachable block in the project — 37 lessons, already validated and building — and everything after it depends on it.

**Scope.**
- Prerequisites: **Phase 1** (landings) and **Phase 2** (the eight rules) both complete
- Regenerate the hifz mapping against the current 37-lesson Unit 3; do not copy the 26-lesson table
- Transcribe the final checkpoint, following `content/checkpoints/checkpoint-2.json` for shape
- Publish in the enforced order: clear `draft` on every file, **then** add the map entry — `src/content/allContent.test.ts:11` fails in between, which is the point
- Confirm `/checkpoint/checkpoint-3` appears in the export, per `src/content/allContent.test.ts:52`

**Findings + recommendation.** All 37 lessons already parse, validate and build; none is blocked on code. The remaining work is content review and two data artifacts. **Publish as one phase, not in slices** — the unit's revision lessons (`3-09`, `3-14`, …) assume the lessons they revise are reachable.

**Risks.** Publishing 37 lessons at once means a single bad hifz assignment reaches every session in the unit. Mitigation: hotlist #1 is a prerequisite, not a parallel task.

**Definition of done.** `content/course.json` holds 3 phases; 66 lessons reachable; `npm test` green; `/checkpoint/checkpoint-3` in the static export; library gate 0 errors and 0 warnings.

---

## Phase 4 — Publish Unit 4, the Kalimas ✅ **DONE 2026-08-11**

> **Delivered.** All **74 lessons reachable across 4 phases**; no lesson file is `draft` anywhere in the repo. The ayah-slide guard ships and was verified by injecting one into 4-01. Landings in all 8 notes.
>
> **The checkpoint question resolved itself from the notes.** Reusing `checkpoint-3` would have been wrong — it tests unseen pages, hifz and colour muṣḥaf, none of which touches the Kalimas. But 4-01 states Unit 4 is *optional* relative to the four end goals, and 4-08 states the unit is assessed "**not by a test**, but by the rule-spotting pass in Drill 1". So `checkpoint-4` **is** that pass, given a page, and says outright that it is not a gate and has no fail outcome — only COMPLETE and CONTINUE. The schema's requirement is satisfied without inventing a gate the design deliberately declined to have.

**Goal.** The six Kalimas and the two declarations of faith are reachable, and are never presented as Qurʾānic text.

**Deliverables.**
- `draft` cleared on `content/lessons/4-*.json` and the phase 4 map entry
- A test asserting no Unit 4 slide uses `kind: "ayah"`

**Why now.** Small, self-contained, and the natural close of the course. It sits here only because `4-01` declares `prerequisites: ["3-37"]` — it cannot ship before Phase 3.

**Scope.**
- Prerequisite: **Phase 3** complete
- Add the ayah-slide guard to `src/content/allContent.test.ts`, scoped to `phase === 4`
- Publish in the enforced order, as Phase 3

**Findings + recommendation.** Unit 4 teaches no rules at all — every lesson's `teaches[]` is empty — so it is unblocked by rule verification entirely. Its one real hazard is representational.

**Risks.** The Kalimas are creedal formulae, not Qurʾān. An `ayah` slide would present them as revelation, and **nothing currently catches it** — it fails no test and renders perfectly. Mitigation: the guard is a deliverable of this phase, not an afterthought.

**Definition of done.** 4 phases live, 74 lessons reachable, and the ayah-slide guard fails when a Unit 4 slide is switched to `kind: "ayah"`.

---

## Phase 5 — Audio 🚫 **RECORDING SKIPPED by the owner, 2026-08-12**

> **Owner decision, 2026-08-12: skip the recording work.** Not deferred pending a
> better moment — **skipped**. Nothing in this phase that requires someone to record
> audio is scheduled, and it should not be surfaced as next work or quietly revived
> by a later sweep. That covers the owner's own recording *and* the 723-cue
> qāʿidah recording job below, which was the irreducible remainder either way.
>
> **What the decision does not touch**, because none of it involves recording: the
> whole-Qurʾān word audio (link-only, already usable), the CC-BY letter video set,
> and the licence findings. Those stay documented and available if anyone ever
> wants them — the research below is kept for that reason, not as a to-do list.
>
> **Consequence worth stating plainly:** every qāʿidah cue stays as written text.
> `TapToHear`'s `teacher-voice` tier already says so on screen — *"No recording
> exists for this item — practice live with your teacher"* — which was designed as
> a placeholder and is now the permanent behaviour. That is a coherent answer for a
> course built around a live teacher at the checkpoints; it is not a gap left open.

> **Earlier status, kept because it corrects the record.** This was once "deferred, and
> nothing exists anyway". The 2026-08-11 sweep found that framing wrong in three places,
> and those corrections stand on their own even now that the recording work is skipped —
> in particular, *"no openly-licensed set exists"* was simply untrue.

**Goal.** A student practising alone hears a correct human articulation instead of reading an instruction about one.

### Three corrections to what this phase used to claim

**1. "~7,000 silent cues" was never the size of the job.** Measured: 6,966 cues carry only
**1,635 distinct payloads** (4.3× reuse). They split four ways, and each needs a different
answer:

| Group | Distinct | Answer |
|---|---|---|
| Qurʾānic words | 254 exact / **575** normalised | **Solved** — whole-Qurʾān word CDN, ~1.09 s/word, link-only |
| Base letters | ~29 | **A complete CC-BY video set exists** — 28 of 29 verified |
| Letters × harakat | 213 | ~29 servable; **Commons holds zero audio for any harakah** |
| Joining drills | 510 | **Nothing.** بت، تب، كل — TTS rejected for these |
| Ordinary vocabulary | 535 | **7.7%** open coverage |

**The irreducible recording job is the 723 letters and syllables** — not seven thousand.

**2. "No openly-licensed set exists" was too broad.** Three usable things were found: a
complete 29-letter **CC-BY** video series (re-hostable), whole-Qurʾān word audio (link-only),
and an MIT-licensed 28-letter set (letter *names*, likely the wrong form).

**3. "Arabic TTS was evaluated and rejected" was too coarse — the verdict differs per group.**
Reject for the 723 qāʿidah cues, on a better argument than makhraj: **a bare 1–3 character
input is out-of-distribution for every TTS system**, and the model may speak the letter's
*name* rather than its sound. But **English instructional narration is unobjectionable**, and
the 535 ordinary words are a conditional yes pending a ~20-word probe.

### What used to block it *(no longer a blocker — the phase is not being pursued)*

**Nobody had listened to a single file.** Every finding rests on metadata and licence text.
The next step would have been small and needed an ear, not an agent: **audition the 29 CC-BY
letter videos**, and get written confirmation from the channel before re-hosting — YouTube's
CC tag is self-declared, and the sweep found a live example of a re-upload wearing one. Kept
because that caveat still applies to anyone who picks this up later.

### Constraint discovered, worth knowing before anything is built

**Both Qurʾān audio sources are non-commercial only** — EveryAyah by CC BY-NC 2.5 Canada
(recovered from a 2012 Wayback capture, verified), Quran.com by its own terms. Free course:
fine, link-only with attribution. **Monetised: both barred.**

**Definition of done — superseded 2026-08-12.** It used to read: *the letter set has audio in
the published phases, and every remaining silent cue is one a reviewer has deliberately left
as text.* The owner's decision settles the second half for every cue at once and removes the
first, so this phase has no open definition of done. It closes as a **deliberate, dated
decision not to do the work**, which is exactly what Phase 6's own standard asks for.

---

## Phase 6 — Close the verification gaps that need the outside world

**Goal.** Nothing in the vault is verified-by-assumption.

**Deliverables.**
- ✅ **DONE 2026-08-11 —** Safari shaping verification recorded in the log's human-verified table (hotlist #4)
- Waqf-sign position data, or a written decision to ship without the placement drill
- Dar al-Maʿrifah hex values sampled from a physical muṣḥaf, or Family A withdrawn

> **1 of 3 delivered; the two that remain are blocked on the world, not on effort.** Both need an artifact that does not exist in any vendored dataset — a waqf-position source and a photographed muṣḥaf. Neither blocks a learner: Family B is the pinned default, and the placement drill is the only thing the waqf data gates.

**Why now.** Last, because none of it blocks a learner today — Family B is the pinned default and both engines are now verified.

**Scope.**
- ~~Render `3-01` and `3-03` in Safari and check the lām-alif ligature survives a `madd_6` span, exactly as recorded for Chrome~~ — done; the check also surfaced the 33%-of-spans underline bug, see hotlist #4
- Waqf-sign positions are in **neither** vendored dataset: the pinned Tanzil text omits waqf signs by design and cpfair does not annotate them
- Sample Dar al-Maʿrifah colours from print; the archive.org scan 503s on every attempt

**Findings + recommendation.** For the waqf drill, **recommend shipping without it** unless a dataset appears. Inventing sign positions would be worse than omitting the drill, and the rest of Unit 3.7 does not depend on it.

**Risks.** Family A is currently approximated from documented semantics, not sampled. Mitigation: it is already labelled as such at `src/content/tajweed.ts:47` — do not let that label be quietly dropped.

**Definition of done.** Every row in the log's "Open — a script cannot settle these" table is either resolved or restated as a deliberate, dated decision not to resolve it.

---

## Phase 7 — Close the gaps that are actually fixable ✅ **DONE 2026-08-12**

**Goal.** Everything the project can fix with its own hands, as opposed to Phase 6's items that wait on the world and Phase 5's that wait on an ear.

**Why this phase exists.** The 2026-08-11 review asked "what else is blocking?" and the honest answer separated into three piles, only one of which is ours to move. This is that pile. Full item-level detail lives in `WISHLIST.md`; this is the ordering.

> **All three work items are closed.** 7a shipped the ten makhraj diagrams and their mapping; 7c named the popover and the 148 course-map links; 7b turned out to be **entirely done already and merely unticked** — its own lesson, and the same drift that left Phase 8 reading "not started" while twelve tasks of it sat on the branch. A checklist nobody re-reads against the code overstates what remains. 7d is a launch checklist rather than work.

### 7a — Per-letter makhraj diagrams ✅ **DONE 2026-08-12**

**18 tongue letters shared one `lisan.jpg` with an identical highlight**, so ت (tip), ض (side) and ك (back) looked the same. The owner's original ask was diagrams so the student "wouldn't have to guess" — for the tongue letters she still did. It needed ten sub-zone images plus a per-letter mapping in the content, and it got both.

**Delivered.** `makhraj_point` on the 18 tongue letter notes, ten generated diagrams, and 26 letter slides wired to them — 26 rather than 18 because eight tongue-letter slides had **no image at all**, a gap this surfaced.

**The tool note in this section used to be wrong, and it cost a detour.** It read "codex CLI is installed… the pipeline is proven", which was then re-checked against `codex --help`, found to list no image command, and written up as blocked. Both readings were wrong. Codex generates images through a **model-side tool, `image_gen.imagegen`** — it is not a CLI subcommand and does not appear in `--help`, so the only way to find it is to *ask the agent*, which is what finally settled it. Two practical notes for next time: the prompt must arrive on **stdin**, because `-i` is variadic and eats a trailing positional prompt; and passing the existing rasters with `-i` as style references is what keeps new images in the same visual language.

**Owner rejected line-art SVGs — match the existing raster style**, and the generated set does, because the existing rasters are the references.

Two framings had to differ from the references, both for accuracy rather than taste:

- **ض is lateral** — the side edges of the tongue against the upper molars. A mid-sagittal section is a slice down the midline and *cannot* show a side contact, so a marker placed there would have been a confident-looking lie about the letter this course calls the hardest in the alphabet. It gets an oblique cutaway.
- **Points 6–10 all sit on the tongue tip**, millimetres apart. At the wide framing they would have been five near-identical images — the very failure being fixed — so they get a close view of the front of the mouth.

**Regeneration is deliberate, not part of the build.** `npm run build:makhraj` returns a fresh render each run and will not reproduce a byte-identical set; run it when a point is wrong. `npm run wire:makhraj` re-derives the slide mapping from the library and *is* idempotent.

### 7b — Correctness and hygiene ✅ **DONE** *(verified against the code 2026-08-12)*

All six were already fixed; the list had simply never been ticked. Re-checked one by one rather than taken on trust:

- ~~PPTX recap columns fill left-to-right~~ — now fills right-first, with the reasoning in the code
- ~~PPTX recap font-size threshold at 14 items~~ — threshold is 13, and 13 is also the largest recap in real content
- ~~`drill.grid` guards the outer array only~~ — `schema.test.ts` pins the empty-inner-row rejection
- ~~`useSwapPuzzle` repeats one equality check four ways~~ — one `isCorrect`, everything routed through it
- ~~`FormSwap` re-declares `FormKey`~~ — imported from `derive.ts`
- ~~`Flashcards` keys a list by line text~~ — keyed `${i}-${line}`

### 7c — Accessibility ✅ **DONE 2026-08-12**

~~Popover `role="dialog"` and dismissal~~ (`8bb5618`) · ~~`aria-disabled` on locked `FormSwap`/`LetterQuiz` tiles~~ · ~~distinct accessible names for lesson-row links~~ (`7c` close) · ~~`ExportPptxButton` status announcement~~.

The last two are worth recording because both were about **the same failure at different scales**. `TapToHear`'s popover opened as an anonymous span — a control that produced silence for a screen-reader user and a panel with no exit for a keyboard one. The course map shipped 74 rows carrying two links each whose only names were "Lesson" and "Practice": 148 controls, 2 distinct names, and no way to tell one row from another on the page that *is* the table of contents. Both are now named, and the visible text stayed short — the lesson title is already in the row.

### 7d — Blocking a *public* launch only *(not needed for one student)*

`/teach/<id>` is obscurity-only and ships all 74 teacher notes in the same static bundle · both Qurʾān audio sources are non-commercial, so monetisation bars them · the accessibility batch above.

### Owner decisions, not work

- **4 example words silently excluded from every game** (ضَوْء، لُغَة، بَقَرَة، وَرْدَة) because they carry ة or standalone ء, which the course never teaches as letterforms. Correct per spec, invisible in practice. Teach the forms, drop the words, or accept it?
- **The waqf placement drill** — position data exists in no dataset. Standing recommendation: ship without it rather than invent positions.

**Definition of done.** 7b and 7c green with tests; 7a shipped or explicitly declined; 7d recorded as a launch checklist rather than silently carried.

---

## Phase 8 — The practice engine ✅ **DONE 2026-08-12**

> **Plan:** `docs/superpowers/plans/2026-08-12-practice-engine.md` — 8 tasks as written, **12 as built**. Branch `feat/gamification-persistence`.
>
> **Delivered.** Append-only ledger in IndexedDB, a pure `derive()`, FSRS on 47 concepts, 14-slot session assembly with the wrong-answer tail, the session screen, and Due Today. **900 tests across 64 files**, gates green, 231 static pages.

**Goal.** The 14 drills that already ship start remembering. A learner sees what is due today, weak concepts resurface on a schedule, and a missed answer comes back before the session ends.

**Why it was needed.** The drills already emitted a typed `GameResult` and **nothing listened** — `GamePanel` accepted `onResult` and no caller passed one. The only progress in the app was a self-declared checkbox in `localStorage`. The engine's missing piece was never more games; it is memory of them.

### The four tasks the plan did not have, and why

Twelve tasks shipped against eight planned. Each addition was found by the task before it, which is the part worth keeping:

- **6b — register the six letter drills.** Found by Task 5. **29 of the 47 concepts are letters**, and none of their drills was in the registry, so `shapeOf` fell to its default for 62% of the roster: a letter's session was fourteen recognition items with no ramp in it.
- **6d — the letter drills must actually report.** Found by 6b. They were registered and still emitted nothing, so the entire first half of the course would have produced zero ledger rows.
- **6c — close the flag loop.** Found by Task 6. A concept flagged in one session had no way to be prioritised in the next.
- **9 — the registry could not carry an exemplar.** Found by Task 7. Drills ignored the planned item and picked their own, so the ledger's `itemKey` was a claim about what was shown that was **not true**, and the wrong-answer tail could legitimately re-ask the identical question — the exact failure the mechanic exists to prevent.

### The defect that only a mounted engine could show

The twelve tasks each passed, and the engine still recorded nothing in the running app. `appendAttempt` was called only from `useSession`, `useSession` only from `SessionRunner`, and **`SessionRunner` was rendered nowhere in `src/`**; `DueTodayPanel` was mounted with no `onStart`, so its one loud action fell through to scrolling. Every unit test passed *because* nothing connected the parts.

Closed by `src/components/practice/PracticeSession.tsx` — the client shell that builds the pool from the registry, snapshots the ledger on the click, plans the session, and runs it. Its test asserts **reachability** rather than behaviour, since that is the class of bug the other 63 files could not see.

Wiring it surfaced one more: **`letter-flashcards` advertises exemplars but cannot report a verdict**, and `SessionRunner` gates its continue button on one — a plan that drew a deck would strand the learner on a question with no answerable move. `UNGRADED_GAME_IDS` now excludes both decks, which is also the answer `GamePanel` had already reached on the merits: *"✓ Got it"* is a claim the learner makes about themselves, not a measurement.

### What the research settled

Nine research passes: five mining the owner's other project (Akademiya-AI), four on Duolingo's published learning science. The headline results, because several are counter-intuitive:

- **Akademiya has no spaced repetition at all** — confirmed independently twice across three repos. The thing most worth borrowing does not exist there. What it *does* have, and does well, is the layer underneath: an append-only ledger with derived stores, an EWMA weakness score, and a mastery-band state machine.
- **Duolingo has published no evidence that any gamification feature improves learning** — every number is behavioural (DAU, D7 retention). Their efficacy studies measure the whole course with no arm that removes gamification. *"Streaks work"* is true only if *work* means people come back.
- **Their own scheduler is the wrong choice here.** Untrained half-life regression **is** Leitner, by the paper's own derivation — and across 9,999 Anki collections, untrained FSRS beats *trained* HLR on every metric. Zero-data is exactly where that gap is widest.

### Decisions

- **FSRS with published defaults**, tuning desired retention (0.9) and never the parameters.
- **Scheduling keyed on concepts (47), not items (1,641)** — see ADR-008.
- **Append-only ledger in IndexedDB**, with a pure `derive()`. `derive`, `schedule` and `session` are IO-free *on purpose*: they are the code that runs unchanged server-side when ADR-007 lands.
- **14-slot sessions** — a timed drill costs 2 slots, everything else 1 — with interleaved items never in the first or last two positions, and a **wrong-answer tail** that re-queues *a different exemplar of the same concept*.
- **Mastery bands as diagnosis, never earned status.** Performance-contingent rewards undermine intrinsic motivation (d = −0.28, 128 studies); informational feedback enhances it. Same mechanic, opposite sign, decided by wording.
- **Rolling practice density with no loss condition**, plus a weekly 3-distinct-days target — instead of a daily streak. A missed day does not materially impair habit formation, so a streak zeroing out asserts something factually untrue, and at n=1 there is no averaging to absorb the break.
- **One deliberate inversion of Duolingo:** every wrong answer names the rule and the violated condition. They bet on implicit pattern extraction — their most consistent criticism from teachers — and tajweed is a finite, explicitly rule-governed system where that bet does not transfer.

**Explicitly not shipping:** XP, levels, badges, coins, leagues, leaderboards, hearts, streak-with-a-cliff, UI sound. **And no speed metric may exist anywhere** — Task 4 carries an explicit overshoot test, because holding a madd *longer* must never score better.

**The highest-value item needs no code.** Relatedness is the largest measured gamification benefit (g = 1.776) and is structurally unavailable to a solo learner — except that this course *has* a human teacher at the checkpoints. The software's job is to route toward that: surface readiness, help him arrive prepared. Never gate it, score it, or reward it.

**Risks.** A scheduler that surfaces the wrong things is worse than none, and with one learner there is no A/B to catch it. Mitigation: the ledger is append-only, so the algorithm can be replaced and the history replayed rather than migrated.

**Definition of done.** ✅ All five met. An attempt survives a reload; a due-today list is populated by past performance rather than by lesson order; a missed concept returns before the session ends; the timed drills still grade on accuracy-to-target; gates green.

### What Phase 8 deliberately left

Two are owner requirements now recorded in `WISHLIST.md`, not oversights:

- **A mandatory gamified check at the end of every lesson.** The engine is most of the way there — `planSession` assembles and `SessionRunner` runs — what is missing is a *lesson-scoped* variant that draws from what the lesson just taught, plus a completion gate. Unscoped by design: what "failing" means has to be decided first, and the answer must not be hearts or a lockout.
- **Sound effects where relevant.** Reverses the plan's `No UI sound` line. The stated reason for that line was *collision with recitation*, which scopes rather than contradicts the reversal: sound is safe where the audio channel is idle, and stays banned in the timed drills and anything that will play recitation when Phase 5 lands.

And one genuine gap the wiring exposed:

- **Free practice still records nothing.** `GameResult` carries no `conceptId`, so a drill answered outside a session cannot be written to the ledger without inventing the concept it belongs to — which is precisely what the ledger's honesty rules forbid. Only planned sessions record. Widening `GameResult` would close it; that is a decision, not a chore.

**The path/serpentine home screen** stays out of scope, as the plan set it: real, but its own plan, and this one had to earn its keep first.

---

## Architecture decisions (ADRs)

### ADR-001 — The Jazariyyah spine: ḥaqq al-ḥarf before mustaḥaqq al-ḥarf
**Decision.** Order the syllabus on al-Muqaddimah al-Jazariyyah — the letter's intrinsic due before what it becomes in context — with Tuhfat al-Atfal supplying drill content.
**Context.** Two candidate orderings, both from real courses, each with a dependency inversion: rules that consume ghunnah taught before ghunnah is defined.
**Consequences.** (+) Two dependency bugs dissolve rather than being worked around. (+) Both matns are public-domain and vendorable in full. (−) Departs from the order most students' other books use, so every departure has to be stated in the student's hearing.

### ADR-002 — Family B colours, pinned by observation
**Decision.** Ship the Family B palette (red = qalqalah) as the default.
**Context.** Two incompatible conventions. Dar al-Maʿrifah's printed muṣḥaf uses red for madd; the app the owner actually reads uses red for qalqalah.
**Consequences.** (+) Matches what the student sees daily. (−) Contradicts the printed tradition, so the legend must be teachable rather than memorised — which is why "read the legend of the book in front of you" is an explicit lesson objective.

### ADR-003 — The note is the source; the JSON is transcribed
**Decision.** Author every lesson as markdown in `library/`, then transcribe to `content/`. Never author JSON directly.
**Context.** Prose is cheap to correct; a slide deck embedded in a running app is not.
**Consequences.** (+) One reviewable surface for a human. (+) The vault gate can check things the app schema cannot. (−) Every content change is two edits, and they can drift — which is what the heading/id check at `scripts/check-library.mjs:87` now catches.

### ADR-004 — `draft` separates authoring from publishing
**Decision.** A lesson file carries `draft: true` and stays out of `content/course.json` until deliberately published.
**Context.** Without it, authoring and publishing are the same act: a new lesson either breaks the "every lesson is mapped" test or reaches a learner the moment it exists.
**Consequences.** (+) 45 lessons can exist, validate and build without being reachable. (+) Publishing is an explicit two-step with a test enforcing the order. (−) Two states to keep straight, and the gate warns rather than errors on draft rules.

### ADR-005 — Qurʾānic text is sliced from a pinned corpus, never typed
**Decision.** Every Arabic string in a lesson is extracted programmatically from a pinned 2017 Tanzil snapshot and verified verbatim by the gate.
**Context.** Hand-typed Qurʾānic text is the highest-severity error class available, and proofreading does not reliably catch a missing shadda.
**Consequences.** (+) Exactness is structural, not a matter of care. (+) cpfair's 60,057 annotations key to this exact snapshot. (−) Offsets must never be mixed with quran.com's `text_uthmani`, and `ayah` slides are limited to the bundled surahs 1 and 105–114.

---

### ADR-006 — A fail-closed local package in place of an unpatchable dependency
**Decision.** Replace PptxGenJS's `image-size` dependency with a local package that **throws on import**, forced in through an npm `overrides` entry, and pin PptxGenJS to an exact version.
**Context.** PptxGenJS 4.0.1 declares `image-size` at runtime but its shipped bundles never import it — the app's PPTX export uses the browser bundle and passes already-sized image data. Every published `image-size` release carries GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq, and **no patched release exists**, so there is nothing to upgrade to.
**Consequences.** (+) `npm audit` reports 0 vulnerabilities without waiting on an upstream fix. (+) It throws rather than returning a stub value, so if a future PptxGenJS starts importing it the build fails loudly instead of silently mis-sizing an image. (+) Two things hold the assumption in place: a contract test asserting both the pinned version and that the import throws, and the pre-existing smoke test that builds a real `.pptx` through the actual library. (−) It is a supply-chain override and must be removed once upstream is patched or the dependency is dropped — `config/npm/image-size-disabled/README.md` records the exit condition. (−) Pinning PptxGenJS exactly means its own updates are now a deliberate act.

### ADR-007 — A self-hosted Node server on a VPS, not auth-as-a-service
**Decision.** When accounts arrive, drop `output: "export"` for `output: "standalone"` and run the app as a Node process on a VPS behind Caddy, with SQLite on the same box. **Flip the config on the same commit as the first server-dependent feature — not before.**
**Context.** The app is a pure static export with no server, no database and no session; progress is a `localStorage` key. Registration, a score history, and an AI tutor each need a runtime — an API key cannot ship in a static bundle. The alternative was auth-as-a-service (Clerk/Supabase/Firebase) keeping static hosting.
**Consequences.** (+) No vendor, no per-seat bill, and — the deciding factor — **learners will include children, and self-hosting keeps their data out of a third party's jurisdiction**. (+) The migration is **proven, not assumed**: built standalone and served `/`, `/lesson/1-01`, `/practice/3-04`, `/teach/4-01`, `/checkpoint/checkpoint-2`, all 200, with all 230 pages still prerendering as SSG. (+) `/teach` gating becomes a middleware check rather than a rebuild. (−) Something must now be operated: a process, a reverse proxy, backups. (−) Free static hosting is given up, which is why the flip waits for the first feature that needs it. (−) `output: "standalone"` does not copy `.next/static` or `public/`, so a build step must — omit it and the site serves HTML with every asset 404ing. Recipe and the tested evidence: `docs/deploy/vps.md`.

### ADR-008 — Spaced repetition is keyed on concepts, not items
**Decision.** The scheduler tracks **47 concepts** (18 tajweed rules + 29 letters) and draws a **fresh exemplar on each review**. The ledger still records the `itemKey` actually shown.
**Context.** The course holds **1,641 distinct drillable items**. Per-item scheduling was the obvious design and was planned first. At 14 slots per session it takes **118 sessions to show every item once** — so a card would be reviewed roughly every four months, and FSRS builds stability from *repeated reviews of the same card*. It would have been starved.
**Consequences.** (+) Each concept accumulates dense data within days instead of months, so the scheduler is useful almost immediately. (+) It tests **the rule rather than memory of one exemplar** — a learner needs to recognise idghām anywhere, not recall that one āyah contains it. That is better pedagogy, not merely a workaround for sparse data. (+) `itemKey` stays in the ledger, so a per-item mode remains available if concept-level proves too coarse. (−) It cannot distinguish a hard exemplar from an easy one within a rule; a learner who fails only on one awkward āyah looks the same as one who fails broadly. (−) The exemplar pool must be large enough per concept that fresh draws do not repeat quickly — comfortably true at 1,641 items across 47 concepts.

## Effort / impact table

| Item | Phase | Effort | Impact | Notes |
|------|-------|--------|--------|-------|
| Regenerate the 37-lesson hifz map | Hotlist #1 | M | High | Prerequisite for Phase 3 |
| Fix two source citations | Hotlist #2 | S | Med | Blocked on an external source |
| Library notes for Phase 1 | Hotlist #3 | L | Med | ✅ done — all 74 live lessons now have one |
| Safari shaping check | Hotlist #4 | S | Low | ✅ done — both engines verified; found a 33%-of-spans underline bug |
| Landings in live lessons | 1 | M | **High** | Only item degrading content a student reads today |
| Source the eight rules | 2 | M | **High** | Gates Phase 3; acquisition, not analysis |
| Publish Unit 3 | 3 | M | **High** | 37 lessons; needs Phases 1–2 |
| Publish Unit 4 | 4 | S | Med | Needs Phase 3; ships the ayah-slide guard |
| Record teacher audio | 5 | — | — | 🚫 **SKIPPED by the owner 2026-08-12.** Not deferred — decided. Do not surface as next work, and do not revive it in a sweep |
| Close outside-world gaps | 6 | S–XL | Low–Med | Some items may never resolve; decide and date them |
| The practice engine | 8 | XL | **High** | ✅ done 2026-08-12 — 12 tasks, +365 tests. Four were found by the task before them |
| Mount it in the app | 8 | S | **High** | ✅ done 2026-08-12 — without it the other twelve recorded nothing |
| End-of-lesson check | — | M | **High** | Owner requirement, in `WISHLIST.md`. Reuses the engine; needs a "what does failing mean" decision first |
| Sound effects | — | S | Low–Med | Owner requirement, in `WISHLIST.md`. Reverses the plan's `No UI sound`; safe only where the audio channel is idle |
| Record free practice | — | M | Med | `GameResult` carries no `conceptId`, so only planned sessions record. A decision, not a chore |
