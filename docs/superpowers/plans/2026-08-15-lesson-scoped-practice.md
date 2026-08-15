# Lesson-Scoped Practice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a lesson's practice drill what that lesson taught, using the curriculum's own material, and stop testing vocabulary the course never teaches.

**Architecture:** The concept space moves from a hardcoded 18-id render palette to the library's real 88 (59 rules + 29 letters), generated to TypeScript at build time. A lesson resolves to its own concepts, and games are rebuilt on library material — rule conditions, trigger letters, and worked āyah examples — instead of on word glosses.

**Tech Stack:** Next.js 16 (`output: "export"`), TypeScript, Vitest + Testing Library, `idb`, `ts-fsrs`, `fake-indexeddb`.

## Global Constraints

From `docs/superpowers/specs/2026-08-15-lesson-scoped-practice-design.md`. Every task inherits these.

- **No game may test the meaning of an Arabic word.** This course teaches reading, not vocabulary. This is the constraint the whole plan exists to satisfy.
- The ledger is **append-only**. Never UPDATE, never DELETE.
- **`null` means unmeasured; `0`/`false` is a claim.**
- **No XP, levels, badges, coins, leagues, leaderboards, hearts, or streak-with-a-cliff.**
- **Every wrong answer names the thing and the violated condition.**
- A timer may be **shown**, never recorded or graded. No `Attempt` gains a duration.
- Qurʾānic text is **never hand-typed** — sliced from the pinned corpus or copied from a library note's `examples`.
- Questions are reproducible: **no `Math.random()`** in question generation or planning.
- The library note is the source; code is the transcription (ADR-003).
- `derive`, `schedule` and `session` stay **IO-free** — they run in a browser and later on a DOM-less server (ADR-007). Anything reading the library must be generated at build time.
- Keep files under 500 lines. No jest-dom: `toBeTruthy()`/`toBeNull()`.
- **Run `npm test`, never bare `npx vitest run`.** Do not commit on a red gate.
- **Never add a `Co-Authored-By` trailer.**

---

## What the investigation established

Numbers the tasks below depend on. Re-measure rather than trust if something looks off.

- The curriculum teaches **59 rule ids**; `TAJWEED_RULES` holds **18**; **7** match exactly, **13** after normalising spelling drift, **46 taught rules have no code concept**.
- **5 code ids have no library note at all** — `madd_2`, `madd_246`, `madd_6`, `qalqalah`, `silent`. They are span colours for rendering āyāt, not rules.
- Live spelling drift: library `idgham_shafawi` ↔ code `idghaam_shafawi`; library `ikhfa_haqiqi` ↔ code `ikhfa`.
- `teaches:` coverage — Unit 1: 0/15, Unit 2: 1/14, Unit 3: **30/37**, Unit 4: 0/8. The 7 empty Unit 3 lessons (`3-01, 3-09, 3-14, 3-19, 3-26, 3-33, 3-37`) are consolidation lessons.
- **59 of 60** rule notes carry `examples:` with `ref` + `text`.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `scripts/build-concepts.mjs` | Read the library, emit `src/generated/concepts.ts`. |
| `src/generated/concepts.ts` | Generated + committed: the 88 concepts and each rule's teaching material. |
| `src/games2/lessonConcepts.ts` | A lesson id → the concepts it taught. |
| `src/games2/games/matchAnswer.tsx` | Match the correct answer — never a gloss. |
| `src/games2/games/fillBlank.tsx` | An āyah span blanked; name the rule / the trigger letter. |
| `src/games2/games/buildByForm.tsx` | Place positional forms correctly. |

**Modified**

| File | Change |
|---|---|
| `src/practice/concepts.ts` | `isConceptId` validates against the generated 88. |
| `src/content/tajweed.ts` | `TAJWEED_RULES` documented as the render palette; unchanged otherwise. |
| `src/games2/types.ts` | `StudySet` gains `concepts` and real `rules`. |
| `src/games2/studySetFromData.ts` | Build a set from a lesson's own concepts. |
| `src/games2/games/index.ts` | Register the new three; drop `match`, `type-it`. |
| `src/components/practice/PracticeSession.tsx` | Lesson-scoped practice vs due review. |
| `scripts/check-library.mjs` | Gate: every code rule id resolves to a note. |

**Deleted:** `src/games2/games/match.tsx`, `typeIt.tsx`, `wordBank.tsx` and their tests. `buildByForm` replaces `wordBank`; `matchAnswer` replaces `match`.

`TAJWEED_RULES` is **not renamed.** The spec says "demote", and demotion is achieved by documenting its role and by the new gate — renaming would touch 21 files across the seven old tajweed drills and the renderer for no functional gain, and mechanical churn on working code is its own risk.

---

## Task 1: Generate the concept model from the library

