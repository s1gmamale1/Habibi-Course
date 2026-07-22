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
        Arrange the letters to build <span className="font-semibold">{word.translit}</span> ("{word.meaning}").
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
