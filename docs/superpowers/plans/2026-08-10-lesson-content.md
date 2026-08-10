# Lesson Content — Units 2, 3 & 4 (Sub-projects A & E) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the verified library vault into 58 JSON lesson files plus three checkpoint kits, validated against the schema at build time.

**Architecture:** Every lesson is transcribed from its already-reviewed library note — the vault is the source, the JSON is the artifact. Unit 2 ships first because it needs no engine work; Units 3 and 4 wait on the tajweed slide kinds and drills. Nothing is authored directly in JSON, ever.

**Tech Stack:** JSON content files · Zod validation via `src/content/schema.ts` · `scripts/check-refs.mjs` · `scripts/check-library.mjs`

## Global Constraints

- **The library vault is the source of truth.** A lesson JSON file may contain no fact that is not already in a `status: verified` library note. If something is missing, add it to the vault and verify it there *first*.
- **Qur'an text is never hand-typed and never retyped from a research doc.** Copy from the pinned corpus or the generated verse data. `check-library.mjs` proves the library's examples; `allContent.test.ts` must prove the lessons'.
- **Unit 2 must not re-teach what Phase 1 already teaches.** Commit `c385ad0` shipped Unit 1.4 (`1-13`…`1-15`) covering **sukūn, hamza, and the heavy letters including tafkhīm heard in the adjacent vowel**. Read those three files before writing Unit 2.
- **Practical stopping belongs in Unit 2**, not Unit 3. Madd 'āriḍ lis-sukūn is *defined* by stopping, so waqf must precede it; the classical Jazariyyah has the same gap and this course deliberately fixes it.
- Lesson ids are zero-padded `2-01`, `3-01`, `4-01`. Slides per lesson: **min 8, max 24**.
- Every Arabic term gets an inline plain-English gloss on first use. Drill instructions address the student directly ("Point to each letter and say its name").
- `youtube-cue` audio is permitted **only** for single-topic videos at `startSeconds: 0`. Compilation deep-links remain disabled pending human audit.
- **Another session owns `content/`.** Check `git status` before every batch and never overwrite a file you did not create.
- Commits: `<type>(<scope>): <description>`. **No `Co-Authored-By` trailer.**

---

## Task 1: Reconcile Unit 2 against shipped Phase 1

**Do this before authoring a single lesson.**

- [ ] **Step 1: Read what shipped**

```bash
git show c385ad0 --stat
node -e "for (const f of ['1-13','1-14','1-15']) { const l=require('./content/lessons/'+f+'.json'); console.log(f, '|', l.title, '|', l.objectives.join(' / ')); }"
```

- [ ] **Step 2: Rewrite the Unit 2 scope table**

| Planned | Was | Must become |
|---|---|---|
| `2-03`, `2-04` sukūn | introduce | extend to harder clusters; sukūn assumed known |
| `2-09` hamzatul-waṣl | introduce hamza | waṣl **vs** qaṭʿ contrast; qaṭʿ taught in `1-13` |
| `2-12`–`2-14` | sentences | sentences **+ practical stopping** |

- [ ] **Step 3: Record the reconciliation** in `library/00-Index/Verification-Log.md` with the date and the commit hash, so the next person knows why Unit 2 assumes what it assumes.

- [ ] **Step 4: Commit** — `docs(library): reconcile Unit 2 scope against shipped Unit 1.4`

---

## Task 2: Unit 2 lesson notes → JSON (14 lessons)

Author in the vault first, then transcribe. Work in batches of 3–4 so review stays tractable.

For **each** lesson:

- [ ] **Step 1: Write `library/04-Curriculum/Unit-2-Reading-Mechanics/2-NN-<slug>.md`**

```yaml
---
type: lesson
id: "2-03"
unit: "2.1"
stage: Reading Mechanics
title: Sukūn I — Closed Syllables
teaches: []
prerequisites: ["1-13"]
status: draft
---
```

Body: **Objectives** (≤4) · **Hook** (corrective framing — lead with the error, not the definition) · **Teaching sequence** · **Examples** · **Drills** · **Listen-for** (7-field entries) · **Homework**.

- [ ] **Step 2: Gate the note** — `npm run check:library` must exit 0.

- [ ] **Step 3: Transcribe to `content/lessons/2-NN.json`** against the existing schema. Unit 2 needs **no new slide kinds** — `title`, `concept`, `letter`, `drill`, `recap`, `homework` cover it. That is why Unit 2 ships first.