**Files:**
- Create: `scripts/build-concepts.mjs`, `src/generated/concepts.ts`, `src/generated/concepts.test.ts`
- Modify: `package.json` (add `build:concepts`)

**Interfaces:**
- Produces: `CONCEPTS: readonly string[]` (88), `RULE_CONCEPTS`, `LETTER_CONCEPTS`, and `RULE_MATERIAL: Readonly<Record<string, RuleMaterial>>` where
  `RuleMaterial = { id: string; english: string; translit: string; family: string; letters: string[]; harakat: number | null; examples: { ref: string; text: string; note?: string }[] }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/generated/concepts.test.ts
import { describe, expect, test } from "vitest";
import { CONCEPTS, LETTER_CONCEPTS, RULE_CONCEPTS, RULE_MATERIAL } from "./concepts";

describe("the concept model", () => {
  test("is the library's 59 rules plus 29 letters", () => {
    expect(RULE_CONCEPTS).toHaveLength(59);
    expect(LETTER_CONCEPTS).toHaveLength(29);
    expect(CONCEPTS).toHaveLength(88);
  });

  test("includes what lessons actually teach, which the old 18-id list did not", () => {
    // `leen` is in the title of the lesson that produced the bug report; the
    // sifat are taught across Unit 3 and had no concept at all.
    for (const id of ["leen", "izhar_halqi", "lam_jalalah", "madd_arid_lissukun", "hams", "istila"]) {
      expect(RULE_CONCEPTS).toContain(id);
    }
  });

  test("excludes the five render-palette ids, which no library note defines", () => {
    // madd_2/madd_246/madd_6/qalqalah/silent are span colours in
    // `content/tajweed.ts`, not rules. No lesson teaches them.
    for (const id of ["madd_2", "madd_246", "madd_6", "silent"]) {
      expect(RULE_CONCEPTS).not.toContain(id);
    }
  });

  test("carries the material a question can be built from", () => {
    const ikhfa = RULE_MATERIAL["ikhfa_haqiqi"];
    expect(ikhfa.english).toMatch(/conceal/i);
    expect(ikhfa.letters).toHaveLength(15);
    expect(ikhfa.harakat).toBe(2);
    expect(ikhfa.examples.length).toBeGreaterThan(0);
    for (const ex of ikhfa.examples) {
      expect(ex.ref).toMatch(/^\d+:\d+$/);
      expect(ex.text).toMatch(/\p{Script=Arabic}/u);
    }
  });

  test("all but one rule carries at least one worked example", () => {
    const withExamples = RULE_CONCEPTS.filter((id) => (RULE_MATERIAL[id]?.examples.length ?? 0) > 0);
    expect(withExamples.length).toBeGreaterThanOrEqual(RULE_CONCEPTS.length - 1);
  });

  test("no concept id repeats", () => {
    expect(new Set(CONCEPTS).size).toBe(CONCEPTS.length);
  });
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npm test -- src/generated/concepts.test.ts`
Expected: FAIL — `Failed to resolve import "./concepts"`.

- [ ] **Step 3: Write the generator**

```js
// scripts/build-concepts.mjs
#!/usr/bin/env node
// Emits src/generated/concepts.ts from the library.
//
// The library is the source (ADR-003) and is read through `node:fs`, but
// `practice/concepts.ts` has to run in a browser — so the concept list is
// generated and committed, exactly as the Qur'an corpus already is.
//
// This exists because the scheduler's concept space was previously
// `TAJWEED_RULES` in src/content/tajweed.ts, which is the span-colour palette
// for rendering ayat: 46 of the 59 rules the curriculum teaches had no id at
// all, and 5 ids in that list are taught by nothing.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "src/generated/concepts.ts");

/** Frontmatter only — enough for the scalar and inline-list fields we need. */
function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  return m ? m[1] : "";
}
const scalar = (fm, key) => {
  const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(fm);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
};
const list = (fm, key) => {
  const m = new RegExp(`^${key}:\\s*\\[(.*?)\\]$`, "m").exec(fm);
  return m ? m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean) : [];
};

/** `examples:` is a block list of `- ref: / text: / note:` items. */
function examples(text) {
  const block = /^examples:\n([\s\S]*?)(?=\n[a-z_]+:|\n---)/m.exec(text);
  if (!block) return [];
  const out = [];
  for (const chunk of block[1].split(/^\s*-\s+/m).slice(1)) {
    const ref = /ref:\s*"?([^"\n]+)"?/.exec(chunk)?.[1]?.trim();
    const txt = /text:\s*"?([^"\n]+)"?/.exec(chunk)?.[1]?.trim();
    const note = /note:\s*"?([^"\n]+)"?/.exec(chunk)?.[1]?.trim();
    if (ref && txt) out.push(note ? { ref, text: txt, note } : { ref, text: txt });
  }
  return out;
}

const rules = [];
for (const f of readdirSync(join(ROOT, "library/02-Rules")).sort()) {
  if (!f.endsWith(".md")) continue;
  const text = readFileSync(join(ROOT, "library/02-Rules", f), "utf8");
  const fm = frontmatter(text);
  if (scalar(fm, "type") !== "rule") continue;
  const id = scalar(fm, "id");
  if (!id) continue;
  const harakat = scalar(fm, "harakat");
  rules.push({
    id,
    english: scalar(fm, "english") ?? id,
    translit: scalar(fm, "translit") ?? id,
    family: scalar(fm, "family") ?? "",
    letters: list(fm, "letters"),
    harakat: harakat === null ? null : Number(harakat),
    examples: examples(text),
  });
}

const letters = [];
for (const f of readdirSync(join(ROOT, "library/03-Letters")).sort()) {
  if (!f.endsWith(".md")) continue;
  const fm = frontmatter(readFileSync(join(ROOT, "library/03-Letters", f), "utf8"));
  const arabic = scalar(fm, "arabic");
  if (scalar(fm, "type") === "letter" && arabic) letters.push(arabic);
}

mkdirSync(join(ROOT, "src/generated"), { recursive: true });
writeFileSync(
  OUT,
  `// GENERATED by scripts/build-concepts.mjs — do not edit.
