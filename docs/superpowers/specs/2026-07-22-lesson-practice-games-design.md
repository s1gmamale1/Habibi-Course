# Lesson Practice Games — Design

**Date:** 2026-07-22
**Status:** Approved by owner (placement: both deck + practice page; word games: all three; state: ephemeral)

## Problem

Alphabet lessons (Phase 1) have no self-checking interactivity. Every drill relies on
the teacher being present: `TapToHear` plays audio/cues, but nothing gives the student
correct/incorrect feedback. The owner wants small interactive games *during* lessons —
flashcards, letter-form position games, word practice — using only letters the student
has already passed.

## Approach (chosen: A — derive from existing content)

Game data is **derived** from existing lesson JSON at build time. No content authoring,
no zod schema changes. Letter slides already carry `forms` (isolated/initial/medial/final)
and `examples` (word + translit + meaning + position tag); lesson file order gives the
cumulative "letters passed so far" set.

Rejected: (B) authored `game` slide kind — 12 lessons of authoring plus drift risk;
(C) standalone `/games/[id]` route — fails the "during the lesson" requirement.

## 1. Derivation module — `src/games/derive.ts` (pure, unit-tested)

For lesson N (ordered by lesson id):

- `newLetters: ArabicItem[]` — letters introduced on lesson N's `letter` slides.
- `letterPool: ArabicItem[]` — deduped union of letters from lessons 1..N (recap/drill
  items included only if they are letter-slide items from prior lessons — the canonical
  source is `letter` slides).
- `formEntries` — from the cumulative pool, letters whose `forms` object has ≥3 forms
  (enough slots to make a swap puzzle meaningful).
- `wordPool` — every `examples[]` word from lessons 1..N that passes the filter:
  strip harakat/diacritics, then every remaining base letter must be in `letterPool`.
  Words that fail (contain unlearned letters) are excluded now and appear automatically
  in later lessons once their letters are taught.

Helper module `src/games/arabic.ts`: harakat stripping, the six non-connectors
(ا د ذ ر ز و), and ZWJ contextual-shaping helper for rendering a word as individually
tappable letters without losing joined letterforms.

Derivation runs server-side in the static build; game data is passed to client
components as props. The site remains a fully static export.

## 2. Games — `src/components/games/` (client components)

Shared: green "locked correct" state, shake-on-wrong CSS animation (globals.css),
shuffle-after-mount (no SSR hydration mismatch), a common `useSwapPuzzle` hook for the
two swap games, and a common flashcard engine for the two flashcard modes. All state is
ephemeral — nothing persisted.

1. **Letter flashcards** — front: glyph; back: name + translit + audio cue. Shuffled;
   "Got it" removes the card, "Again" recycles it to the back until the deck clears.
2. **Form swap** — slots labeled Alone/Start/Middle/End (RTL order); one letter's forms
   shuffled across slots. Tap two tiles to swap. Tiles in their correct slot lock green;
   a swap that produces no newly-correct tile shakes. All green → success, advance to
   the next letter. **Gated to lessons ≥ 1-07** (forms are taught in 1-07).
3. **Word builder** — a `wordPool` word appears as shuffled isolated-letter tiles;
   same tap-two-to-swap mechanic. Solving reveals the joined, voweled word +
   transliteration + meaning.
4. **Spot-the-letter** — a word rendered as tappable letters (ZWJ contextual shapes,
   harakat stripped — matching unvoweled reading in lessons 1-07–1-09). Prompt:
   "tap ش (sheen)". Correct letter → green; wrong → shake.
5. **Letter quiz** — prompt shows a letter's name/sound; 4 glyph options drawn from the
   cumulative pool (requires ≥4 letters; lesson 1-01 has exactly 4). Green/shake feedback.
6. **Word flashcards** — flashcard engine with word front, translit + meaning back.

Each game renders only when it has sufficient data; otherwise it is hidden (no empty
shells). `GamePanel.tsx` is the tabbed container that hosts whichever games qualify.

## 3. Placement

- **Lesson deck:** one injected "Practice games" slide (the `GamePanel`) between the
  last content slide and the homework slide. Injection happens at the TypeScript level —
  `DeckSlide = Slide | { kind: "games"; data: GameData }` — the zod content schema and
  lesson JSON are untouched. `SlideDeck` gains a `games` case.
- **Practice page:** the same `GamePanel` above the printable drill grids, `print:hidden`
  so the printable sheet is unchanged.

## 4. Error handling / edge cases

- Early lessons with thin word pools: word games hide until ≥1 qualifying word.
- Letters with <3 forms (e.g. ر: isolated + final only) are excluded from form swap.
- Duplicate letters across recaps/drills: pool dedupes by base glyph.
- Diacritic stripping covers U+064B–U+0652 plus tatweel; shaping helper treats the six
  non-connectors correctly so ZWJ never fabricates a joined form that cannot exist.
- Shuffles that accidentally produce the solved order are reshuffled.

## 5. Testing (vitest + testing-library, existing suite stays green)

- `derive.test.ts` — cumulative pools across lessons, dedup, word filtering (unlearned
  letter → excluded; appears in later lesson), harakat stripping, form-entry gating,
  ≥1-07 gate for form swap.
- Per-game interaction tests — swap→green lock, fruitless swap→shake class, completion;
  flashcard flip + Again-recycle until cleared; quiz correct/wrong; spot-the-letter tap.
- Deck injection test — games slide present for a lesson with data, absent otherwise;
  homework remains the final slide.
