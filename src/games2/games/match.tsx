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