// Run \`npm run build:concepts\` after changing library/02-Rules or library/03-Letters.
//
// The 88 concepts the scheduler keys on (ADR-008): ${rules.length} tajweed rules
// and ${letters.length} letters, read from the library, which is the source.

export type RuleMaterial = {
  id: string;
  english: string;
  translit: string;
  family: string;
  /** The letters that trigger this rule. 15 for ikhfa; empty where not applicable. */
  letters: string[];
  harakat: number | null;
  examples: { ref: string; text: string; note?: string }[];
};

export const RULE_CONCEPTS = ${JSON.stringify(rules.map((r) => r.id), null, 2)} as const;

export const LETTER_CONCEPTS = ${JSON.stringify(letters, null, 2)} as const;

export const CONCEPTS: readonly string[] = [...RULE_CONCEPTS, ...LETTER_CONCEPTS];

export const RULE_MATERIAL: Readonly<Record<string, RuleMaterial>> = ${JSON.stringify(
    Object.fromEntries(rules.map((r) => [r.id, r])),
    null,
    2,
  )};
`,
);
console.log(`wrote ${OUT}: ${rules.length} rules, ${letters.length} letters`);
```

- [ ] **Step 4: Add the npm script and run it**

Add to `package.json` scripts: `"build:concepts": "node scripts/build-concepts.mjs"`.

Run: `npm run build:concepts`
Expected: `wrote …/src/generated/concepts.ts: 59 rules, 29 letters`. If the counts differ, **stop and report** — the parser is wrong, or the library changed.

- [ ] **Step 5: Run the test, pass**

Run: `npm test -- src/generated/concepts.test.ts` — Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add scripts/build-concepts.mjs src/generated/concepts.ts src/generated/concepts.test.ts package.json
git commit -m "feat(concepts): generate the 88 concepts from the library, not a render palette"
```

---

## Task 2: Point `isConceptId` at the 88, and gate the drift

**Files:**
- Modify: `src/practice/concepts.ts`, `src/practice/concepts.test.ts`, `src/content/tajweed.ts`, `scripts/check-library.mjs`, `scripts/check-library.test.mjs`

**Interfaces:**
- Consumes: `CONCEPTS`, `RULE_CONCEPTS` from `@/generated/concepts`.
- Produces: `isConceptId` unchanged in signature, widened in meaning.

- [ ] **Step 1: Write the failing test**

```ts
// append to src/practice/concepts.test.ts
import { RULE_CONCEPTS } from "@/generated/concepts";

