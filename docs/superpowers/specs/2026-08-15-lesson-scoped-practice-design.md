# Lesson-scoped practice — design

**Status:** approved 2026-08-15. Supersedes the games layer shipped by `2026-08-13-games-rebuild-design.md`; keeps its contract, replaces its content.

**Goal.** Practice on a lesson drills what that lesson taught, using material the curriculum already owns — and never tests vocabulary, which this course does not teach.

---

## The diagnosis

The owner opened `/practice/3-20` — *"Madd meets shadda & sukūn; the leen letters"* — and was asked **"pick the meaning that matches the word"** for ٱلرَّحِيم, with the options *steam · opening · bread · "the Mercifual (1:3) — kasrah before the yāʾ: madd, two counts"*.

Three separate failures stack up in that one screen, and the third is the real one.

### 1. The games test meaning; the course never teaches it

`Match` (word ↔ English gloss) and `Type it` (type the transliteration) are vocabulary drills. `Word bank` was cued by meaning. Three of four games tested a thing the syllabus does not contain.

They were chosen because `wordPool` carried `arabic`/`translit`/`meaning` and was the richest data seam available. **Data availability drove pedagogy.** That is the error in one line.

### 2. `meaning` is not a gloss for Qurʾānic words

For ordinary vocabulary it holds `"door"`. For Qurʾānic words it holds a tajweed annotation — *"the Mercifual (1:3) — kasrah before the yāʾ: madd, two counts"*. Only 6 of 90 words on a Unit 3 lesson are annotated that way, but those are exactly the ones a tajweed lesson surfaces, so the answer becomes identifiable by being the long one and the other three options are noise.

### 3. The code has no identifier for most of what the lessons teach

This is the root cause; the first two are downstream of it.

| | count |
|---|---|
| Rule ids the curriculum teaches (`teaches:` across `library/04-Curriculum`) | **59** |
| Ids in `src/content/tajweed.ts` (`TAJWEED_RULES`) | 18 |
| Exact matches | **7** |
| Matches after normalising spelling drift | 13 |
| **Taught, with no code concept at all** | **46** |
| Code ids nothing in the curriculum teaches | 5 — `madd_2`, `madd_246`, `madd_6`, `qalqalah`, `silent` |

Those five give it away. They are **span colours for rendering āyāt**, not things a lesson teaches. The scheduler's concept space was built on a rendering enum.

So the 46 orphans include `leen` — named in the title of the very lesson that produced the screenshot — plus `izhar_halqi`, `lam_jalalah`, `madd_arid_lissukun`, and the whole sifāt family (`hams`, `jahr`, `istila`, `itbaq`, `istitalah`, `inhiraf`, …).

**Practice could not correspond to the lesson because the code had no name for what the lesson taught.** The only vocabulary the code had was letters and words, so word games were close to inevitable.

There is also live spelling drift: the library says `idgham_shafawi`, the code says `idghaam_shafawi`; the library says `ikhfa_haqiqi`, the code says `ikhfa`. Nothing currently detects that these are the same rule.

### 4. The lesson's own material was ignored entirely

