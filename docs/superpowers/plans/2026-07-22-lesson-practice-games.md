# Lesson Practice Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add self-checking practice games (letter/word flashcards, letter quiz, form swap, word builder, spot-the-letter) derived from existing lesson JSON, injected into lesson slide decks and the practice page.

**Architecture:** A pure derivation module (`src/games/`) computes per-lesson game data (cumulative letter pool, form entries, filtered word pool) from ordered lesson content at build time. Client game components under `src/components/games/` render it with green-lock / shake feedback; a tabbed `GamePanel` hosts them. The zod content schema and lesson JSON are untouched — a TS-only `DeckSlide` union injects one games slide per lesson deck.

**Tech Stack:** Next.js 16 (static export), React 19 client components, Tailwind 4 + custom globals.css classes, vitest + @testing-library/react (jsdom).

**Spec:** `docs/superpowers/specs/2026-07-22-lesson-practice-games-design.md`

## Global Constraints

- No changes to `src/content/schema.ts` or any `content/**/*.json`.
- All game state is ephemeral — no localStorage, no persistence.
- Shuffling only happens in `useEffect` after mount (site is statically exported; no hydration mismatch).
- Form swap game is gated to lessons ≥ `1-07`.
- Word pool for lesson N only contains words whose base letters are all taught in lessons 1..N.
- Existing test suite stays green: `npm test`, `npm run lint`, `npm run build` all pass at the end.
- Repo path contains a space — always quote paths in shell commands. Never `git add` the modified `public/images/**` files (unrelated in-progress work); always add specific file paths.
- Match existing styling idiom: `glass` cards, `cta-primary` / `cta-secondary` buttons, `arabic` font class, `text-white/NN` opacities, `dir="rtl"` for Arabic rows.

---

### Task 0: Branch

- [ ] **Step 0.1: Create the feature branch**

```bash
cd "/Users/scorpionn/Desktop/Tajweed Course"
git checkout -b feat/practice-games
```

Expected: `Switched to a new branch 'feat/practice-games'`. (Uncommitted `public/images` modifications will carry over — leave them alone.)

---

### Task 1: Arabic text helpers (`src/games/arabic.ts`)

**Files:**
- Create: `src/games/arabic.ts`
- Test: `src/games/arabic.test.ts`

**Interfaces:**
- Produces: `stripDiacritics(s: string): string`, `baseLetters(word: string): string[]`, `contextualGlyphs(word: string): string[]`, `NON_CONNECTORS: Set<string>`. Later tasks (derive, WordBuilder, SpotTheLetter, GamePanel) import these.

- [ ] **Step 1.1: Write the failing test**

Create `src/games/arabic.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { baseLetters, contextualGlyphs, NON_CONNECTORS, stripDiacritics } from "./arabic";

const ZWJ = "\u200D";

describe("stripDiacritics", () => {
  test("removes harakat and tatweel", () => {
    expect(stripDiacritics("شَمْس")).toBe("شمس");
    expect(stripDiacritics("خُبْز")).toBe("خبز");
    expect(stripDiacritics("بـ")).toBe("ب"); // tatweel stripped
  });
  test("leaves bare letters unchanged", () => {
    expect(stripDiacritics("باب")).toBe("باب");
  });
});

describe("baseLetters", () => {
  test("splits a voweled word into base letters", () => {
    expect(baseLetters("شَمْس")).toEqual(["ش", "م", "س"]);
  });
  test("maps hamza-carriers and variants to taught base letters", () => {
    expect(baseLetters("أَب")).toEqual(["ا", "ب"]);
    expect(baseLetters("مُؤْمِن")).toEqual(["م", "و", "م", "ن"]);
  });
});

describe("contextualGlyphs", () => {
  test("wraps joining letters in ZWJ so isolated spans keep shape", () => {
    // شمس: ش joins forward, م joins both sides, س joins backward only
    expect(contextualGlyphs("شَمْس")).toEqual([`ش${ZWJ}`, `${ZWJ}م${ZWJ}`, `${ZWJ}س`]);
  });
  test("never joins after a non-connector", () => {
    // باب: ب joins forward, ا never connects forward, so final ب stays isolated
    expect(contextualGlyphs("باب")).toEqual([`ب${ZWJ}`, `${ZWJ}ا`, "ب"]);
  });
  test("exposes the six non-connectors", () => {
    expect([...NON_CONNECTORS].sort()).toEqual(["ا", "د", "ذ", "ر", "ز", "و"].sort());
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `npm test -- src/games/arabic.test.ts`
Expected: FAIL — cannot resolve `./arabic`.

- [ ] **Step 1.3: Write the implementation**

Create `src/games/arabic.ts`:

```ts
// Text helpers for the practice games — harakat stripping, base-letter
// normalization, and ZWJ contextual shaping (spec §1, §4).

// Tatweel + fathatan..sukun + dagger alif.
const DIACRITICS = /[ـً-ْٰ]/g;

export function stripDiacritics(s: string): string {
  return s.replace(DIACRITICS, "");
}

// The six letters that never connect forward (lesson 1-08).
export const NON_CONNECTORS = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);

// Hamza-carriers / variants → the base letter taught in the lessons.
const BASE_MAP: Record<string, string> = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ؤ": "و",
  "ئ": "ي",
  "ى": "ي",
};

export function baseLetters(word: string): string[] {
  return [...stripDiacritics(word)].map((c) => BASE_MAP[c] ?? c);
}

const ZWJ = "\u200D";

// Each letter of a word as its own string, ZWJ-padded so that rendering the
// letters in separate <button>s preserves the joined contextual forms.
// Diacritics are stripped (games read unvoweled, like lessons 1-07–1-09).
export function contextualGlyphs(word: string): string[] {
  const letters = [...stripDiacritics(word)];
  return letters.map((ch, i) => {
    const joinsPrev = i > 0 && !NON_CONNECTORS.has(letters[i - 1]);
    const joinsNext = i < letters.length - 1 && !NON_CONNECTORS.has(ch);
    return `${joinsPrev ? ZWJ : ""}${ch}${joinsNext ? ZWJ : ""}`;
  });
}
```

- [ ] **Step 1.4: Run test to verify it passes**

Run: `npm test -- src/games/arabic.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 1.5: Commit**

```bash
git add src/games/arabic.ts src/games/arabic.test.ts
git commit -m "feat: arabic text helpers for practice games"
```

---

### Task 2: Game data derivation (`src/games/derive.ts` + `allLessons()`)

**Files:**
- Create: `src/games/derive.ts`
- Modify: `src/content/load.ts` (append one function)
- Test: `src/games/derive.test.ts`

**Interfaces:**
- Consumes: `baseLetters` from Task 1; `Lesson`, `ArabicItem` types from `@/content/schema`; `allLessonIds`, `loadLesson` from `@/content/load`.
- Produces:
  - `allLessons(): Lesson[]` in `@/content/load`.
  - In `@/games/derive`: `type FormKey = "isolated" | "initial" | "medial" | "final"`; `type FormEntry = { item: ArabicItem; forms: Partial<Record<FormKey, string>> }`; `type WordEntry = { arabic: string; translit: string; meaning: string }`; `type GameData = { lessonId: string; newLetters: ArabicItem[]; letterPool: ArabicItem[]; formEntries: FormEntry[]; wordPool: WordEntry[]; formsTaught: boolean }`; `deriveGameData(lessons: Lesson[], lessonId: string): GameData`.

- [ ] **Step 2.1: Write the failing test**

