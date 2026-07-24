"use client";
import { useState } from "react";
import type { WordEntry } from "@/games/derive";
import { useBuildPuzzle } from "./useBuildPuzzle";

export function WordBuilder({ words }: { words: WordEntry[] }) {
  const [round, setRound] = useState(0);
  const word = words[round % words.length];
  const p = useBuildPuzzle(words, round);

  if (!p.bank) return <p className="text-white/50">Shuffling…</p>;
  return (
    <div className="text-center">
      <p className="mb-1 text-white/80">
        Arrange the letters to build <span className="font-semibold">{word.translit}</span> (“{word.meaning}”).
      </p>
      <p className="mb-4 text-xs text-white/50">
        Tap letters to fill the word — it reads right to left. Tap a filled box to take a letter back.
        {p.decoyCount > 0 && " Watch out: some letters don't belong."}
      </p>
      <div dir="rtl" className="mb-4 flex flex-wrap justify-center gap-3">
        {p.letters.map((expected, slot) => {
          const bankIdx = p.slots[slot];
          const filled = bankIdx !== null;
          const correct = filled && p.bank![bankIdx] === expected;
          const shaking = p.shake?.slots.includes(slot) ?? false;
          return (
            <button
              key={`${slot}-${shaking ? p.shake!.n : 0}`}
              type="button"
              aria-label={`slot ${slot + 1}`}
              onClick={() => p.removeFromSlot(slot)}
              disabled={!filled}
              className={`arabic min-w-16 rounded-2xl border px-4 py-3 text-4xl text-white transition ${
                correct ? "game-correct" : filled ? "border-sky-300/70 bg-sky-400/10" : "border-dashed border-white/20 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              {filled ? p.bank![bankIdx] : ""}
            </button>
          );
        })}
      </div>
      <div dir="rtl" className="flex flex-wrap justify-center gap-3">
        {p.bank.map((glyph, idx) => {
          const used = p.slots.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              aria-label={`bank letter ${glyph} ${idx + 1}`}
              onClick={() => p.placeFromBank(idx)}
              disabled={used}
              className={`arabic min-w-16 rounded-2xl border px-4 py-3 text-4xl transition ${
                used ? "border-white/5 bg-white/0 text-transparent" : "border-white/15 bg-white/5 text-white"
              }`}
            >
              {used ? "" : glyph}
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
