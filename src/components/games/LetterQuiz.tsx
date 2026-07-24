"use client";
import { useEffect, useState } from "react";
import type { ArabicItem } from "@/content/schema";
import { shuffled } from "./useSwapPuzzle";

export function LetterQuiz({ pool }: { pool: ArabicItem[] }) {
  const [round, setRound] = useState(0);
  const [choices, setChoices] = useState<ArabicItem[] | null>(null);
  const [answer, setAnswer] = useState<ArabicItem | null>(null);
  const [gotIt, setGotIt] = useState(false);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState<{ glyph: string; n: number } | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });

  useEffect(() => {
    const opts = shuffled(pool).slice(0, 4);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- round-keyed effect with mount-time shuffle must run client-side only; render-time shuffle would mismatch SSR HTML
    setAnswer(opts[0]);
    setChoices(shuffled(opts));
    setGotIt(false);
    setMissed(false);
    setShake(null);
  }, [round, pool]);

  if (!choices || !answer) return <p className="text-white/50">Preparing…</p>;
  return (
    <div className="text-center">
      <p className="mb-4 text-white/80">
        Which letter is <span className="font-semibold">{answer.name}</span>
        {answer.translit ? ` (${answer.translit})` : ""}?
      </p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-3">
        {choices.map((it) => {
          const shaking = shake?.glyph === it.arabic;
          return (
            <button
              key={`${it.arabic}-${shaking ? shake!.n : 0}`}
              type="button"
              aria-label={`choice ${it.arabic}`}
              onClick={() => {
                if (gotIt) return;
                if (it.arabic === answer.arabic) {
                  setGotIt(true);
                  setScore((s) => ({ right: s.right + (missed ? 0 : 1), asked: s.asked + 1 }));
                } else {
                  setMissed(true);
                  setShake({ glyph: it.arabic, n: (shake?.n ?? 0) + 1 });
                }
              }}
              className={`arabic min-w-16 rounded-2xl border px-4 py-3 text-4xl text-white transition ${
                gotIt && it.arabic === answer.arabic ? "game-correct" : "border-white/15 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              {it.arabic}
            </button>
          );
        })}
      </div>
      {gotIt && (
        <button type="button" className="cta-primary mt-4 rounded-full px-4 py-2" onClick={() => setRound((r) => r + 1)}>
          Next question →
        </button>
      )}
      {score.asked > 0 && <p className="mt-3 text-xs text-white/50">First-try score: {score.right} / {score.asked}</p>}
    </div>
  );
}
