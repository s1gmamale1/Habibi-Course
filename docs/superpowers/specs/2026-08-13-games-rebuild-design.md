# Practice games rebuild — design

**Status:** approved 2026-08-13. Vertical slice first; the rest of the course widens onto it afterwards.

**Goal.** Make a practice session on a Unit 1 lesson stop feeling like "guess the letter", by rebuilding the games layer around a contract that lets games declare what they are, and by binding both a Quizlet-style set screen and the Duolingo-style due session to the same games.

---

## Why — the diagnosis, with evidence

The owner played `/practice/1-06` and said the games were *"just guess the letter type sh"*. That is accurate, and it has three separate causes. Naming them matters, because only one of them is "we need more games".

**1. Unit 1 has four plannable drills; Unit 3 has seven.** The letter drills are `letter-quiz`, `spot-the-letter`, `form-swap`, `word-builder` — the two flashcard decks cannot be graded and are excluded from planning. The tajweed drills (`span-tapper`, `family-sorter`, `condition-builder`, `madd-counter`, `ghunnah-timer`, `rule-identifier`, `listen-identify`) are far more varied. **The complaint is real and it is concentrated in the half of the course built on letters.**

**2. The session showed the shallow end and hid the good drill.** The observed session planned **5 items, all recognition/discrimination**. The response-mode ramp runs recognition → discrimination → production, so five items never reach production, and `word-builder` — which already asks *"Arrange the letters to build **bayt** ("house")"* — never appeared. The owner's transliteration→construction request was **already built and never surfaced**.

**3. Two rich seams are barely used.**

| Material | Amount | Used by today |
|---|---|---|
| `wordPool` — Arabic + transliteration + English meaning | 58 → 90 words, grows per lesson | `word-flashcards`, `word-builder` |
| `formEntries` — all four positional forms per letter (`ت / تـ / ـتـ / ـت`) | 22 letters | `form-swap` only |

A three-field word set (بَيْت / bayt / house) is exactly what Quizlet's Match, Learn and Test run on, and it is sitting unused. The form table is exactly what the owner's "meem's initial form at the end" game needs.

**The root cause underneath all three** is the game contract. A game is `render(props) => ReactNode` plus an optional `exemplars()`, and the session picks using `DRILL_MODES` — a hardcoded table in a *different module*. A game cannot say what it is or what it needs, so the session composes blind.

---

## Global constraints

Carried forward from `docs/superpowers/plans/2026-08-12-practice-engine.md`. Every one still binds.

- The ledger is **append-only**. Never UPDATE, never DELETE.
- **`null` means unmeasured; `0`/`false` is a claim.** A game that cannot grade must report `null`, never `false`.
- **No XP, levels, badges, coins, leagues, leaderboards, hearts, or streak-with-a-cliff.**
- **Mastery bands are diagnosis, never earned status** (performance-contingent rewards undermine intrinsic motivation, d = −0.28 across 128 studies).
- **Every wrong answer names the rule and the violated condition.** The deliberate inversion of Duolingo, which bets on implicit pattern extraction.
- Qurʾānic text is **never hand-typed** — sliced from the pinned corpus.
- Checkpoints stay human. Nothing here gates or scores them.
- Run `npm test`, never bare `npx vitest run`.
- **Do not commit on a red gate.**

### The speed rule, as amended 2026-08-13

The practice-engine plan says **"no speed metric may exist anywhere"**, written to stop a madd held *longer* from scoring worse. Quizlet's Match is inherently timed, so the owner settled the conflict directly:

> **A timer may be shown; it may never be recorded or graded.** No `Attempt` row carries elapsed time, nothing derives from it, and no game's verdict depends on it. The clock exists for feel and disappears at the ledger boundary.

The original prohibition stands unchanged for anything that grades an articulation.

---

## Architecture

### `Question` — the unit that fixes three problems at once

