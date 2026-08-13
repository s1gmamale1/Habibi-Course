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