describe("isConceptId, against the real curriculum", () => {
  test("accepts every rule the library defines, not just the render palette's 18", () => {
    for (const id of RULE_CONCEPTS) expect(isConceptId(id)).toBe(true);
  });

  test("accepts the rules that had no concept before", () => {
    // `leen` is in the title of the lesson that produced the bug report.
    for (const id of ["leen", "izhar_halqi", "lam_jalalah", "hams"]) {
      expect(isConceptId(id)).toBe(true);
    }
  });

  test("rejects a render-palette id that names no rule", () => {
    // `madd_2` is a span colour. Nothing teaches it, and scheduling it would
    // seed a concept no lesson can ever surface.
    expect(isConceptId("madd_2")).toBe(false);
  });

  test("still rejects the misspelling that caught four fixtures", () => {
    expect(isConceptId("idgham")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — `leen` and the other 45 are rejected today.

- [ ] **Step 3: Implement**

In `src/practice/concepts.ts`, replace the `TAJWEED_RULES` import with `CONCEPTS` from `@/generated/concepts` and build `RULES` from `RULE_CONCEPTS`. The letter branch (single Arabic grapheme, `\p{Lo}` base plus `\p{M}*`) is unchanged — keep it and its comment, including the U+0653 maddah note.

In `src/content/tajweed.ts`, add a doc comment above `TAJWEED_RULES` recording what it is:

```ts
/**
 * The span-colour palette for rendering ayat — NOT the concept space.
 *
 * Five of these ids (`madd_2`, `madd_246`, `madd_6`, `qalqalah`, `silent`)
 * have no library note and are taught by no lesson: they are colouring
 * categories. The scheduler's concepts live in `@/generated/concepts`, which is
 * generated from the library and holds all 59 taught rules. Conflating the two
 * is what made a madd lesson generate vocabulary questions about `ا`.
 */
```

- [ ] **Step 4: Add the drift gate to `check-library.mjs`**

Every rule id referenced in `src/` must resolve to a library note, *except* the five palette ids, which are allowed and named explicitly. This is what makes `idghaam_shafawi` vs `idgham_shafawi` a build failure instead of two silent concepts.

```js
// in checkVault, after the rule notes are collected
const PALETTE_ONLY = new Set(["madd_2", "madd_246", "madd_6", "qalqalah", "silent"]);
// ...for each id referenced by a lesson note's `teaches:`
for (const n of notes.filter((x) => x.data.type === "lesson")) {
  for (const id of n.data.teaches ?? []) {
    if (!ruleStatus.has(id) && !PALETTE_ONLY.has(id)) {
      errors.push(`${n.rel}: teaches "${id}" but no rule note has that id`);
    }
  }
}
```

- [ ] **Step 5: Full gate + commit**

```bash
npm test && npm run lint && npx tsc --noEmit && npm run check:library && npm run build
git add src/practice/concepts.ts src/practice/concepts.test.ts src/content/tajweed.ts scripts/check-library.mjs
git commit -m "fix(concepts): the scheduler keys on what lessons teach, not on span colours"
```

---

## Task 3: A lesson's own concepts

**Files:**
- Create: `src/games2/lessonConcepts.ts`, `src/games2/lessonConcepts.test.ts`
- Modify: `scripts/build-concepts.mjs` (also emit `LESSON_CONCEPTS`), `src/generated/concepts.ts`

**Interfaces:**
- Produces: `LESSON_CONCEPTS: Readonly<Record<string, string[]>>` in the generated file, and `lessonConcepts(lessonId): string[]`.

- [ ] **Step 1: Write the failing test**

```ts
// src/games2/lessonConcepts.test.ts
import { describe, expect, test } from "vitest";
import { lessonConcepts } from "./lessonConcepts";
import { isConceptId } from "@/practice/concepts";

describe("lessonConcepts", () => {
  test("a tajweed lesson resolves to the rules it teaches", () => {
    // 3-23 teaches iqlab; its curriculum note declares it.
    expect(lessonConcepts("3-23")).toContain("iqlab");
  });

  test("a letters lesson resolves to the letters it introduces", () => {
    // Unit 1 declares no `teaches:` — its concepts are its letter slides.
    const c = lessonConcepts("1-06");
    expect(c).toContain("ك");
    expect(c).toContain("ل");
    expect(c.some((id) => id.length > 2)).toBe(false); // no rule ids here
  });

  test("a consolidation lesson with no teaches and no new letters is not empty", () => {
    // 3-01 "Makharij Consolidated" declares `teaches: []` and introduces no
    // letter. A lesson that reviews everything practises everything taught so
    // far — an empty set would leave its practice screen blank.
    expect(lessonConcepts("3-01").length).toBeGreaterThan(0);
  });

  test("every concept it returns is schedulable", () => {
    for (const lid of ["1-06", "2-08", "3-10", "3-23", "4-05"]) {
      for (const id of lessonConcepts(lid)) expect(isConceptId(id)).toBe(true);
    }
  });

  test("an unknown lesson yields nothing rather than throwing", () => {
    expect(lessonConcepts("9-99")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — module does not exist.

- [ ] **Step 3: Extend the generator**

In `scripts/build-concepts.mjs`, walk `library/04-Curriculum/**/*.md` for `type: lesson`, and for each read `id` and `teaches:`. Then walk `content/lessons/*.json` for that id and collect its `kind: "letter"` slide letters. Emit:

```js
export const LESSON_CONCEPTS: Readonly<Record<string, string[]>> = { ... };
```

Rule for each lesson, in order:
1. `teaches:` rule ids that resolve to a rule concept, **plus** the letters its letter slides introduce.
2. If that set is empty — a consolidation lesson — fall back to **every concept taught in earlier lessons**, cumulative. `3-01`, `3-09`, `3-14`, `3-19`, `3-26`, `3-33`, `3-37` are the seven that need this, and they are review lessons, so reviewing everything is the correct reading rather than a fudge.

Re-run `npm run build:concepts`.

- [ ] **Step 4: Implement the accessor**

```ts
// src/games2/lessonConcepts.ts
import { LESSON_CONCEPTS } from "@/generated/concepts";

/**
 * What a lesson taught, as schedulable concepts.
 *
 * This is what the previous games layer had no access to: it planned over a
 * cumulative letter-and-word pool, so a lesson about madd generated questions
 * about `ا`. Generated at build time because the curriculum notes are read
 * through `node:fs` and this has to run in a browser.
 */
export function lessonConcepts(lessonId: string): string[] {
  return LESSON_CONCEPTS[lessonId] ?? [];
}
```

- [ ] **Step 5: Run, pass, commit**

```bash
npm test -- src/games2/lessonConcepts.test.ts
git add scripts/build-concepts.mjs src/generated/concepts.ts src/games2/lessonConcepts.ts src/games2/lessonConcepts.test.ts
git commit -m "feat(games2): a lesson resolves to the concepts it actually taught"
```

---

## Task 4: `StudySet` carries the lesson's concepts

**Files:**
- Modify: `src/games2/types.ts`, `src/games2/studySetFromData.ts`, `src/games2/studySet.ts`, and their tests.

**Interfaces:**
- Produces: `StudySet` gains `concepts: string[]` (what this set is *about*) and `rules: string[]` becomes the lesson's real rule concepts rather than a hardcoded `[]`.

- [ ] **Step 1: Write the failing test**

```ts
// append to src/games2/studySet.test.ts
import { lessonSet } from "./studySet";

describe("a lesson's set is about that lesson", () => {
  test("a tajweed lesson's set carries its rules", () => {
    const set = lessonSet("3-23");
    expect(set.rules).toContain("iqlab");
    expect(set.concepts).toContain("iqlab");
  });

  test("rules is no longer hardcoded empty", () => {
    // The previous slice set `rules: []` unconditionally, which is why the
    // entire tajweed dimension was absent from every set.
    expect(lessonSet("3-23").rules.length).toBeGreaterThan(0);
  });

  test("a letters lesson carries letter concepts and no rules", () => {
    const set = lessonSet("1-06");
    expect(set.rules).toEqual([]);
    expect(set.concepts).toContain("ك");
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — `concepts` does not exist and `rules` is `[]`.

- [ ] **Step 3: Implement**

Add `concepts: string[]` to `StudySet` in `types.ts`. In `studySetFromData.ts`, take the lesson's concepts as a parameter (it must stay fs-free, so it cannot call `lessonConcepts` itself if that would drag the generated file's size into the client bundle — it will not; `@/generated/concepts` is a plain TS constant, so importing it is safe). Split `concepts` into `rules` (those in `RULE_CONCEPTS`) and letters.

`lessonSet(lessonId)` passes `lessonConcepts(lessonId)`.

- [ ] **Step 4: Run, pass, full gate, commit**

```bash
npm test && npx tsc --noEmit
git add src/games2/types.ts src/games2/studySetFromData.ts src/games2/studySet.ts src/games2/studySet.test.ts
git commit -m "feat(games2): a StudySet knows which concepts it is about"
```

---

## Task 5: Match the correct answer

Replaces `match.tsx`, which asked for an English gloss.

**Files:**
- Create: `src/games2/games/matchAnswer.tsx`, `matchAnswer.test.tsx`
- Delete: `src/games2/games/match.tsx`, `match.test.tsx`

**Interfaces:**
- Produces: registers `match-answer` (recognition, cost 1, graded); exports `matchAnswerQuestions(set)`, `MatchAnswer`, `type MatchAnswerPayload = { prompt: string; promptArabic?: string; answer: string; distractors: string[]; conceptLabel: string }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/games2/games/matchAnswer.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { lessonSet } from "../studySet";
import { matchAnswerQuestions, MatchAnswer, type MatchAnswerPayload } from "./matchAnswer";

describe("matchAnswerQuestions", () => {
  test("asks about the lesson's rules, not about word meanings", () => {
    const qs = matchAnswerQuestions(lessonSet("3-23"));
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) expect(q.conceptId).not.toMatch(/^\p{Script=Arabic}+$/u);
  });

  test("no option is an English gloss of an Arabic word", () => {
    // The constraint this whole plan exists for. The old game's options were
    // "steam / opening / bread" on a madd lesson.
    for (const q of matchAnswerQuestions(lessonSet("3-23"))) {
      const p = q.payload as MatchAnswerPayload;
      for (const o of [p.answer, ...p.distractors]) expect(o).not.toMatch(/^(door|house|name|bread)$/i);
    }
  });

  test("a letters lesson asks letter ↔ name", () => {
    const qs = matchAnswerQuestions(lessonSet("1-06"));
    expect(qs.length).toBeGreaterThan(0);
    const p = qs[0].payload as MatchAnswerPayload;
    expect(p.distractors.length).toBeGreaterThan(0);
    expect(p.distractors).not.toContain(p.answer);
  });

  test("questions are deterministic", () => {
    const a = JSON.stringify(matchAnswerQuestions(lessonSet("3-23")));
    expect(a).toBe(JSON.stringify(matchAnswerQuestions(lessonSet("3-23"))));
  });
});

describe("MatchAnswer", () => {
  const q = () => matchAnswerQuestions(lessonSet("3-23"))[0];

  test("the right option reports correct", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as MatchAnswerPayload;
    render(<MatchAnswer q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.answer }));
    expect(answer).toHaveBeenCalledWith(true);
  });

  test("a wrong option reports incorrect and names the right answer", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as MatchAnswerPayload;
    render(<MatchAnswer q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.distractors[0] }));
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status").textContent).toContain(p.answer);
  });
});
```

- [ ] **Step 2: Run it, watch it fail** — module does not exist.

- [ ] **Step 3: Implement**

Question kinds, all from `RULE_MATERIAL` and the letter notes — pick per concept with the existing `stableIndex` so selection is deterministic:

- **rule → English name.** Prompt is the rule's `translit`; options are other rules' `english`, preferring same-`family` distractors, since a distractor from another family is too easy.
- **rule → trigger letter.** Prompt names the rule; options are Arabic letters, one of which is in `letters` and the rest are not. This is the game the owner described as "quick match the correct answer".
- **letter → name.** Prompt is the letter; options are letter names.

`conceptId` is the rule id or the letter — never derived from a word. Register with `mode: "recognition"`, `cost: 1`, `graded: true`.

Delete `match.tsx` and `match.test.tsx` in the same commit.

- [ ] **Step 4: Verify against real content**

Run: `npx tsx -e "import {lessonSet} from './src/games2/studySet'; import {matchAnswerQuestions as f} from './src/games2/games/matchAnswer'; for (const l of ['1-06','3-10','3-23']) console.log(l, f(lessonSet(l)).length)"`
Expected: non-zero for all three. Report the counts.

- [ ] **Step 5: Run, pass, commit**

```bash
npm test -- src/games2/games/matchAnswer.test.tsx
git add src/games2/games/matchAnswer.tsx src/games2/games/matchAnswer.test.tsx
git rm src/games2/games/match.tsx src/games2/games/match.test.tsx
git commit -m "feat(games2): match the correct answer — rules and letters, never a gloss"
```

---

## Task 6: Fill in the blank

**Files:**
- Create: `src/games2/games/fillBlank.tsx`, `fillBlank.test.tsx`

**Interfaces:**
- Produces: registers `fill-blank` (discrimination, cost 1, graded); exports `fillBlankQuestions(set)`, `FillBlank`, `type FillBlankPayload = { ref: string; before: string; blank: string; after: string; answer: string; distractors: string[]; ask: string }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/games2/games/fillBlank.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { lessonSet } from "../studySet";
import { fillBlankQuestions, FillBlank, type FillBlankPayload } from "./fillBlank";

describe("fillBlankQuestions", () => {
  test("builds from the lesson's own rules' worked examples", () => {
    const qs = fillBlankQuestions(lessonSet("3-23"));
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      const p = q.payload as FillBlankPayload;
      expect(p.ref).toMatch(/^\d+:\d+$/);
      expect(p.blank).toMatch(/\p{Script=Arabic}/u);
    }
  });

  test("the ayah text is never hand-typed — it comes from the note", () => {
    // Constraint: Quranic text is sliced from the corpus or copied from a
    // library note, never authored here.
    for (const q of fillBlankQuestions(lessonSet("3-23"))) {
      const p = q.payload as FillBlankPayload;
      expect(`${p.before}${p.blank}${p.after}`).toMatch(/\p{Script=Arabic}/u);
    }
  });

  test("a lesson with no rules yields nothing rather than throwing", () => {
    expect(fillBlankQuestions(lessonSet("1-06"))).toEqual([]);
  });

  test("questions are deterministic", () => {
    const a = JSON.stringify(fillBlankQuestions(lessonSet("3-23")));
    expect(a).toBe(JSON.stringify(fillBlankQuestions(lessonSet("3-23"))));
  });
});

describe("FillBlank", () => {
  test("the right option reports correct; a wrong one names the answer", async () => {
    const answer = vi.fn();
    const q = fillBlankQuestions(lessonSet("3-23"))[0];
    const p = q.payload as FillBlankPayload;
    render(<FillBlank q={q} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.distractors[0] }));
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status").textContent).toContain(p.answer);
  });
});
```

- [ ] **Step 2: Run it, watch it fail.**

- [ ] **Step 3: Implement**

For each rule concept in `set.rules`, for each of its `examples`: split `text` into `before`/`blank`/`after` by removing the span the rule applies to — use the example's own `text` and the rule's `letters` to locate the trigger, falling back to blanking the whole example when the trigger cannot be located (report how often that happens rather than hiding it).

Two asks, chosen deterministically per question: **"which rule is this?"** (options are rule `english` names, distractors preferred from the same `family`) and **"which letter triggered it?"** (options are Arabic letters, one from `letters`).

`conceptId` is the rule id. `ask` carries the question text so the component does not re-derive it.

- [ ] **Step 4: Verify against real content, run, pass, commit**

Report question counts for `3-10`, `3-23`, `3-30`, and the fallback rate for span location.

```bash
git add src/games2/games/fillBlank.tsx src/games2/games/fillBlank.test.tsx
git commit -m "feat(games2): fill in the blank, from each rule's own worked examples"
```

---

## Task 7: Build by form

Replaces `wordBank.tsx`, which was cued by meaning.

**Files:**
- Create: `src/games2/games/buildByForm.tsx`, `buildByForm.test.tsx`
- Delete: `src/games2/games/wordBank.tsx`, `wordBank.test.tsx`, `typeIt.tsx`, `typeIt.test.tsx`

**Interfaces:**
- Produces: registers `build-by-form` (production, cost 1, graded); exports `buildByFormQuestions(set)`, `BuildByForm`, `type BuildByFormPayload = { word: string; slots: ("initial"|"medial"|"final"|"isolated")[]; tiles: string[]; answer: string[] }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/games2/games/buildByForm.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { lessonSet } from "../studySet";
import { buildByFormQuestions, BuildByForm, type BuildByFormPayload } from "./buildByForm";

describe("buildByFormQuestions", () => {
  test("cues on the word's shape, never on its meaning", () => {
    // The owner: "re-order or construct the words (meaning the correct forms
    // not the actual words cuz we don teach the language vocab)".
    for (const q of buildByFormQuestions(lessonSet("2-08"))) {
      expect(JSON.stringify(q.payload)).not.toMatch(/meaning|translit/i);
    }
  });

  test("tiles are positional FORMS, not bare letters", () => {
    const p = buildByFormQuestions(lessonSet("2-08"))[0].payload as BuildByFormPayload;
    expect(p.tiles.length).toBeGreaterThan(1);
    expect(p.slots.length).toBe(p.answer.length);
  });

  test("questions are deterministic", () => {
    const a = JSON.stringify(buildByFormQuestions(lessonSet("2-08")));
    expect(a).toBe(JSON.stringify(buildByFormQuestions(lessonSet("2-08"))));
  });
});

describe("BuildByForm", () => {
  test("one verdict per completed word, never per tile", async () => {
    const answer = vi.fn();
    const q = buildByFormQuestions(lessonSet("2-08"))[0];
    const p = q.payload as BuildByFormPayload;
    render(<BuildByForm q={q} api={{ answer, now: () => 1 }} />);
    const tiles = screen.getAllByTestId(/^tile-/);
    await userEvent.click(tiles[0]);
    expect(answer).not.toHaveBeenCalled();
    for (let i = 1; i < p.answer.length; i += 1) {
      await userEvent.click(screen.getAllByTestId(/^tile-/)[0]);
    }
    expect(answer).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it, watch it fail.**

- [ ] **Step 3: Implement**

Show the word's letters as **positional form tiles** (`contextualGlyphs`, as `brokenForm` does — one mechanism, no tatweel, so no rendering tell) and ask the learner to place them in reading order. The cue is the word itself rendered in outline/slots, never a gloss or a transliteration.

One verdict per completed word — a tile placed mid-word is not an answer. `conceptId` is the word's first letter via `baseLetters`.

Delete `wordBank.*` and `typeIt.*` in the same commit.

- [ ] **Step 4: Run, pass, commit**

```bash
git add src/games2/games/buildByForm.tsx src/games2/games/buildByForm.test.tsx
git rm src/games2/games/wordBank.tsx src/games2/games/wordBank.test.tsx src/games2/games/typeIt.tsx src/games2/games/typeIt.test.tsx
git commit -m "feat(games2): build by form — construct the shape, not the vocabulary"
```

---

## Task 8: The gates that would have caught this

**Files:**
- Modify: `src/games2/contract.test.ts`
- Modify: `src/games2/games/index.ts` (register the new three, drop the deleted two)

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/games2/contract.test.ts
import { lessonConcepts } from "./lessonConcepts";
import { RULE_MATERIAL } from "@/generated/concepts";

describe("practice corresponds to the lesson", () => {
  // The gate that would have caught the bug report: a madd lesson generated
  // questions about `ا` because the pool was cumulative and letter-shaped.
  for (const lid of ["1-06", "2-08", "3-10", "3-23", "4-05"]) {
    test(`every question on ${lid} names a concept ${lid} taught`, () => {
      const taught = new Set(lessonConcepts(lid));
      const qs = questionsFor([...SLICE_GAME_IDS], lessonSet(lid), { gradedOnly: true });
      expect(qs.length).toBeGreaterThan(0);
      for (const q of qs) expect(taught.has(q.conceptId)).toBe(true);
    });
  }
});

describe("no game tests vocabulary", () => {
  // The constraint the whole plan exists for. Checkable, and worth mechanising
  // because this failure was invisible to 998 passing tests.
  const GLOSSES = ["door", "house", "name", "mountain", "heart", "dates", "bread"];
  test("no question payload offers an English gloss as an option", () => {
    for (const lid of ["1-06", "3-10", "3-23"]) {
      for (const q of questionsFor([...SLICE_GAME_IDS], lessonSet(lid), { gradedOnly: true })) {
        const blob = JSON.stringify(q.payload).toLowerCase();
        for (const g of GLOSSES) expect(blob).not.toMatch(new RegExp(`"${g}"`));
      }
    }
  });
});
```

- [ ] **Step 2: Run.** Both must pass. **If the lesson-correspondence test fails, fix the game that emits the foreign concept — never widen the assertion.**

- [ ] **Step 3: Commit**

```bash
git add src/games2/contract.test.ts src/games2/games/index.ts
git commit -m "test(games2): practice must name what the lesson taught, and never a gloss"
```

---

## Task 9: Two surfaces

**Files:**
- Modify: `src/components/practice/PracticeSession.tsx`, `SetScreen.tsx`, `src/app/practice/[id]/page.tsx`, and their tests.

- [ ] **Step 1: Write the failing test**

```tsx
// append to src/components/practice/PracticeSession.test.tsx
test("practising a lesson draws only from that lesson's concepts", async () => {
  const user = userEvent.setup();
  render(<PracticeSession data={deriveGameData(allLessons(), "3-23")} games={[]} />);
  await user.click(await screen.findByTestId("practice-lesson"));
  const band = await screen.findByTestId("drill-band");
  expect(band.getAttribute("data-concept-id")).toBe("iqlab");
});
```

- [ ] **Step 2: Run it, watch it fail** — there is one button and it starts a due review.

- [ ] **Step 3: Implement**

Two entry points, as the spec requires them separate:

- **Practice this lesson** (`data-testid="practice-lesson"`) — plans over `questionsFor(SLICE_GAME_IDS, lessonSet(id), { gradedOnly: true })` filtered to `lessonConcepts(id)`, unscheduled, always available.
- **Review** — the existing due-driven session over all 88 concepts, unchanged.

`SessionRunner`'s drill band gains `data-concept-id` so the test above can assert what is being asked.

- [ ] **Step 4: Full gate + commit**

```bash
npm test && npm run lint && npx tsc --noEmit && npm run check:library && npm run build
git commit -m "feat(practice): practise this lesson, or review what is due — not both at once"
```

---

## Task 10: Wire it and measure

**Files:**
- Modify: `src/app/practice/[id]/page.tsx` if needed
- Create: `src/components/practice/lessonScoped.test.tsx`

- [ ] **Step 1: Write the end-to-end test**

A session on `3-23` contains ≥2 distinct games and every row it writes names a concept `3-23` taught. Read the rows back out of a real `fake-indexeddb` ledger.

- [ ] **Step 2: Measure and report, do not tune**

For lessons `1-06`, `2-08`, `3-10`, `3-23`, `4-05`, report: questions available, items planned, distinct games, distinct modes, and **the concepts asked about**. The last column is the one that matters — it must be the lesson's own.

- [ ] **Step 3: Manual verification — the human operator does this, do NOT perform it**

Skip and say so. The owner will play it.

- [ ] **Step 4: Full gate + commit**

---

## Out of scope

- **Porting the seven old tajweed drills** onto `GameSpec`. They stay on the old registry; the new games cover rule concepts directly, which is what the wishlisted Unit 3 regression actually needed.
- **Migrating ledger rows** written under the old ids. `schedulesFromLedger` is permissive by design; a retired id was still genuinely answered.
- **Audio-dependent games** — recording is skipped by owner decision.
- **The mandatory end-of-lesson check** and **sound effects** — wishlisted separately.