```ts
type Question = {
  /** The scheduling key (ADR-008): a RuleId or a single Arabic letter. */
  conceptId: string;
  /** Stable identity of this exact question, prefixed with the game id. */
  itemKey: string;
  gameId: string;
  /** Everything the game needs to render it. Shape is the game's own business. */
  payload: unknown;
};
```

A game returns **fully-formed questions**, not exemplar keys. This is the load-bearing change:

- A question **carries its own `conceptId`**, so a game answered outside a planned session can still write a truthful ledger row. That closes the *"free practice records nothing"* gap — `GameResult` had no concept, and inventing one is what the ledger's honesty rules forbid.
- The session composes from **real questions**, so it can see what is actually available rather than guessing from a table.
- `itemKey` is minted by the game that owns it, so two games' questions about one letter never collide.

### `GameSpec` — games declare what they are

```ts
type GameSpec = {
  id: string;
  label: string;
  /** Drives the ramp. Declared here, not in a table elsewhere. */
  mode: "recognition" | "discrimination" | "production";
  /** Cost against the session's slot budget. */
  cost: number;
  /** Can this produce a verdict at all? Replaces UNGRADED_GAME_IDS. */
  graded: boolean;
  /** Every question this game can ask of this set. `[]` is a valid answer. */
  questions: (set: StudySet) => Question[];
  render: (q: Question, api: GameApi) => ReactNode;
};
```

`DRILL_MODES` and `UNGRADED_GAME_IDS` both **cease to exist** — they become fields on the spec. Their current failure mode is exactly what a declared field prevents: `shapeOf` falls back to `recognition` for an unknown id, so a missing entry is indistinguishable from a correct one.

### `GameApi` — what a game may do

```ts
type GameApi = {
  /** Report a verdict. `null` = ungradeable; never `false` for "no verdict". */
  answer: (correct: boolean | null, detail?: AnswerDetail) => void;
  /** Injected clock. No game reads Date.now() directly. */
  now: () => number;
};
```

`detail` carries game-specific extras (the madd measurement, the chosen ḥarakāt). **It may not carry elapsed time.**

### `StudySet` — the bindable unit

```ts
type StudySet = {
  id: string;        // "lesson:1-06" | "due:2026-08-13"
  title: string;
  letters: ArabicItem[];
  words: WordEntry[];
  forms: FormEntry[];
  rules: RuleId[];
};
```

**This is what makes "both Quizlet and Duolingo" one job rather than two.** A lesson set is derived from the lesson; a due set is assembled by the scheduler. Every game works against either, unchanged, because a game only ever sees a `StudySet`.

---

## The two surfaces

### Set screen — Quizlet-style, on demand

Pick a set (this lesson, or everything so far), then a mode: **Match · Learn · Test · Cards**. Replayable, learner-initiated, no scheduling involved. It records to the ledger because questions carry their concept.

*Learn* and *Test* are compositions rather than new games: Learn runs a set's questions ramping by mode until each concept has a clean rep; Test draws a fixed-length mixed paper and reports at the end.

### Session — Duolingo-style, the daily run

Unchanged in purpose: what is due, mixed games, mode ramp, interleaving, wrong-answer tail. It now plans over `Question[]` instead of `PoolItem[]`.

---

## The four games in the slice

### 1. Broken form *(discrimination)*

A real word rendered with **one letter in the wrong positional form** — بَيْت with the ت in initial form (`تـ`) instead of final (`ـت`). Tap the broken letter.

The owner's flagship request, and a genuinely Arabic-specific game neither Duolingo nor Quizlet has. Buildable today: `formEntries` carries all four forms for 22 letters, and `contextualGlyphs` already does ZWJ-aware shaping.

`conceptId` is the letter whose form is broken. A word with no letter that has a full form set yields no question.

### 2. Match *(recognition)*

A grid of tiles; tap Arabic and its English meaning to clear the pair. **Timer displayed, never recorded** (see the amended speed rule).

One `Attempt` per pair attempt, not one per board — a board is several observations, and collapsing them loses the per-concept signal the scheduler needs.