Create `src/games/derive.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import type { Lesson } from "@/content/schema";
import { allLessons } from "@/content/load";
import { deriveGameData } from "./derive";

const cue = { type: "teacher-voice" as const, cue: "cue" };

function letterSlide(arabic: string, extra: Record<string, unknown> = {}) {
  return {
    kind: "letter" as const,
    item: { arabic, name: `name-${arabic}`, audio: cue },
    makhraj: "m",
    notes: [],
    ...extra,
  };
}

// Cast: derive only reads `id` and `slides`; full zod-valid lessons need 8+ slides.
function lesson(id: string, slides: unknown[]): Lesson {
  return { id, slides } as unknown as Lesson;
}

const fixtures: Lesson[] = [
  lesson("1-01", [
    letterSlide("ب", {
      forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
      examples: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
    }),
    letterSlide("ا"),
  ]),
  lesson("1-02", [
    letterSlide("ت", {
      forms: { isolated: "ت", final: "ـت" }, // only 2 forms → no formEntry
      examples: [
        { arabic: "تَاب", translit: "tāb", meaning: "repented" },
        { arabic: "تَمْر", translit: "tamr", meaning: "dates" }, // م not taught → excluded
      ],
    }),
    letterSlide("ب"), // duplicate → deduped
  ]),
  lesson("1-07", [letterSlide("م", { forms: { isolated: "م", initial: "مـ", medial: "ـمـ", final: "ـم" } })]),
];

describe("deriveGameData (fixtures)", () => {
  test("letterPool is cumulative and deduped; newLetters is this lesson only", () => {
    const d = deriveGameData(fixtures, "1-02");
    expect(d.letterPool.map((i) => i.arabic)).toEqual(["ب", "ا", "ت"]);
    expect(d.newLetters.map((i) => i.arabic)).toEqual(["ت", "ب"]);
  });
  test("wordPool only admits words whose base letters are all learned", () => {
    const d1 = deriveGameData(fixtures, "1-01");
    expect(d1.wordPool.map((w) => w.arabic)).toEqual(["بَاب"]);
    const d2 = deriveGameData(fixtures, "1-02");
    expect(d2.wordPool.map((w) => w.arabic)).toEqual(["بَاب", "تَاب"]); // تمر still excluded
    const d7 = deriveGameData(fixtures, "1-07");
    expect(d7.wordPool.map((w) => w.arabic)).toContain("تَمْر"); // م now learned
  });
  test("formEntries require >=3 forms", () => {
    const d = deriveGameData(fixtures, "1-02");
    expect(d.formEntries.map((f) => f.item.arabic)).toEqual(["ب"]);
  });
  test("formsTaught flips at 1-07", () => {
    expect(deriveGameData(fixtures, "1-02").formsTaught).toBe(false);
    expect(deriveGameData(fixtures, "1-07").formsTaught).toBe(true);
  });
  test("unknown lesson id throws", () => {
    expect(() => deriveGameData(fixtures, "9-99")).toThrow(/Unknown lesson/);
  });
});

describe("deriveGameData (real content)", () => {
  test("lesson 1-03 has 13 cumulative letters and only fully-learned words", () => {
    const d = deriveGameData(allLessons(), "1-03");
    expect(d.letterPool).toHaveLength(13);
    const words = d.wordPool.map((w) => w.arabic);
    expect(words).toContain("خُبْز"); // خ ب ز all taught by 1-03
    expect(words).not.toContain("رَجُل"); // ل taught in 1-06
    expect(words).not.toContain("سَمَك"); // م ك taught in 1-06
  });
  test("lesson 1-06 has all 28 letters", () => {
    expect(deriveGameData(allLessons(), "1-06").letterPool).toHaveLength(28);
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

Run: `npm test -- src/games/derive.test.ts`
Expected: FAIL — cannot resolve `./derive` / `allLessons` not exported.

- [ ] **Step 2.3: Add `allLessons()` to the loader**

In `src/content/load.ts`, append after `loadLesson`:

```ts
export function allLessons(): Lesson[] {
  return allLessonIds().map((id) => loadLesson(id));
}
```

- [ ] **Step 2.4: Write the derivation module**

Create `src/games/derive.ts`:

```ts
// Build-time derivation of per-lesson game data from lesson content (spec §1).
import type { ArabicItem, Lesson } from "@/content/schema";
import { baseLetters } from "./arabic";

export type FormKey = "isolated" | "initial" | "medial" | "final";
export type FormEntry = { item: ArabicItem; forms: Partial<Record<FormKey, string>> };
export type WordEntry = { arabic: string; translit: string; meaning: string };

export type GameData = {
  lessonId: string;
  newLetters: ArabicItem[];
  letterPool: ArabicItem[];
  formEntries: FormEntry[];
  wordPool: WordEntry[];
  formsTaught: boolean;
};

// Forms are taught in lesson 1-07; the form-swap game is gated until then.
const FORMS_TAUGHT_FROM = "1-07";

export function deriveGameData(lessons: Lesson[], lessonId: string): GameData {
  const ordered = [...lessons].sort((a, b) => a.id.localeCompare(b.id));
  const idx = ordered.findIndex((l) => l.id === lessonId);
  if (idx === -1) throw new Error(`Unknown lesson id: ${lessonId}`);

  const letterPool: ArabicItem[] = [];
  const formEntries: FormEntry[] = [];
  const words = new Map<string, WordEntry>();
  const seen = new Set<string>();

  for (const l of ordered.slice(0, idx + 1)) {
    for (const slide of l.slides) {
      if (slide.kind !== "letter") continue;
      if (!seen.has(slide.item.arabic)) {
        seen.add(slide.item.arabic);
        letterPool.push(slide.item);
        const forms = slide.forms ?? {};
        if (Object.values(forms).filter(Boolean).length >= 3) {
          formEntries.push({ item: slide.item, forms });
        }
      }
      for (const ex of slide.examples ?? []) {
        if (!words.has(ex.arabic)) {
          words.set(ex.arabic, { arabic: ex.arabic, translit: ex.translit, meaning: ex.meaning });
        }
      }
    }
  }

  const learned = new Set(letterPool.map((it) => it.arabic));
  const wordPool = [...words.values()].filter((w) => baseLetters(w.arabic).every((c) => learned.has(c)));
  const newLetters = ordered[idx].slides.flatMap((s) => (s.kind === "letter" ? [s.item] : []));

  return {
    lessonId,
    newLetters,
    letterPool,
    formEntries,
    wordPool,
    formsTaught: lessonId.localeCompare(FORMS_TAUGHT_FROM) >= 0,
  };
}
```

- [ ] **Step 2.5: Run test to verify it passes**

Run: `npm test -- src/games/derive.test.ts`
Expected: PASS. Note: if the real-content assertions fail, inspect actual content (e.g. `1-02` letter slides) rather than loosening blindly — the fixture tests are the contract; real-content tests document reality and may be adjusted to match actual lesson JSON.

- [ ] **Step 2.6: Run the loader's existing tests**

Run: `npm test -- src/content/load.test.ts`
Expected: PASS (no regression).

- [ ] **Step 2.7: Commit**

```bash
git add src/games/derive.ts src/games/derive.test.ts src/content/load.ts
git commit -m "feat: derive per-lesson game data from lesson content"
```

---

### Task 3: Feedback CSS + swap-puzzle hook

**Files:**
- Modify: `src/app/globals.css` (append)
- Create: `src/components/games/useSwapPuzzle.ts`
- Test: `src/components/games/useSwapPuzzle.test.ts`

**Interfaces:**
- Produces:
  - CSS classes `.game-shake` (one-shot shake animation) and `.game-correct` (green locked state).
  - `shuffled<T>(arr: readonly T[]): T[]` — Fisher–Yates copy.
  - `shuffledUnsolved(values: readonly string[]): number[]` — permutation of indices, guaranteed not value-solved when ≥2 distinct values.
  - `useSwapPuzzle(values: string[], round: number): SwapPuzzle` where `SwapPuzzle = { order: number[] | null; selected: number | null; shake: { slot: number; n: number } | null; solved: boolean; select: (slot: number) => void }`. Slot `i` is correct when `values[order[i]] === values[i]` (value equality, so duplicate letters in words behave correctly). `select` implements tap-two-to-swap; a swap producing no newly-correct slot sets `shake` on the second slot; already-correct slots are locked.

- [ ] **Step 3.1: Append feedback styles to globals.css**

Append to `src/app/globals.css`:

```css
/* ── Practice-game feedback (GamePanel and friends) ── */
@keyframes game-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.game-shake { animation: game-shake 0.35s ease-in-out; }
.game-correct {
  border-color: rgb(74 222 128 / 0.7);
  background: rgb(34 197 94 / 0.15);
  box-shadow: 0 0 14px rgb(74 222 128 / 0.3);
}
@media (prefers-reduced-motion: reduce) {
  .game-shake { animation: none; }
}
```

- [ ] **Step 3.2: Write the failing hook test**

Create `src/components/games/useSwapPuzzle.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { shuffled, shuffledUnsolved, useSwapPuzzle } from "./useSwapPuzzle";

