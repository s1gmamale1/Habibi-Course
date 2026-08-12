# Practice Games Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the games layer around a contract where a game declares what it is and returns fully-formed questions, then prove it with a Unit 1 vertical slice: a Quizlet-style set screen and the Duolingo-style session, both running four new games.

**Architecture:** A `GameSpec` declares `mode`, `cost` and `graded` and exposes `questions(set) → Question[]`. A `Question` carries its own `conceptId`, so any answer can be written to the ledger truthfully without a plan having assigned one. A `StudySet` is the single bindable unit both surfaces consume, which is what makes the set screen and the session one job rather than two.

**Tech Stack:** Next.js 16 (`output: "export"`), TypeScript, Tailwind v4, Vitest + Testing Library, `idb` (IndexedDB), `ts-fsrs`, `fake-indexeddb` in tests.

## Global Constraints

Copied from `docs/superpowers/specs/2026-08-13-games-rebuild-design.md`. Every task inherits these.

- The ledger is **append-only**. Never UPDATE, never DELETE.
- **`null` means unmeasured; `0`/`false` is a claim.** A game that cannot grade reports `null`, never `false`.
- **No XP, levels, badges, coins, leagues, leaderboards, hearts, or streak-with-a-cliff.**
- **Mastery bands are diagnosis, never earned status.**
- **Every wrong answer names the rule/letter and the violated condition.**
- **A timer may be SHOWN; it may never be recorded or graded.** No `Attempt` gains a duration field. The original "no speed metric" rule stands unchanged for anything grading an articulation.
- Qurʾānic text is **never hand-typed** — sliced from the pinned corpus.
- **Run `npm test`, never bare `npx vitest run`** (Node 26 needs the `NODE_OPTIONS` the npm script sets).
- **Do not commit on a red gate.**
- **Never add a `Co-Authored-By` trailer.**
- Keep files under 500 lines.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `src/games2/types.ts` | `Question`, `GameSpec`, `GameApi`, `StudySet`, `AnswerDetail`. Types only, no logic. |
| `src/games2/registry.ts` | Register/resolve `GameSpec`. Replaces `GameRegistry.ts` for new games. |
| `src/games2/studySet.ts` | Build a `StudySet` from a lesson, and from the due queue. |
| `src/games2/games/brokenForm.tsx` | Game 1 — spot the letter in the wrong positional form. |
| `src/games2/games/match.tsx` | Game 2 — tap Arabic↔meaning pairs. Timer shown, never recorded. |
| `src/games2/games/wordBank.tsx` | Game 3 — build the Arabic from tiles, cued by translit + meaning. |
| `src/games2/games/typeIt.tsx` | Game 4 — type the transliteration. |
| `src/games2/games/index.ts` | Side-effect barrel + `SLICE_GAME_IDS`. |
| `src/components/practice/SetScreen.tsx` | Quizlet surface: pick a mode, run it. |
| `src/app/study/[id]/page.tsx` | Route for the set screen. |

**Modified**

| File | Change |
|---|---|
| `src/practice/session.ts` | `planSession` accepts `Question[]`; delete `DRILL_MODES`, `UNGRADED_GAME_IDS`, `shapeOf`, `PoolItem`. |
| `src/practice/useSession.ts` | Session state over `Question`. |
| `src/components/practice/SessionRunner.tsx` | Render via `GameSpec.render(q, api)`. |
| `src/components/practice/PracticeSession.tsx` | Build the pool with `questionsFor`. |

`src/games2/` is a deliberate parallel tree. The seven tajweed drills keep running on the old registry until the widening phase, and two registries coexisting is easier to reason about — and to delete — than one registry serving two contracts.

---

## Task 1: The contract types

**Files:**
- Create: `src/games2/types.ts`
- Test: `src/games2/types.test.ts`

**Interfaces:**
- Consumes: `ArabicItem`, `WordEntry`, `FormEntry` from `@/games/derive` and `@/content/schema`; `RuleId` from `@/content/tajweed`.
- Produces: `Question`, `GameSpec`, `GameApi`, `StudySet`, `AnswerDetail`, `ResponseMode`.

- [ ] **Step 1: Write the failing test**

```ts
// src/games2/types.test.ts
import { describe, expect, test } from "vitest";
import { isQuestion, MODE_RANK } from "./types";

describe("Question", () => {
  test("accepts a well-formed question", () => {
    expect(isQuestion({ conceptId: "ب", itemKey: "match/ب", gameId: "match", payload: {} })).toBe(true);
  });

  test("rejects one whose conceptId is not a real concept", () => {
    // The whole point of carrying conceptId on the question: it is what gets
    // written to an append-only ledger, so a bad one is permanent.
    expect(isQuestion({ conceptId: "idgham", itemKey: "match/x", gameId: "match", payload: {} })).toBe(false);
    expect(isQuestion({ conceptId: "", itemKey: "match/x", gameId: "match", payload: {} })).toBe(false);
  });

  test("rejects an itemKey that is not prefixed with its game id", () => {
    // Two games' questions about one letter must never collide.
    expect(isQuestion({ conceptId: "ب", itemKey: "ب", gameId: "match", payload: {} })).toBe(false);
  });
});

describe("MODE_RANK", () => {
  test("ramps recognition → discrimination → production", () => {
    expect(MODE_RANK.recognition).toBeLessThan(MODE_RANK.discrimination);
    expect(MODE_RANK.discrimination).toBeLessThan(MODE_RANK.production);
  });
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npm test -- src/games2/types.test.ts`
Expected: FAIL — `Failed to resolve import "./types"`.

- [ ] **Step 3: Implement**

```ts
// src/games2/types.ts
import type { ReactNode } from "react";
import type { ArabicItem } from "@/content/schema";
import type { FormEntry, WordEntry } from "@/games/derive";
import type { RuleId } from "@/content/tajweed";
import { isConceptId } from "@/practice/concepts";

export type ResponseMode = "recognition" | "discrimination" | "production";

/** The ramp. Ordering lives here so nothing re-derives it from a string. */
export const MODE_RANK: Readonly<Record<ResponseMode, number>> = {
  recognition: 0,
  discrimination: 1,
  production: 2,
};

/**
 * One question a game can ask.
 *
 * `conceptId` rides on the question, not on a plan. That is the change the
 * whole rebuild turns on: a game answered on the set screen — where nothing
 * planned anything — still knows what concept it was about, so it can write a
 * truthful ledger row. Before this, `GameResult` carried no concept, and
 * inventing one is exactly what the ledger's honesty rules forbid.
 */
export type Question = {
  conceptId: string;
  /** Prefixed with the owning game's id, so two games never collide. */
  itemKey: string;
  gameId: string;
  /** Whatever this game needs to render. Opaque to everything else. */
  payload: unknown;
};

export function isQuestion(q: Question): boolean {
  if (!isConceptId(q.conceptId)) return false;
  if (!q.gameId || !q.itemKey) return false;
  return q.itemKey.startsWith(`${q.gameId}/`);
}

/** Extra observations a verdict may carry. Never elapsed time — see constraints. */
export type AnswerDetail = {
  measuredHarakat?: number;
  targetHarakat?: number;
  acceptedHarakat?: number[];
  msPerHarakah?: number;
};

export type GameApi = {
  /** `null` = ungradeable. NEVER `false` for "no verdict". */
  answer: (correct: boolean | null, detail?: AnswerDetail) => void;
  /** Injected clock. No game calls Date.now() directly. */
  now: () => number;
};

/** The material a game draws questions from. */
export type StudySet = {
  id: string;
  title: string;
  letters: ArabicItem[];
  words: WordEntry[];
  forms: FormEntry[];
  rules: RuleId[];
};

export type GameSpec = {
  id: string;
  label: string;
  /** Declared here, not in a table elsewhere — that table's fallback hid bugs. */
  mode: ResponseMode;
  cost: number;
  /** False for the flashcard decks: a self-claim is not a measurement. */
  graded: boolean;
  questions: (set: StudySet) => Question[];
  render: (q: Question, api: GameApi) => ReactNode;
};
```