Lesson `3-10` (*Rā' I — fatḥa and ḍamma heavy, kasra light*) declares `games: ["rule-identifier", "listen-identify"]`, authors **nine drills** all about rā' weight, carries a letter slide for ر and four āyah slides. The session used none of it and asked the learner to build بَاب from tiles.

---

## Global constraints

Carried forward. Every one still binds.

- The ledger is **append-only**. Never UPDATE, never DELETE.
- **`null` means unmeasured; `0`/`false` is a claim.**
- **No XP, levels, badges, coins, leagues, leaderboards, hearts, or streak-with-a-cliff.**
- Mastery bands are diagnosis, never earned status.
- **Every wrong answer names the thing and the violated condition.**
- A timer may be **shown**, never recorded or graded.
- Qurʾānic text is **never hand-typed** — sliced from the pinned corpus.
- Questions are reproducible: no `Math.random()` in generation or planning.
- The library note is the source; code is the transcription (ADR-003).
- Run `npm test`, never bare `npx vitest run`. Do not commit on a red gate.
- **New:** no game may test the *meaning* of an Arabic word. The course teaches reading, not vocabulary.

---

## 1. The concept model — 88, from the library

A concept is **a library id**: the 59 rule ids in `library/02-Rules/*.md` plus the 29 letters in `library/03-Letters/*.md`.

Generated to a TypeScript constant at build time and committed, exactly as the Qurʾān corpus already is — the library is read through `node:fs`, and `derive`/`schedule`/`session` must stay runnable in a browser and later on a DOM-less server (ADR-007).

**`TAJWEED_RULES` is demoted to what it always was:** the render palette for āyah spans. The library already models this correctly — every rule note carries `cpfair_key` and `colour_b` — so the split exists in the source and only the code conflated them. Rename to make the role explicit and keep the renderer on it.

**`isConceptId` validates against the generated 88.** The guard keeps its teeth; it simply gains 41 concepts it should always have accepted.

**Spelling drift dies.** The library is canonical. A gate asserts every rule id referenced anywhere in code resolves to a library note, so `idghaam_shafawi` vs `idgham_shafawi` fails the build rather than silently splitting one concept into two.

**Existing ledger rows are not migrated.** The ledger is append-only and `schedulesFromLedger` is deliberately permissive about ids outside the current roster — a retired id was still genuinely answered. Rows written under the old spellings stay as history and simply stop being surfaced.

## 2. A lesson's concepts

`teaches: [...]` in the lesson's curriculum note, plus the letters its `kind: "letter"` slides introduce. That is the set the lesson's practice draws from, and it is the thing the previous design had no access to.

## 3. Two surfaces, deliberately separate

- **Practice this lesson** — questions drawn *only* from that lesson's concepts. Always available, unscheduled.
- **Review** — the due-driven session across all 88 concepts, with the ramp, interleaving and wrong-answer tail already built.

They are separate because mixing them is what produced the complaint: a learner asking *"drill what I just learned"* and *"what am I due to revisit"* are asking different questions, and one screen answering both answered neither.

## 4. The games

No game tests meaning. Every one draws on material the library already carries.

### Match *(recognition)*
Match the correct answer, never a gloss: letter ↔ its name · rule ↔ its English name · rule ↔ its family · **which letters trigger this rule** (`letters:` in the rule note — 15 for ikhfāʾ).

### Fill in the blank *(discrimination)*
An āyah from the lesson with a span blanked. Which rule applies here? Which letter triggered it? How many ḥarakāt? Built from the rule note's `examples` (`ref` + `text`, present in **59 of 60 notes**) and the pinned corpus.

### Broken form *(discrimination)* — kept unchanged
One letter in the wrong positional form inside a real word. It survives because it was always about forms, which is what the owner asked for. Its two hard-won properties stay: the wrong glyph varies across all four forms, and every glyph is built by one mechanism so no rendering artifact gives the answer away.

### Build by form *(production)*
Place the initial / medial / final forms correctly. Cued by the word's shape, **never by its meaning** — this is the owner's "re-order or construct… the correct forms, not the actual words".

### Cut
`Match` (word ↔ meaning) and `Type it` are deleted. `Word bank` becomes *Build by form* and loses its meaning cue.

## 5. What survives

The contract does, and that is what makes this a content swap rather than a third rebuild: `GameSpec` (declared `mode`/`cost`/`graded`), `Question` (carrying its own `conceptId`), `StudySet`, the registry, the two surfaces, `SessionRunner`, and the whole scheduling engine — ledger, `derive`, FSRS, planning, interleaving, the wrong-answer tail.

`StudySet.rules` stops being the empty array hardcoded in the last slice and becomes the lesson's actual rule concepts. `StudySet.words` stops being the primary seam.

---

## Testing

**The gate that would have caught this.** For every lesson, every question its practice generates must name a concept that lesson `teaches` (or a letter it introduces). Today's build fails that on every Unit 3 lesson — a madd lesson generates questions about ب.

**No-vocabulary gate.** No question payload may carry an English gloss as an answer option. Mechanically checkable and worth mechanising, because this failure was invisible to 998 passing tests.

**Concept-model gate.** Every rule id referenced in code resolves to a library note; the generated constant matches the library; the 88 count is pinned so silent drift fails.

**Per game.** Questions are valid, deterministic, honour the question given, and return `[]` for material they cannot use.

**Anti-shallowness**, retained: a lesson's practice contains ≥3 distinct games and ≥2 modes.

---

## Out of scope

- **Porting the seven old tajweed drills** onto `GameSpec`. They keep running on the old registry. Their absence from Unit 3 session pools — recorded in `WISHLIST.md` — is resolved by *this* work rather than by porting them, since the new games cover rule concepts directly.
- **Audio-dependent games.** Recording is skipped by owner decision (2026-08-12).
- **The mandatory end-of-lesson check.** Reuses this contract; easier once it exists.
- **Sound effects.** Wishlisted separately.
- **Migrating existing ledger rows.** History stays as written.
