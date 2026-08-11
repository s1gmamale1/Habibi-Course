# Habibi Course — Roadmap

A self-paced Arabic reading and tajweed course: **74 lessons live across four phases**, from the alphabet to the tajweed rules to the Kalimas. Content is written twice — as a reviewable markdown note in `library/04-Curriculum/`, then transcribed to JSON in `content/lessons/` — and every Qurʾānic string is sliced from a pinned Tanzil snapshot rather than typed.

This ROADMAP is the single source of truth for what to build next. The detailed evidence behind every claim here lives in `library/00-Index/Verification-Log.md`.

**Built state — 2026-08-11**

| | |
|---|---|
| Live to a learner | **All four phases — 74 lessons.** 1 *Letters & Sounds* (15) · 2 *Reading Mechanics* (14) · 3 *Tajweed* (37) · 4 *The Kalimas* (8) |
| Authored but unreachable | **None.** No lesson file is `draft` anywhere in the repo |
| Library | **182 notes** — every one of the 74 live lessons has a reviewable note |
| Rule notes | 59 total — **54 verified** against the vendored matns, 5 `needs-review`, each blocked on a named external source |
| Gates | 417 tests · 0 lint errors · library 0 errors / 5 warnings · static export builds |

> **Phases 1–4 are complete and the course is fully reachable.** Phase 5 (audio) is **deferred by the owner** — do not surface it as next work. **The hotlist is clear** — #1, #3 and #4 are closed and #2 is blocked on an external source. What remains is Phase 6's outside-world items, none of which blocks a learner. Nothing on that list blocks a learner from starting today.

---

## How to read this

- **Phases are ordered by value/effort**, with cross-phase prerequisites called out.
- **Effort** is S (≤½ day), M (1–2 days), L (3–5 days), XL (>1 week).
- Confirmed defects are fixed before new feature phases.
- "Blocked on the world" means no amount of work in this repo resolves it — a source, a recording or a dataset has to come from outside.

---

## Confirmed defects to fix first (hotlist)

| # | Sev | Defect | Where | Effort |
|---|-----|--------|-------|--------|
| 1 | ~~High~~ | ✅ **CLOSED 2026-08-11 — never a live defect.** The stale 26-lesson table is in a **superseded planning doc**, now banner-marked; the live hifz map is the `hifz:` field on each lesson note and was **already correct**. Audited against the corpus: all **55 āyāt** of the eleven hifz surahs assigned, **no gaps, no duplicates, none spanning a surah**. Now gate-enforced, proved in both directions. | `docs/syllabus/phase-3-tajweed.md` (superseded) · `scripts/check-library.mjs:151` | — |
| 2 | Med | ~~`silent_letters` and `waqf_signs` cite Jazariyyah for content it does not contain.~~ **`waqf_signs` resolved 2026-08-11** — sourced to [[Sajawandi-Waqf]] (d. 560 AH). The "~5 centuries after Ibn al-Jazarī" clause in this row was **my own unverified inference and was wrong by 273 years in the other direction**; see the Verification-Log correction. `silent_letters` still unsourced: the two muṣḥaf zeros are Uthmānī printing convention and are in no vendored text. | `library/02-Rules/Silent-Letters.md` | S (blocked on a source) |
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
> **The five that remain are `needs-review` with a named external blocker each, not unfinished work:** `madd_iwad` and `madd_tamkeen` appear in none of the three matns (iwaḍ is *presupposed* by v.830's "the alif of the tanwīn", tamkeen has no attestation at all); `silent_letters` needs a muṣḥaf-convention source; `waqf_signs` is sourced but the Madinah committee's specific set is not documented here; `hafs_special_words` waits on يَبْصُۜطُ. **Re-reading the vendored matns will not settle any of them.**

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

## Phase 5 — Record the teacher audio ⏸️ **DEFERRED by the owner**

> **Do not propose this as a next step.** The owner has deferred it twice. It is the one item in the project that cannot be done by anyone else — Arabic TTS was evaluated and rejected because it optimises for intelligibility rather than makhraj, and no openly-licensed full-coverage set exists — so it waits on his availability rather than on any work here. **Nothing regresses while it waits:** every cue already renders as usable text. Pick it up only if he raises it.

**Goal.** A student practising alone hears a correct human articulation instead of reading an instruction about one.

**Deliverables.**
- Recorded audio for the letter and qāʿidah cues
- A resolved `qari-clip` or equivalent source wired into `AudioSourceSchema`
- The `teacher-voice` cues that remain text-only marked as deliberate

**Why now.** ~7,000 `teacher-voice` cues across the published and authored content are silent. It is the largest single quality gap that no amount of writing closes.

**Scope.**
- Owner records the letter set and the core qāʿidah drills — the research put this at 20–30 minutes of audio for full letter coverage
- No schema change is required: `AudioSourceSchema` at `src/content/schema.ts:20` already carries `qari-clip`, `youtube-cue` and `teacher-voice`

**Findings + recommendation.** An exhaustive search found **no openly-licensed, full-coverage audio set**. Arabic TTS was evaluated and rejected: it optimises for intelligibility, not makhraj, so it would actively teach errors. **This must be a human recording, and it must be the owner's.**

**Risks.** Blocked on owner availability, not on engineering. Mitigation: it is additive — every cue already renders as usable text, so nothing regresses while this waits.

**Definition of done.** The letter set has audio in the published phases, and every remaining silent cue is one a reviewer has deliberately left as text.

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
| Record teacher audio | 5 | L | — | **DEFERRED by the owner.** Do not surface as next work |
| Close outside-world gaps | 6 | S–XL | Low–Med | Some items may never resolve; decide and date them |