- [ ] **Step 4: Run, pass.**

Run: `npm test -- src/games2/types.test.ts` — Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/games2/types.ts src/games2/types.test.ts
git commit -m "feat(games2): the contract — a question carries its own concept"
```

---

## Task 2: The registry

**Files:**
- Create: `src/games2/registry.ts`
- Test: `src/games2/registry.test.ts`

**Interfaces:**
- Consumes: `GameSpec`, `Question`, `StudySet`, `isQuestion` from `./types`.
- Produces: `registerGame(spec)`, `getGame(id): GameSpec | undefined`, `allGames(): GameSpec[]`, `questionsFor(ids, set): Question[]`, `clearGames()`.

- [ ] **Step 1: Write the failing test**

```ts
// src/games2/registry.test.ts
import { beforeEach, describe, expect, test } from "vitest";
import { allGames, clearGames, getGame, questionsFor, registerGame } from "./registry";
import type { GameSpec, StudySet } from "./types";

const SET: StudySet = { id: "t", title: "t", letters: [], words: [], forms: [], rules: [] };

const spec = (id: string, over: Partial<GameSpec> = {}): GameSpec => ({
  id,
  label: id,
  mode: "recognition",
  cost: 1,
  graded: true,
  questions: () => [{ conceptId: "ب", itemKey: `${id}/ب`, gameId: id, payload: {} }],
  render: () => null,
  ...over,
});

beforeEach(() => clearGames());