- [ ] **Step 4: Add the lesson to `content/course.json`** under a phase-2 entry.

- [ ] **Step 5: Gate**

```bash
npm test && npm run check:refs && npm run check:library
```

- [ ] **Step 6: Commit the batch** — `feat(content): Unit 2 lessons 2-01..2-04`

---

## Task 3: Checkpoint 2 — "the biggest gate in the course"

- [ ] **Step 1: Write `library/04-Curriculum/Checkpoint-2.md`** — test structure, the Jali (−2) / Khafi (−1) rubric, pass thresholds, and the revision map naming specific units.
- [ ] **Step 2: Transcribe to `content/checkpoints/checkpoint-2.json`.**
- [ ] **Step 3: Gate and commit.**

Pass condition, per the existing research: numeric ≥70%, **or** no Jali error survives an examiner correction. Errors are tracked **per letter and per rule**, never only per passage — that is what makes "revise these units" name something specific.

---

## Task 4: Units 3 and 4 (44 lessons)

**Blocked on Sub-project C** (tajweed slide kinds) **and D** (drills). Do not start before both are green.

Per stage — 3.1 sifat, 3.2 rā'/lām, 3.3 ghunnah/meem, 3.4 noon, 3.5 idghām theory, 3.6 madd, 3.7 waqf, then Unit 4:

- [ ] **Step 1: Author the stage's lesson notes in the vault**, each `teaches:` naming rules that are already `status: verified`. `check-library.mjs` warns when a lesson teaches an unverified rule — treat that warning as a blocker, not noise.
- [ ] **Step 2: Transcribe to JSON**, using `rule`, `ayah`, `contrast`, `legend` and `mistake` slides.
- [ ] **Step 3: Declare drills** via `games: [...]` per lesson.
- [ ] **Step 4: Map the hifz strand.** The lesson→surah mapping in `phase-3-tajweed.md` §2.2 was built for **26** lessons and Unit 3 now has **36** — it must be regenerated, not copied. Order is al-Fātiḥa, then 114 → 105. Budget segments in proportion to a surah's length, not one surah per lesson.
- [ ] **Step 5: Gate and commit per stage.**

**Every rule's first example must come from al-Fātiḥa or surahs 105–114 where a clean instance exists.** Where none does, label it explicitly: *"reference example — outside your memorized surahs."* Three rules are known to need this: **iqlāb**, **idghām shafawī/mithlayn**, and the **five rā' isti'lā exception words**.

---

## Task 5: The Final Checkpoint

- [ ] Author `library/04-Curriculum/Final-Checkpoint.md`, then `content/checkpoints/checkpoint-final.json`, with all four tests:

1. **Unseen mushaf page** — plain Uthmani, no colour. Zero uncorrected Jali; Khafi ≤5 clean, 6–10 pass-with-flag, >10 revise.
2. **Hifz recitation** — al-Fātiḥa then 114→105 unaided, scored on a **separate memorisation-fidelity axis** so weak tajweed is distinguishable from not having it memorised. >3 examiner corrections in one surah fails that surah alone.
3. **Oral rule quiz** — binary, pass ≥90%.
4. **Colour-mushaf reading** — ≥90% rule IDs correct, zero Jali on coloured spans. Recommended item: **al-Fātiḥa 1:7**, which carries iẓhār, madd munfaṣil, madd lāzim and lām shamsiyyah in one line.

- [ ] Gate and commit.

---

## Self-Review

**Spec coverage.** §2 structure → Tasks 2 and 4. §3 hifz → Task 4 Step 4. §7 assessment → Tasks 3 and 5. §8 priority errors → the listen-for entries in every lesson note.

**Deliberate exclusions.** No engine work. If a lesson needs something the schema cannot express, that is a Sub-project C task, not a reason to bend the content.

**Dependency order.** Task 1 → Task 2 → Task 3 can start immediately. Task 4 is blocked on C and D. Task 5 is blocked on Task 4.

**Known risks.** (1) `content/` is shared with another active session — batch commits and re-check `git status` each time. (2) The hifz re-mapping is genuinely new work, not a copy. (3) If Unit 1.4 keeps growing, Task 1's reconciliation must be re-run before each Unit 2 batch.
