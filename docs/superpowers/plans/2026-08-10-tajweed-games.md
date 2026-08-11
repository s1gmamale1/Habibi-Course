# Tajweed Games (Sub-project D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tajweed practice drills to the existing games engine, and give the engine the three seams it currently lacks — a game registry, result reporting, and audio.

**Architecture:** Three structural fixes come first, because every drill depends on them: `GamePanel`'s hardcoded tab array becomes a registry keyed by ids declared per lesson; games gain an `onResult` callback so per-rule mastery can be tracked; and audio moves into games for the first time. Then eight drills are built on top, in ascending order of novelty — starting with the two that reuse existing engines almost unchanged.

**Tech Stack:** React 19 · Vitest + @testing-library/react + user-event · the generated verse data from Sub-project B · the schema from Sub-project C

## Global Constraints

- **Never apply `baseLetters` or `stripDiacritics` to tajweed content.** Those helpers in `src/games/arabic.ts` destroy sukūn, shadda and tanwīn — precisely the marks that decide every tajweed rule. A qalqalah letter qualifies *only when it carries sukūn*; strip the sukūn and the drill is wrong.
- **Every game shuffles inside an effect.** That pattern caused the crash fixed in `0b09f21` — a one-frame window where state is inconsistent with props. Every new game must either guard the stale frame or remount by `key`.
- **A drill must never contain its own answer.** This is established repo intent (`6b7e8d1`): Spot-the-letter was changed to prompt by name only, and WordBuilder was rebuilt with decoy letters so it could not be solved by elimination. Tajweed drills inherit this rule.
- **Distractors must be pedagogically chosen, not random.** `shuffled(pool).slice(0,4)` is wrong for rules: the sibling rules of the same family are the meaningful wrong answers (iẓhār/idghām/iqlāb/ikhfā' for a noon question).
- **Another session owns `src/games/`.** Coordinate before modifying `arabic.ts`, `derive.ts` or `deck.ts`. Prefer adding new files over editing shared ones.
- Commits: `<type>(<scope>): <description>`. **No `Co-Authored-By` trailer.**

---

## File Structure

```
src/games/
├── tajweed.ts               # NEW: rule-aware pools, distractors, harakat-safe segmentation
└── tajweed.test.ts
src/components/games/
├── GameRegistry.ts          # NEW: id → component map
├── GamePanel.tsx            # MODIFY: registry-driven, generalised subtitle
└── tajweed/
    ├── RuleIdentifier.tsx   # drill 1
    ├── FamilySorter.tsx     # drill 2
    ├── SpanTapper.tsx       # drill 3
    ├── MaddCounter.tsx      # drill 4
    ├── ListenIdentify.tsx   # drill 5
    ├── ConditionBuilder.tsx # drill 6
    ├── WaqfPlacer.tsx       # drill 7
    └── GhunnahTimer.tsx     # drill 8
```

---

## Task 1: Harakat-safe segmentation and rule-aware distractors

**Files:**
- Create: `src/games/tajweed.ts`, `src/games/tajweed.test.ts`

**Interfaces:**
- Produces:
  - `segmentGraphemes(text: string) => string[]` — each element is one base letter **with its marks attached**.
  - `hasSukun(seg: string) => boolean`, `hasShadda(seg: string) => boolean`, `baseOf(seg: string) => string`
  - `QALQALAH_LETTERS`, `ISTILA_LETTERS`, `IKHFA_LETTERS`, `THROAT_LETTERS`, `YARMALUN` — `ReadonlySet<string>`
  - `siblingRules(rule: RuleId) => RuleId[]` — same-family rules, for distractors.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import {
  segmentGraphemes, hasSukun, baseOf, QALQALAH_LETTERS, siblingRules,
} from "./tajweed";

describe("segmentGraphemes", () => {
  it("keeps a letter together with its marks", () => {
    // ب + kasra, س + sukun, م + kasra  → 3 segments, not 6
    expect(segmentGraphemes("بِسْمِ")).toHaveLength(3);
  });
  it("keeps shadda and a vowel on one base", () => {
    expect(segmentGraphemes("رَّ")).toHaveLength(1);
  });
  it("round-trips", () => {
    const t = "بِسْمِ ٱللَّهِ";
    expect(segmentGraphemes(t).join("")).toBe(t);
  });
});

describe("mark detection", () => {
  it("detects sukun", () => {
    expect(hasSukun("سْ")).toBe(true);
    expect(hasSukun("سِ")).toBe(false);
  });
  it("extracts the base letter", () => {
    expect(baseOf("سْ")).toBe("س");
    expect(baseOf("رَّ")).toBe("ر");
  });
});

describe("letter sets", () => {
  it("has exactly the five qalqalah letters", () => {
    expect(QALQALAH_LETTERS.size).toBe(5);
    for (const l of ["ق", "ط", "ب", "ج", "د"]) expect(QALQALAH_LETTERS.has(l)).toBe(true);
  });
});

describe("siblingRules", () => {
  it("returns same-family rules as distractors", () => {
    const s = siblingRules("ikhfa");
    expect(s).toContain("ikhfa_shafawi");
    expect(s).not.toContain("ikhfa");
  });
  it("always yields at least three distractors", () => {
    for (const r of ["ikhfa", "qalqalah", "madd_2", "iqlab"] as const) {
      expect(siblingRules(r).length).toBeGreaterThanOrEqual(3);
    }
  });
});
```

- [ ] **Step 2: Run, confirm failure.**

- [ ] **Step 3: Implement**

```typescript
import { TAJWEED_RULES, RULE_META, type RuleId } from "@/content/tajweed";

const MARKS = /\p{Mn}/u;

/** Split into base-letter-plus-marks units. Never splits a cluster. */
export function segmentGraphemes(text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    if (out.length > 0 && MARKS.test(ch)) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

export const hasSukun = (seg: string) => seg.includes("ْ") || seg.includes("ۡ");
export const hasShadda = (seg: string) => seg.includes("ّ");
export const baseOf = (seg: string) => [...seg].filter((c) => !MARKS.test(c)).join("");

export const QALQALAH_LETTERS: ReadonlySet<string> = new Set(["ق", "ط", "ب", "ج", "د"]);
export const ISTILA_LETTERS: ReadonlySet<string> = new Set(["خ", "ص", "ض", "غ", "ط", "ق", "ظ"]);
export const THROAT_LETTERS: ReadonlySet<string> = new Set(["ء", "ه", "ع", "ح", "غ", "خ"]);
export const YARMALUN: ReadonlySet<string> = new Set(["ي", "ر", "م", "ل", "و", "ن"]);
export const IKHFA_LETTERS: ReadonlySet<string> = new Set([
  "ص", "ذ", "ث", "ك", "ج", "ش", "ق", "س", "د", "ط", "ز", "ف", "ت", "ض", "ظ",
]);

/** Same-family rules — the pedagogically correct distractors. */
export function siblingRules(rule: RuleId): RuleId[] {
  const family = RULE_META[rule].family;
  const same = TAJWEED_RULES.filter((r) => r !== rule && RULE_META[r].family === family);
  if (same.length >= 3) return same;
  const others = TAJWEED_RULES.filter((r) => r !== rule && !same.includes(r));
  return [...same, ...others].slice(0, Math.max(3, same.length));
}
```

- [ ] **Step 4: Run, confirm all pass. Step 5: commit.**

```bash
git add src/games/tajweed.ts src/games/tajweed.test.ts
git commit -m "feat(games): harakat-safe segmentation and rule-aware distractors"
```

---

## Task 2: Game registry and the `onResult` seam

**Files:**
- Create: `src/components/games/GameRegistry.ts` (+ test)
- Modify: `src/components/games/GamePanel.tsx` (+ test)

⚠️ **Coordinate — another session owns `src/games/` and may be editing `GamePanel`.** Check `git log --oneline -5` first.

**Interfaces:**
- Produces: `GameResult = {gameId: string; ruleId?: RuleId; correct: boolean; at: number}`; `registerGame(id, entry)`; `getGames(ids: string[])`.

- [ ] **Step 1: Write the failing test**

```typescript
it("returns only registered ids, in the order requested", () => {
  expect(getGames(["rule-identifier", "nope"]).map((g) => g.id)).toEqual(["rule-identifier"]);
});
it("surfaces results to a listener", async () => {
  const onResult = vi.fn();
  render(<GamePanel lessonId="3-23" games={["rule-identifier"]} onResult={onResult} data={fixture} />);
  await userEvent.click(screen.getAllByRole("button")[0]);
  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ gameId: "rule-identifier" }));
});
```

- [ ] **Step 2: Implement the registry**

```typescript
import type { RuleId } from "@/content/tajweed";
export type GameResult = { gameId: string; ruleId?: RuleId; correct: boolean; at: number };
export type GameEntry = {
  id: string; label: string;
  render: (props: { onResult?: (r: GameResult) => void }) => React.ReactNode;
};