describe("the registry", () => {
  test("registers and resolves by id", () => {
    registerGame(spec("a"));
    expect(getGame("a")?.id).toBe("a");
    expect(getGame("nope")).toBeUndefined();
  });

  test("questionsFor stamps nothing — the game owns its own questions", () => {
    registerGame(spec("a"));
    expect(questionsFor(["a"], SET)).toEqual([
      { conceptId: "ب", itemKey: "a/ب", gameId: "a", payload: {} },
    ]);
  });

  test("an unknown id contributes nothing rather than throwing", () => {
    expect(questionsFor(["ghost"], SET)).toEqual([]);
  });

  test("an ungraded game yields no questions to a caller that wants graded ones", () => {
    // `graded: false` replaces UNGRADED_GAME_IDS. The decks stay playable on the
    // set screen; they simply cannot be planned into a session.
    registerGame(spec("deck", { graded: false }));
    expect(questionsFor(["deck"], SET, { gradedOnly: true })).toEqual([]);
    expect(questionsFor(["deck"], SET)).toHaveLength(1);
  });

  test("a game emitting a malformed question is dropped loudly, not silently", () => {
    registerGame(spec("bad", { questions: () => [{ conceptId: "nonsense", itemKey: "bad/x", gameId: "bad", payload: {} }] }));
    expect(() => questionsFor(["bad"], SET)).toThrow(/bad/);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — module does not exist.

- [ ] **Step 3: Implement**

```ts
// src/games2/registry.ts
import { isQuestion, type GameSpec, type Question, type StudySet } from "./types";

const REGISTRY = new Map<string, GameSpec>();

export function registerGame(spec: GameSpec): void {
  REGISTRY.set(spec.id, spec);
}

export function getGame(id: string): GameSpec | undefined {
  return REGISTRY.get(id);
}

export function allGames(): GameSpec[] {
  return [...REGISTRY.values()];
}

/** Test seam. */
export function clearGames(): void {
  REGISTRY.clear();
}

/**
 * Every question the named games can ask of this set.
 *
 * Throws on a malformed question rather than filtering it out. A question with
 * a bad `conceptId` would become a permanent ledger row that the scheduler can
 * never surface, and the append-only store cannot take it back — so the loud
 * failure belongs at the moment the game produced it, where the stack trace
 * still names the game.
 */
export function questionsFor(
  ids: readonly string[],
  set: StudySet,
  opts: { gradedOnly?: boolean } = {},
): Question[] {
  const out: Question[] = [];
  for (const id of ids) {
    const spec = REGISTRY.get(id);
    if (!spec) continue;
    if (opts.gradedOnly && !spec.graded) continue;
    for (const q of spec.questions(set)) {
      if (!isQuestion(q)) {
        throw new Error(`${spec.id}: emitted a malformed question — ${JSON.stringify(q)}`);
      }
      out.push(q);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run, pass.**

Run: `npm test -- src/games2/registry.test.ts` — Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/games2/registry.ts src/games2/registry.test.ts
git commit -m "feat(games2): registry — malformed questions fail loudly at their source"
```

---

## Task 3: StudySet builders

**Files:**
- Create: `src/games2/studySet.ts`
- Test: `src/games2/studySet.test.ts`

**Interfaces:**
- Consumes: `deriveGameData(lessons, lessonId)` from `@/games/derive`; `allLessons()` from `@/content/load`; `StudySet` from `./types`.
- Produces: `lessonSet(lessonId): StudySet`, `setFromGameData(data): StudySet`.

- [ ] **Step 1: Write the failing test**

```ts
// src/games2/studySet.test.ts
import { describe, expect, test } from "vitest";
import { lessonSet } from "./studySet";

describe("lessonSet", () => {
  test("carries the lesson's letters, words and forms", () => {
    const set = lessonSet("2-08");
    expect(set.id).toBe("lesson:2-08");
    expect(set.letters.length).toBeGreaterThan(20);
    expect(set.words.length).toBeGreaterThan(50);
    expect(set.forms.length).toBeGreaterThan(0);
  });

  test("every word carries the three fields the new games need", () => {
    // Arabic + transliteration + meaning is what Match, Word bank and Type it
    // all run on. A word missing one of them is unusable, not merely thinner.
    for (const w of lessonSet("2-08").words) {
      expect(w.arabic).toBeTruthy();
      expect(w.translit).toBeTruthy();
      expect(w.meaning).toBeTruthy();
    }
  });

  test("an early lesson has fewer letters than a later one", () => {
    expect(lessonSet("1-02").letters.length).toBeLessThan(lessonSet("2-08").letters.length);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — module does not exist.

- [ ] **Step 3: Implement**

```ts
// src/games2/studySet.ts
import { allLessons } from "@/content/load";
import { deriveGameData, type GameData } from "@/games/derive";
import type { StudySet } from "./types";

/**
 * A study set from a lesson.
 *
 * `rules` is empty for the slice: Unit 1 lessons teach letters, and the tajweed
 * drills are not ported yet. It exists on the type now so the widening phase
 * adds data rather than changing the shape everything already consumes.
 */
export function setFromGameData(data: GameData, title: string): StudySet {
  return {
    id: `lesson:${data.lessonId}`,
    title,
    letters: data.letterPool,
    words: data.wordPool,
    forms: data.formEntries,
    rules: [],
  };
}

export function lessonSet(lessonId: string): StudySet {
  const lessons = allLessons();
  const lesson = lessons.find((l) => l.id === lessonId);
  const data = deriveGameData(lessons, lessonId);
  return setFromGameData(data, lesson?.title ?? lessonId);
}
```

- [ ] **Step 4: Run, pass.**

Run: `npm test -- src/games2/studySet.test.ts` — Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/games2/studySet.ts src/games2/studySet.test.ts
git commit -m "feat(games2): StudySet — one bindable unit for both surfaces"
```

---

## Task 4: Broken form

The owner's flagship request. A real word rendered with one letter in the wrong positional form.

**Files:**
- Create: `src/games2/games/brokenForm.tsx`
- Test: `src/games2/games/brokenForm.test.tsx`

**Interfaces:**
- Consumes: `displayLetters` from `@/games/arabic`; `registerGame` from `../registry`; `GameSpec`, `Question`, `GameApi`, `StudySet` from `../types`.
- Produces: registers game id `broken-form`; exports `brokenFormQuestions(set)` and `type BrokenFormPayload = { word: string; meaning: string; glyphs: string[]; brokenIndex: number; letter: string }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/games2/games/brokenForm.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { FormEntry } from "@/games/derive";
import { brokenFormQuestions, BrokenForm, type BrokenFormPayload } from "./brokenForm";
import type { StudySet } from "../types";

const forms: FormEntry[] = [
  {
    item: { arabic: "ت", name: "ta", audio: { type: "teacher-voice", cue: "tip" } },
    forms: { isolated: "ت", initial: "تـ", medial: "ـتـ", final: "ـت" },
  },
];

const set: StudySet = {
  id: "t", title: "t", letters: [], forms, rules: [],
  words: [{ arabic: "بَيْت", translit: "bayt", meaning: "house" }],
};

describe("brokenFormQuestions", () => {
  test("only asks about letters whose forms the course has taught", () => {
    const qs = brokenFormQuestions(set);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) expect(q.conceptId).toBe("ت");
  });

  test("the broken glyph is a REAL form of the letter, just the wrong one", () => {
    // A random glyph would be a spot-the-garbage game. The teaching point is
    // that ـت and تـ are both real and only one belongs at the end.
    const q = brokenFormQuestions(set)[0];
    const p = q.payload as BrokenFormPayload;
    const all = Object.values(forms[0].forms);
    expect(all).toContain(p.glyphs[p.brokenIndex]);
    expect(p.glyphs[p.brokenIndex]).not.toBe("ـت");
  });

  test("a set with no usable word yields no questions rather than throwing", () => {
    expect(brokenFormQuestions({ ...set, words: [] })).toEqual([]);
  });

  test("itemKey is prefixed with the game id so it cannot collide", () => {
    for (const q of brokenFormQuestions(set)) expect(q.itemKey.startsWith("broken-form/")).toBe(true);
  });
});

describe("BrokenForm", () => {
  const q = () => brokenFormQuestions(set)[0];

  test("tapping the broken letter reports correct", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as BrokenFormPayload;
    render(<BrokenForm q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByTestId(`glyph-${p.brokenIndex}`));
    expect(answer).toHaveBeenCalledWith(true);
  });

  test("tapping a sound letter reports incorrect, and names the letter", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as BrokenFormPayload;
    const sound = p.glyphs.findIndex((_, i) => i !== p.brokenIndex);
    render(<BrokenForm q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByTestId(`glyph-${sound}`));
    expect(answer).toHaveBeenCalledWith(false);
    // Every wrong answer names the thing and the violated condition.
    expect(screen.getByRole("status").textContent).toMatch(/ت/);
  });

  test("a second tap after answering reports nothing", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as BrokenFormPayload;
    render(<BrokenForm q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByTestId(`glyph-${p.brokenIndex}`));
    await userEvent.click(screen.getByTestId("glyph-0"));
    expect(answer).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — module does not exist.

- [ ] **Step 3: Implement**

```tsx
// src/games2/games/brokenForm.tsx
"use client";
import { useState } from "react";
import { displayLetters } from "@/games/arabic";
import { registerGame } from "../registry";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "broken-form";

export type BrokenFormPayload = {
  word: string;
  meaning: string;
  /** Per-letter glyphs as displayed, one already swapped to the wrong form. */
  glyphs: string[];
  brokenIndex: number;
  letter: string;
};

/** Which positional form a letter at index `i` of `n` should take. */
function correctForm(i: number, n: number): "isolated" | "initial" | "medial" | "final" {
  if (n === 1) return "isolated";
  if (i === 0) return "initial";
  if (i === n - 1) return "final";
  return "medial";
}

/**
 * One question per (word, letter) pair the course has taught full forms for.
 *
 * The broken glyph is always another REAL form of the same letter. Substituting
 * a random glyph would turn this into spot-the-garbage; the teaching point is
 * that تـ and ـت are both correct Arabic and only one of them belongs at the
 * end of a word.
 */
export function brokenFormQuestions(set: StudySet): Question[] {
  const out: Question[] = [];
  const byLetter = new Map(set.forms.map((f) => [f.item.arabic, f]));

  for (const word of set.words) {
    const letters = displayLetters(word.arabic);
    if (letters.length < 2) continue;
    for (let i = 0; i < letters.length; i += 1) {
      const entry = byLetter.get(letters[i]);
      if (!entry) continue;
      const want = correctForm(i, letters.length);
      const right = entry.forms[want];
      const wrong = (Object.entries(entry.forms) as [string, string][])
        .filter(([k, v]) => k !== want && v && v !== right)
        .map(([, v]) => v)[0];
      if (!right || !wrong) continue;

      const glyphs = letters.map((l, j) => {
        const e = byLetter.get(l);
        return e?.forms[correctForm(j, letters.length)] ?? l;
      });
      glyphs[i] = wrong;

      out.push({
        conceptId: letters[i],
        itemKey: `${GAME_ID}/${word.arabic}/${i}`,
        gameId: GAME_ID,
        payload: { word: word.arabic, meaning: word.meaning, glyphs, brokenIndex: i, letter: letters[i] } satisfies BrokenFormPayload,
      });
    }
  }
  return out;
}

export function BrokenForm({ q, api }: { q: Question; api: GameApi }) {
  const p = q.payload as BrokenFormPayload;
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;

  function tap(i: number) {
    if (done) return;
    setPicked(i);
    api.answer(i === p.brokenIndex);
  }

  return (
    <div className="text-center">
      <p className="mb-1 text-white/80">
        One letter is in the wrong form. Tap it.
      </p>
      <p className="mb-4 text-xs text-white/50">
        “{p.meaning}” — {p.word}
      </p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-1">
        {p.glyphs.map((g, i) => (
          <button
            key={i}
            type="button"
            data-testid={`glyph-${i}`}
            aria-disabled={done}
            onClick={() => tap(i)}
            className={`arabic rounded-xl border px-3 py-2 text-5xl text-white ${
              done && i === p.brokenIndex
                ? "game-correct"
                : done && i === picked
                  ? "border-red-400/70 bg-red-500/15"
                  : "border-white/10 bg-white/5"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-white/80">
        {!done
          ? ""
          : picked === p.brokenIndex
            ? `✓ ${p.letter} — that form does not belong in this position.`
            : `✗ The broken one is ${p.letter}: it is in the wrong position-form for where it sits in ${p.word}.`}
      </p>
    </div>
  );
}

registerGame({
  id: GAME_ID,
  label: "🔧 Broken form",
  mode: "discrimination",
  cost: 1,
  graded: true,
  questions: brokenFormQuestions,
  render: (q, api) => <BrokenForm q={q} api={api} />,
});
```

- [ ] **Step 4: Run, pass.**

Run: `npm test -- src/games2/games/brokenForm.test.tsx` — Expected: PASS (7 tests).

- [ ] **Step 5: Verify against real content**

Run: `npx tsx -e "import {lessonSet} from './src/games2/studySet'; import {brokenFormQuestions} from './src/games2/games/brokenForm'; console.log(brokenFormQuestions(lessonSet('2-08')).length)"`
Expected: a number greater than 20. If it is 0, the form/word overlap is empty and the game has no material — stop and report rather than shipping an empty game.

- [ ] **Step 6: Commit**

```bash
git add src/games2/games/brokenForm.tsx src/games2/games/brokenForm.test.tsx
git commit -m "feat(games2): broken form — the wrong positional form inside a real word"
```

---

## Task 5: Match

**Files:**
- Create: `src/games2/games/match.tsx`
- Test: `src/games2/games/match.test.tsx`

**Interfaces:**
- Consumes: `registerGame`, `GameApi`, `Question`, `StudySet`.
- Produces: registers `match`; exports `matchQuestions(set)`, `Match`, `type MatchPayload = { arabic: string; meaning: string; distractors: string[] }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/games2/games/match.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { matchQuestions, Match, type MatchPayload } from "./match";
import type { StudySet } from "../types";

const set: StudySet = {
  id: "t", title: "t", letters: [], forms: [], rules: [],
  words: [
    { arabic: "بَاب", translit: "bāb", meaning: "door" },
    { arabic: "بَيْت", translit: "bayt", meaning: "house" },
    { arabic: "جَبَل", translit: "jabal", meaning: "mountain" },
    { arabic: "قَلْب", translit: "qalb", meaning: "heart" },
  ],
};

describe("matchQuestions", () => {
  test("one question per word, each with distractor meanings", () => {
    const qs = matchQuestions(set);
    expect(qs).toHaveLength(4);
    const p = qs[0].payload as MatchPayload;
    expect(p.distractors.length).toBeGreaterThan(0);
    expect(p.distractors).not.toContain(p.meaning);
  });

  test("the concept is the word's first letter, which is what the scheduler tracks", () => {
    // ADR-008 keys scheduling on the 47 concepts. A word is not one of them.
    expect(matchQuestions(set)[0].conceptId).toBe("ب");
  });

  test("a set too small for distractors yields nothing rather than a one-option game", () => {
    expect(matchQuestions({ ...set, words: set.words.slice(0, 1) })).toEqual([]);
  });
});

describe("Match", () => {
  test("tapping the right meaning reports correct", async () => {
    const answer = vi.fn();
    const q = matchQuestions(set)[0];
    const p = q.payload as MatchPayload;
    render(<Match q={q} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.meaning }));
    expect(answer).toHaveBeenCalledWith(true);
  });

  test("tapping a wrong meaning reports incorrect and names the right one", async () => {
    const answer = vi.fn();
    const q = matchQuestions(set)[0];
    const p = q.payload as MatchPayload;
    render(<Match q={q} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.distractors[0] }));
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status").textContent).toContain(p.meaning);
  });

  test("the timer is shown but never reaches the verdict", async () => {
    // Constraint: a timer may be SHOWN; it may never be recorded or graded.
    const answer = vi.fn();
    const q = matchQuestions(set)[0];
    const p = q.payload as MatchPayload;
    render(<Match q={q} api={{ answer, now: () => 5_000 }} />);
    expect(screen.getByTestId("match-timer")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: p.meaning }));
    // Exactly two arguments would mean a detail object rode along; there is none.
    expect(answer.mock.calls[0]).toEqual([true]);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — module does not exist.

- [ ] **Step 3: Implement**

```tsx
// src/games2/games/match.tsx
"use client";
import { useEffect, useState } from "react";
import { displayLetters } from "@/games/arabic";
import { registerGame } from "../registry";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "match";
const OPTIONS = 4;

export type MatchPayload = { arabic: string; meaning: string; distractors: string[] };

export function matchQuestions(set: StudySet): Question[] {
  const meanings = set.words.map((w) => w.meaning);
  if (set.words.length < 2) return [];

  return set.words.flatMap((w) => {
    const conceptId = displayLetters(w.arabic)[0];
    if (!conceptId) return [];
    const distractors = meanings.filter((m) => m !== w.meaning).slice(0, OPTIONS - 1);
    if (distractors.length === 0) return [];
    return [{
      conceptId,
      itemKey: `${GAME_ID}/${w.arabic}`,
      gameId: GAME_ID,
      payload: { arabic: w.arabic, meaning: w.meaning, distractors } satisfies MatchPayload,
    }];
  });
}

/**
 * The timer is decoration, on purpose.
 *
 * The project's speed rule was written so a madd held LONGER can never score
 * worse. The owner amended it on 2026-08-13: a timer may be shown, never
 * recorded or graded. So this reads the clock for display and `api.answer`
 * receives a verdict and nothing else — no detail object, no duration. The test
 * asserts the call has exactly one argument, which is what stops a later
 * "helpful" addition from smuggling elapsed time into the ledger.
 */
export function Match({ q, api }: { q: Question; api: GameApi }) {
  const p = q.payload as MatchPayload;
  const [start] = useState(() => api.now());
  const [elapsed, setElapsed] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const done = picked !== null;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed(api.now() - start), 250);
    return () => clearInterval(t);
  }, [done, start, api]);

  // Stable option order: shuffling in render would differ between SSR and client.
  const options = [p.meaning, ...p.distractors].sort();

  function pick(m: string) {
    if (done) return;
    setPicked(m);
    api.answer(m === p.meaning);
  }

  return (
    <div className="text-center">
      <p className="arabic mb-3 text-5xl text-white">{p.arabic}</p>
      <p data-testid="match-timer" className="mb-3 text-xs text-white/40">
        <bdi dir="ltr">{(elapsed / 1000).toFixed(1)}s</bdi>
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((m) => (
          <button
            key={m}
            type="button"
            aria-disabled={done}
            onClick={() => pick(m)}
            className={`rounded-xl border px-4 py-2 text-white ${
              done && m === p.meaning
                ? "game-correct"
                : done && m === picked
                  ? "border-red-400/70 bg-red-500/15"
                  : "border-white/10 bg-white/5"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-white/80">
        {!done ? "" : picked === p.meaning ? `✓ ${p.arabic} — ${p.meaning}` : `✗ ${p.arabic} means “${p.meaning}”.`}
      </p>
    </div>
  );
}

registerGame({
  id: GAME_ID,
  label: "🔗 Match",
  mode: "recognition",
  cost: 1,
  graded: true,
  questions: matchQuestions,
  render: (q, api) => <Match q={q} api={api} />,
});
```

- [ ] **Step 4: Run, pass.**

Run: `npm test -- src/games2/games/match.test.tsx` — Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/games2/games/match.tsx src/games2/games/match.test.tsx
git commit -m "feat(games2): match — timer shown, never recorded"
```

---

## Task 6: Word bank and Type it

Two production-mode games. Grouped because they share the same word material and neither is large enough to warrant its own review gate.

**Files:**
- Create: `src/games2/games/wordBank.tsx`, `src/games2/games/typeIt.tsx`
- Test: `src/games2/games/wordBank.test.tsx`, `src/games2/games/typeIt.test.tsx`

**Interfaces:**
- Produces: registers `word-bank` and `type-it`; exports `wordBankQuestions`, `WordBank`, `typeItQuestions`, `TypeIt`, `normaliseTranslit(s: string): string`, `type WordBankPayload = { arabic: string; translit: string; meaning: string; tiles: string[] }`, `type TypeItPayload = { arabic: string; translit: string; meaning: string }`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/games2/games/typeIt.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { normaliseTranslit, typeItQuestions, TypeIt } from "./typeIt";
import type { StudySet } from "../types";

const set: StudySet = {
  id: "t", title: "t", letters: [], forms: [], rules: [],
  words: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
};

describe("normaliseTranslit", () => {
  test("accepts the macron the course uses, and the ASCII a learner types", () => {
    // The drill tests recall of the WORD, not of a diacritic convention.
    for (const typed of ["bāb", "bab", "baab", " BĀB "]) {
      expect(normaliseTranslit(typed)).toBe(normaliseTranslit("bāb"));
    }
  });

  test("does not collapse genuinely different words", () => {
    expect(normaliseTranslit("bayt")).not.toBe(normaliseTranslit("bāb"));
  });
});

describe("TypeIt", () => {
  test("a matching answer reports correct", async () => {
    const answer = vi.fn();
    render(<TypeIt q={typeItQuestions(set)[0]} api={{ answer, now: () => 1 }} />);
    await userEvent.type(screen.getByRole("textbox"), "bab");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(answer).toHaveBeenCalledWith(true);
  });

  test("a wrong answer reports incorrect and shows the expected spelling", async () => {
    const answer = vi.fn();
    render(<TypeIt q={typeItQuestions(set)[0]} api={{ answer, now: () => 1 }} />);
    await userEvent.type(screen.getByRole("textbox"), "bayt");
    await userEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status").textContent).toContain("bāb");
  });

  test("an empty answer reports nothing — a blank is not a wrong answer", () => {
    const answer = vi.fn();
    render(<TypeIt q={typeItQuestions(set)[0]} api={{ answer, now: () => 1 }} />);
    expect(screen.getByRole("button", { name: /check/i })).toHaveProperty("disabled", true);
    expect(answer).not.toHaveBeenCalled();
  });
});
```

```tsx
// src/games2/games/wordBank.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { wordBankQuestions, WordBank, type WordBankPayload } from "./wordBank";
import type { StudySet } from "../types";

const set: StudySet = {
  id: "t", title: "t", letters: [], forms: [], rules: [],
  words: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
};

describe("wordBankQuestions", () => {
  test("tiles are the word's own letters", () => {
    const p = wordBankQuestions(set)[0].payload as WordBankPayload;
    expect(p.tiles).toHaveLength(3);
    expect([...p.tiles].sort()).toEqual(["ا", "ب", "ب"].sort());
  });

  test("the cue carries transliteration AND meaning", () => {
    const p = wordBankQuestions(set)[0].payload as WordBankPayload;
    expect(p.translit).toBe("bāb");
    expect(p.meaning).toBe("door");
  });
});

describe("WordBank", () => {
  test("one verdict per completed word, never per tile", async () => {
    // A tile placed with the word unfinished is not an answer to anything.
    const answer = vi.fn();
    render(<WordBank q={wordBankQuestions(set)[0]} api={{ answer, now: () => 1 }} />);
    const tiles = screen.getAllByTestId(/^tile-/);
    await userEvent.click(tiles[0]);
    expect(answer).not.toHaveBeenCalled();
    await userEvent.click(screen.getAllByTestId(/^tile-/)[0]);
    await userEvent.click(screen.getAllByTestId(/^tile-/)[0]);
    expect(answer).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run both, watch them fail** — modules do not exist.

- [ ] **Step 3: Implement `typeIt.tsx`**

```tsx
// src/games2/games/typeIt.tsx
"use client";
import { useState } from "react";
import { displayLetters } from "@/games/arabic";
import { registerGame } from "../registry";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "type-it";

export type TypeItPayload = { arabic: string; translit: string; meaning: string };

/**
 * Fold the transliteration to what the learner is actually being asked to
 * recall: the word, not a diacritic convention. `bāb`, `bab` and `baab` are the
 * same answer; `bayt` is not.
 */
export function normaliseTranslit(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // strip macrons and any other marks
    .replace(/([aiu])\1+/g, "$1")       // aa/ii/uu collapse to the short vowel
    .replace(/[^a-z']/g, "");
}

export function typeItQuestions(set: StudySet): Question[] {
  return set.words.flatMap((w) => {
    const conceptId = displayLetters(w.arabic)[0];
    if (!conceptId) return [];
    return [{
      conceptId,
      itemKey: `${GAME_ID}/${w.arabic}`,
      gameId: GAME_ID,
      payload: { arabic: w.arabic, translit: w.translit, meaning: w.meaning } satisfies TypeItPayload,
    }];
  });
}

export function TypeIt({ q, api }: { q: Question; api: GameApi }) {
  const p = q.payload as TypeItPayload;
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const done = verdict !== null;

  function check() {
    if (done || !value.trim()) return;
    const ok = normaliseTranslit(value) === normaliseTranslit(p.translit);
    setVerdict(ok);
    api.answer(ok);
  }

  return (
    <div className="text-center">
      <p className="arabic mb-2 text-5xl text-white">{p.arabic}</p>
      <p className="mb-4 text-sm text-white/60">“{p.meaning}” — type it in English letters</p>
      <input
        aria-label="transliteration"
        dir="ltr"
        value={value}
        disabled={done}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && check()}
        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-center text-white"
      />
      <div className="mt-3">
        <button
          type="button"
          disabled={done || !value.trim()}
          onClick={check}
          className="cta-primary rounded-full px-4 py-2 disabled:opacity-40"
        >
          Check
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-white/80">
        {!done ? "" : verdict ? `✓ ${p.translit}` : `✗ ${p.arabic} is written “${p.translit}”.`}
      </p>
    </div>
  );
}

registerGame({
  id: GAME_ID,
  label: "⌨️ Type it",
  mode: "production",
  cost: 1,
  graded: true,
  questions: typeItQuestions,
  render: (q, api) => <TypeIt q={q} api={api} />,
});
```

- [ ] **Step 4: Implement `wordBank.tsx`**

```tsx
// src/games2/games/wordBank.tsx
"use client";
import { useState } from "react";
import { displayLetters } from "@/games/arabic";
import { registerGame } from "../registry";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "word-bank";

export type WordBankPayload = { arabic: string; translit: string; meaning: string; tiles: string[] };

export function wordBankQuestions(set: StudySet): Question[] {
  return set.words.flatMap((w) => {
    const tiles = displayLetters(w.arabic);
    if (tiles.length < 2) return [];
    return [{
      conceptId: tiles[0],
      itemKey: `${GAME_ID}/${w.arabic}`,
      gameId: GAME_ID,
      payload: { arabic: w.arabic, translit: w.translit, meaning: w.meaning, tiles } satisfies WordBankPayload,
    }];
  });
}

/**
 * One verdict per COMPLETED word, never per tile.
 *
 * A tile placed while the word is unfinished is not right or wrong yet, and
 * grading it would put a claim in an append-only ledger that no observation
 * supports. This is the shape `word-builder` and `span-tapper` already have.
 */
export function WordBank({ q, api }: { q: Question; api: GameApi }) {
  const p = q.payload as WordBankPayload;
  // Sorted, not shuffled: a render-time shuffle mismatches the SSR markup.
  const [bank, setBank] = useState<string[]>(() => [...p.tiles].sort());
  const [built, setBuilt] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const done = verdict !== null;

  function place(i: number) {
    if (done) return;
    const tile = bank[i];
    const nextBank = bank.filter((_, j) => j !== i);
    const nextBuilt = [...built, tile];
    setBank(nextBank);
    setBuilt(nextBuilt);
    if (nextBank.length === 0) {
      const ok = nextBuilt.join("") === p.tiles.join("");
      setVerdict(ok);
      api.answer(ok);
    }
  }

  return (
    <div className="text-center">
      <p className="mb-1 text-white/80">
        Build <span className="font-semibold">{p.translit}</span> (“{p.meaning}”).
      </p>
      <p className="mb-4 text-xs text-white/50">Tap the letters in order, right to left.</p>

      <div dir="rtl" className="mb-4 min-h-16 rounded-xl border border-white/10 bg-white/5 p-2">
        <span className="arabic text-5xl text-white">{built.join("")}</span>
      </div>

      <div dir="rtl" className="flex flex-wrap justify-center gap-2">
        {bank.map((t, i) => (
          <button
            key={`${t}-${i}`}
            type="button"
            data-testid={`tile-${i}`}
            onClick={() => place(i)}
            className="arabic rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-4xl text-white"
          >
            {t}
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" className="mt-3 text-sm text-white/80">
        {!done ? "" : verdict ? `✓ ${p.arabic} — ${p.meaning}` : `✗ ${p.translit} is ${p.arabic}.`}
      </p>
    </div>
  );
}

registerGame({
  id: GAME_ID,
  label: "🧩 Word bank",
  mode: "production",
  cost: 1,
  graded: true,
  questions: wordBankQuestions,
  render: (q, api) => <WordBank q={q} api={api} />,
});
```

- [ ] **Step 5: Run both, pass.**

Run: `npm test -- src/games2/games/` — Expected: PASS.

- [ ] **Step 6: Create the barrel**

```ts
// src/games2/games/index.ts
// Side-effect barrel. `./tajweed` in the old tree records what happens without
// one: seven drills sat dead for weeks because nothing outside their own tests
// imported them, and every test passed the whole time.
import "./brokenForm";
import "./match";
import "./wordBank";
import "./typeIt";

export const SLICE_GAME_IDS = ["broken-form", "match", "word-bank", "type-it"] as const;
```

- [ ] **Step 7: Commit**

```bash
git add src/games2/games/
git commit -m "feat(games2): word bank and type it — the two production games"
```

---

## Task 7: The anti-shallowness contract test

The test that makes the owner's complaint a red build. Written before the surfaces so that they are built against it.

**Files:**
- Create: `src/games2/contract.test.ts`

**Interfaces:**
- Consumes: `allGames`, `questionsFor` from `./registry`; `lessonSet` from `./studySet`; `SLICE_GAME_IDS` from `./games`.

- [ ] **Step 1: Write the failing test**

```ts
// src/games2/contract.test.ts
import { describe, expect, test } from "vitest";
import { isConceptId } from "@/practice/concepts";
import "./games";
import { SLICE_GAME_IDS } from "./games";
import { allGames, questionsFor } from "./registry";
import { lessonSet } from "./studySet";
import { MODE_RANK } from "./types";

const SET = lessonSet("2-08");

describe("every registered game", () => {
  test("declares a mode, a cost and whether it grades", () => {
    for (const g of allGames()) {
      expect(MODE_RANK[g.mode]).toBeGreaterThanOrEqual(0);
      expect(g.cost).toBeGreaterThanOrEqual(1);
      expect(typeof g.graded).toBe("boolean");
    }
  });

  test("produces questions whose conceptId the scheduler can act on", () => {
    for (const g of allGames()) {
      for (const q of g.questions(SET)) expect(isConceptId(q.conceptId)).toBe(true);
    }
  });

  test("returns [] for an empty set rather than throwing", () => {
    const empty = { ...SET, letters: [], words: [], forms: [], rules: [] };
    for (const g of allGames()) expect(g.questions(empty)).toEqual([]);
  });
});

describe("the slice is not shallow", () => {
  const questions = questionsFor([...SLICE_GAME_IDS], SET, { gradedOnly: true });

  test("a Unit 1 set yields at least 3 distinct games", () => {
    // The owner played a session that offered two games in one mode band and
    // called it "guess the letter". This is that complaint, as a gate.
    expect(new Set(questions.map((q) => q.gameId)).size).toBeGreaterThanOrEqual(3);
  });

  test("and at least 2 distinct response modes", () => {
    const modes = new Set(allGames().filter((g) => questions.some((q) => q.gameId === g.id)).map((g) => g.mode));
    expect(modes.size).toBeGreaterThanOrEqual(2);
  });

  test("and reaches production, which the old session never did in 5 items", () => {
    const production = allGames().filter((g) => g.mode === "production").map((g) => g.id);
    expect(questions.some((q) => production.includes(q.gameId))).toBe(true);
  });
});

describe("no game reads a clock it was not given", () => {
  test("no source file in games2 calls Date.now directly", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "src/games2/games");
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
      expect(readFileSync(join(dir, f), "utf8")).not.toMatch(/Date\.now\(\)/);
    }
  });
});
```

- [ ] **Step 2: Run it.**

Run: `npm test -- src/games2/contract.test.ts`
Expected: PASS. If "at least 3 distinct games" fails, a game is producing no questions from real content — fix that game rather than lowering the threshold.

- [ ] **Step 3: Commit**

```bash
git add src/games2/contract.test.ts
git commit -m "test(games2): the anti-shallowness contract — 3 games, 2 modes, reaches production"
```

---

## Task 8: The set screen

**Files:**
- Create: `src/components/practice/SetScreen.tsx`, `src/components/practice/SetScreen.test.tsx`, `src/app/study/[id]/page.tsx`

**Interfaces:**
- Consumes: `questionsFor`, `getGame`, `lessonSet`, `SLICE_GAME_IDS`, `appendAttempt` from `@/practice/ledger`, `attemptFromResult` is NOT used (that builds from the old `GameResult`).
- Produces: `SetScreen({ set })`, and `/study/<lessonId>`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/practice/SetScreen.test.tsx
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { allAttempts } from "@/practice/ledger";
import { lessonSet } from "@/games2/studySet";
import "@/games2/games";
import { SetScreen } from "./SetScreen";

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });

describe("SetScreen", () => {
  test("offers a mode per graded game", async () => {
    render(<SetScreen set={lessonSet("2-08")} />);
    expect(await screen.findByRole("button", { name: /match/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /broken form/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /word bank/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /type it/i })).toBeTruthy();
  });

  test("answering on the set screen writes a real ledger row", async () => {
    // The gap this closes: free practice previously recorded NOTHING, because
    // GameResult carried no conceptId and inventing one is forbidden.
    const user = userEvent.setup();
    render(<SetScreen set={lessonSet("2-08")} />);
    await user.click(await screen.findByRole("button", { name: /match/i }));

    const band = await screen.findByTestId("set-drill");
    const option = within(band).getAllByRole("button").find((b) => b.getAttribute("aria-disabled") !== "true");
    await user.click(option!);

    await waitFor(async () => expect((await allAttempts()).length).toBeGreaterThan(0));
    const rows = await allAttempts();
    expect(rows[0].sessionId).toMatch(/^set:/);
    expect(rows[0].isInterleaved).toBe(false);
  });

  test("leaving a mode returns to the mode list", async () => {
    const user = userEvent.setup();
    render(<SetScreen set={lessonSet("2-08")} />);
    await user.click(await screen.findByRole("button", { name: /match/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(await screen.findByRole("button", { name: /broken form/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — component does not exist.

- [ ] **Step 3: Implement `SetScreen.tsx`**

```tsx
// src/components/practice/SetScreen.tsx
"use client";
import { useMemo, useState } from "react";
import { getGame, questionsFor } from "@/games2/registry";
import { SLICE_GAME_IDS } from "@/games2/games";
import type { Question, StudySet } from "@/games2/types";
import { appendAttempt } from "@/practice/ledger";

/**
 * The Quizlet surface: pick a set, pick a mode, play it.
 *
 * Learner-initiated and unscheduled — nothing here consults FSRS. It still
 * records, because a `Question` carries its own `conceptId`; that is the whole
 * reason free practice can finally feed the scheduler instead of being thrown
 * away.
 */
export function SetScreen({ set }: { set: StudySet }) {
  const [mode, setMode] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [sessionId] = useState(() => `set:${set.id}:${crypto.randomUUID()}`);

  const questions = useMemo(
    () => (mode ? questionsFor([mode], set, { gradedOnly: true }) : []),
    [mode, set],
  );
  const spec = mode ? getGame(mode) : undefined;
  const current: Question | undefined = questions[index];

  function record(q: Question, correct: boolean | null, at: number) {
    void appendAttempt({
      id: crypto.randomUUID(),
      at,
      conceptId: q.conceptId,
      itemKey: q.itemKey,
      gameId: q.gameId,
      correct,
      sessionId,
      isInterleaved: false,
    }).catch(() => {
      // A lost row beats a lost turn — the same failure mode `useSession` takes.
    });
    setIndex((i) => i + 1);
  }

  if (!mode || !spec) {
    return (
      <section className="glass rounded-2xl p-4 sm:p-5">
        <h2 className="mb-1 text-xl font-semibold text-white/90">{set.title}</h2>
        <p className="mb-4 text-sm text-white/60">Pick a way to drill this lesson.</p>
        <div className="flex flex-wrap gap-2">
          {SLICE_GAME_IDS.map((id) => {
            const g = getGame(id);
            if (!g || !g.graded) return null;
            const n = questionsFor([id], set, { gradedOnly: true }).length;
            if (n === 0) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => { setMode(id); setIndex(0); }}
                className="cta-secondary rounded-full px-4 py-2 text-sm"
              >
                {g.label} <span className="text-white/40">({n})</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-white/60">
          {spec.label} · <bdi dir="ltr">{Math.min(index + 1, questions.length)}/{questions.length}</bdi>
        </span>
        <button type="button" onClick={() => setMode(null)} className="cta-secondary rounded-full px-3 py-1 text-sm">
          Done
        </button>
      </div>
      <div data-testid="set-drill">
        {current ? (
          <div key={current.itemKey}>
            {spec.render(current, {
              answer: (correct) => record(current, correct, Date.now()),
              now: () => Date.now(),
            })}
          </div>
        ) : (
          <p className="text-white/80">Set complete.</p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add the route**

```tsx
// src/app/study/[id]/page.tsx
import { allLessonIds } from "@/content/load";
import { lessonSet } from "@/games2/studySet";
import { SetScreen } from "@/components/practice/SetScreen";
// Side-effect: register the slice games so the registry is populated.
import "@/games2/games";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const set = lessonSet(id);
  return (
    <main className="mx-auto max-w-2xl p-6 pb-16">
      <h1 className="gradient-text mb-4 text-2xl font-bold">Study — {set.title}</h1>
      <SetScreen set={set} />
    </main>
  );
}
```

- [ ] **Step 5: Run, pass.**

Run: `npm test -- src/components/practice/SetScreen.test.tsx` — Expected: PASS (3 tests).

- [ ] **Step 6: Full gate + commit**

```bash
npm test && npm run lint && npx tsc --noEmit && npm run check:library && npm run build
git add src/components/practice/SetScreen.tsx src/components/practice/SetScreen.test.tsx "src/app/study/[id]/page.tsx"
git commit -m "feat(practice): the set screen — free practice finally records"
```

---

## Task 9: Move the session onto Questions

**Files:**
- Modify: `src/practice/session.ts`, `src/practice/useSession.ts`, `src/components/practice/SessionRunner.tsx`, `src/components/practice/PracticeSession.tsx`
- Modify tests: `src/practice/session.test.ts`, `src/practice/useSession.test.ts`, `src/components/practice/SessionRunner.test.tsx`, `src/components/practice/PracticeSession.test.tsx`

**Interfaces:**
- Consumes: `Question`, `GameSpec`, `MODE_RANK`, `getGame`, `questionsFor`.
- Produces: `planSession(schedules, states, questions: readonly Question[], now, opts): SessionPlan` where `SessionPlan = { focusConceptId: string | null; items: PlannedQuestion[]; slots: number }` and `PlannedQuestion = Question & { mode: ResponseMode; slots: number; isInterleaved: boolean }`.

- [ ] **Step 1: Update the session's failing test**

```ts
// src/practice/session.test.ts — replace the poolFor helper and shape tests.
// `shapeOf`, `DRILL_MODES` and `TIMED_GAME_IDS` no longer exist: a question's
// mode and cost come from its game's spec.
import { getGame } from "@/games2/registry";

function questionsFor2(conceptIds: readonly string[], gameIds: readonly string[], per = 3) {
  const out = [];
  for (const conceptId of conceptIds) {
    for (const gameId of gameIds) {
      for (let n = 1; n <= per; n += 1) {
        out.push({ conceptId, itemKey: `${gameId}/${conceptId}/${n}`, gameId, payload: {} });
      }
    }
  }
  return out;
}

test("a planned item carries the mode and cost its game declares", () => {
  const plan = planSession(schedules, states, questionsFor2(["ب"], ["match"]), NOW);
  for (const item of plan.items) {
    expect(item.mode).toBe(getGame(item.gameId)!.mode);
    expect(item.slots).toBe(getGame(item.gameId)!.cost);
  }
});
```

- [ ] **Step 2: Run it, watch it fail** — `planSession` still takes `PoolItem[]`.

- [ ] **Step 3: Change `session.ts`**

Delete `DRILL_MODES`, `UNGRADED_GAME_IDS`, `shapeOf`, `TIMED_GAME_IDS` and `PoolItem`. Replace every `shapeOf(item.gameId)` with a lookup:

```ts
import { getGame } from "@/games2/registry";
import type { Question, ResponseMode } from "@/games2/types";

export type PlannedQuestion = Question & {
  mode: ResponseMode;
  slots: number;
  isInterleaved: boolean;
};

/** A question whose game is not registered cannot be planned — it cannot render. */
function shapeOfQuestion(q: Question): { mode: ResponseMode; slots: number } | null {
  const spec = getGame(q.gameId);
  if (!spec || !spec.graded) return null;
  return { mode: spec.mode, slots: spec.cost };
}
```

`conceptRoster` now reads `Question[]`; its body is unchanged apart from the parameter type. `planSession`'s grouping key stays `conceptId`, and its dedup set stays `itemKey`.

- [ ] **Step 4: Change `useSession.ts` and `SessionRunner.tsx`**

`useSession` holds `PlannedQuestion` instead of `PlannedItem`; the tail draws a different `itemKey` for the same `conceptId` exactly as before. **Its `record` changes signature** — it used to take a `GameResult` and pair it with the planned item, and now takes the question and a verdict, because the question already carries everything the row needs:

```ts
// before: record(result: GameResult)
// after:
record: (q: PlannedQuestion, correct: boolean | null, detail?: AnswerDetail) => void
```

The `Attempt` is built from `q.conceptId`, `q.itemKey`, `q.gameId` and `q.isInterleaved` directly — nothing is inferred, and `attemptFromResult` in `src/practice/attempt.ts` is no longer used by this path. Leave that module in place: the seven tajweed drills still go through it until the widening phase.

`SessionRunner` resolves through the new registry and passes a `GameApi`:

```tsx
const spec = current ? getGame(current.gameId) : undefined;
// ...
{spec ? spec.render(current, {
  answer: (correct) => runner.record(current, correct),
  now: () => Date.now(),
}) : <p className="text-white/50">هذا التمرين غير متاح بعد · this drill has not shipped yet</p>}
```

`runner.record` builds the `Attempt` from the question directly — `conceptId`, `itemKey` and `gameId` all come off the question, so nothing is inferred.

- [ ] **Step 5: Change `PracticeSession.tsx`**

Keep the `data: GameData` prop exactly as it is — the page is a server component and passes derived data, and changing that prop would ripple into the route for no gain. Build the set *inside* the component and replace `sessionPool` with the registry call:

```ts
import { questionsFor } from "@/games2/registry";
import { SLICE_GAME_IDS } from "@/games2/games";
import { setFromGameData } from "@/games2/studySet";

const set = useMemo(() => setFromGameData(data, data.lessonId), [data]);
const questions = useMemo(
  () => questionsFor([...SLICE_GAME_IDS], set, { gradedOnly: true }),
  [set],
);
```

Delete the exported `sessionPool` and its four tests in `PracticeSession.test.tsx`; the behaviour they asserted — a non-empty pool whose items carry their own game id — is now covered by `contract.test.ts`, which checks it against every registered game rather than one hand-built list.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS. Every test that referenced `shapeOf`, `DRILL_MODES`, `UNGRADED_GAME_IDS`, `TIMED_GAME_IDS` or `PoolItem` must be updated, not deleted — each one is asserting a real behaviour that still exists, only relocated.

- [ ] **Step 7: Full gate + commit**

```bash
npm test && npm run lint && npx tsc --noEmit && npm run check:library && npm run build
git add src/practice/ src/components/practice/
git commit -m "refactor(practice): the session plans over Questions, not PoolItems"
```

---

## Task 10: Wire the slice and prove it end to end

**Files:**
- Modify: `src/app/practice/[id]/page.tsx`
- Create: `src/components/practice/slice.test.tsx`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/practice/slice.test.tsx
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { allAttempts } from "@/practice/ledger";
import { lessonSet } from "@/games2/studySet";
import "@/games2/games";
import { PracticeSession } from "./PracticeSession";
import { deriveGameData } from "@/games/derive";
import { allLessons } from "@/content/load";

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });

describe("the slice, end to end", () => {
  test("a started session offers more than one kind of game", async () => {
    // The owner's actual complaint, asserted on the real screen.
    const user = userEvent.setup();
    render(<PracticeSession data={deriveGameData(allLessons(), "2-08")} games={[]} />);
    await user.click(await screen.findByTestId("start-review"));

    const seen = new Set<string>();
    for (let i = 0; i < 6; i += 1) {
      const band = await screen.findByTestId("drill-band");
      const gameId = band.getAttribute("data-game-id");
      if (gameId) seen.add(gameId);
      const btn = within(band).getAllByRole("button").find((b) => b.getAttribute("aria-disabled") !== "true");
      if (!btn) break;
      await user.click(btn);
      const cont = screen.queryByRole("button", { name: "متابعة" });
      if (cont && !cont.hasAttribute("disabled")) await user.click(cont);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  test("answers land in the ledger with the concept the question named", async () => {
    const user = userEvent.setup();
    render(<PracticeSession data={deriveGameData(allLessons(), "2-08")} games={[]} />);
    await user.click(await screen.findByTestId("start-review"));
    const band = await screen.findByTestId("drill-band");
    const btn = within(band).getAllByRole("button").find((b) => b.getAttribute("aria-disabled") !== "true");
    await user.click(btn!);

    await waitFor(async () => expect((await allAttempts()).length).toBeGreaterThan(0));
    const concepts = new Set(lessonSet("2-08").letters.map((l) => l.arabic));
    for (const row of await allAttempts()) expect(concepts.has(row.conceptId)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — the session still mounts old-registry games.

- [ ] **Step 3: Add the study link to the practice page**

```tsx
// src/app/practice/[id]/page.tsx — after the <h1>
<a href={`/study/${id}`} className="cta-secondary mb-4 inline-block rounded-full px-4 py-2 text-sm">
  📚 Study this set
</a>
```

Replace the old barrel imports with `import "@/games2/games";`. Leave `import "@/components/games/tajweed";` in place — those seven drills are not ported in this slice and the import is what keeps them registered.

- [ ] **Step 4: Run, pass.**

Run: `npm test -- src/components/practice/slice.test.tsx` — Expected: PASS (2 tests).

- [ ] **Step 5: Manual verification — the step that catches what tests cannot**

```bash
npm run dev
```

Open `http://localhost:3000/practice/2-08` and confirm, by playing:

1. Starting a session shows **at least three different games**, not five variants of one.
2. A wrong answer states what was wrong, in words, naming the letter.
3. `/study/2-08` lists four modes with question counts, and each is playable.
4. Answering on `/study/2-08`, then reloading `/practice/2-08`, changes the due count — free practice really does feed the scheduler.
5. Match shows a running timer.

The practice engine shipped fully built and mounted nowhere while 933 tests passed, because unit tests cannot see a missing connection. **Do not skip this step.**

- [ ] **Step 6: Full gate + commit**

```bash
npm test && npm run lint && npx tsc --noEmit && npm run check:library && npm run build
git add -A src/
git commit -m "feat(practice): wire the slice — four games, two surfaces, one ledger"
```

---

## Out of scope (deliberately)

- **Porting the seven tajweed drills.** They stay on the old registry; the slice mounts none of them. First job of the widening phase, which also deletes `src/components/games/GameRegistry.ts`.
- **The other 73 lessons.** Mechanical once the feel is judged right.
- **Learn and Test modes** on the set screen. They are compositions over `questions()` and cost nothing structurally — but the slice exists to judge feel, and four games plus one mode-picker is enough to judge it.
- **Cards** on the set screen. The spec lists it as an ungraded mode, and `graded: false` exists on `GameSpec` to carry it — but the two flashcard decks live in the old registry and are not ported here. The field is proved instead by `registry.test.ts`, so the behaviour is guaranteed before anything depends on it.
- **Audio-dependent games.** Recording is skipped by owner decision (2026-08-12).
- **The mandatory end-of-lesson check.** Reuses this contract; easier once it exists.
- **Sound effects.** Wishlisted separately.
