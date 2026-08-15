"use client";
import { useState } from "react";
import { stripDiacritics } from "@/games/arabic";
import { LETTER_CONCEPTS, RULE_CONCEPTS, RULE_MATERIAL, type RuleMaterial } from "@/generated/concepts";
import { registerGame } from "../registry";
import { stableIndex } from "./brokenForm";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "fill-blank";
const OPTIONS = 4;

/**
 * Fill in the blank, built from each taught rule's OWN worked examples
 * (`RULE_MATERIAL[ruleId].examples`) rather than any word pool — this is the
 * game that closes the thin-question gap `matchAnswer` left on rule-only
 * lessons (`3-23` had just 2 questions; see progress ledger, Task 5 carry).
 *
 * `before`/`blank`/`after` always concatenate back to the example's own
 * `text` — never hand-typed, never re-flowed. `ref` and `text` are real
 * Qurʾānic citations copied verbatim from the library note through
 * `RULE_MATERIAL`.
 */
export type FillBlankPayload = {
  ref: string;
  before: string;
  blank: string;
  after: string;
  answer: string;
  distractors: string[];
  ask: string;
};

type Example = RuleMaterial["examples"][number];

/** A bare combining mark strips to nothing; a base letter does not. */
function isDiacritic(ch: string): boolean {
  return ch.length > 0 && stripDiacritics(ch) === "";
}

/**
 * Locate the rule's trigger inside `text` and split around it, grouping the
 * base letter with any harakat/tanwīn immediately following it so the blank
 * reads as one grapheme, not a bare consonant.
 *
 * Returns `null` — and callers fall back to blanking the whole example —
 * when no letter in `letters` appears in `text` at all. That is a real and
 * expected outcome, not a bug to paper over: `RULE_MATERIAL.letters` names
 * what triggers the rule, not what this one excerpt happens to contain. The
 * classic case is a noon-sākinah/tanwīn rule (e.g. `iqlab`) whose trigger is
 * the FIRST letter of the FOLLOWING word — outside a single-word example's
 * `text` — or a rule like `ra_tafkhim`/`ra_tarqiq` whose `letters` is empty
 * by design (the trigger is the rā's own ḥaraka, not a following letter).
 */
function locateTrigger(
  text: string,
  letters: readonly string[],
): { before: string; blank: string; after: string; letter: string } | null {
  if (letters.length === 0) return null;
  const triggers = new Set(letters);
  const chars = [...text];
  for (let i = 0; i < chars.length; i += 1) {
    if (!triggers.has(chars[i])) continue;
    let end = i + 1;
    while (end < chars.length && isDiacritic(chars[end])) end += 1;
    return {
      before: chars.slice(0, i).join(""),
      blank: chars.slice(i, end).join(""),
      after: chars.slice(end).join(""),
      letter: chars[i],
    };
  }
  return null;
}

/**
 * Deterministic rotation pick of up to `k` unique items from `pool` — same
 * mechanism as `matchAnswer`'s (duplicated rather than imported: neither
 * module exports it, and `stableIndex` is the shared primitive both build
 * on).
 */
function rotatedPick<T>(seed: string, pool: readonly T[], k: number): T[] {
  if (pool.length === 0 || k <= 0) return [];
  const start = stableIndex(seed, pool.length);
  const out: T[] = [];
  for (let i = 0; i < pool.length && out.length < k; i += 1) {
    out.push(pool[(start + i) % pool.length]);
  }
  return out;
}

/** Wrong rule `english` names for `ruleId`, same-`family` ones preferred. */
function ruleAskDistractors(ruleId: string, seed: string, k: number): string[] {
  const family = RULE_MATERIAL[ruleId].family;
  const sameFamily = RULE_CONCEPTS.filter((id) => id !== ruleId && RULE_MATERIAL[id].family === family);
  const rest = RULE_CONCEPTS.filter((id) => id !== ruleId && RULE_MATERIAL[id].family !== family);
  const picked = rotatedPick(`${seed}:family`, sameFamily, k);
  if (picked.length < k) picked.push(...rotatedPick(`${seed}:rest`, rest, k - picked.length));
  return picked.map((id) => RULE_MATERIAL[id].english);
}

/**
 * Wrong letters for a "which letter triggered it?" ask — never one of the
 * rule's own triggers.
 *
 * Compares by BASE letter, not raw string equality: `ghunnah` is the one
 * rule whose `letters` entries carry a shadda (`"نّ"`, `"مّ"` — the rule fires
 * on a geminated noon/meem, not a following letter), two code points against
 * every other rule's one. Comparing raw strings would let `LETTER_CONCEPTS`'
 * bare `"ن"`/`"م"` slip into the distractor pool right next to their own
 * shadda-marked trigger — confusable at best.
 */