const REGISTRY = new Map<string, GameEntry>();
export function registerGame(entry: GameEntry) { REGISTRY.set(entry.id, entry); }
export function getGames(ids: string[]): GameEntry[] {
  return ids.map((id) => REGISTRY.get(id)).filter((e): e is GameEntry => Boolean(e));
}
```

- [ ] **Step 3: Refactor `GamePanel`**

Replace the hardcoded six-tab literal (`GamePanel.tsx:24-47`) with `getGames(props.games ?? DEFAULT_LETTER_GAMES)`. Register the five existing letter games under their current ids so **behaviour is unchanged for Phase 1** — the existing `GamePanel.test.tsx` must still pass untouched. Generalise the hardcoded subtitle (`:55-58`) away from "letters you've learned".

- [ ] **Step 4: Run the FULL suite — the existing games tests are the regression guard.**

`npm test` — every pre-existing test must still pass. If any fails, the refactor changed behaviour; fix it.

- [ ] **Step 5: Commit**

```bash
git add src/components/games/
git commit -m "refactor(games): registry-driven panel with result reporting"
```

---

## Task 3: Drill 1 — Rule Identifier

The highest-value drill and the closest to an existing engine. `LetterQuiz`'s `Question = {prompt, choices}` already fits.

**Files:** `src/components/games/tajweed/RuleIdentifier.tsx` (+ test)

- [ ] **Step 1: Write the failing test**

```tsx
it("asks which rule applies to the highlighted span", () => {
  render(<RuleIdentifier items={[{ text: "مِّن جُوعٍ", spanStart: 0, spanEnd: 3, rule: "ikhfa" }]} />);
  expect(screen.getByText(/which rule/i)).toBeTruthy();
});
it("offers same-family distractors, not random ones", () => {
  render(<RuleIdentifier items={[{ text: "مِّن جُوعٍ", spanStart: 0, spanEnd: 3, rule: "ikhfa" }]} />);
  expect(screen.getByRole("button", { name: /ikhfāʾ shafawī/i })).toBeTruthy();
});
it("locks green on the correct answer and reports it", async () => {
  const onResult = vi.fn();
  render(<RuleIdentifier items={[...]} onResult={onResult} />);
  await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));
  expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ correct: true, ruleId: "ikhfa" }));
});
it("does not reveal the answer in the prompt", () => {
  const { container } = render(<RuleIdentifier items={[...]} />);
  expect(container.textContent).not.toMatch(/ikhfāʾ.*ikhfāʾ/i);
});
```

- [ ] **Step 2: Implement.** Render the fragment with `TajweedText` (span highlighted, others dimmed), four choices from `siblingRules`, reuse `LetterQuiz`'s scoring/shake/lock machinery. Shuffle with a `key`-based remount, not an unguarded effect.

- [ ] **Step 3: Run, confirm pass. Step 4: register as `rule-identifier`. Step 5: commit.**

---

## Task 4: Drill 2 — Family Sorter

**Files:** `src/components/games/tajweed/FamilySorter.tsx` (+ test)

N fragments into M labelled buckets (Iẓhār / Idghām / Iqlāb / Ikhfā'). **`useSwapPuzzle` cannot express this** — it is a fixed one-tile-per-slot bijection, and this is an N-into-M assignment. Write it fresh.

- [ ] **Step 1: Failing test** — assign a fragment to the wrong bucket → shake, it returns; to the right bucket → locks green; all assigned → round complete, `onResult` per item.
- [ ] **Step 2: Implement. Step 3: Run. Step 4: register as `family-sorter`. Step 5: commit.**

---

## Task 5: Drill 3 — Span Tapper

**Files:** `src/components/games/tajweed/SpanTapper.tsx` (+ test)

A fork of `SpotTheLetter`, not a config of it. Three things differ and all matter:

1. The target is an **index set**, not a letter identity — a qalqalah letter only counts *when it carries sukūn*.
2. The text stays **voweled**; `baseLetters`/`contextualGlyphs` must not be applied.
3. `found` is a **set** with a submit step, because the prompt is "tap *all* the letters that…".

- [ ] **Step 1: Failing test**

```tsx
it("accepts only sukun-bearing qalqalah letters", async () => {
  // يَجْعَلْ — ج carries sukun (qalqalah), ل final also sukun
  render(<SpanTapper text="يَجْعَلْ" criterion="qalqalah" />);
  await userEvent.click(screen.getByRole("button", { name: /جْ/ }));
  expect(screen.getByRole("button", { name: /جْ/ })).toHaveAttribute("data-state", "correct");
});
it("rejects a qalqalah letter without sukun", async () => {
  render(<SpanTapper text="جَعَلَ" criterion="qalqalah" />);
  await userEvent.click(screen.getByRole("button", { name: /جَ/ }));
  expect(screen.getByRole("button", { name: /جَ/ })).toHaveAttribute("data-state", "wrong");
});
```

- [ ] **Step 2: Implement** using `segmentGraphemes` + `hasSukun` + the letter sets. **Step 3–5: run, register as `span-tapper`, commit.**

---

## Task 6: Drill 4 — Madd Counter

**Files:** `src/components/games/tajweed/MaddCounter.tsx` (+ test)

Fragment plus a 2 / 4 / 6 ḥarakāt selector. The count is a number, which nothing in the existing data model carries — it comes from `RULE_META[rule].harakat`.

- [ ] Failing test → implement → run → register as `madd-counter` → commit.

Note `madd_246` ('āriḍ lis-sukūn) legitimately accepts 2, 4 **or** 6 — all three must be marked correct, with a note that the choice is held consistent within a session. Do not mark 4 wrong.

---

## Task 7: Drill 5 — Listen and Identify

**Files:** `src/components/games/tajweed/ListenIdentify.tsx` (+ test)

**The first game in this repo to play audio.** `TapToHear.tsx:19-27` is the only existing player and it lives outside `games/`. Extract its playback into a shared hook rather than duplicating it.

- [ ] **Step 1:** Extract `useAudioCue(source: AudioSource)` from `TapToHear`, leaving `TapToHear`'s tests green.
- [ ] **Step 2:** Failing test — audio element gets the everyayah URL for the ayah; choices are `siblingRules`; the ayah text is **not** rendered (that would give away the answer).
- [ ] **Step 3–5:** implement, register as `listen-identify`, commit.

Audio URL is a pure function of (surah, ayah): `https://everyayah.com/data/Husary_Muallim_128kbps/{SSS}{AAA}.mp3`, zero-padded to 3 digits each. **Stream only — never bundle.**

