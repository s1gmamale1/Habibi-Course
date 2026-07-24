"use client";
import { useEffect, useState } from "react";
import type { ArabicItem } from "@/content/schema";
import type { WordEntry } from "@/games/derive";
import { baseLetters, contextualGlyphs } from "@/games/arabic";
import { shuffled } from "./useSwapPuzzle";

export function SpotTheLetter({ words, pool }: { words: WordEntry[]; pool: ArabicItem[] }) {
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [shake, setShake] = useState<{ idx: number; n: number } | null>(null);
  const word = words[round % words.length];

  useEffect(() => {
    const uniq = [...new Set(baseLetters(words[round % words.length].arabic))];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- random target pick must run client-side only; render-time shuffle would mismatch SSR HTML
    setTarget(shuffled(uniq)[0]);
    setFound(false);
    setShake(null);
  }, [round, words]);

  if (!target) return <p className="text-white/50">Picking a letter…</p>;
  const letters = baseLetters(word.arabic);
  const glyphs = contextualGlyphs(word.arabic);
  const targetItem = pool.find((it) => it.arabic === target);

  return (
    <div className="text-center">
      <p className="mb-4 text-white/80">
        Tap the letter <span className="font-semibold">{targetItem?.name ?? target}</span>{" "}
        <span className="arabic text-3xl">({target})</span> in this word:
      </p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-1">
        {glyphs.map((g, i) => {
          const shaking = shake?.idx === i;
          return (
            <button
              key={`${i}-${shaking ? shake!.n : 0}`}
              type="button"
              aria-label={`word letter ${i + 1}`}
              onClick={() => {
                if (found) return;
                if (letters[i] === target) setFound(true);
                else setShake({ idx: i, n: (shake?.n ?? 0) + 1 });
              }}
              className={`arabic rounded-xl border px-2 py-2 text-5xl text-white ${
                found && letters[i] === target ? "game-correct" : "border-white/10 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              {g}
            </button>
          );
        })}
      </div>
      {found && (
        <div className="mt-4">
          <p className="text-green-300">✓ Found it! {word.translit} — {word.meaning}</p>
          <button type="button" className="cta-primary mt-2 rounded-full px-4 py-2" onClick={() => setRound((r) => r + 1)}>
            Next word →
          </button>
        </div>
      )}
    </div>
  );
}