afterEach(() => vi.restoreAllMocks());

// With Math.random mocked to 0, Fisher–Yates rotates the array left by one:
// shuffled([0,1,2,3]) === [1,2,3,0]. Tests rely on this.
describe("shuffled / shuffledUnsolved", () => {
  test("mocked random=0 rotates left by one", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(shuffled([0, 1, 2, 3])).toEqual([1, 2, 3, 0]);
  });
  test("shuffledUnsolved never returns a value-solved order for distinct values", () => {
    for (let i = 0; i < 50; i++) {
      const order = shuffledUnsolved(["a", "b", "c"]);
      expect(order.some((tile, slot) => ["a", "b", "c"][tile] !== ["a", "b", "c"][slot])).toBe(true);
    }
  });
  test("all-identical values return identity instead of looping forever", () => {
    expect(shuffledUnsolved(["x", "x"])).toEqual([0, 1]);
  });
});

describe("useSwapPuzzle", () => {
  test("good swap locks a slot; solving flips solved", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // initial order [1,2,0] for 3 values
    const { result } = renderHook(() => useSwapPuzzle(["A", "B", "C"], 0));
    expect(result.current.order).toEqual([1, 2, 0]);
    expect(result.current.solved).toBe(false);
    act(() => result.current.select(0));
    act(() => result.current.select(2)); // [0,2,1] — slot 0 now correct
    expect(result.current.order).toEqual([0, 2, 1]);
    expect(result.current.shake).toBeNull();
    act(() => result.current.select(0)); // locked correct slot — no selection
    expect(result.current.selected).toBeNull();
    act(() => result.current.select(1));
    act(() => result.current.select(2)); // [0,1,2] — solved
    expect(result.current.solved).toBe(true);
  });
  test("fruitless swap shakes the second slot", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // initial order [1,2,3,0] for 4 values
    const { result } = renderHook(() => useSwapPuzzle(["A", "B", "C", "D"], 0));
    act(() => result.current.select(0));
    act(() => result.current.select(2)); // [3,2,1,0] — nothing newly correct
    expect(result.current.shake?.slot).toBe(2);
    expect(result.current.solved).toBe(false);
  });
  test("round change reshuffles", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result, rerender } = renderHook(({ r }) => useSwapPuzzle(["A", "B", "C"], r), {
      initialProps: { r: 0 },
    });
    act(() => result.current.select(0));
    rerender({ r: 1 });
    expect(result.current.order).toEqual([1, 2, 0]);
    expect(result.current.selected).toBeNull();
  });
});
```

- [ ] **Step 3.3: Run test to verify it fails**

Run: `npm test -- src/components/games/useSwapPuzzle.test.ts`
Expected: FAIL — cannot resolve `./useSwapPuzzle`.

- [ ] **Step 3.4: Write the hook**

Create `src/components/games/useSwapPuzzle.ts`:

```ts
"use client";
import { useEffect, useState } from "react";

export function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Permutation of tile indices that is not already value-solved (n >= 2 distinct).
export function shuffledUnsolved(values: readonly string[]): number[] {
  const ids = values.map((_, i) => i);
  if (new Set(values).size < 2) return ids;
  let a = shuffled(ids);
  while (a.every((tile, slot) => values[tile] === values[slot])) a = shuffled(ids);
  return a;
}

export type SwapPuzzle = {
  order: number[] | null;
  selected: number | null;
  shake: { slot: number; n: number } | null;
  solved: boolean;
  select: (slot: number) => void;
};

// Tap-two-to-swap puzzle over `values`; slot i wants a tile whose value equals
// values[i] (value equality so duplicate letters in a word all count). `round`
// bumps force a reshuffle. Shuffle runs in an effect — SSR markup stays stable.
export function useSwapPuzzle(values: string[], round: number): SwapPuzzle {
  const [order, setOrder] = useState<number[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [shake, setShake] = useState<{ slot: number; n: number } | null>(null);
  const valueKey = values.join("\u0001");

  useEffect(() => {
    setOrder(shuffledUnsolved(valueKey.split("\u0001")));
    setSelected(null);
    setShake(null);
  }, [valueKey, round]);

  const solved = order !== null && order.every((tile, slot) => values[tile] === values[slot]);

  function select(slot: number) {
    if (!order || solved) return;
    if (values[order[slot]] === values[slot]) return; // locked correct
    if (selected === null) {
      setSelected(slot);
      return;
    }
    if (selected === slot) {
      setSelected(null);
      return;
    }
    const next = [...order];
    [next[selected], next[slot]] = [next[slot], next[selected]];
    const gained =
      (values[next[selected]] === values[selected] ? 1 : 0) +
      (values[next[slot]] === values[slot] ? 1 : 0);
    setOrder(next);
    setSelected(null);
    setShake(gained === 0 ? { slot, n: (shake?.n ?? 0) + 1 } : null);
  }

  return { order, selected, shake, solved, select };
}
```

- [ ] **Step 3.5: Run test to verify it passes**

Run: `npm test -- src/components/games/useSwapPuzzle.test.ts`
Expected: PASS.

- [ ] **Step 3.6: Commit**

```bash
git add src/app/globals.css src/components/games/useSwapPuzzle.ts src/components/games/useSwapPuzzle.test.ts
git commit -m "feat: swap-puzzle hook and game feedback styles"
```

---

### Task 4: Flashcards (engine + letter/word card builders)

**Files:**
- Create: `src/components/games/Flashcards.tsx`
- Test: `src/components/games/Flashcards.test.tsx`

**Interfaces:**
- Consumes: `shuffled` from Task 3; `ArabicItem` from `@/content/schema`; `WordEntry` from `@/games/derive`.
- Produces: `type CardFace = { id: string; front: string; back: string[] }`; `Flashcards({ cards }: { cards: CardFace[] })`; `letterCards(items: ArabicItem[]): CardFace[]`; `wordCards(words: WordEntry[]): CardFace[]`; `LetterFlashcards({ newLetters, allLetters }: { newLetters: ArabicItem[]; allLetters: ArabicItem[] })` (scope toggle "Today's letters" / "All N so far").

- [ ] **Step 4.1: Write the failing test**

Create `src/components/games/Flashcards.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ArabicItem } from "@/content/schema";
import { Flashcards, LetterFlashcards, letterCards, wordCards } from "./Flashcards";

afterEach(() => vi.restoreAllMocks());

const cards = [
  { id: "a", front: "ا", back: ["alif"] },
  { id: "b", front: "ب", back: ["ba — b", "lips together"] },
  { id: "c", front: "ت", back: ["ta — t"] },
];

