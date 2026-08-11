---
name: writing-tajweed-lessons
description: Use when authoring or revising a lesson note or lesson JSON for this tajweed course — any file under library/04-Curriculum/ or content/lessons/, or when a rule, drill, or teacher note needs writing or correcting.
---

# Writing Tajweed Lessons

## Overview

Every lesson is written twice: as a markdown note in `library/04-Curriculum/` (the source a
human reviews) and as JSON in `content/lessons/` (the artifact the app renders). **The note
is the source. The JSON is transcribed from it, never authored directly.**

Prose is cheap to correct. A slide deck embedded in a running app is not.

## The plain-language landing — REQUIRED

Teach the rule at full technical depth. Then give its examples. **Then land it in one or
two lines of ordinary words.**

The landing is a fixed three-part shape, in this order:

1. **The technical account** — the precise condition, the letters, the counts, the makhraj,
   the classical terminology, where the sources differ. Do not soften it. A teacher who only
   ever gets the simple version cannot answer a question one step past it.
2. **The examples** — the verified āyāt or drill words that show it happening.
3. **The landing** — **one or two lines, no more.** It takes the fuzzy Arabic terms that
   just appeared and says the same thing in words a beginner would use.

Signal it so the reader can see the shift: *"In plain terms:"*, *"Said simply:"*, *"What
that means out loud:"*.

```markdown
The ghunnah issues from the **khayshum** (الخَيْشُوم), the nasal cavity — the fifth makhraj
zone alongside the jawf, the ḥalq, the lisān and the shafatān. It is the only zone with no
moving articulator; what moves is the soft palate, which drops and diverts the airstream
through the nose. Its most complete form, *akmal al-ghunnah*, is on a نّ or مّ carrying
shaddah, held two ḥarakāt.

- **114:1** بِرَبِّ ٱلنَّاسِ — نّ mushaddadah, recited every day
- **108:3** إِنَّ شَانِئَكَ — the highest-frequency ghunnah word in the Qurʾān
- **112:2** ٱللَّهُ ٱلصَّمَدُ — two shaddas, neither of them a ghunnah

**In plain terms:** the sound comes out of her nose, not her mouth. Pinch the nose and it
should stop dead — that is the whole test.
```

**Why it sits after the examples, not before them.** By that point the reader has met
*khayshum*, *akmal al-ghunnah* and *ḥarakāt* in the space of a paragraph. The landing is
where those come back down. Placed earlier it competes with the technical account; placed
first it lets the reader stop there and never acquire the real account at all.

**Keep it to one or two lines.** It is a landing, not a second treatment. If it runs to a
paragraph, the technical layer above it was doing its job badly — fix that instead of
expanding this.

## The lesson shape

| Section | What it does |
|---|---|
| **Objectives** | ≤4, each "Student can…", concrete and testable |
| **Hook** | Make the student *produce the error* before naming anything |
| **What they already know** | Name the specific earlier lesson this builds on |
| **Teaching sequence** | Technical account → examples → 1–2 line plain landing, per point |
| **Examples** | Mirroring the verified `examples:` frontmatter |
| **Drills** | Address the student directly — "Point to each letter and say…" |
| **Listen-for** | The teacher's checklist, structured (see below) |
| **Hifz for this session** | Unit 3 only |
| **Homework** | 15–20 min/day |

## Rules that produce good lessons

**Open by making her fail.** Do not open with a definition. Give a task that exposes the
error, let her hear it, then name it. `2-12` has her read 1:5 and stop — she ends on
*nastaʿīnu* with the ḍammah hanging in the air, and diagnoses it herself. `3-14` has her
pinch her nose on إِنَّ and discover the sound doesn't stop.

**Explain the student's reasoning, not just her error.** A `listen-for` entry that says
"she pronounced the final ḥarakah" is worth little. One that says *"she is reading exactly
what is printed, and the ḍammah IS printed — this is obedience to the text, not
carelessness, and say so"* tells the teacher how to correct without discouraging.

**Refuse to teach what belongs later.** If a rule is coming in a later lesson, plant it as
an observation and say out loud that it has a name and a number you are not giving yet.
Naming it early costs the fluency the current lesson exists to build. Write the refusal
into the teacher script so it is not quietly skipped.

