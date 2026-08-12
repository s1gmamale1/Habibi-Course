# Practice Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The 14 drills that already ship start remembering. A learner sees what is due today, weak concepts resurface on a schedule, and a missed answer comes back before the session ends.

**Architecture:** An append-only attempt ledger in IndexedDB is the only ground truth. Everything else — due queue, mastery band, practice density — is derived by a pure function that can be thrown away and rebuilt. FSRS with published defaults does the scheduling, keyed on **concepts, not items**. Session assembly is client-side; the drills already emit typed results and nothing listens yet.

**Tech Stack:** TypeScript, Next.js 16 (static export), Vitest, `idb` for IndexedDB, `ts-fsrs` for the scheduler.

## Global Constraints

Every task inherits these. They come from nine research passes and several are non-obvious.

- **The ledger is append-only.** Never `UPDATE`, never `DELETE` an attempt. Retries are new rows. The reference project overwrote and documented it as a defect; for duration-graded drills it destroys the distribution, which is the whole signal.
- **`null` means unmeasured. `0` is a claim.** An ungraded drill writes `correct: null`, never `false`. Ungraded attempts must not move a band, break a streak, or count as a miss.
- **No speed metric may exist anywhere** — no XP, no "minutes practised", no per-second scoring, no time bonus. `GhunnahTimer` and `MaddCounter` grade a *held duration against a target*; overshooting is an error. Any metric monotonic in duration corrupts them.
- **No XP, levels, badges, coins, leagues, leaderboards, hearts, or streak-with-a-cliff.** Decided on evidence: Duolingo has published **no** result showing any of these improves learning, only retention — and relatedness (g=1.776), the largest measured gamification benefit, is structurally unavailable to a solo learner.
- **Mastery bands are diagnosis, never earned status.** "This rule needs review", not "You earned Gold". Performance-contingent rewards *undermine* intrinsic motivation (d=−0.28, 128 studies); informational feedback enhances it. Same mechanic, opposite sign, decided by wording.
- **Checkpoints stay human.** They are live oral gates with a teacher. Never automate, gate, score, or reward them.
- **Never fragment an āyah.** Idghām, iqlāb and ikhfāʾ operate at the *junction between words*. Chip/tile layouts put a border exactly where the rule lives. The āyah stays one text node with inline spans.
- **Do not edit `content/**` or `library/**`.** Those are the vault and its transcriptions, governed by `check:library` and ADR-003.
- **Gates must stay green:** `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run check:library`, `npm run build`. Current floor: **535 tests / 52 files, 0 lint errors, 231 static pages.** Never weaken a test to pass.

---

## The decision that shaped this plan

**Scheduling is keyed on CONCEPTS (47), not items (1,641).**

I originally planned per-item FSRS. The measurement killed it: at 14 slots per session it takes **118 sessions to show every item once**, so a card would be reviewed roughly every four months. FSRS builds stability from *repeated reviews of the same card*; at that spacing it has nothing to work with.

The reframe: **the learning object is the rule, not the exemplar.** A learner does not need to remember that `مِنْ رَبِّهِمْ` is idghām — they need to recognise idghām anywhere. So the scheduler tracks 47 concepts (18 tajweed rules + 29 letters) and **draws a fresh exemplar each review**. That gives dense data per concept within days, and it tests the rule rather than memory of one card — which is pedagogically better, not merely a workaround.