### 3. Word bank *(production)*

Build the Arabic from letter tiles, cued by **transliteration and meaning together**. The upgrade of `word-builder`, which cues on transliteration alone.

One verdict per completed word, not per tile — a tile in the wrong slot with the word unfinished is not yet an answer. This preserves `word-builder`'s existing and deliberate behaviour.

### 4. Type it *(production)*

Show the meaning and the Arabic; the learner types the transliteration. Matching is normalised for the macrons the course uses (`ā ī ū`) so `bab`, `baab` and `bāb` all pass — the drill is testing recall of the word, not of a diacritic convention.

---

## What is kept

**The ledger, `derive`, and FSRS scheduling do not change.** They are not the problem, they are pure and tested, and the append-only history stays replayable across the rebuild.

**`SessionRunner`'s shell stays** — progress, the three bands, the feedback bar, the wrong-answer tail. It consumes `Question` instead of `PlannedItem`.

**The seven tajweed drills are ported, not rewritten — and not in this slice.** ~2,200 lines with mutation-tested exemplar handling, and they are the *varied* half of the course; nobody looking at Unit 3 would call it "guess the letter". Porting means wrapping each drill's existing item source in `questions(set)` and moving its mode and cost onto its spec — mechanical, and it belongs to the widening phase. **The slice is one Unit 1 lesson, which mounts no tajweed drill**, so the slice does not need them ported to be judged. Until then they keep running on the current registry, which is why the old registry is not deleted in this slice.

**The two flashcard decks stay as an ungraded mode** on the set screen. `graded: false` on the spec is what keeps them out of planned sessions — the same conclusion `UNGRADED_GAME_IDS` reached, now declared by the game rather than listed elsewhere. *"✓ Got it"* is a claim the learner makes about themselves, not a measurement.

---

## Data flow

```
StudySet ──► GameSpec.questions() ──► Question[]
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
              Set screen                                 planSession
           (learner picks a mode)                    (scheduler picks)
                    │                                       │
                    └───────────────► GameSpec.render ◄──────┘
                                            │
                                     GameApi.answer
                                            │
                                     Attempt (append-only)
                                            │
                              derive() ─────┴───── schedulesFromLedger()
```

The ledger boundary is where the timer is dropped: an `Attempt` never gains a duration field.

---

## Testing

**Per game.** `questions(set)` produces valid questions from a real lesson set; every question's `conceptId` passes `isConceptId`; `render` honours the question it is given rather than choosing its own; a game handed a set it cannot use returns `[]` rather than throwing.

**Contract, across all registered games.** Every spec declares `mode`, `cost` and `graded`; no game reads `Date.now()` directly; no `Attempt` produced by any game carries elapsed time.

**The anti-shallowness test.** A session planned from a Unit 1 set must contain **at least 3 distinct games and at least 2 distinct modes**. Today's session — 5 items, two games, one mode band — fails it. This is the requirement that turns *"this is cheeks"* from something the owner has to notice by playing into a red build.

**Reachability.** Every registered game is reachable from a real page. The practice engine shipped fully built and mounted nowhere; unit tests all passed *because* nothing connected them. That class of bug gets its own test here from the start.

---

## Out of scope

- **The other 73 lessons.** The slice is one Unit 1 lesson end to end. Widening is mechanical once the feel is right.
- **Porting the seven tajweed drills.** Belongs to the widening phase; the slice mounts none of them. Both registries coexist until then — an explicitly temporary state, and the first thing the widening phase removes.
- **Audio-dependent games.** Recording is skipped by owner decision (2026-08-12); `listen-identify` keeps its current cue behaviour.
- **The mandatory end-of-lesson check.** A separate owner requirement in `WISHLIST.md`; it will reuse this contract, and is easier to build after it exists.
- **Sound effects.** Wishlisted separately, and scoped to where the audio channel is idle.
- **Server sync.** `derive`, `schedule` and `session` stay IO-free so they run unchanged after ADR-007.