describe("Flashcards", () => {
  test("shows shuffled deck, flips, and clears with Got it", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deck order [1,2,0] → first card ب
    render(<Flashcards cards={cards} />);
    expect(await screen.findByText("ب")).toBeTruthy();
    expect(screen.getByText("3 cards left")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /flip card/i }));
    expect(screen.getByText("ba — b")).toBeTruthy();
    expect(screen.getByText("lips together")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.getByText("2 cards left")).toBeTruthy();
    expect(screen.getByText("ت")).toBeTruthy(); // next card, front side again
    await userEvent.click(screen.getByRole("button", { name: /got it/i }));
    await userEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.getByText(/deck cleared/i)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /restart/i }));
    expect(screen.getByText("3 cards left")).toBeTruthy();
  });
  test("Again recycles the card to the back of the deck", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deck [1,2,0]
    render(<Flashcards cards={cards} />);
    expect(await screen.findByText("ب")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /again/i }));
    expect(screen.getByText("3 cards left")).toBeTruthy(); // not removed
    expect(screen.getByText("ت")).toBeTruthy(); // moved on
  });
});

describe("card builders", () => {
  test("letterCards carry name/translit and the audio cue", () => {
    const items: ArabicItem[] = [
      { arabic: "ب", name: "ba", translit: "b", audio: { type: "teacher-voice", cue: "lips together" } },
    ];
    expect(letterCards(items)).toEqual([{ id: "ب", front: "ب", back: ["ba — b", "lips together"] }]);
  });
  test("wordCards show translit — meaning", () => {
    expect(wordCards([{ arabic: "بَاب", translit: "bāb", meaning: "door" }])).toEqual([
      { id: "بَاب", front: "بَاب", back: ["bāb — door"] },
    ]);
  });
});

describe("LetterFlashcards scope toggle", () => {
  const mk = (arabic: string): ArabicItem => ({ arabic, name: `n${arabic}`, audio: { type: "teacher-voice", cue: "c" } });
  test("defaults to today's letters and can switch to all", async () => {
    render(<LetterFlashcards newLetters={[mk("ت")]} allLetters={[mk("ا"), mk("ب"), mk("ت")]} />);
    expect(await screen.findByText("1 card left")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /all 3 so far/i }));
    expect(await screen.findByText("3 cards left")).toBeTruthy();
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

Run: `npm test -- src/components/games/Flashcards.test.tsx`
Expected: FAIL — cannot resolve `./Flashcards`.

- [ ] **Step 4.3: Write the component**

Create `src/components/games/Flashcards.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import type { ArabicItem } from "@/content/schema";
import type { WordEntry } from "@/games/derive";
import { shuffled } from "./useSwapPuzzle";

export type CardFace = { id: string; front: string; back: string[] };

function cueText(it: ArabicItem): string {
  switch (it.audio.type) {
    case "teacher-voice":
      return it.audio.cue;
    case "youtube-cue":
      return `▶ ${it.audio.title}`;
    case "qari-clip":
      return `Recited by ${it.audio.reciter}`;
  }
}

export function letterCards(items: ArabicItem[]): CardFace[] {
  return items.map((it) => ({
    id: it.arabic,
    front: it.arabic,
    back: [[it.name, it.translit].filter(Boolean).join(" — ") || it.arabic, cueText(it)],
  }));
}

export function wordCards(words: WordEntry[]): CardFace[] {
  return words.map((w) => ({ id: w.arabic, front: w.arabic, back: [`${w.translit} — ${w.meaning}`] }));
}

export function Flashcards({ cards }: { cards: CardFace[] }) {
  const [deck, setDeck] = useState<number[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const cardsKey = cards.map((c) => c.id).join("|");

  useEffect(() => {
    setDeck(shuffled(cards.map((_, i) => i)));
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cards identity churns; cardsKey covers content
  }, [cardsKey]);

  if (!deck) return <p className="text-white/50">Shuffling…</p>;
  if (deck.length === 0) {
    return (
      <div className="text-center">
        <p className="mb-3 text-2xl text-white/90">🎉 Deck cleared!</p>
        <button
          type="button"
          className="cta-secondary rounded-full px-4 py-2"
          onClick={() => {
            setDeck(shuffled(cards.map((_, i) => i)));
            setFlipped(false);
          }}
        >
          Restart
        </button>
      </div>
    );
  }
  const card = cards[deck[0]];
  return (
    <div className="text-center">
      <p className="mb-2 text-xs text-white/50">
        {deck.length} card{deck.length === 1 ? "" : "s"} left
      </p>
      <button
        type="button"
        aria-label="flip card"
        onClick={() => setFlipped((f) => !f)}
        className="glass mx-auto flex min-h-40 w-full max-w-xs flex-col items-center justify-center rounded-2xl p-6"
      >
        {flipped ? (
          <span className="space-y-1">
            {card.back.map((line) => (
              <span key={line} dir="ltr" className="block text-white/85">
                {line}
              </span>
            ))}
          </span>
        ) : (
          <span className="arabic text-6xl text-white">{card.front}</span>
        )}
        <span className="mt-3 block text-xs text-white/40">{flipped ? "tap to see front" : "tap to reveal"}</span>
      </button>
      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          className="cta-secondary rounded-full px-4 py-2"
          onClick={() => {
            setDeck((d) => d && [...d.slice(1), d[0]]);
            setFlipped(false);
          }}
        >
          ↺ Again
        </button>
        <button
          type="button"
          className="cta-primary rounded-full px-4 py-2"
          onClick={() => {
            setDeck((d) => d && d.slice(1));
            setFlipped(false);
          }}
        >
          ✓ Got it
        </button>
      </div>
    </div>
  );
}

export function LetterFlashcards({ newLetters, allLetters }: { newLetters: ArabicItem[]; allLetters: ArabicItem[] }) {
  const [scope, setScope] = useState<"new" | "all">(newLetters.length > 0 ? "new" : "all");
  const items = scope === "new" && newLetters.length > 0 ? newLetters : allLetters;
  return (
    <div>
      {newLetters.length > 0 && (
        <div className="mb-3 flex justify-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setScope("new")}
            className={`rounded-full px-3 py-1 ${scope === "new" ? "cta-primary" : "cta-secondary"}`}
          >
            Today&apos;s letters
          </button>
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`rounded-full px-3 py-1 ${scope === "all" ? "cta-primary" : "cta-secondary"}`}
          >
            All {allLetters.length} so far
          </button>
        </div>
      )}
      <Flashcards cards={letterCards(items)} />
    </div>
  );
}
```

- [ ] **Step 4.4: Run test to verify it passes**

Run: `npm test -- src/components/games/Flashcards.test.tsx`
Expected: PASS.

- [ ] **Step 4.5: Commit**

```bash
git add src/components/games/Flashcards.tsx src/components/games/Flashcards.test.tsx
git commit -m "feat: flashcard engine with letter and word decks"
```

---

### Task 5: Form swap game

**Files:**
- Create: `src/components/games/FormSwap.tsx`
- Test: `src/components/games/FormSwap.test.tsx`

**Interfaces:**
- Consumes: `useSwapPuzzle` (Task 3), `FormEntry` (Task 2).
- Produces: `FormSwap({ entries }: { entries: FormEntry[] })`. Slot buttons have `aria-label="<Label> slot"` with labels Alone/Start/Middle/End.

- [ ] **Step 5.1: Write the failing test**

Create `src/components/games/FormSwap.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { FormEntry } from "@/games/derive";
import { FormSwap } from "./FormSwap";

afterEach(() => vi.restoreAllMocks());

const ba: FormEntry = {
  item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } },
  forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
};

// Math.random mocked to 0 → initial order [1,2,3,0]:
// Alone slot shows بـ, Start shows ـبـ, Middle shows ـب, End shows ب.
describe("FormSwap", () => {
  test("solving via swaps locks tiles green and offers next letter", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<FormSwap entries={[ba]} />);
    const alone = await screen.findByRole("button", { name: "Alone slot" });
    const start = screen.getByRole("button", { name: "Start slot" });
    const middle = screen.getByRole("button", { name: "Middle slot" });
    const end = screen.getByRole("button", { name: "End slot" });
    expect(alone.textContent).toBe("بـ");

    // Swap Alone↔End: puts ب into Alone (correct) → no shake, green lock
    await userEvent.click(alone);
    await userEvent.click(end);
    expect(screen.getByRole("button", { name: "Alone slot" }).className).toContain("game-correct");

    // Swap Start↔End, then Middle↔End → solved
    await userEvent.click(start);
    await userEvent.click(screen.getByRole("button", { name: "End slot" }));
    await userEvent.click(middle);
    await userEvent.click(screen.getByRole("button", { name: "End slot" }));
    expect(screen.getByText(/all forms in place/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /next letter/i })).toBeTruthy();
  });
  test("fruitless swap shakes", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<FormSwap entries={[ba]} />);
    const alone = await screen.findByRole("button", { name: "Alone slot" });
    await userEvent.click(alone);
    await userEvent.click(screen.getByRole("button", { name: "Middle slot" }));
    // [3,2,1,0]: nothing newly correct → second-clicked slot shakes
    expect(screen.getByRole("button", { name: "Middle slot" }).className).toContain("game-shake");
  });
});
```

- [ ] **Step 5.2: Run test to verify it fails**

Run: `npm test -- src/components/games/FormSwap.test.tsx`
Expected: FAIL — cannot resolve `./FormSwap`.

- [ ] **Step 5.3: Write the component**

Create `src/components/games/FormSwap.tsx`:

```tsx
"use client";
import { useState } from "react";
import type { FormEntry } from "@/games/derive";
import { useSwapPuzzle } from "./useSwapPuzzle";

const FORM_LABELS = { isolated: "Alone", initial: "Start", medial: "Middle", final: "End" } as const;
type FormKey = keyof typeof FORM_LABELS;

export function FormSwap({ entries }: { entries: FormEntry[] }) {
  const [round, setRound] = useState(0);
  const entry = entries[round % entries.length];
  const keys = (Object.keys(FORM_LABELS) as FormKey[]).filter((k) => entry.forms[k]);
  const values = keys.map((k) => entry.forms[k]!);
  const p = useSwapPuzzle(values, round);

  if (!p.order) return <p className="text-white/50">Shuffling…</p>;
  return (
    <div className="text-center">
      <p className="mb-1 text-white/80">
        Put each form of <span className="arabic text-2xl">{entry.item.arabic}</span>
        {entry.item.name ? ` (${entry.item.name})` : ""} in its correct position.
      </p>
      <p className="mb-4 text-xs text-white/50">Tap two tiles to swap them. Correct tiles lock green.</p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-4">
        {keys.map((k, slot) => {
          const correct = values[p.order![slot]] === values[slot];
          const shaking = p.shake?.slot === slot;
          return (
            <div key={k} className="text-center">
              <button
                key={shaking ? `s${p.shake!.n}` : "s"}
                type="button"
                aria-label={`${FORM_LABELS[k]} slot`}
                onClick={() => p.select(slot)}
                className={`arabic min-w-20 rounded-2xl border px-4 py-3 text-4xl text-white transition ${
                  correct ? "game-correct" : p.selected === slot ? "border-sky-300/70 bg-sky-400/10" : "border-white/15 bg-white/5"
                } ${shaking ? "game-shake" : ""}`}
              >
                {values[p.order![slot]]}
              </button>
              <p className="mt-1 text-xs text-white/50">{FORM_LABELS[k]}</p>
            </div>
          );
        })}
      </div>
      {p.solved && (
        <div className="mt-4">
          <p className="mb-2 text-green-300">✓ All forms in place!</p>
          <button type="button" className="cta-primary rounded-full px-4 py-2" onClick={() => setRound((r) => r + 1)}>
            Next letter →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5.4: Run test to verify it passes**

Run: `npm test -- src/components/games/FormSwap.test.tsx`
Expected: PASS.

- [ ] **Step 5.5: Commit**

```bash
git add src/components/games/FormSwap.tsx src/components/games/FormSwap.test.tsx
git commit -m "feat: form-position swap game"
```

---

### Task 6: Word builder game

**Files:**
- Create: `src/components/games/WordBuilder.tsx`
- Test: `src/components/games/WordBuilder.test.tsx`

**Interfaces:**
- Consumes: `useSwapPuzzle` (Task 3), `baseLetters` (Task 1), `WordEntry` (Task 2).
- Produces: `WordBuilder({ words }: { words: WordEntry[] })`. Tiles have `aria-label="letter tile <n>"` (1-based, RTL visual order).

- [ ] **Step 6.1: Write the failing test**

Create `src/components/games/WordBuilder.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { WordBuilder } from "./WordBuilder";

afterEach(() => vi.restoreAllMocks());

const words = [{ arabic: "شَمْس", translit: "shams", meaning: "sun" }];

// letters(شَمْس) = [ش, م, س]; random=0 → order [1,2,0]:
// tile 1 shows م, tile 2 shows س, tile 3 shows ش.
describe("WordBuilder", () => {
  test("solving reveals the joined voweled word and meaning", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<WordBuilder words={words} />);
    expect(await screen.findByText(/shams/)).toBeTruthy(); // clue in prompt
    const t1 = screen.getByRole("button", { name: "letter tile 1" });
    const t3 = screen.getByRole("button", { name: "letter tile 3" });
    await userEvent.click(t1);
    await userEvent.click(t3); // [0,2,1] → tile1 = ش correct
    expect(screen.getByRole("button", { name: "letter tile 1" }).className).toContain("game-correct");
    await userEvent.click(screen.getByRole("button", { name: "letter tile 2" }));
    await userEvent.click(screen.getByRole("button", { name: "letter tile 3" })); // solved
    expect(screen.getByText("شَمْس")).toBeTruthy(); // joined voweled word revealed
    expect(screen.getByText(/✓ shams — sun/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /next word/i })).toBeTruthy();
  });
});
```

- [ ] **Step 6.2: Run test to verify it fails**

Run: `npm test -- src/components/games/WordBuilder.test.tsx`
Expected: FAIL — cannot resolve `./WordBuilder`.

- [ ] **Step 6.3: Write the component**

Create `src/components/games/WordBuilder.tsx`:

```tsx
"use client";
import { useState } from "react";
import type { WordEntry } from "@/games/derive";
import { baseLetters } from "@/games/arabic";
import { useSwapPuzzle } from "./useSwapPuzzle";