---

## Task 8: Drills 6–8

Lower priority; build only after 1–5 are green and in use.

- **Condition Builder** (`condition-builder`) — reuses `useBuildPuzzle`'s slot-and-bank engine with `pickDecoys` replaced (the existing one calls `baseLetters`, which is glyph-specific). Assemble "noon sākin + ب → iqlāb, pronounced as meem with ghunnah" from shuffled labelled tiles.
- **Waqf Placer** (`waqf-placer`) — tap *between* words to mark permissible stops. Boundary-based, so no existing index model applies. Needs waqf-sign data per ayah, which the generated verse data does not yet carry — **this is blocked until that is added**; note it rather than faking it.
- **Ghunnah Timer** (`ghunnah-timer`) — press and hold for the ghunnah's duration, score against 2 ḥarakāt. The first game with a time dimension. Calibrate a ḥarakah against the learner's own tempo, not a fixed millisecond value — the length of a ḥarakah is relative to the reciter's pace, and treating it as absolute teaches a falsehood.

Each: failing test → implement → run → register → commit.

---

## Task 9: Wire into lessons

**Files:** Modify `src/content/schema.ts` (add `games: z.array(z.string()).optional()` to `LessonSchema`), `GamePanel`, and the practice page.

- [ ] Failing test: a lesson declaring `games: ["rule-identifier"]` renders exactly that game.
- [ ] Implement, run the full gate: `npm test && npm run lint && npm run check:refs && npm run check:library`.
- [ ] Commit.

---

## Self-Review

**Spec coverage.** §5.1 blockers → Tasks 1–2 and 7 (registry, `onResult`, audio, span model). §5.2 reuse verdicts → Tasks 3–8. §5.3 all eight drills → Tasks 3–8.

**Deliberate exclusions.** No spaced repetition — `deck.ts` does not do SRS and adding it is net-new work outside this plan. No mastery *persistence*; `onResult` is the seam, and whoever consumes it (a progress store) is separate.

**Type consistency.** `RuleId` comes from Sub-project C's `src/content/tajweed.ts`. `GameResult` is defined once in Task 2 and used by every drill. `segmentGraphemes`/`hasSukun`/`baseOf` from Task 1 are used with those exact signatures in Tasks 5 and 8.

**Known blocker, stated rather than hidden.** Waqf Placer needs per-ayah waqf-sign positions. The pinned Tanzil corpus does **not** carry waqf signs (that is one of the documented differences from quran.com's text), and cpfair does not annotate them. Sourcing that data is unresolved — spec open item 5. Build drills 1–7 excluding waqf, and leave Waqf Placer blocked and labelled.