Items remain in the ledger for reporting and for a future per-item mode.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/practice/types.ts` | `Attempt`, `ConceptState`, `Grade`, `SessionPlan`. No logic. |
| `src/practice/ledger.ts` | IndexedDB open/append/readAll. The only writer. |
| `src/practice/derive.ts` | **Pure.** `Attempt[] → Map<conceptId, ConceptState>`. No IO, no clock — takes `now` as an argument. |
| `src/practice/schedule.ts` | FSRS wrapper: grade mapping, `review()`, `dueConcepts()`. Pure. |
| `src/practice/session.ts` | **Pure.** Assembles a `SessionPlan` from due concepts + item pool. |
| `src/practice/useSession.ts` | React glue: runs a plan, owns the tail queue, calls `recordAttempt`. |
| `src/components/practice/SessionRunner.tsx` | The three-band screen. |
| `src/components/practice/FeedbackBar.tsx` | Fixed-height verdict + **the named rule**. |
| `src/components/practice/DueToday.tsx` | Entry point: what is due, density, weak list. |

`derive.ts`, `schedule.ts` and `session.ts` are pure and IO-free **on purpose** — they are the code that must run unchanged server-side when ADR-007 lands.

---

## Task 1: Widen `GameResult` so measurements survive

**Files:**
- Modify: `src/components/games/GameRegistry.ts:21-30`
- Modify: `src/components/games/tajweed/GhunnahTimer.tsx:172-174`
- Test: `src/components/games/tajweed/GhunnahTimer.test.tsx`

**Interfaces:**
- Produces: `GameResult.measure?: { heldMs, msPerHarakah, targetHarakat, measuredHarakat }` — consumed by Tasks 2 and 4.

`GhunnahTimer` computes `scoreHold()` → `{counts, correct}` and emits only `correct`. `counts`, `heldMs` and `msPerHarakah` — the learner's own calibration, established over three reference holds precisely so the drill never hardcodes "a ḥarakah = 500ms" — are discarded at the boundary. Without this task the pedagogical content of both timed drills never reaches storage.

- [ ] **Step 1: Write the failing test**

```ts
test("emits the measurement, not just the verdict", async () => {
  const results: GameResult[] = [];
  render(<GhunnahTimer items={[item]} onResult={(r) => results.push(r)} />);
  await calibrate(); // three reference holds
  await hold(900);
  expect(results.at(-1)?.measure).toMatchObject({
    heldMs: expect.any(Number),
    msPerHarakah: expect.any(Number),
    targetHarakat: 2,
  });
  expect(results.at(-1)!.measure!.measuredHarakat).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npx vitest run src/components/games/tajweed/GhunnahTimer.test.tsx`
Expected: FAIL — `measure` is `undefined`.

- [ ] **Step 3: Widen the type**

```ts
export type GameResult = {
  gameId: string;
  ruleId?: RuleId;
  /** null = ungradeable/skipped. NEVER false for "no verdict" — see Global Constraints. */
  correct: boolean | null;
  at: number;
  /** Present only for duration-graded drills. The raw measurement, kept because
   *  `correct` is a lossy derivation of it and tolerances may be retuned later. */
  measure?: {
    heldMs: number;
    msPerHarakah: number;
    targetHarakat: number;
    measuredHarakat: number;
  };
};
```

- [ ] **Step 4: Emit it from `GhunnahTimer`**

```ts
const { counts, correct } = scoreHold(held, msPerHarakah, target);
setOutcome({ kind: "scored", counts, correct });
onResult?.({
  gameId: GAME_ID, ruleId: rule, correct, at: now(),
  measure: { heldMs: held, msPerHarakah, targetHarakat: target, measuredHarakat: counts },
});
```

- [ ] **Step 5: `MaddCounter` gets `choice`, NOT `measure`** *(corrected 2026-08-12 — the original instruction here was wrong)*

`MaddCounter` is **not duration-graded**. Its `held` is a *prop*, nothing is timed, and there is no calibration step. It grades against `acceptedHarakat(rule)` — a **set** — and `madd_246` accepts `[2,4,6]` because the rule genuinely permits any of the three. Its own header comment: *"A drill that marked four wrong for it would be teaching a falsehood."*

Filling `measure` would mean writing `heldMs: 0, msPerHarakah: 0` — a fabricated measurement, the same defect class as `correct: false` for "no verdict" that the Global Constraints forbid. So it emits a separate optional field instead:

```ts
/** Drills where the learner SELECTS a length rather than holding one. */
choice?: { chosenHarakat: number; acceptedHarakat: number[] };
```

This captures what was actually being discarded: **which** length was picked — a 2-for-6 miss is a different diagnosis from a 4-for-6 miss — and the full accepted set.

**Downstream (Tasks 2, 3, 4):** map `choice.chosenHarakat → measuredHarakat`, and **leave `targetHarakat` undefined when the accepted set has more than one member.** Picking one of three would record a falsehood. A grader that sees a `choice` with no single target falls back to `correct`.
- [ ] **Step 6: Fix every `correct: boolean` consumer** the `| null` widening breaks. `npx tsc --noEmit` lists them.
- [ ] **Step 7: Full gate + commit**

Run: `npm test && npx tsc --noEmit && npm run lint`

---

## Task 2: The append-only ledger

**Files:**
- Create: `src/practice/types.ts`, `src/practice/ledger.ts`
- Test: `src/practice/ledger.test.ts`
- Add dep: `npm i idb`

**Interfaces:**
- Produces: `appendAttempt(a: Attempt): Promise<void>`, `allAttempts(): Promise<Attempt[]>` — consumed by Tasks 3 and 6.

- [ ] **Step 1: Define the record**

```ts
export type Attempt = {
  id: string;              // crypto.randomUUID()
  at: number;
  conceptId: string;       // rule id or letter — the SCHEDULING key
  itemKey: string;         // the exemplar actually shown; for reporting
  gameId: string;
  correct: boolean | null; // null = ungraded. Never false for "no verdict".
  measuredHarakat?: number;
  /** Undefined when the rule accepts several lengths (madd_246 accepts 2, 4 and 6).
   *  Never collapse a set to one value — that records a falsehood the drill exists to refute. */
  targetHarakat?: number;
  acceptedHarakat?: number[];
  msPerHarakah?: number;   // without this, measuredHarakat is uninterpretable later
  sessionId: string;
  isInterleaved: boolean;  // review items double as the retention instrument
};
```

- [ ] **Step 2: Write the failing test**

```ts
test("appends and never mutates", async () => {
  await appendAttempt(mk({ correct: false }));
  await appendAttempt(mk({ correct: true }));   // same concept, a retry
  const all = await allAttempts();
  expect(all).toHaveLength(2);                   // two rows, not one updated row
  expect(all.map((a) => a.correct)).toEqual([false, true]);
});

test("an ungraded attempt stores null, not false", async () => {
  await appendAttempt(mk({ correct: null }));
  expect((await allAttempts()).at(-1)!.correct).toBeNull();
});
```

- [ ] **Step 3: Run it, watch it fail** — module does not exist.
- [ ] **Step 4: Implement with `idb`**, store `attempts`, `keyPath: "id"`, index on `conceptId` and on `at`. No update or delete method may exist on the module surface — absence is the guarantee.
- [ ] **Step 5: Run, pass, commit.**

---

## Task 3: `derive()` — pure, rebuildable state

**Files:**
- Create: `src/practice/derive.ts`
- Test: `src/practice/derive.test.ts`

**Interfaces:**
- Consumes: `Attempt[]` from Task 2.
- Produces: `ConceptState { conceptId, attempts, correct, ewma, cleanStreak, band, promoteStreak, demoteStreak, lastSeenAt }` — consumed by Tasks 4, 6, 8.

Two behaviours here are lifted from a reference implementation's *bug fixes*, not its design.

- [ ] **Step 1: Write the failing tests**

```ts
test("an ungraded attempt changes nothing", () => {
  const base = derive([mk({ correct: true })], NOW);
  const withNull = derive([mk({ correct: true }), mk({ correct: null })], NOW);
  expect(withNull.get("idgham")).toEqual(base.get("idgham"));
});

// The reference project shipped the naive version: one lucky answer made an
// active weakness vanish from the queue built to target it.
test("one good rep does not clear a weak concept", () => {
  const s = derive([...wrong(5), mk({ correct: true })], NOW).get("idgham")!;
  expect(s.ewma).toBeGreaterThan(20);
  expect(s.cleanStreak).toBe(1);
});

test("three clean reps do clear it", () => {
  const s = derive([...wrong(5), ...right(3)], NOW).get("idgham")!;
  expect(s.cleanStreak).toBe(3);
});

test("demotion needs two consecutive bad sessions, promotion three good", () => { /* … */ });
```

- [ ] **Step 2: Run, watch fail.**
- [ ] **Step 3: Implement**

```ts
const KEEP = 0.7, NEW = 0.3, RESOLVED = 20, CLEAN_RUN = 3;

/** wrong = 1 · ungraded = skip · correct = 0. Continuous for measured drills:
 *  a 1.8-of-2 hold is neither right nor wrong, so the signal is the miss ratio. */
function wrongSignal(a: Attempt): number | null {
  if (a.correct === null) return null;                       // no signal at all
  if (a.measuredHarakat != null && a.targetHarakat != null) {
    const tol = a.targetHarakat * 0.25;
    return Math.min(1, Math.abs(a.measuredHarakat - a.targetHarakat) / tol);
  }
  return a.correct ? 0 : 1;
}
```

`derive(attempts, now)` folds attempts in `at` order; `null` signals `continue` before touching any counter. EWMA `s' = KEEP*s + NEW*(100*signal)`. `cleanStreak` increments only when `signal < 0.05` and resets otherwise; a concept is resolved only at `cleanStreak >= CLEAN_RUN`.

- [ ] **Step 4: Run, pass.**
- [ ] **Step 5: Mutation-check** — set `CLEAN_RUN = 1`, confirm "one good rep" fails, restore.
- [ ] **Step 6: Commit.**

---

## Task 4: FSRS scheduling on concepts

**Files:**
- Create: `src/practice/schedule.ts`
- Test: `src/practice/schedule.test.ts`
- Add dep: `npm i ts-fsrs`

**Interfaces:**
- Produces: `gradeOf(a: Attempt): Grade`, `reviewConcept(state, grade, now)`, `dueConcepts(states, now): string[]`.

FSRS with **published default parameters**. Benchmarked over 9,999 collections / ~350M reviews, untrained FSRS beats *trained* half-life regression on every metric — which matters because we start with zero data. Tune **desired retention** (0.9), never the parameters.

- [ ] **Step 1: Write the failing tests**

```ts
test("a held duration maps to a graded answer, not a boolean", () => {
  expect(gradeOf(hold(2.0, 2))).toBe(Rating.Easy);
  expect(gradeOf(hold(1.7, 2))).toBe(Rating.Good);
  expect(gradeOf(hold(1.2, 2))).toBe(Rating.Hard);
  expect(gradeOf(hold(0.6, 2))).toBe(Rating.Again);
});

test("overshooting is an error, symmetrically", () => {
  expect(gradeOf(hold(3.4, 2))).toBe(Rating.Again);   // NOT rewarded for longer
});

test("a wrong answer schedules sooner than a right one", () => {
  const soon = reviewConcept(fresh, Rating.Again, NOW).due;
  const later = reviewConcept(fresh, Rating.Good, NOW).due;
  expect(soon.getTime()).toBeLessThan(later.getTime());
});
```

The overshoot test is the guard on the whole no-speed-metric constraint. It must exist.

- [ ] **Step 2: Run, watch fail.**
- [ ] **Step 3: Implement**

```ts
const ratio = (m: number, t: number) => Math.abs(m - t) / t;
export function gradeOf(a: Attempt): Grade {
  if (a.measuredHarakat != null && a.targetHarakat != null) {
    const r = ratio(a.measuredHarakat, a.targetHarakat);   // symmetric: over === under
    if (r <= 0.10) return Rating.Easy;
    if (r <= 0.25) return Rating.Good;
    if (r <= 0.50) return Rating.Hard;
    return Rating.Again;
  }
  // A choice drill with several accepted lengths has no single target to score
  // against, so it grades on the verdict. See Task 1 Step 5.
  return a.correct ? Rating.Good : Rating.Again;
}
```

Seed a new concept's difficulty from a per-rule prior (hard rules start stiffer) rather than a learned model.

- [ ] **Step 4: Run, pass, commit.**

---

## Task 5: Session assembly

**Files:**
- Create: `src/practice/session.ts`
- Test: `src/practice/session.test.ts`

**Interfaces:**
- Produces: `planSession(states, pool, now): SessionPlan` — consumed by Task 6.

14 slots. **A timed drill costs 2 slots, everything else 1** — a ḥarakāt hold takes far longer than a multiple choice, so budgeting in items would make sessions wildly uneven.

- [ ] **Step 1: Write the failing tests**

```ts
test("budgets in slots, so at most two timed drills appear", () => {
  const plan = planSession(allDue, pool, NOW);
  expect(plan.items.filter((i) => TIMED.has(i.gameId)).length).toBeLessThanOrEqual(2);
  expect(cost(plan)).toBeLessThanOrEqual(14);
});

// Lifted from Duolingo's documented Review Exercise placement rule.
test("interleaved items never sit in the first two or last two slots", () => {
  const idx = plan.items.flatMap((it, i) => (it.isInterleaved ? [i] : []));
  for (const i of idx) {
    expect(i).toBeGreaterThanOrEqual(2);
    expect(i).toBeLessThan(plan.items.length - 2);
  }
});

test("never more than two consecutive items of the same drill shape", () => { /* … */ });
test("response mode ramps: recognition before production", () => { /* … */ });
```

- [ ] **Step 2: Run, watch fail.**
- [ ] **Step 3: Implement** — ~70% focus concept, ~25% interleaved from concepts met a known distance back, one deliberately hard item last. Exemplars drawn fresh from the pool per concept.
- [ ] **Step 4: Run, pass, commit.**

---

## Task 6: The wrong-answer tail

**Files:**
- Create: `src/practice/useSession.ts`
- Test: `src/practice/useSession.test.ts`

**Interfaces:**
- Consumes: `SessionPlan` (Task 5), `appendAttempt` (Task 2).
- Produces: `{ current, progress, tailLength, submit(result), isComplete }`.

The single cheapest high-value mechanic. Duolingo's whitepaper: *"an exercise targeting the same concept is resurfaced at the very end of the lesson."*

**The detail that makes or breaks it: a DIFFERENT exemplar of the same concept, never the identical item.** Replaying the same question is answered from memory of the correction just read — a near-worthless retrieval event.

- [ ] **Step 1: Write the failing tests**

```ts
test("a miss re-queues a DIFFERENT exemplar of the same concept", () => {
  const s = run(plan);
  s.submit({ conceptId: "idgham", itemKey: "item-a", correct: false });
  const tail = s.tailItems();
  expect(tail[0].conceptId).toBe("idgham");
  expect(tail[0].itemKey).not.toBe("item-a");     // the load-bearing assertion
});

test("the session does not end while the tail is non-empty", () => { /* … */ });
test("the tail is bounded: max 6 items, max 2 attempts per concept", () => { /* … */ });
test("a concept still failing after 2 tail attempts is flagged for next session", () => { /* … */ });
test("every submit appends exactly one attempt row", async () => { /* … */ });
```

- [ ] **Step 2–4: Run/fail, implement, pass, commit.**

---

## Task 6b: Register the six letter drills *(added 2026-08-12, found by Task 5)*

**Files:** `src/components/games/{Flashcards,FormSwap,WordBuilder,LetterQuiz,SpotTheLetter}.tsx`, `src/practice/session.ts` (`DRILL_MODES`)

**The gap.** Only the seven *tajweed* drills call `registerGame`. The six letter drills are rendered from a literal tab list in `GamePanel.tsx:24-47` and have **no `gameId` at all** — verified: `grep -c registerGame` returns 0 for every one.

**Why it matters.** `shapeOf()` keys the response mode off `gameId`, so every unregistered drill falls to the default (recognition, 1 slot). **29 of the 47 concepts are letters**, so 62% of the roster currently plans as an all-recognition session with no ramp — and the recognition → discrimination → production ramp is one of the few structural ideas with *causal* evidence behind it (regression-discontinuity, Portnoff et al. 2021).

- [ ] **Step 1: Write the failing test** — a letter concept's plan contains at least one non-recognition item.
- [ ] **Step 2: Run it, watch it fail** — every item is `recognition`.
- [ ] **Step 3: Register each drill** with a stable `gameId`, following the pattern in `src/components/games/tajweed/*.tsx`.
- [ ] **Step 4: Add `DRILL_MODES` entries.** Suggested: `flashcards` recognition · `letter-quiz` recognition · `spot-the-letter` discrimination · `form-swap` discrimination · `word-builder` production. None is timed, so all cost 1 slot.
- [ ] **Step 5: Verify the roster still resolves to 47** and no drill is double-registered.
- [ ] **Step 6: Full gate + commit.**

**Do not** wire `GamePanel`'s literal tab list to the registry here — that is a separate change and this task must stay small.

## Task 6d: The letter drills must actually report *(added 2026-08-12, found by Task 6b)*

**Files:** `src/components/games/{LetterQuiz,SpotTheLetter,FormSwap,WordBuilder}.tsx`

**The gap, and it is the largest in the plan.** Task 6b registered all six letter drills, so they now have a `gameId` and a response mode. But **none of them emits a `GameResult`** — verified: `grep -c onResult` returns **0** for all five files while `registerGame` returns 2-3.

So **29 of the 47 concepts never produce a single ledger row.** Their FSRS schedule can never move off its seed no matter how much the learner practises: permanently due, permanently unknown, forever. The practice engine would work for the 18 tajweed rules and quietly do nothing for the letters — which is 62% of the roster and the entire first half of the course.

**Scope: the four drills with an objective verdict.** `LetterQuiz`, `SpotTheLetter`, `FormSwap` and `WordBuilder` each have a real first-try right/wrong available. Emit `{ gameId, correct, at }` with `conceptId` supplied by the caller (the letter drills have no `ruleId`, which is exactly why `attemptFromResult` requires `conceptId` in its context rather than inferring it).

Each needs two decisions made explicitly, not by accident:
- **An injected `now`**, as the tajweed drills already take — never `Date.now()` inside the component, or the drill is untestable.
- **What counts as one attempt** in a multi-round drill. First try only, or every pick? The tajweed drills answer this per-drill; follow their precedent and state your choice.

**The two flashcard decks are deliberately excluded.** They self-grade — "✓ Got it" is a claim the learner makes about themselves, not a measurement — and synthesising a `correct` from it would put an unearned verdict in an append-only ledger.

> **Worth noting for whoever picks this up:** self-report is *not* inherently dishonest as an SRS input — it is exactly how Anki works, and FSRS is built for it. The objection is narrower: here "✓ Got it" is a card-flip affordance, and the learner does not know it drives scheduling. Make the UI say so and the signal becomes legitimate. **That is a Task 7 design decision, not a data-integrity one** — do not resolve it by quietly emitting.

- [ ] **Step 1: Write the failing test** — a letter concept accumulates ledger rows after a session, and its schedule moves off the seed.
- [ ] **Step 2: Run it, watch it fail** — zero rows for every letter concept.
- [ ] **Step 3: Add `onResult` + injected `now`** to the four objective drills, following `src/components/games/tajweed/RuleIdentifier.tsx` for the pattern.
- [ ] **Step 4: Confirm the shape** — no fabricated fields; `correct` is a real verdict, never a default.
- [ ] **Step 5: Mutation-check + full gate + commit.**

## Task 6c: Close the flag loop *(added 2026-08-12, found by Task 6)*

**Files:** `src/practice/session.ts`

**The gap.** `useSession` mints `flagged` — concepts missed and *not repaired* in the tail — and nothing consumes it. `planSession`'s signature has no parameter for it, and `pickInterleaveConcepts` orders by due date and weakness only. So the plan's claim that a repeated failure *"converts a failure into scheduling information"* is **half-built**: the information is produced and dropped at session end.

**Preferred fix: derive it, do not store it.** A flagged concept is one whose most recent attempts in the ledger show a miss with no subsequent clean rep in the same session. That keeps the architecture's central property — the ledger is ground truth, everything else is derived and rebuildable — and needs no new storage or plumbing through React state. Falling back to an `opts.prioritise?: readonly string[]` parameter is acceptable if derivation proves awkward, but say which you chose and why.

- [ ] **Step 1: Write the failing test** — a concept flagged in the previous session appears in the next session's interleaved slots ahead of an equally-due unflagged one.
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Implement**, keeping `planSession` pure.
- [ ] **Step 4: Confirm it does not override the focus concept** — a flag raises interleave priority, it does not hijack the session.
- [ ] **Step 5: Mutation-check + full gate + commit.**

### Accepted deviation, recorded so it is not "fixed" back

**A tail retry is recorded `isInterleaved: false`, even when the item that spawned it was interleaved.** Task 6 deviated from the brief here and was right to. That flag *is* the retention instrument — it answers "did this concept survive being left alone". A retry two minutes after corrective feedback measures **repair, not survival**, so inheriting `true` would inject a near-instant re-test into the retention data and inflate the exact number the flag exists to report. Pinned by the test `a tail retry is never recorded as interleaved`.

## Task 7: The session screen

**Files:**
- Create: `src/components/practice/SessionRunner.tsx`, `FeedbackBar.tsx`
- Test: `src/components/practice/SessionRunner.test.tsx`

Three bands. **The primary button never moves** — Check, feedback and Continue all render in the same fixed slot at the same height, so the eye does not travel and Enter-Enter drives the loop.

```
┌──────────────────────────────────────────────┐
│  [✕]   ▓▓▓▓▓▓▓▓▓░░░░░░░░░░              │ ← fills RIGHT→LEFT
├──────────────────────────────────────────────┤
│  <the drill renders here, unchanged>         │
├──────────────────────────────────────────────┤
│  ✓  إدغام بغنّة — النون الساكنة قبل الميم      │ ← THE RULE, not just ✓
│                                  [  متابعة  ] │ ← same position as تحقّق
└──────────────────────────────────────────────┘
```

- [ ] **Step 1: Write the failing tests**

```ts
test("a wrong answer names the rule and its condition, not just the verdict", () => {
  submitWrong();
  expect(screen.getByRole("status").textContent).toMatch(/إدغام/);
  expect(screen.getByRole("status").textContent).not.toMatch(/^(خطأ|✗)$/);
});

test("the feedback bar reserves its height so nothing above it shifts", () => { /* … */ });
test("the progress track is RTL", () => {
  expect(getComputedStyle(track).direction).toBe("rtl");
});
test("no audio element is created", () => {
  expect(container.querySelector("audio")).toBeNull();
});
```

Duolingo bets on implicit pattern extraction and it is their most consistent criticism from teachers. Tajweed is a finite, explicitly rule-governed system — **we invert that deliberately**, so the rule-naming test is a requirement, not a nicety.

No UI sound: the audio channel belongs to recitation, and a chirp competing with a madd example is actively harmful.

- [ ] **Step 2–4: Run/fail, implement, pass, commit.**

---

## Task 8: Due Today

**Files:**
- Create: `src/components/practice/DueToday.tsx`
- Modify: `src/app/practice/[id]/page.tsx`
- Test: `src/components/practice/DueToday.test.tsx`

```
┌────────────────────────────────────────┐
│  للمراجعة اليوم            ١٢ مفهوم     │
│  ┌──────────────────────────────────┐  │
│  │        ▶  ابدأ المراجعة           │  │ ← ONE loud action
│  └──────────────────────────────────┘  │
│                                        │
│  تحتاج مراجعة                           │
│   ⚠ إدغام بغنّة                        │  ← diagnosis, NOT a grade
│   ⚠ مد منفصل                           │
│                                        │
│  تدرّبت ١٤ من آخر ٢١ يوماً                │ ← rolling, cannot break
│  هذا الأسبوع  ●●○                       │ ← 3 distinct days
└────────────────────────────────────────┘
```

- [ ] **Step 1: Write the failing tests**

```ts
test("shows a diagnosis, never a grade or a score", () => {
  render(<DueToday states={states} />);
  expect(screen.getByText(/تحتاج مراجعة/)).toBeTruthy();
  expect(container.textContent).not.toMatch(/XP|نقطة|ذهبي|المركز/);
});

test("the density display has no loss condition", () => {
  const { container } = render(<DueToday states={missedYesterday} />);
  expect(container.textContent).not.toMatch(/انقطع|خسرت|صفر/);
});

test("the weekly target counts distinct DAYS, not minutes or points", () => { /* … */ });
```

- [ ] **Step 2–4: Run/fail, implement, pass, commit.**
- [ ] **Step 5: Full gate** — `npm test && npm run lint && npx tsc --noEmit && npm run check:library && npm run build`

---

## Out of scope (deliberately)

- The Duolingo-style **path/serpentine home screen**. Real, but a separate plan — this one has to earn its keep first.
- **Server sync.** `derive`, `schedule` and `session` are pure so they run unchanged after ADR-007. Nothing here blocks it.
- **Per-item scheduling.** The ledger records `itemKey`, so it stays available if concept-level ever proves too coarse.
- **Audio.** Deferred by the owner and untouched here.