function letterAskDistractors(ruleLetters: readonly string[], seed: string, k: number): string[] {
  const bases = new Set(ruleLetters.map(stripDiacritics));
  const nonTriggering = LETTER_CONCEPTS.filter((l) => !bases.has(l));
  return rotatedPick(`${seed}:non-trigger`, nonTriggering, k);
}

/**
 * One question from one (rule, example) pair.
 *
 * The ask is chosen deterministically per question (`stableIndex` on the
 * example's own ref, never `Math.random()`): "which rule is this?" or
 * "which letter triggered it?" — the latter only when the rule has trigger
 * letters at all. When the trigger WAS located in `text`, the letter-ask
 * answer is that exact located letter (honest to the blank actually shown)
 * rather than an arbitrary member of `letters`; when it fell back to
 * blanking the whole example, the answer falls back the same way, to a
 * deterministic pick from the rule's own trigger set.
 */
function fillBlankQuestion(ruleId: string, rule: RuleMaterial, example: Example, index: number): Question | null {
  const located = locateTrigger(example.text, rule.letters);
  const before = located?.before ?? "";
  const blank = located?.blank ?? example.text;
  const after = located?.after ?? "";
  const seed = `${ruleId}:${example.ref}:${index}`;

  const wantLetterAsk = rule.letters.length > 0 && stableIndex(`${seed}:ask`, 2) === 1;
  if (wantLetterAsk) {
    const distractors = letterAskDistractors(rule.letters, seed, OPTIONS - 1);
    if (distractors.length > 0) {
      // Base letter only — `located.letter` already is one (a single code
      // point read off `text`); the fallback pick is normalized to match,
      // since `rule.letters` itself is not always bare (see `ghunnah`).
      const answer = located?.letter ?? stripDiacritics(rotatedPick(`${seed}:trigger`, rule.letters, 1)[0]);
      return {
        conceptId: ruleId,
        itemKey: `${GAME_ID}/${ruleId}/${index}`,
        gameId: GAME_ID,
        payload: {
          ref: example.ref,
          before,
          blank,
          after,
          answer,
          distractors,
          ask: "Which letter triggered this blank?",
        } satisfies FillBlankPayload,
      };
    }
  }

  const distractors = ruleAskDistractors(ruleId, seed, OPTIONS - 1);
  if (distractors.length === 0) return null;
  return {
    conceptId: ruleId,
    itemKey: `${GAME_ID}/${ruleId}/${index}`,
    gameId: GAME_ID,
    payload: {
      ref: example.ref,
      before,
      blank,
      after,
      answer: rule.english,
      distractors,
      ask: "Which rule explains this blank?",
    } satisfies FillBlankPayload,
  };
}

export function fillBlankQuestions(set: StudySet): Question[] {
  const out: Question[] = [];
  for (const ruleId of set.rules) {
    const rule = RULE_MATERIAL[ruleId];
    if (!rule) continue;
    rule.examples.forEach((example, index) => {
      const q = fillBlankQuestion(ruleId, rule, example, index);
      if (q) out.push(q);
    });
  }
  return out;
}

export function FillBlank({ q, api }: { q: Question; api: GameApi }) {
  const p = q.payload as FillBlankPayload;
  const [picked, setPicked] = useState<string | null>(null);
  const done = picked !== null;

  // Stable option order: shuffling in render would differ between SSR and client.
  const options = [p.answer, ...p.distractors].sort();
  const arabicOptions = /\p{Script=Arabic}/u.test(p.answer);

  function pick(opt: string) {
    if (done) return;
    setPicked(opt);
    api.answer(opt === p.answer);
  }

  return (
    <div className="text-center">
      <p className="mb-1 text-xs text-white/50">{p.ref}</p>
      <p dir="rtl" className="arabic mb-4 text-3xl leading-loose text-white">
        {p.before}
        <span className="mx-1 inline-block min-w-[2em] border-b-2 border-dashed border-white/60 align-middle">
          &nbsp;
        </span>
        {p.after}
      </p>
      <p className="mb-4 text-white/80">{p.ask}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            aria-disabled={done}
            onClick={() => pick(opt)}
            className={`rounded-xl border px-4 py-2 text-white ${arabicOptions ? "arabic text-3xl" : ""} ${
              done && opt === p.answer
                ? "game-correct"
                : done && opt === picked
                  ? "border-red-400/70 bg-red-500/15"
                  : "border-white/10 bg-white/5"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-white/80">
        {!done ? "" : statusText(p, picked)}
      </p>
    </div>
  );
}

function statusText(p: FillBlankPayload, picked: string | null): string {
  if (picked === p.answer) return `✓ ${p.answer}`;
  return `✗ ${p.answer}`;
}

registerGame({
  id: GAME_ID,
  label: "✏️ Fill in the blank",
  mode: "discrimination",
  cost: 1,
  graded: true,
  questions: fillBlankQuestions,
  render: (q, api) => <FillBlank q={q} api={api} />,
});
