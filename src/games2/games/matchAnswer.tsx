"use client";
import { useState } from "react";
import { LETTER_CONCEPTS, RULE_CONCEPTS, RULE_MATERIAL } from "@/generated/concepts";
import { registerGame } from "../registry";
import { shuffleBy, stableIndex } from "./brokenForm";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "match-answer";
const OPTIONS = 4;

/**
 * The replacement for `match.tsx`'s vocabulary quiz.
 *
 * This course does not teach vocabulary, and for Qurʾānic words `meaning`
 * holds a tajweed annotation rather than a gloss — so every option here comes
 * from `RULE_MATERIAL` or a letter's taught name, never from a word. `prompt`
 * is the question text; `promptArabic`, when present, is Arabic script shown
 * large above it (a letter glyph). `answer`/`distractors` are always the same
 * kind of thing — rule names, letters, or letter names — never mixed, so a
 * wrong option is wrong on the merits and not by category.
 */
export type MatchAnswerPayload = {
  prompt: string;
  promptArabic?: string;
  answer: string;
  distractors: string[];
  conceptLabel: string;
};

const RULE_SET: ReadonlySet<string> = new Set(RULE_CONCEPTS);

/**
 * Deterministic rotation pick of up to `k` unique items from `pool`, starting
 * at a seeded offset rather than a fixed prefix. Reuses `brokenForm`'s
 * `stableIndex` — no `Math.random()`, since a session is rebuilt from the
 * ledger on every load and the same set must yield the same questions.
 * `pool` must already be free of duplicates: every pool this file builds
 * (rule ids, letters, distinct letter names) already is.
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

/**
 * Wrong `english` names for `ruleId`, same-`family` ones first.
 *
 * A distractor from another tajweed family is not a choice — "heavy rā" next
 * to "the noon becomes a meem" is identifiable without knowing either rule.
 * Filling from the rule's own family first, and only reaching into the rest
 * of the 59-rule roster if the family runs short, is what keeps the wrong
 * options worth reading.
 */
function ruleMeaningDistractors(ruleId: string, k: number): string[] {
  const family = RULE_MATERIAL[ruleId].family;
  const sameFamily = RULE_CONCEPTS.filter((id) => id !== ruleId && RULE_MATERIAL[id].family === family);
  const rest = RULE_CONCEPTS.filter((id) => id !== ruleId && RULE_MATERIAL[id].family !== family);
  const picked = rotatedPick(`${ruleId}:family`, sameFamily, k);
  if (picked.length < k) picked.push(...rotatedPick(`${ruleId}:rest`, rest, k - picked.length));
  return picked.map((id) => RULE_MATERIAL[id].english);
}

/** rule → English name. `conceptId` is the rule, never a word. */
function ruleMeaningQuestion(ruleId: string): Question {
  const rule = RULE_MATERIAL[ruleId];
  return {
    conceptId: ruleId,
    itemKey: `${GAME_ID}/rule-meaning/${ruleId}`,
    gameId: GAME_ID,
    payload: {
      prompt: rule.translit,
      answer: rule.english,
      distractors: ruleMeaningDistractors(ruleId, OPTIONS - 1),
      conceptLabel: "What this rule means",
    } satisfies MatchAnswerPayload,
  };
}

/**
 * rule → trigger letter. "quick match the correct answer": one option is a
 * letter that fires this rule, the rest do not. `conceptId` stays the rule —
 * the thing being tested is the rule's trigger set, not the letter itself.
 * Skipped when the rule has no trigger letters (most rules — `letters` is
 * non-empty only for the ~15 that key off a specific following letter).
 */
function ruleLetterQuestion(ruleId: string): Question | null {
  const rule = RULE_MATERIAL[ruleId];
  if (rule.letters.length === 0) return null;
  const answer = rotatedPick(`${ruleId}:trigger`, rule.letters, 1)[0];
  const nonTriggering = LETTER_CONCEPTS.filter((l) => !rule.letters.includes(l));
  const distractors = rotatedPick(`${ruleId}:non-trigger`, nonTriggering, OPTIONS - 1);
  if (distractors.length === 0) return null;
  return {
    conceptId: ruleId,
    itemKey: `${GAME_ID}/rule-letter/${ruleId}`,
    gameId: GAME_ID,
    payload: {
      prompt: `Which letter triggers ${rule.translit}?`,
      answer,
      distractors,
      conceptLabel: "Trigger letter",
    } satisfies MatchAnswerPayload,
  };
}

/**
 * letter → name. Pulled from `set.letters` (the lesson's cumulative alphabet
 * pool, each an `ArabicItem` with an optional `name`), never from a word —
 * `conceptId` is the letter itself. Skipped when the letter or its distractor
 * pool has no taught name to ask about.
 */
function letterNameQuestion(set: StudySet, letter: string): Question | null {
  const item = set.letters.find((it) => it.arabic === letter);
  if (!item?.name) return null;

  const seen = new Set<string>([item.name]);
  const namedPool: string[] = [];
  for (const it of set.letters) {
    if (it.arabic === letter || !it.name || seen.has(it.name)) continue;
    seen.add(it.name);
    namedPool.push(it.name);
  }
  const distractors = rotatedPick(`${letter}:name`, namedPool, OPTIONS - 1);
  if (distractors.length === 0) return null;

  return {
    conceptId: letter,
    itemKey: `${GAME_ID}/letter-name/${letter}`,
    gameId: GAME_ID,
    payload: {
      prompt: "Name this letter.",
      promptArabic: letter,
      answer: item.name,
      distractors,
      conceptLabel: "Letter name",
    } satisfies MatchAnswerPayload,
  };
}

export function matchAnswerQuestions(set: StudySet): Question[] {
  const out: Question[] = [];

  for (const ruleId of set.rules) {
    if (!RULE_MATERIAL[ruleId]) continue;
    out.push(ruleMeaningQuestion(ruleId));
    const trigger = ruleLetterQuestion(ruleId);
    if (trigger) out.push(trigger);
  }

  for (const conceptId of new Set(set.concepts)) {
    if (RULE_SET.has(conceptId)) continue;
    const q = letterNameQuestion(set, conceptId);
    if (q) out.push(q);
  }

  return out;
}

export function MatchAnswer({ q, api }: { q: Question; api: GameApi }) {
  const p = q.payload as MatchAnswerPayload;
  const [picked, setPicked] = useState<string | null>(null);
  const done = picked !== null;

  // Deterministic per-question shuffle, not a sort: sorting correlated the
  // answer's slot with the question (see `shuffleBy`'s docstring). Seeded on
  // `itemKey`, so it is still stable across a render — same question, same
  // order — and SSR markup still matches the client.
  const options = shuffleBy([p.answer, ...p.distractors], q.itemKey);
  const arabicOptions = /\p{Script=Arabic}/u.test(p.answer);

  function pick(opt: string) {
    if (done) return;
    setPicked(opt);
    api.answer(opt === p.answer);
  }

  return (
    <div className="text-center">
      {p.promptArabic ? <p className="arabic mb-3 text-5xl text-white">{p.promptArabic}</p> : null}
      <p className="mb-4 text-white/80">{p.prompt}</p>
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

function statusText(p: MatchAnswerPayload, picked: string | null): string {
  if (picked === p.answer) return `✓ ${p.answer}`;
  return `✗ ${p.conceptLabel}: ${p.answer}`;
}

registerGame({
  id: GAME_ID,
  label: "🎯 Match the answer",
  mode: "recognition",
  cost: 1,
  graded: true,
  questions: matchAnswerQuestions,
  render: (q, api) => <MatchAnswer q={q} api={api} />,
});