**Say when the course departs from the classical order, and why.** Two deliberate
departures: ghunnah is taught before the rules that use it (Tuhfat al-Atfal has it
backwards), and practical stopping is taught in Unit 2 before madd ʿāriḍ lis-sukūn (both
al-Jazariyyah and this course's earlier syllabus put the consequence before its cause).
State these in the student's hearing, not only in teacher notes.

**Drill on non-Qur'ānic words where the skill is decoding.** *"A ة you can recite is not a
ة you have read."* Anything from her memorised surahs can be answered from memory.

**Where scholars differ, say so once and name the position taught.** Madd munfaṣil is 4–5
via Shāṭibiyyah and 2 via Ṭayyibah. Qalqalah has 2 degrees or 3. A ḥarakah is relative to
tempo, not a fixed duration — the finger convention is a learning aid, not a definition.

## Hard constraints — violating these ships something wrong

**Qur'ān text is never hand-typed.** Slice it out of the pinned corpus:

```bash
node --input-type=module -e "import {loadCorpus} from './scripts/lib/corpus.mjs'; console.log(JSON.stringify(loadCorpus().get('106:4')))"
```

Every `examples:` entry is verified verbatim by `npm run check:library`. There is no
override. Exactness is structural, not a matter of proofreading.

**`ayah` slides may only cite surahs 1 and 105–114.** Only those are bundled into the
static export; any other surah renders unstyled and silently loses its colouring. A rule
whose only example lies outside that set goes in a `concept` slide as plain text, labelled
*"reference example — outside your memorized surahs."* That applies to **iqlāb** (zero
in-set occurrences), **idghām mutaqāribayn** (zero), and the five rā' isti'lā exception
words.

**The Kalimas never use an `ayah` slide.** That kind means Qur'an. The Kalimas are creedal
formulae; using it would present non-Qur'anic text as Qur'anic — and nothing would catch
it, because it fails no test.

**Derived stopped forms are not corpus text and must be shown as such.** `نَسْتَعِينْ` is
what the word sounds like at a waqf, not what the muṣḥaf prints. Always display it beside
the printed form with the difference explained.

**`madd_246` has three correct answers.** Madd ʿāriḍ lis-sukūn is transmitted at 2, 4 *or*
6; the reciter picks one and holds it consistently. Marking 4 wrong teaches a falsehood.
The only real error is *mixing* lengths within a session.

## Frontmatter contract

```yaml
---
type: lesson
id: "3-14"          # zero-padded, always
unit: "3.3"
stage: Ghunnah & Meem Sākinah
title: Ghunnah — Noon and Meem Mushaddadatān
teaches: [ghunnah]  # rule ids that must exist as rule notes
prerequisites: ["2-05", "3-13"]
hifz: "112:1-112:2"
status: draft
examples:
  - ref: "114:1"
    text: "بِرَبِّ ٱلنَّاسِ"
    note: "نّ mushaddadah — the anchor, recited every day"
---
```

Include at least one **counter-example** where the rule looks like it applies and does not
— `112:2 ٱللَّهُ ٱلصَّمَدُ` has two shaddas and neither is a ghunnah.

## Before finishing

```bash
npm run check:library    # frontmatter, links, verbatim Qur'an — must exit 0
npm test                 # if JSON was touched
```

`content/course.json` is the course *map*. A new lesson carries `"draft": true` and stays
out of it. Publishing means clearing the flag **and** adding the map entry, in that order —
there is a test enforcing it.

## Common mistakes

| Mistake | Fix |
|---|---|
| Plain explanation only | Add the technical account above it — the teacher needs the real one |
| Technical account with no landing | Add 1–2 plain lines after the examples; the jargon needs somewhere to come down |
| Landing placed before the examples | Move it after — it competes with the technical account otherwise |
| Landing that runs to a paragraph | It is a landing, not a second treatment. If it needs a paragraph, the technical layer above is unclear — fix that |
| Opening with a definition | Open with a task that exposes the error |
| `listen-for` naming only the error | Add why she makes it — correction depends on the cause |
| Naming a later rule "for completeness" | Plant it as an observation; say its name is coming |
| Qur'ānic drill words for a decoding skill | Use non-Qur'ānic — memory must not substitute for reading |
| Typing Arabic by hand | Slice it from the corpus |
| `ayah` slide citing surah 2 | Bundled surahs are 1 and 105–114 only; use a `concept` slide |

## Why the landing rule exists (micro-test, 2026-08-10)

The rule was tested before being trusted, per `superpowers:writing-skills`.

**Task:** write the *Teaching sequence* for a lesson on madd lāzim kalimī muthaqqal.
Both arms were told to write at full technical depth; the only difference was whether the
landing rule was present. Fresh context per sample, every match read manually.

| Arm | Landing produced |
|---|---|
| Control — skill removed from disk | **0 / 3** |
| Treatment — landing rule in the prompt | **3 / 3** |

The controls are good writing and end on *tashīl* variants, disputed *tawassuṭ* readings
and contrast drills. Not one line a beginner could use — the terminology never comes down.
So the rule is **necessary**, not decoration: at full technical depth the landing does not
appear on its own.

**A methodology note worth keeping.** The first control round was invalid and nearly
produced the opposite conclusion. This skill's own description matches "write a lesson
section", so the control agents loaded it — 2 of 3 "controls" produced landings. A control
run inside the project that hosts the skill is not a control. Park the skill directory
before baselining, and tell the agent not to read from disk.