export function WordBuilder({ words }: { words: WordEntry[] }) {
  const [round, setRound] = useState(0);
  const word = words[round % words.length];
  const letters = baseLetters(word.arabic);
  const p = useSwapPuzzle(letters, round);

  if (!p.order) return <p className="text-white/50">Shuffling…</p>;
  return (
    <div className="text-center">
      <p className="mb-1 text-white/80">
        Arrange the letters to build <span className="font-semibold">{word.translit}</span> (“{word.meaning}”).
      </p>
      <p className="mb-4 text-xs text-white/50">Tap two tiles to swap them. The word reads right to left.</p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-3">
        {letters.map((_, slot) => {
          const correct = letters[p.order![slot]] === letters[slot];
          const shaking = p.shake?.slot === slot;
          return (
            <button
              key={`${slot}-${shaking ? p.shake!.n : 0}`}
              type="button"
              aria-label={`letter tile ${slot + 1}`}
              onClick={() => p.select(slot)}
              className={`arabic min-w-16 rounded-2xl border px-4 py-3 text-4xl text-white transition ${
                correct ? "game-correct" : p.selected === slot ? "border-sky-300/70 bg-sky-400/10" : "border-white/15 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              {letters[p.order![slot]]}
            </button>
          );
        })}
      </div>
      {p.solved && (
        <div className="mt-4">
          <p className="arabic text-5xl text-white">{word.arabic}</p>
          <p className="mt-1 text-green-300">✓ {word.translit} — {word.meaning}</p>
          <button type="button" className="cta-primary mt-2 rounded-full px-4 py-2" onClick={() => setRound((r) => r + 1)}>
            Next word →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6.4: Run test to verify it passes**

Run: `npm test -- src/components/games/WordBuilder.test.tsx`
Expected: PASS.

- [ ] **Step 6.5: Commit**

```bash
git add src/components/games/WordBuilder.tsx src/components/games/WordBuilder.test.tsx
git commit -m "feat: word-builder swap game"
```

---

### Task 7: Spot-the-letter game

**Files:**
- Create: `src/components/games/SpotTheLetter.tsx`
- Test: `src/components/games/SpotTheLetter.test.tsx`

**Interfaces:**
- Consumes: `baseLetters`, `contextualGlyphs` (Task 1), `shuffled` (Task 3), `WordEntry` (Task 2), `ArabicItem`.
- Produces: `SpotTheLetter({ words, pool }: { words: WordEntry[]; pool: ArabicItem[] })`. Letter buttons have `aria-label="word letter <n>"` (1-based).

- [ ] **Step 7.1: Write the failing test**

Create `src/components/games/SpotTheLetter.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ArabicItem } from "@/content/schema";
import { SpotTheLetter } from "./SpotTheLetter";

afterEach(() => vi.restoreAllMocks());

const words = [{ arabic: "شَمْس", translit: "shams", meaning: "sun" }];
const pool: ArabicItem[] = [
  { arabic: "ش", name: "sheen", audio: { type: "teacher-voice", cue: "c" } },
  { arabic: "م", name: "meem", audio: { type: "teacher-voice", cue: "c" } },
  { arabic: "س", name: "seen", audio: { type: "teacher-voice", cue: "c" } },
];

// unique letters [ش,م,س]; random=0 rotates → target = م (index 1 in the word).
describe("SpotTheLetter", () => {
  test("prompts by letter name; right tap goes green, wrong tap shakes", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<SpotTheLetter words={words} pool={pool} />);
    expect(await screen.findByText(/meem/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "word letter 1" })); // ش — wrong
    expect(screen.getByRole("button", { name: "word letter 1" }).className).toContain("game-shake");
    await userEvent.click(screen.getByRole("button", { name: "word letter 2" })); // م — right
    expect(screen.getByRole("button", { name: "word letter 2" }).className).toContain("game-correct");
    expect(screen.getByText(/✓ Found it! shams — sun/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /next word/i })).toBeTruthy();
  });
});
```

- [ ] **Step 7.2: Run test to verify it fails**

Run: `npm test -- src/components/games/SpotTheLetter.test.tsx`
Expected: FAIL — cannot resolve `./SpotTheLetter`.

- [ ] **Step 7.3: Write the component**

Create `src/components/games/SpotTheLetter.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import type { ArabicItem } from "@/content/schema";
import type { WordEntry } from "@/games/derive";
import { baseLetters, contextualGlyphs } from "@/games/arabic";
import { shuffled } from "./useSwapPuzzle";

export function SpotTheLetter({ words, pool }: { words: WordEntry[]; pool: ArabicItem[] }) {
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [shake, setShake] = useState<{ idx: number; n: number } | null>(null);
  const word = words[round % words.length];

  useEffect(() => {
    const uniq = [...new Set(baseLetters(words[round % words.length].arabic))];
    setTarget(shuffled(uniq)[0]);
    setFound(false);
    setShake(null);
  }, [round, words]);

  if (!target) return <p className="text-white/50">Picking a letter…</p>;
  const letters = baseLetters(word.arabic);
  const glyphs = contextualGlyphs(word.arabic);
  const targetItem = pool.find((it) => it.arabic === target);

  return (
    <div className="text-center">
      <p className="mb-4 text-white/80">
        Tap the letter <span className="font-semibold">{targetItem?.name ?? target}</span>{" "}
        <span className="arabic text-3xl">({target})</span> in this word:
      </p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-1">
        {glyphs.map((g, i) => {
          const shaking = shake?.idx === i;
          return (
            <button
              key={`${i}-${shaking ? shake!.n : 0}`}
              type="button"
              aria-label={`word letter ${i + 1}`}
              onClick={() => {
                if (found) return;
                if (letters[i] === target) setFound(true);
                else setShake({ idx: i, n: (shake?.n ?? 0) + 1 });
              }}
              className={`arabic rounded-xl border px-2 py-2 text-5xl text-white ${
                found && letters[i] === target ? "game-correct" : "border-white/10 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              {g}
            </button>
          );
        })}
      </div>
      {found && (
        <div className="mt-4">
          <p className="text-green-300">✓ Found it! {word.translit} — {word.meaning}</p>
          <button type="button" className="cta-primary mt-2 rounded-full px-4 py-2" onClick={() => setRound((r) => r + 1)}>
            Next word →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7.4: Run test to verify it passes**

Run: `npm test -- src/components/games/SpotTheLetter.test.tsx`
Expected: PASS.

- [ ] **Step 7.5: Commit**

```bash
git add src/components/games/SpotTheLetter.tsx src/components/games/SpotTheLetter.test.tsx
git commit -m "feat: spot-the-letter game"
```

---

### Task 8: Letter recognition quiz

**Files:**
- Create: `src/components/games/LetterQuiz.tsx`
- Test: `src/components/games/LetterQuiz.test.tsx`

**Interfaces:**
- Consumes: `shuffled` (Task 3), `ArabicItem`.
- Produces: `LetterQuiz({ pool }: { pool: ArabicItem[] })` — pool items must have `name` (GamePanel filters). Choice buttons have `aria-label="choice <arabic>"`.

- [ ] **Step 8.1: Write the failing test**

Create `src/components/games/LetterQuiz.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ArabicItem } from "@/content/schema";
import { LetterQuiz } from "./LetterQuiz";

afterEach(() => vi.restoreAllMocks());

const mk = (arabic: string, name: string): ArabicItem => ({ arabic, name, audio: { type: "teacher-voice", cue: "c" } });
const pool = [mk("ا", "alif"), mk("ب", "ba"), mk("ت", "ta"), mk("ث", "tha")];

// random=0: opts = rotate(pool) = [ب,ت,ث,ا] → answer = ب ("ba");
// choices = rotate(opts) = [ت,ث,ا,ب].
describe("LetterQuiz", () => {
  test("asks by name; wrong pick shakes, right pick locks green and scores", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<LetterQuiz pool={pool} />);
    expect(await screen.findByText(/which letter is/i)).toBeTruthy();
    expect(screen.getByText(/ba/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "choice ت" }));
    expect(screen.getByRole("button", { name: "choice ت" }).className).toContain("game-shake");
    await userEvent.click(screen.getByRole("button", { name: "choice ب" }));
    expect(screen.getByRole("button", { name: "choice ب" }).className).toContain("game-correct");
    expect(screen.getByText("First-try score: 0 / 1")).toBeTruthy(); // missed first
    expect(screen.getByRole("button", { name: /next question/i })).toBeTruthy();
  });
  test("first-try correct scores 1 / 1", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<LetterQuiz pool={pool} />);
    await screen.findByText(/which letter is/i);
    await userEvent.click(screen.getByRole("button", { name: "choice ب" }));
    expect(screen.getByText("First-try score: 1 / 1")).toBeTruthy();
  });
});
```

- [ ] **Step 8.2: Run test to verify it fails**

Run: `npm test -- src/components/games/LetterQuiz.test.tsx`
Expected: FAIL — cannot resolve `./LetterQuiz`.

- [ ] **Step 8.3: Write the component**

Create `src/components/games/LetterQuiz.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import type { ArabicItem } from "@/content/schema";
import { shuffled } from "./useSwapPuzzle";

export function LetterQuiz({ pool }: { pool: ArabicItem[] }) {
  const [round, setRound] = useState(0);
  const [choices, setChoices] = useState<ArabicItem[] | null>(null);
  const [answer, setAnswer] = useState<ArabicItem | null>(null);
  const [gotIt, setGotIt] = useState(false);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState<{ glyph: string; n: number } | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });

  useEffect(() => {
    const opts = shuffled(pool).slice(0, 4);
    setAnswer(opts[0]);
    setChoices(shuffled(opts));
    setGotIt(false);
    setMissed(false);
    setShake(null);
  }, [round, pool]);

  if (!choices || !answer) return <p className="text-white/50">Preparing…</p>;
  return (
    <div className="text-center">
      <p className="mb-4 text-white/80">
        Which letter is <span className="font-semibold">{answer.name}</span>
        {answer.translit ? ` (${answer.translit})` : ""}?
      </p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-3">
        {choices.map((it) => {
          const shaking = shake?.glyph === it.arabic;
          return (
            <button
              key={`${it.arabic}-${shaking ? shake!.n : 0}`}
              type="button"
              aria-label={`choice ${it.arabic}`}
              onClick={() => {
                if (gotIt) return;
                if (it.arabic === answer.arabic) {
                  setGotIt(true);
                  setScore((s) => ({ right: s.right + (missed ? 0 : 1), asked: s.asked + 1 }));
                } else {
                  setMissed(true);
                  setShake({ glyph: it.arabic, n: (shake?.n ?? 0) + 1 });
                }
              }}
              className={`arabic min-w-16 rounded-2xl border px-4 py-3 text-4xl text-white transition ${
                gotIt && it.arabic === answer.arabic ? "game-correct" : "border-white/15 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              {it.arabic}
            </button>
          );
        })}
      </div>
      {gotIt && (
        <button type="button" className="cta-primary mt-4 rounded-full px-4 py-2" onClick={() => setRound((r) => r + 1)}>
          Next question →
        </button>
      )}
      {score.asked > 0 && <p className="mt-3 text-xs text-white/50">First-try score: {score.right} / {score.asked}</p>}
    </div>
  );
}
```

- [ ] **Step 8.4: Run test to verify it passes**

Run: `npm test -- src/components/games/LetterQuiz.test.tsx`
Expected: PASS.

- [ ] **Step 8.5: Commit**

```bash
git add src/components/games/LetterQuiz.tsx src/components/games/LetterQuiz.test.tsx
git commit -m "feat: letter recognition quiz"
```

---

### Task 9: GamePanel (tabbed container with gating)

**Files:**
- Create: `src/components/games/GamePanel.tsx`
- Test: `src/components/games/GamePanel.test.tsx`

**Interfaces:**
- Consumes: all game components (Tasks 4–8), `GameData` (Task 2), `baseLetters` (Task 1).
- Produces: `GamePanel({ data, heading? }: { data: GameData; heading?: string })`. Gating rules: Letter cards → `letterPool.length > 0`; Quiz → ≥4 named letters; Forms → `formsTaught && formEntries.length > 0`; Build a word → words with 2–6 letters and ≥2 distinct; Spot the letter → words with ≥2 distinct letters; Word cards → `wordPool.length > 0`. Renders `null` when no tab qualifies.

- [ ] **Step 9.1: Write the failing test**

Create `src/components/games/GamePanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import type { GameData } from "@/games/derive";
import { GamePanel } from "./GamePanel";

const mk = (arabic: string, name: string) => ({ arabic, name, audio: { type: "teacher-voice" as const, cue: "c" } });

const base: GameData = {
  lessonId: "1-03",
  newLetters: [mk("س", "seen")],
  letterPool: [mk("ا", "alif"), mk("ب", "ba"), mk("ت", "ta"), mk("س", "seen")],
  formEntries: [{ item: mk("س", "seen"), forms: { isolated: "س", initial: "سـ", medial: "ـسـ", final: "ـس" } }],
  wordPool: [{ arabic: "بَاب", translit: "bāb", meaning: "door" }],
  formsTaught: false,
};

describe("GamePanel gating", () => {
  test("hides Forms tab before 1-07, shows it after", () => {
    const { rerender } = render(<GamePanel data={base} />);
    expect(screen.queryByRole("button", { name: /forms/i })).toBeNull();
    rerender(<GamePanel data={{ ...base, formsTaught: true }} />);
    expect(screen.getByRole("button", { name: /forms/i })).toBeTruthy();
  });
  test("hides quiz when fewer than 4 named letters", () => {
    render(<GamePanel data={{ ...base, letterPool: base.letterPool.slice(0, 3) }} />);
    expect(screen.queryByRole("button", { name: /quiz/i })).toBeNull();
  });
  test("word games hidden when word pool is empty", () => {
    render(<GamePanel data={{ ...base, wordPool: [] }} />);
    expect(screen.queryByRole("button", { name: /build a word/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /spot the letter/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /word cards/i })).toBeNull();
  });
  test("switching tabs swaps the active game", async () => {
    render(<GamePanel data={base} />);
    expect(await screen.findByText(/cards? left/)).toBeTruthy(); // flashcards default
    await userEvent.click(screen.getByRole("button", { name: /quiz/i }));
    expect(await screen.findByText(/which letter is/i)).toBeTruthy();
  });
  test("renders nothing with no data", () => {
    const { container } = render(
      <GamePanel data={{ ...base, letterPool: [], newLetters: [], formEntries: [], wordPool: [] }} />,
    );
    expect(container.innerHTML).toBe("");
  });
});
```

- [ ] **Step 9.2: Run test to verify it fails**

Run: `npm test -- src/components/games/GamePanel.test.tsx`
Expected: FAIL — cannot resolve `./GamePanel`.

- [ ] **Step 9.3: Write the component**

Create `src/components/games/GamePanel.tsx`:

```tsx
"use client";
import { useMemo, useState } from "react";
import type { GameData } from "@/games/derive";
import { baseLetters } from "@/games/arabic";
import { Flashcards, LetterFlashcards, wordCards } from "./Flashcards";
import { FormSwap } from "./FormSwap";
import { WordBuilder } from "./WordBuilder";
import { SpotTheLetter } from "./SpotTheLetter";
import { LetterQuiz } from "./LetterQuiz";

export function GamePanel({ data, heading = "Practice games" }: { data: GameData; heading?: string }) {
  const [tab, setTab] = useState(0);
  const builderWords = useMemo(
    () =>
      data.wordPool.filter((w) => {
        const l = baseLetters(w.arabic);
        return l.length >= 2 && l.length <= 6 && new Set(l).size >= 2;
      }),
    [data],
  );
  const spotWords = useMemo(() => data.wordPool.filter((w) => new Set(baseLetters(w.arabic)).size >= 2), [data]);
  const quizPool = useMemo(() => data.letterPool.filter((it) => it.name), [data]);

  const tabs = [
    {
      label: "🃏 Letter cards",
      show: data.letterPool.length > 0,
      render: () => <LetterFlashcards newLetters={data.newLetters} allLetters={data.letterPool} />,
    },
    { label: "❓ Quiz", show: quizPool.length >= 4, render: () => <LetterQuiz pool={quizPool} /> },
    {
      label: "🔀 Forms",
      show: data.formsTaught && data.formEntries.length > 0,
      render: () => <FormSwap entries={data.formEntries} />,
    },
    { label: "🧩 Build a word", show: builderWords.length > 0, render: () => <WordBuilder words={builderWords} /> },
    {
      label: "🔍 Spot the letter",
      show: spotWords.length > 0,
      render: () => <SpotTheLetter words={spotWords} pool={data.letterPool} />,
    },
    { label: "📖 Word cards", show: data.wordPool.length > 0, render: () => <Flashcards cards={wordCards(data.wordPool)} /> },
  ].filter((t) => t.show);

  if (tabs.length === 0) return null;
  const active = tabs[Math.min(tab, tabs.length - 1)];

  return (
    <div className="text-center">
      <h2 className="mb-1 text-3xl font-bold text-white">{heading}</h2>
      <p className="mb-4 text-sm text-white/60">
        Self-check games built from the {data.letterPool.length} letter{data.letterPool.length === 1 ? "" : "s"} you&apos;ve
        learned so far.
      </p>
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-full px-3 py-1.5 text-sm ${t === active ? "cta-primary" : "cta-secondary"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active.render()}
    </div>
  );
}
```

- [ ] **Step 9.4: Run test to verify it passes**

Run: `npm test -- src/components/games/GamePanel.test.tsx`
Expected: PASS.

- [ ] **Step 9.5: Commit**

```bash
git add src/components/games/GamePanel.tsx src/components/games/GamePanel.test.tsx
git commit -m "feat: tabbed game panel with availability gating"
```

---

### Task 10: Deck injection (lesson page)

**Files:**
- Create: `src/games/deck.ts`
- Modify: `src/components/SlideDeck.tsx` (type + one switch case)
- Modify: `src/app/lesson/[id]/page.tsx`
- Test: `src/games/deck.test.ts`

**Interfaces:**
- Consumes: `Slide` from `@/content/schema`, `GameData` (Task 2), `GamePanel` (Task 9).
- Produces: `type DeckSlide = Slide | { kind: "games"; data: GameData }`; `buildDeckSlides(slides: Slide[], data: GameData): DeckSlide[]` — inserts one games slide before the homework slide (or appends if none); returns slides unchanged when the panel would be empty. `SlideDeck` accepts `slides: DeckSlide[]`.

- [ ] **Step 10.1: Write the failing test**

Create `src/games/deck.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import type { Slide } from "@/content/schema";
import type { GameData } from "./derive";
import { buildDeckSlides } from "./deck";

const data: GameData = {
  lessonId: "1-01",
  newLetters: [],
  letterPool: [{ arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "c" } }],
  formEntries: [],
  wordPool: [],
  formsTaught: false,
};

const slides: Slide[] = [
  { kind: "title", heading: "T" },
  { kind: "concept", heading: "C", body: ["b"] },
  { kind: "homework", heading: "HW", tasks: ["t"] },
];

describe("buildDeckSlides", () => {
  test("inserts the games slide before homework", () => {
    const out = buildDeckSlides(slides, data);
    expect(out.map((s) => s.kind)).toEqual(["title", "concept", "games", "homework"]);
  });
  test("appends when there is no homework slide", () => {
    const out = buildDeckSlides(slides.slice(0, 2), data);
    expect(out.map((s) => s.kind)).toEqual(["title", "concept", "games"]);
  });
  test("no games slide when there is nothing to play", () => {
    const empty = { ...data, letterPool: [], wordPool: [] };
    expect(buildDeckSlides(slides, empty).map((s) => s.kind)).toEqual(["title", "concept", "homework"]);
  });
});
```

- [ ] **Step 10.2: Run test to verify it fails**

Run: `npm test -- src/games/deck.test.ts`
Expected: FAIL — cannot resolve `./deck`.

- [ ] **Step 10.3: Write the deck helper**

Create `src/games/deck.ts`:

```ts
import type { Slide } from "@/content/schema";
import type { GameData } from "./derive";

export type DeckSlide = Slide | { kind: "games"; data: GameData };

// One games slide per lesson, right before homework (spec §3).
export function buildDeckSlides(slides: Slide[], data: GameData): DeckSlide[] {
  if (data.letterPool.length === 0 && data.wordPool.length === 0) return [...slides];
  const out: DeckSlide[] = [...slides];
  const games: DeckSlide = { kind: "games", data };
  const hw = out.findIndex((s) => s.kind === "homework");
  if (hw === -1) out.push(games);
  else out.splice(hw, 0, games);
  return out;
}
```

- [ ] **Step 10.4: Run test to verify it passes**

Run: `npm test -- src/games/deck.test.ts`
Expected: PASS.

- [ ] **Step 10.5: Wire the games case into SlideDeck**

In `src/components/SlideDeck.tsx`:

1. Replace the `Slide` import line:

```tsx
import type { Slide } from "@/content/schema";
```

with:

```tsx
import type { Slide } from "@/content/schema";
import type { DeckSlide } from "@/games/deck";
import { GamePanel } from "./games/GamePanel";
```

2. Change `SlideView`'s signature from `{ slide }: { slide: Slide }` to `{ slide }: { slide: DeckSlide }` and add a case to the switch (before `case "recap":`):

```tsx
    case "games":
      return <GamePanel data={slide.data} />;
```

3. Change the `SlideDeck` props type `slides: Slide[]` to `slides: DeckSlide[]`.

(The unused `Slide` import stays — `DeckSlide` references it; if eslint flags it, drop the standalone import since `DeckSlide` re-exports the union.)

- [ ] **Step 10.6: Inject in the lesson page**

Replace `src/app/lesson/[id]/page.tsx` imports and deck construction:

```tsx
import { allLessonIds, allLessons, loadLesson } from "@/content/load";
import { SlideDeck } from "@/components/SlideDeck";
import { buildDeckSlides } from "@/games/deck";
import { deriveGameData } from "@/games/derive";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = loadLesson(id);
  const deck = buildDeckSlides(l.slides, deriveGameData(allLessons(), id));
  return (
    <>
      <SlideDeck title={l.title} slides={deck} videosAnchor={l.videos.length > 0} />
      {/* …existing videos section unchanged… */}
```

(Only the import block, the `deck` line, and `slides={deck}` change; the videos JSX stays as-is.)

- [ ] **Step 10.7: Run the full suite**

Run: `npm test`
Expected: PASS — including the existing `SlideDeck.test.tsx` and `src/app/lesson/lesson.test.tsx`. If `lesson.test.tsx` snapshots slide counts, update expectations to account for the one injected games slide.

- [ ] **Step 10.8: Commit**

```bash
git add src/games/deck.ts src/games/deck.test.ts src/components/SlideDeck.tsx "src/app/lesson/[id]/page.tsx"
git commit -m "feat: inject practice-games slide into lesson decks"
```

---

### Task 11: Practice page + final verification

**Files:**
- Modify: `src/app/practice/[id]/page.tsx`

**Interfaces:**
- Consumes: `GamePanel` (Task 9), `deriveGameData` + `allLessons` (Task 2).

- [ ] **Step 11.1: Add the panel to the practice page**

In `src/app/practice/[id]/page.tsx`, add imports and one section after the `<PrintButton …/>` line:

```tsx
import { allLessonIds, allLessons, loadLesson } from "@/content/load";
import { DrillGrid } from "@/components/DrillGrid";
import { GamePanel } from "@/components/games/GamePanel";
import { PrintButton } from "@/components/ProgressClient";
import { deriveGameData } from "@/games/derive";
```

and inside the component, before `return`:

```tsx
  const gameData = deriveGameData(allLessons(), id);
```

then directly after `<PrintButton …/>`:

```tsx
      <section className="glass mb-8 rounded-2xl p-4 print:hidden sm:p-5">
        <GamePanel data={gameData} heading="Interactive practice" />
      </section>
```

- [ ] **Step 11.2: Full verification**

Run each and confirm:

```bash
npm test        # all suites pass
npm run lint    # no errors
npm run build   # static export succeeds
```

Expected: all green. If `npm run build` fails on the games slide, check that `GamePanel` is only reached through the client `SlideDeck` (it is "use client") and that `deriveGameData` runs only in server components.

- [ ] **Step 11.3: Visual smoke check (manual)**

Run: `npm run dev` and open `http://localhost:3000/lesson/1-03` → arrow to the second-to-last slide: games panel with Letter cards / Quiz / word tabs (no Forms tab — pre-1-07). Open `/lesson/1-07` → Forms tab present; play one form-swap round. Open `/practice/1-03` → "Interactive practice" section above drills; print preview hides it.

- [ ] **Step 11.4: Commit**

```bash
git add "src/app/practice/[id]/page.tsx"
git commit -m "feat: interactive practice games on the practice page"
```
