"use client";
import { useEffect, useRef, useState } from "react";
import { baseLetters } from "@/games/arabic";
import { registerGame } from "../registry";
import { stableIndex } from "./brokenForm";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "match";
const OPTIONS = 4;

export type MatchPayload = { arabic: string; meaning: string; distractors: string[] };

/**
 * Pick `OPTIONS - 1` distractors from `pool`, starting at a word-seeded
 * offset rather than a fixed prefix.
 *
 * A fixed `slice(0, k)` made the same handful of meanings appear as the
 * distractor set for nearly every word — measured on real content, 3 of 4
 * distinct distractor sets across 82 questions were the identical triple. A
 * learner eliminates those fixed strings once and never reads the Arabic
 * again. Rotating the start index by `stableIndex(seed, pool.length)` spreads
 * distractor membership across the whole pool while staying reproducible —
 * no `Math.random()`, because the session is rebuilt from the ledger on every
 * load and the same word must yield the same question.
 */
function pickDistractors(seed: string, pool: string[]): string[] {
  const start = stableIndex(seed, pool.length);
  const seen = new Set<string>();
  const picked: string[] = [];
  for (let i = 0; i < pool.length && picked.length < OPTIONS - 1; i += 1) {
    const m = pool[(start + i) % pool.length];
    if (seen.has(m)) continue;
    seen.add(m);
    picked.push(m);
  }
  return picked;
}

export function matchQuestions(set: StudySet): Question[] {
  const meanings = set.words.map((w) => w.meaning);
  if (set.words.length < 2) return [];

  return set.words.flatMap((w) => {
    // The taught concept, not the glyph as written: a word opening with a
    // hamza-carrier (أ إ آ) drills the base letter (ا) the scheduler actually
    // tracks, the same normalisation `deriveGameData`'s word-pool filter
    // already applies via `baseLetters`. Using the display glyph here wrote
    // ledger rows for concepts (أ, ؤ, ئ, ى) that are not among the 47 the
    // roster tracks and no lesson ever taught on their own.
    const conceptId = baseLetters(w.arabic)[0];
    if (!conceptId) return [];
    const pool = meanings.filter((m) => m !== w.meaning);
    if (pool.length === 0) return [];
    const distractors = pickDistractors(w.arabic, pool);
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
  // Callers wire `api` as an inline object literal, so it is a fresh
  // reference on every parent render. Reading it through a ref (rather than
  // depending on it) keeps the interval alive for the question's full life
  // instead of tearing down and rebuilding — and jittering the display —
  // on every re-render.
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  });
  const [start] = useState(() => api.now());
  const [elapsed, setElapsed] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const done = picked !== null;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed(apiRef.current.now() - start), 250);
    return () => clearInterval(t);
  }, [done, start]);

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
